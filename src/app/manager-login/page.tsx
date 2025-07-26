
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
import { AlertCircle, User, Lock, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Header } from '@/components/header';
import { db } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';

export default function ManagerLoginPage() {
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { departments } = useEmployees();
    const { toast } = useToast();

    useEffect(() => {
        // Clear any existing session on login page load
        sessionStorage.clear();
    }, []);

    const selectedManagerName = departments.find(d => d.name === selectedDepartment)?.manager.name;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedDepartment || !pin) {
            setError("Veuillez sélectionner un département et entrer votre code PIN.");
            return;
        }
        
        const department = departments.find(d => d.name === selectedDepartment);

        if (department && department.manager.pin === pin) {
            sessionStorage.setItem('userType', 'manager');
            sessionStorage.setItem('department', department.name);

            try {
                await addDoc(collection(db, "login_logs"), {
                    userName: department.manager.name,
                    userType: 'manager',
                    details: department.name,
                    timestamp: new Date().toISOString(),
                });
            } catch (logError) {
                console.error("Failed to write login log:", logError);
            }

            toast({
                title: "Connexion réussie",
                description: `Bienvenue, ${department.manager.name}.`,
                className: 'bg-accent text-accent-foreground'
            });
            router.push(`/department/${encodeURIComponent(department.name)}`);
        } else {
            setError("Code PIN incorrect. Veuillez réessayer.");
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
                            Sélectionnez votre département et entrez votre code PIN.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="department">Département</Label>
                                <Select onValueChange={setSelectedDepartment} defaultValue={selectedDepartment}>
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder="Sélectionnez votre département" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedManagerName && (
                                <div className="space-y-2">
                                    <Label htmlFor="manager-name">Nom du Responsable</Label>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="manager-name" type="text" value={selectedManagerName} readOnly disabled className="pl-8" />
                                    </div>
                                </div>
                            )}
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
                                        disabled={!selectedDepartment}
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
