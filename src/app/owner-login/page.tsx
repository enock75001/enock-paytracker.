
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Lock } from "lucide-react";
import { Header } from '@/components/header';
import { useSession } from '@/hooks/use-session';

// Le mot de passe est maintenant défini ici pour éviter les problèmes d'environnement.
const OWNER_PASSWORD = "enock@2024";

export default function OwnerLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { sessionData, isLoggedIn } = useSession();

    useEffect(() => {
        if (isLoggedIn && sessionData.userType === 'owner') {
            router.replace('/owner-dashboard');
        }
    }, [sessionData, router, isLoggedIn]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password === OWNER_PASSWORD) {
            sessionStorage.setItem('ownerLoggedIn', 'true');
            sessionStorage.setItem('userType', 'owner');
            toast({ title: 'Connexion réussie', description: 'Bienvenue, propriétaire.' });
            router.push('/owner-dashboard');
        } else {
            setError('Mot de passe incorrect.');
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center container mx-auto p-4">
                <Card className="mx-auto max-w-sm w-full">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-2xl">Accès Propriétaire</CardTitle>
                        <CardDescription>
                            Entrez le mot de passe pour accéder au tableau de bord principal.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-8"
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
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Vérification...' : 'Se Connecter'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
