
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, User, Lock, ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { loginAdmin } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
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

export default function AdminLoginPage() {
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        sessionStorage.clear();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !pin) {
            setError("Veuillez entrer le nom et le code PIN.");
            return;
        }

        try {
            const admin = await loginAdmin(name, pin);
            if (admin) {
                sessionStorage.setItem('userType', 'admin');
                sessionStorage.setItem('adminName', admin.name);
                sessionStorage.setItem('adminId', admin.id);

                try {
                    await addDoc(collection(db, "login_logs"), {
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
                setError("Nom d'utilisateur ou code PIN incorrect.");
            }
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
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
                                <Label htmlFor="admin-name">Nom</Label>
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
                                    <Label htmlFor="pin-code">Code PIN</Label>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <button type="button" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                <HelpCircle className="h-3 w-3" />
                                                Code PIN oublié ?
                                             </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Réinitialisation du Code PIN</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Pour des raisons de sécurité, la réinitialisation du code PIN du super administrateur nécessite une intervention manuelle. Veuillez contacter le support pour obtenir de l'aide.
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
                                        id="pin-code"
                                        type="password"
                                        placeholder="••••"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        required
                                        className="pl-8"
                                        maxLength={4}
                                    />
                                </div>
                            </div>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Erreur</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" className="w-full">
                                Se connecter
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
