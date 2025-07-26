
'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { registerCompany } from "@/lib/auth";
import { useEmployees } from "@/context/employee-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center container mx-auto p-4">
            <Card className="mx-auto max-w-md w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-headline">Bienvenue sur Enock PayTracker</CardTitle>
                    <CardDescription>
                        La solution de gestion de paie pour votre entreprise.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <Tabs defaultValue="login" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Se Connecter</TabsTrigger>
                        <TabsTrigger value="register">Inscrire mon Entreprise</TabsTrigger>
                      </TabsList>
                      <TabsContent value="login">
                        <LoginSelector />
                      </TabsContent>
                      <TabsContent value="register">
                        <CompanyRegistrationForm />
                      </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </main>
    </div>
  )
}


function LoginSelector() {
    return (
        <div className="grid gap-4 pt-4">
             <Button asChild className="w-full h-12 text-lg">
                <Link href="/admin-login">Connexion Administrateur</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full h-12 text-lg">
                <Link href="/manager-login">Connexion Responsable</Link>
            </Button>
        </div>
    )
}


function CompanyRegistrationForm() {
    const [companyName, setCompanyName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminPin, setAdminPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { setCompanyId, fetchDataForCompany } = useEmployees();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!companyName || !adminName || !adminPin) {
            setError("Tous les champs sont requis.");
            setLoading(false);
            return;
        }
        if (adminPin.length !== 4) {
            setError("Le code PIN doit contenir 4 chiffres.");
            setLoading(false);
            return;
        }

        try {
            const { company, admin } = await registerCompany(companyName, adminName, adminPin);
            
            // Log the new company in
            sessionStorage.setItem('userType', 'admin');
            sessionStorage.setItem('adminName', admin.name);
            sessionStorage.setItem('adminId', admin.id);
            sessionStorage.setItem('companyId', company.id);
            sessionStorage.setItem('companyName', company.name);
            setCompanyId(company.id);
            await fetchDataForCompany(company.id);

            toast({
                title: "Inscription Réussie!",
                description: `Bienvenue sur PayTracker, ${admin.name} de ${company.name}.`,
            });

            router.push('/dashboard');

        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleRegister} className="space-y-4 pt-4">
             <div className="space-y-2">
                <Label htmlFor="company-name">Nom de l'entreprise</Label>
                <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Mon Entreprise SAS" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="admin-name">Votre nom (Super Administrateur)</Label>
                <Input id="admin-name" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="John Doe" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="admin-pin">Votre code PIN (4 chiffres)</Label>
                <Input id="admin-pin" type="password" value={adminPin} onChange={e => setAdminPin(e.target.value)} placeholder="••••" maxLength={4} required />
            </div>
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur d'inscription</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Inscription en cours..." : "Créer mon compte entreprise"}
            </Button>
        </form>
    );
}

