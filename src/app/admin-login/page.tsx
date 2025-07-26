
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, User, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { loginAdmin } from '@/lib/auth';

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
                                <Label htmlFor="pin-code">Code PIN</Label>
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
