
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
import { addDoc, collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import type { Department, Employee } from '@/lib/types';
import { findCompanyByIdentifier } from '@/lib/auth';
import { Checkbox } from '@/components/ui/checkbox';
import { updateUserPresence } from '@/lib/chat';

export default function ManagerLoginPage() {
    const [companyIdentifier, setCompanyIdentifier] = useState('');
    const [departmentsForCompany, setDepartmentsForCompany] = useState<Department[]>([]);
    const [employeesForCompany, setEmployeesForCompany] = useState<Employee[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [pin, setPin] = useState(''); // Pin will be the employee's phone number
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { clearData, setCompanyId, fetchDataForCompany } = useEmployees();

     useEffect(() => {
        clearData();
        sessionStorage.clear();
        const rememberedId = localStorage.getItem('rememberedCompanyId');
        if (rememberedId) {
            setCompanyIdentifier(rememberedId);
            setRememberMe(true);
            handleCompanyIdChange(rememberedId);
        }
    }, [clearData]);

    const handleCompanyIdChange = async (identifier: string) => {
        setCompanyIdentifier(identifier);
        setError('');
        setDepartmentsForCompany([]);
        setEmployeesForCompany([]);
        setSelectedDepartment('');
        setPin('');
        if (identifier) {
            setLoading(true);
            const company = await findCompanyByIdentifier(identifier);
            if(company) {
                 const deptsQuery = query(collection(db, "departments"), where("companyId", "==", company.id));
                 const empsQuery = query(collection(db, "employees"), where("companyId", "==", company.id));
                 
                 const [deptsSnapshot, empsSnapshot] = await Promise.all([
                    getDocs(deptsQuery),
                    getDocs(empsQuery),
                 ]);

                 const depts = deptsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Department[];
                 const emps = empsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Employee[];
                 setDepartmentsForCompany(depts);
                 setEmployeesForCompany(emps);
            } else {
                setError("Aucune entreprise trouvée avec cet ID.");
            }
            setLoading(false);
        }
    }

    const department = departmentsForCompany.find(d => d.name === selectedDepartment);
    const manager = department?.managerId ? employeesForCompany.find(e => e.id === department.managerId) : null;
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!companyIdentifier || !selectedDepartment || !pin) {
            setError("Veuillez sélectionner une entreprise, un département et entrer votre code PIN.");
            setLoading(false);
            return;
        }
        
        const company = await findCompanyByIdentifier(companyIdentifier);
        if (!company) {
            setError("Erreur: entreprise non trouvée.");
            setLoading(false);
            return;
        }
        
        if (rememberMe) {
            localStorage.setItem('rememberedCompanyId', companyIdentifier);
        } else {
            localStorage.removeItem('rememberedCompanyId');
        }

        if (manager && manager.phone === pin) {
            sessionStorage.setItem('userType', 'manager');
            sessionStorage.setItem('department', department!.name);
            sessionStorage.setItem('managerId', manager.id);
            sessionStorage.setItem('managerName', `${manager.firstName} ${manager.lastName}`);
            sessionStorage.setItem('companyId', company.id);
            sessionStorage.setItem('companyName', company.name);
            
            setCompanyId(company.id);
            await fetchDataForCompany(company.id);

            await updateUserPresence({
              userId: manager.id,
              companyId: company.id,
              name: `${manager.firstName} ${manager.lastName}`,
              role: 'manager',
              departmentName: department!.name,
              lastSeen: Date.now(),
            });

            try {
                await addDoc(collection(db, "login_logs"), {
                    companyId: company.id,
                    companyName: company.name,
                    userName: `${manager.firstName} ${manager.lastName}`,
                    userType: 'manager',
                    details: department!.name,
                    timestamp: new Date().toISOString(),
                });
            } catch (logError) {
                console.error("Failed to write login log:", logError);
            }

            toast({
                title: "Connexion réussie",
                description: `Bienvenue, ${manager.firstName} ${manager.lastName}.`,
                className: 'bg-accent text-accent-foreground'
            });
            router.push(`/department/${encodeURIComponent(department!.name)}`);
        } else {
            setError("Code PIN (numéro de téléphone) incorrect pour ce responsable. Veuillez réessayer.");
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
                                <Label htmlFor="company-id">ID de l'Entreprise</Label>
                                <div className="relative">
                                     <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="company-id"
                                        type="text"
                                        placeholder="EPT-12345"
                                        value={companyIdentifier}
                                        onChange={(e) => handleCompanyIdChange(e.target.value)}
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
                                    disabled={!companyIdentifier || loading || departmentsForCompany.length === 0}
                                >
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder={loading ? "Chargement..." : "Sélectionnez votre département"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departmentsForCompany.filter(d => d.managerId).map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {manager && (
                                <div className="space-y-2">
                                    <Label htmlFor="manager-name">Nom du Responsable</Label>
                                    <div className="relative">
                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="manager-name" type="text" value={`${manager.firstName} ${manager.lastName}`} readOnly disabled className="pl-8" />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="pin-code">Code PIN (Votre numéro de téléphone)</Label>
                                <div className="relative">
                                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="pin-code"
                                        type="password"
                                        placeholder="••••••••••"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        required
                                        disabled={!selectedDepartment}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                                <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground">Se souvenir de l'ID</Label>
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
