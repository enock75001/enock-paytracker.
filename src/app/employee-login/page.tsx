
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
import { findCompanyByIdentifier, loginEmployee } from '@/lib/auth';
import { Checkbox } from '@/components/ui/checkbox';
import { useSession } from '@/hooks/use-session';

export default function EmployeeLoginPage() {
    const [companyIdNumber, setCompanyIdNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { clearData } = useEmployees();
    const { isLoggedIn } = useSession();

    useEffect(() => {
        if (isLoggedIn) {
            router.replace('/employee-dashboard');
        }
    }, [isLoggedIn, router]);

    useEffect(() => {
        clearData();
        sessionStorage.clear();
        const rememberedId = localStorage.getItem('rememberedCompanyId');
        if (rememberedId && rememberedId.startsWith('EPT-')) {
            setCompanyIdNumber(rememberedId.substring(4));
            setRememberMe(true);
        }
    }, [clearData]);
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const companyIdentifier = `EPT-${companyIdNumber}`;

        if (!companyIdNumber || !phone) {
            setError("Veuillez entrer l'ID de l'entreprise et votre numéro de téléphone.");
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

            const employee = await loginEmployee(company.id, phone);

            if (employee) {
                sessionStorage.setItem('userType', 'employee');
                sessionStorage.setItem('employeeId', employee.id);
                sessionStorage.setItem('employeeName', `${employee.firstName} ${employee.lastName}`);
                sessionStorage.setItem('companyId', company.id);
                sessionStorage.setItem('companyName', company.name);

                toast({
                    title: "Connexion réussie",
                    description: `Bienvenue, ${employee.firstName} ${employee.lastName}.`,
                    className: 'bg-accent text-accent-foreground'
                });
                router.push(`/employee-dashboard`);
            } else {
                setError("Numéro de téléphone incorrect pour cette entreprise.");
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
                        <CardTitle className="text-2xl font-headline">Portail Employé</CardTitle>
                        <CardDescription>
                            Entrez l'ID de votre entreprise et votre numéro de téléphone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="company-id">ID de l'Entreprise</Label>
                                <div className="flex items-center">
                                     <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary text-sm h-10">EPT-</span>
                                    <Input
                                        id="company-id"
                                        type="text"
                                        pattern="[0-9]*"
                                        placeholder="12345"
                                        value={companyIdNumber}
                                        onChange={(e) => setCompanyIdNumber(e.target.value.replace(/\D/g, ''))}
                                        required
                                        className="rounded-l-none pl-3"
                                    />
                                </div>
                            </div>
                           
                            <div className="space-y-2">
                                <Label htmlFor="phone">Votre Numéro de Téléphone</Label>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        type="password"
                                        placeholder="0102030405"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
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
