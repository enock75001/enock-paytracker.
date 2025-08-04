
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
import { AlertCircle, KeyRound, Phone, Mail, User, ArrowLeft, Check, ChevronsUpDown, Building } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { payPeriods } from "@/lib/data";
import { countries } from "@/lib/countries";
import type { PayPeriod } from "@/lib/types";


export default function LoginPage() {
    const { siteSettings } = useEmployees();

    if (siteSettings?.isUnderMaintenance) {
      return (
          <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 flex items-center justify-center container mx-auto p-4">
                  <Card className="mx-auto max-w-md w-full text-center">
                      <CardHeader>
                          <CardTitle className="text-2xl font-headline">Site en Maintenance</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p>{siteSettings.maintenanceMessage}</p>
                      </CardContent>
                  </Card>
              </main>
          </div>
      )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 flex items-center justify-center container mx-auto p-4">
                 <Card className="mx-auto max-w-md w-full">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-headline">Accédez à Votre Espace</CardTitle>
                        <CardDescription>
                            Connectez-vous ou inscrivez votre entreprise pour commencer.
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
                         <Button variant="link" asChild className="w-full mt-4">
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Retour à la page d'accueil
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
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
            <Button asChild variant="outline" className="w-full h-12 text-lg">
                <Link href="/employee-login">Connexion Employé</Link>
            </Button>
        </div>
    )
}


function CompanyRegistrationForm() {
    const [companyName, setCompanyName] = useState('');
    const [companyIdNumber, setCompanyIdNumber] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'CI'));
    const [adminPassword, setAdminPassword] = useState('');
    const [payPeriod, setPayPeriod] = useState<PayPeriod>('weekly');
    const [registrationCode, setRegistrationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { setCompanyId: setGlobalCompanyId, fetchDataForCompany } = useEmployees();
    const [comboboxOpen, setComboboxOpen] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        const companyIdentifier = `EPT-${companyIdNumber}`;
        const adminPhone = `+${selectedCountry?.phone}${phone}`;

        if (!companyName || !companyIdNumber || !adminName || !adminEmail || !phone || !adminPassword || !payPeriod || !registrationCode || !selectedCountry) {
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
            const { company, admin } = await registerCompany(companyName, companyIdentifier, adminName, adminEmail, adminPhone, adminPassword, payPeriod, registrationCode, selectedCountry.currency);
            
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
                <div className="relative">
                    <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Mon Entreprise SAS" required className="pl-8" />
                </div>
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
                 <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="admin-name" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="John Doe" required className="pl-8"/>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="admin-email">Votre Email</Label>
                 <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="admin-email" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@entreprise.com" required className="pl-8"/>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="admin-phone">Votre Numéro de Téléphone</Label>
                 <div className="flex">
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                        <PopoverTrigger asChild>
                            <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboboxOpen}
                            className="w-[150px] justify-between rounded-r-none"
                            >
                            {selectedCountry
                                ? `+${selectedCountry.phone}`
                                : "Indicatif"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Rechercher pays..." />
                                <CommandList>
                                    <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                                    <CommandGroup>
                                        {countries.map((country) => (
                                        <CommandItem
                                            key={country.code}
                                            value={country.name}
                                            onSelect={() => {
                                                setSelectedCountry(country)
                                                setComboboxOpen(false)
                                            }}
                                        >
                                            <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedCountry?.code === country.code ? "opacity-100" : "opacity-0"
                                            )}
                                            />
                                            {country.name} (+{country.phone})
                                        </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <Input 
                        id="admin-phone" 
                        type="tel" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="0102030405" 
                        required 
                        className="rounded-l-none"
                    />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="admin-password">Votre mot de passe</Label>
                 <div className="relative">
                    <KeyRound className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="admin-password" type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="••••••••" required className="pl-8"/>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Période de Paie</Label>
                <select
                    value={payPeriod}
                    onChange={(e) => setPayPeriod(e.target.value as PayPeriod)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {payPeriods.map(period => (
                        <option key={period.value} value={period.value}>{period.label}</option>
                    ))}
                </select>
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
