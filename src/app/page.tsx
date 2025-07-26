
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
import { AlertCircle, KeyRound, Phone, Mail } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { payPeriods } from "@/lib/data";
import type { PayPeriod } from "@/lib/types";


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
    const [companyIdNumber, setCompanyIdNumber] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [payPeriod, setPayPeriod] = useState<PayPeriod>('weekly');
    const [registrationCode, setRegistrationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { setCompanyId: setGlobalCompanyId, fetchDataForCompany } = useEmployees();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        const companyIdentifier = `EPT-${companyIdNumber}`;

        if (!companyName || !companyIdNumber || !adminName || !adminEmail || !adminPassword || !payPeriod || !registrationCode) {
            setError("Tous les champs sont requis.");
            setLoading(false);
            return;
        }

        if (registrationCode.length !== 10) {
            setError("Le code d'inscription doit contenir 10 chiffres.");
            setLoading(false);
            return;
        }

        try {
            const { company, admin } = await registerCompany(companyName, companyIdentifier, adminName, adminEmail, adminPassword, payPeriod, registrationCode);
            
            // Log the new company in
            sessionStorage.setItem('userType', 'admin');
            sessionStorage.setItem('adminName', admin.name);
            sessionStorage.setItem('adminId', admin.id);
            sessionStorage.setItem('companyId', company.id);
            sessionStorage.setItem('companyName', company.name);
            setGlobalCompanyId(company.id);
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
                <Label htmlFor="registration-code">Code d'Inscription</Label>
                <div className="relative">
                    <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="registration-code" value={registrationCode} onChange={e => setRegistrationCode(e.target.value)} placeholder="Code à 10 chiffres" required className="pl-8"/>
                </div>
                <CardDescription className="text-xs pt-2">
                    Pour obtenir un code d'inscription, veuillez contacter le propriétaire du site :
                    <br />
                    <a href="mailto:franckenock78@gmail.com" className="flex items-center gap-2 hover:underline text-primary">
                        <Mail className="h-3 w-3" /> franckenock78@gmail.com
                    </a>
                    <a href="tel:+2250544552956" className="flex items-center gap-2 hover:underline text-primary">
                       <Phone className="h-3 w-3" /> +225 05 44 55 29 56
                    </a>
                </CardDescription>
            </div>
             <div className="space-y-2">
                <Label htmlFor="company-name">Nom de l'entreprise</Label>
                <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Mon Entreprise SAS" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="company-id">ID de l'Entreprise (chiffres uniquement)</Label>
                <div className="flex items-center">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary text-sm">EPT-</span>
                    <Input 
                        id="company-id" 
                        type="text"
                        pattern="[0-9]*"
                        value={companyIdNumber} 
                        onChange={e => setCompanyIdNumber(e.target.value.replace(/\D/g, ''))} 
                        placeholder="12345" 
                        required 
                        className="rounded-l-none"
                    />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="admin-name">Votre nom (Super Administrateur)</Label>
                <Input id="admin-name" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="John Doe" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="admin-email">Votre Email</Label>
                <Input id="admin-email" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@entreprise.com" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="admin-password">Votre mot de passe</Label>
                <Input id="admin-password" type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="pay-period">Période de Paie</Label>
                <Select onValueChange={(value: PayPeriod) => setPayPeriod(value)} defaultValue={payPeriod}>
                    <SelectTrigger id="pay-period">
                        <SelectValue placeholder="Choisir une période de paie" />
                    </SelectTrigger>
                    <SelectContent>
                        {payPeriods.map(period => (
                            <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
