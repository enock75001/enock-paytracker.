
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmployees } from '@/context/employee-provider';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Lock, ArrowLeft, Building } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { db } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { findCompanyByIdentifier, findManagerByPin } from '@/lib/auth';
import { Checkbox } from '@/components/ui/checkbox';
import { updateUserPresence } from '@/lib/chat';
import { useSession } from '@/hooks/use-session';

export default function ManagerLoginPage() {
    const [companyIdentifier, setCompanyIdentifier] = useState('');
    const [pin, setPin] = useState(''); // Pin will be the employee's phone number
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { clearData, setCompanyId, fetchDataForCompany } = useEmployees();
    const { isLoggedIn } = useSession();

    useEffect(() => {
        if (isLoggedIn) {
            router.replace('/dashboard'); // Or a specific manager dashboard if one existed
        }
    }, [isLoggedIn, router]);

     useEffect(() => {
        clearData();
        sessionStorage.clear();
        const rememberedId = localStorage.getItem('rememberedCompanyId');
        if (rememberedId) {
            setCompanyIdentifier(rememberedId);
            setRememberMe(true);
        }
    }, [clearData]);
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!companyIdentifier || !pin) {
            setError("Veuillez entrer l'ID de l'entreprise et votre code PIN.");
            setLoading(false);
            return;
        }
        
        try {
            const company = await findCompanyByIdentifier(companyIdentifier);
            if (!company) {
                setError("Aucune entreprise trouvée avec cet ID.");
                setLoading(false);
                return;
            }
            
            if (rememberMe) {
                localStorage.setItem('rememberedCompanyId', companyIdentifier);
            } else {
                localStorage.removeItem('rememberedCompanyId');
            }

            const { manager, department } = await findManagerByPin(company.id, pin);

            if (manager && department) {
                sessionStorage.setItem('userType', 'manager');
                sessionStorage.setItem('departmentName', department.name);
                sessionStorage.setItem('managerId', manager.id);
                sessionStorage.setItem('managerName', `${manager.firstName} ${manager.lastName}`);
                sessionStorage.setItem('companyId', company.id);
                sessionStorage.setItem('companyName', company.name);
                
                setCompanyId(company.id);
                await fetchDataForCompany(company.id);

                await updateUserPresence({
                  senderId: manager.id,
                  companyId: company.id,
                  name: `${manager.firstName} ${manager.lastName}`,
                  role: 'manager',
                  departmentName: department.name,
                });

                try {
                    await addDoc(collection(db, "login_logs"), {
                        companyId: company.id,
                        companyName: company.name,
                        userName: `${manager.firstName} ${manager.lastName}`,
                        userType: 'manager',
                        details: department.name,
                        timestamp: new Date().toISOString(),
                    });
                } catch (logError) {
                    console.error("Failed to write login log:", logError);
                }

                toast({
                    title: "Connexion réussie",
                    description: `Bienvenue, ${manager.firstName} ${manager.lastName}.`,
                    className: 'bg-accent text-accent-foreground'
                });
                router.push(`/department/${encodeURIComponent(department.name)}`);
            } else {
                setError("Code PIN (numéro de téléphone) incorrect ou vous n'êtes pas assigné comme responsable d'un département.");
            }
        } catch(err: any) {
             setError(err.message || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
       <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center container mx-auto p-4">
                <Card className="mx-auto max-w-sm w-full">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-2xl font-headline">Connexion Responsable</CardTitle>
                        <CardDescription>
                            Entrez l'ID de votre entreprise et votre code PIN.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="company-id">ID de l'Entreprise</Label>
                                <div className="relative">
                                     <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="company-id"
                                        type="text"
                                        placeholder="EPT-12345"
                                        value={companyIdentifier}
                                        onChange={(e) => setCompanyIdentifier(e.target.value)}
                                        required
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                           
                            <div className="space-y-2">
                                <Label htmlFor="pin-code">Code PIN (Votre numéro de téléphone)</Label>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="pin-code"
                                        type="password"
                                        placeholder="••••••••••"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        required
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                                <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground">Se souvenir de l'ID</Label>
                             </div>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Erreur</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Chargement...' : 'Se connecter'}
                            </Button>
                            <Button variant="link" asChild className="w-full">
                                <Link href="/">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Retour à la page d'accueil
                                </Link>
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
