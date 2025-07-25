
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmployees } from '@/context/employee-provider';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function ManagerLoginPage() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { employees } = useEmployees();
    const { toast } = useToast();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!code) {
            setError("Veuillez entrer un code de département.");
            return;
        }

        const domains = [...new Set(employees.map(e => e.domain))];
        const matchedDomain = domains.find(d => d.toLowerCase().replace(/\s+/g, '') === code.toLowerCase().replace(/\s+/g, ''));

        if (matchedDomain) {
            toast({
                title: "Connexion réussie",
                description: `Bienvenue dans le département ${matchedDomain}.`,
                className: 'bg-accent text-accent-foreground'
            });
            router.push(`/department/${encodeURIComponent(matchedDomain)}`);
        } else {
            setError("Code de département invalide. Veuillez réessayer.");
        }
    };

    return (
        <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center container mx-auto p-4">
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl font-headline">Connexion Responsable</CardTitle>
                    <CardDescription>
                        Entrez le code d'accès de votre département pour continuer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="department-code">Code du département</Label>
                            <Input
                                id="department-code"
                                type="text"
                                placeholder="ex: peintureinterieure"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
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
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
