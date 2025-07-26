
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
import { AlertCircle, User, Lock, ArrowLeft, Building } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Header } from '@/components/header';
import { db } from '@/lib/firebase';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { Department } from '@/lib/types';
import { findCompanyByName } from '@/lib/auth';

export default function ManagerLoginPage() {
    const [companyName, setCompanyName] = useState('');
    const [departmentsForCompany, setDepartmentsForCompany] = useState<Department[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { clearData, setCompanyId, fetchDataForCompany } = useEmployees();

     useEffect(() => {
        clearData();
        sessionStorage.clear();
    }, [clearData]);

    const handleCompanyChange = async (name: string) => {
        setCompanyName(name);
        setError('');
        setDepartmentsForCompany([]);
        setSelectedDepartment('');
        setPin('');
        if (name) {
            setLoading(true);
            const company = await findCompanyByName(name);
            if(company) {
                 const deptsQuery = query(collection(db, "departments"), where("companyId", "==", company.id));
                 const deptsSnapshot = await getDocs(deptsQuery);
                 const depts = deptsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Department[];
                 setDepartmentsForCompany(depts);
            } else {
                setError("Aucune entreprise trouvée avec ce nom.");
            }
            setLoading(false);
        }
    }

    const selectedManagerName = departmentsForCompany.find(d => d.name === selectedDepartment)?.manager.name;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!companyName || !selectedDepartment || !pin) {
            setError("Veuillez sélectionner une entreprise, un département et entrer votre code PIN.");
            setLoading(false);
            return;
        }
        
        const company = await findCompanyByName(companyName);
        if (!company) {
            setError("Erreur: entreprise non trouvée.");
            setLoading(false);
            return;
        }

        const department = departmentsForCompany.find(d => d.name === selectedDepartment);

        if (department && department.manager.pin === pin) {
            sessionStorage.setItem('userType', 'manager');
            sessionStorage.setItem('department', department.name);
            sessionStorage.setItem('companyId', company.id);
            sessionStorage.setItem('companyName', company.name);
            
            setCompanyId(company.id);
            await fetchDataForCompany(company.id);

            try {
                await addDoc(collection(db, "login_logs"), {
                    companyId: company.id,
                    companyName: company.name,
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
            setError("Code PIN incorrect pour ce département. Veuillez réessayer.");
        }
        setLoading(false);
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
                                <Label htmlFor="company-name">Nom de l'entreprise</Label>
                                <div className="relative">
                                     <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="company-name"
                                        type="text"
                                        placeholder="Mon Entreprise SAS"
                                        value={companyName}
                                        onChange={(e) => handleCompanyChange(e.target.value)}
                                        required
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Département</Label>
                                <Select 
                                    onValueChange={setSelectedDepartment} 
                                    value={selectedDepartment} 
                                    disabled={!companyName || loading || departmentsForCompany.length === 0}
                                >
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder={loading ? "Chargement..." : "Sélectionnez votre département"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departmentsForCompany.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
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
