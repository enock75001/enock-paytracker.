
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, User, Lock, ArrowLeft, HelpCircle, Building } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { loginAdmin, findCompanyByIdentifier } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useEmployees } from '@/context/employee-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminLoginPage() {
    const [companyIdentifier, setCompanyIdentifier] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { setCompanyId, fetchDataForCompany, clearData } = useEmployees();

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

        if (!companyIdentifier || !name || !password) {
            setError("Veuillez entrer l'ID de l'entreprise, votre nom et votre mot de passe.");
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

            const admin = await loginAdmin(company.id, name, password);
            if (admin) {
                sessionStorage.setItem('userType', 'admin');
                sessionStorage.setItem('adminName', admin.name);
                sessionStorage.setItem('adminId', admin.id);
                sessionStorage.setItem('companyId', company.id);
                sessionStorage.setItem('companyName', company.name);

                setCompanyId(company.id);
                await fetchDataForCompany(company.id);

                try {
                    await addDoc(collection(db, "login_logs"), {
                        companyId: company.id,
                        companyName: company.name,
                        userName: admin.name,
                        userType: 'admin',
                        details: admin.role === 'superadmin' ? 'Super Administrateur' : 'Adjoint',
                        timestamp: new Date().toISOString(),
                    });
                } catch (logError) {
                    console.error("Failed to write admin login log:", logError);
                }

                toast({
                    title: "Connexion réussie",
                    description: `Bienvenue, ${admin.name}.`,
                    className: 'bg-accent text-accent-foreground'
                });
                router.push(`/dashboard`);
            } else {
                setError("Nom d'utilisateur ou mot de passe incorrect pour cette entreprise.");
            }
        } catch (err: any) {
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
                        <CardTitle className="text-2xl font-headline">Connexion Administrateur</CardTitle>
                        <CardDescription>
                            Entrez vos identifiants pour accéder au tableau de bord.
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
                                <Label htmlFor="admin-name">Votre Nom</Label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="admin-name"
                                        type="text"
                                        placeholder="Admin"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Mot de passe</Label>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <button type="button" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                <HelpCircle className="h-3 w-3" />
                                                Mot de passe oublié ?
                                             </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Réinitialisation du mot de passe</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   Pour réinitialiser le mot de passe, veuillez contacter le super administrateur de votre entreprise. Si vous êtes le super administrateur et que vous avez perdu l'accès, vous devrez contacter le support technique.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogAction>Compris</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                                <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground">Se souvenir de l'ID de l'entreprise</Label>
                             </div>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Erreur</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Connexion...' : 'Se connecter'}
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
