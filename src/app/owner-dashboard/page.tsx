
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, query, where, getDoc, deleteDoc, setDoc, Timestamp, orderBy } from 'firebase/firestore';
import type { Company, Admin, SiteSettings, RegistrationCode, Employee } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Building, Pen, Save, PlusCircle, Trash2, Ban, PlayCircle, Mail, Settings, Server, Phone, Clock, FileKey, Check, X, RefreshCw, Users, Code, UserCog } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSession } from '@/hooks/use-session';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"


type CompanyWithAdmins = Company & { admins: Admin[], id: string };

function MaintenanceCard() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const settingsRef = doc(db, 'site_settings', 'main');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
                setSettings(settingsSnap.data() as SiteSettings);
            } else {
                setSettings({ isUnderMaintenance: false, maintenanceMessage: "Le site est actuellement en maintenance. Veuillez nous excuser pour la gêne occasionnée. Nous serons de retour bientôt." });
            }
            setLoading(false);
        }
        fetchSettings();
    }, []);

    const handleToggleMaintenance = async (checked: boolean) => {
        if (!settings) return;
        const newSettings = { ...settings, isUnderMaintenance: checked };
        setSettings(newSettings);
        const settingsRef = doc(db, 'site_settings', 'main');
        await setDoc(settingsRef, newSettings, { merge: true });
        toast({ title: `Mode maintenance ${checked ? 'activé' : 'désactivé'}` });
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!settings) return;
        setSettings({ ...settings, maintenanceMessage: e.target.value });
    };

    const handleSaveMessage = async () => {
        if (!settings) return;
        const settingsRef = doc(db, 'site_settings', 'main');
        await setDoc(settingsRef, { maintenanceMessage: settings.maintenanceMessage }, { merge: true });
        toast({ title: 'Message de maintenance sauvegardé.' });
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Server className="h-6 w-6" />Contrôle Global du Site</CardTitle>
                <CardDescription>Gérez l'état global du site pour tous les utilisateurs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 rounded-md border p-4">
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Mode Maintenance</p>
                        <p className="text-sm text-muted-foreground">
                            Activez ce mode pour afficher une page de maintenance pour toutes les entreprises.
                        </p>
                    </div>
                    <Switch
                        checked={settings?.isUnderMaintenance}
                        onCheckedChange={handleToggleMaintenance}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="maintenance-message">Message de Maintenance</Label>
                    <Textarea
                        id="maintenance-message"
                        value={settings?.maintenanceMessage}
                        onChange={handleMessageChange}
                        placeholder="Message à afficher pendant la maintenance..."
                        disabled={!settings?.isUnderMaintenance}
                    />
                    <Button onClick={handleSaveMessage} disabled={!settings?.isUnderMaintenance} size="sm">Sauvegarder le Message</Button>
                </div>
            </CardContent>
        </Card>
    );
}

function RegistrationCodesCard({ codes, onGenerate, onGenerateTrial, onReactivate }: { codes: RegistrationCode[], onGenerate: () => void, onGenerateTrial: () => void, onReactivate: (codeId: string) => void }) {
    const getStatusBadge = (code: RegistrationCode) => {
        if (code.isUsed) {
            return <Badge variant="secondary" className="flex items-center gap-1"><Check className="h-3 w-3" />Utilisé</Badge>;
        }
        if (code.expiresAt && new Date(code.expiresAt.toDate()) < new Date()) {
            return <Badge variant="destructive" className="flex items-center gap-1"><Clock className="h-3 w-3" />Expiré</Badge>;
        }
        return <Badge className="bg-green-500/20 text-green-400 flex items-center gap-1"><FileKey className="h-3 w-3" />Disponible</Badge>;
    };
    
    const isExpired = (code: RegistrationCode) => {
        return code.expiresAt && new Date(code.expiresAt.toDate()) < new Date() && !code.isUsed;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6"/>Gestion des Codes</CardTitle>
                        <CardDescription>Gérez les codes d'inscription des entreprises.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={onGenerate}><PlusCircle className="mr-2"/>Générer un Code</Button>
                        <Button onClick={onGenerateTrial} variant="outline"><Clock className="mr-2" />Générer un Code d'Essai (2 jours)</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Date de Création</TableHead>
                                <TableHead>Date d'Expiration</TableHead>
                                <TableHead>Utilisé par</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {codes.length > 0 ? codes.map(code => (
                                <TableRow key={code.id}>
                                    <TableCell className="font-mono font-medium">{code.code}</TableCell>
                                    <TableCell>{getStatusBadge(code)}</TableCell>
                                    <TableCell>{format(code.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr })}</TableCell>
                                    <TableCell>{code.expiresAt ? format(code.expiresAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Jamais'}</TableCell>
                                    <TableCell>{code.usedByCompanyName || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        {isExpired(code) && (
                                            <Button variant="outline" size="sm" onClick={() => onReactivate(code.id)}>
                                                <RefreshCw className="mr-2 h-4 w-4" /> Réactiver
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Aucun code généré.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

function AnalyticsSection({ companies, employees, codes, admins }: { companies: Company[], employees: Employee[], codes: RegistrationCode[], admins: Admin[] }) {
    const totalCompanies = companies.length;
    const totalEmployees = employees.length;
    const activeCodes = codes.filter(c => !c.isUsed && (!c.expiresAt || new Date(c.expiresAt.toDate()) > new Date())).length;
    const totalAdmins = admins.length;

    const companySignupsByMonth = companies.reduce((acc, company) => {
        if (company.registrationDate) {
            const month = format(parseISO(company.registrationDate), 'yyyy-MM');
            acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(companySignupsByMonth).map(([month, total]) => ({
        name: format(parseISO(month + '-01'), 'MMM yyyy', { locale: fr }),
        total: total,
    })).sort((a,b) => a.name.localeCompare(b.name));

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Entreprises</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalCompanies}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalEmployees}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Codes Actifs</CardTitle>
                    <Code className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeCodes}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Admins Totaux</CardTitle>
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalAdmins}</div>
                </CardContent>
            </Card>

            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Inscriptions de Nouvelles Entreprises</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Bar
                      dataKey="total"
                      fill="currentColor"
                      radius={[4, 4, 0, 0]}
                      className="fill-primary"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
        </div>
    )
}

export default function OwnerDashboardPage() {
    const [companies, setCompanies] = useState<CompanyWithAdmins[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [allAdmins, setAllAdmins] = useState<Admin[]>([]);
    const [registrationCodes, setRegistrationCodes] = useState<RegistrationCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCompany, setEditingCompany] = useState<{ id: string, name: string, identifier: string } | null>(null);
    const [editingAdmin, setEditingAdmin] = useState<{ id: string, password: string } | null>(null);
    const router = useRouter();
    const { toast } = useToast();
    const { isLoggedIn, sessionData } = useSession();


    const fetchData = async () => {
        setLoading(true);
        // Fetch Companies
        const companiesSnapshot = await getDocs(collection(db, 'companies'));
        const companiesData = companiesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as (Company & {id: string})[];
        
        // Fetch All Employees and All Admins
        const [employeesSnapshot, allAdminsSnapshot] = await Promise.all([
            getDocs(collection(db, 'employees')),
            getDocs(collection(db, 'admins')),
        ]);
        const employeesData = employeesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Employee[];
        const allAdminsData = allAdminsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Admin[];
        setEmployees(employeesData);
        setAllAdmins(allAdminsData);

        const companiesWithAdmins: CompanyWithAdmins[] = [];
        for (const company of companiesData) {
            const companyAdmins = allAdminsData.filter(admin => admin.companyId === company.id);
            companiesWithAdmins.push({ ...company, admins: companyAdmins });
        }
        setCompanies(companiesWithAdmins);

        // Fetch Registration Codes
        const codesQuery = query(collection(db, 'registration_codes'), orderBy('createdAt', 'desc'));
        const codesSnapshot = await getDocs(codesQuery);
        const codesData = codesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as RegistrationCode[];
        setRegistrationCodes(codesData);

        setLoading(false);
    };
    
    useEffect(() => {
        if (isLoggedIn === null) return; // Wait until session is checked

        if (!isLoggedIn || sessionData.userType !== 'owner') {
             router.replace('/owner-login');
        } else {
            fetchData();
        }
    }, [router, isLoggedIn, sessionData]);


    const handleGenerateCode = async (isTrial: boolean) => {
        const code = Math.random().toString().slice(2, 12); // 10-digit random number as a string
        const codeData: any = { 
            code, 
            isUsed: false, 
            createdAt: Timestamp.now()
        };

        if (isTrial) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 2);
            codeData.expiresAt = Timestamp.fromDate(expiresAt);
        }

        await addDoc(collection(db, 'registration_codes'), codeData);
        toast({
            title: 'Code Généré',
            description: `Le nouveau code d'inscription est : ${code}`,
        });
        fetchData(); // Refresh data
    };

    const handleReactivateCode = async (codeId: string) => {
        const codeRef = doc(db, 'registration_codes', codeId);
        await updateDoc(codeRef, { expiresAt: null });
        toast({ title: 'Code Réactivé', description: 'Le code est maintenant permanent.' });
        fetchData();
    }

    const handleUpdateCompany = async () => {
        if (!editingCompany) return;
        const companyRef = doc(db, 'companies', editingCompany.id);
        await updateDoc(companyRef, { name: editingCompany.name, companyIdentifier: editingCompany.identifier });
        toast({ title: 'Succès', description: 'Informations de l\'entreprise mises à jour.' });
        setEditingCompany(null);
        fetchData();
    };

    const handleUpdateAdminPassword = async () => {
        if (!editingAdmin) return;
        const adminRef = doc(db, 'admins', editingAdmin.id);
        await updateDoc(adminRef, { password: editingAdmin.password });
        toast({ title: 'Succès', description: 'Mot de passe de l\'administrateur mis à jour.' });
        setEditingAdmin(null);
        fetchData();
    };

    const handleToggleSuspendCompany = async (company: CompanyWithAdmins) => {
        const newStatus = company.status === 'suspended' ? 'active' : 'suspended';
        const companyRef = doc(db, 'companies', company.id);
        await updateDoc(companyRef, { status: newStatus });
        toast({
            title: 'Statut Modifié',
            description: `L'entreprise ${company.name} a été ${newStatus === 'suspended' ? 'suspendue' : 'réactivée'}.`
        });
        fetchData();
    };

    const handleDeleteCompany = async (companyId: string) => {
        try {
            const batch = writeBatch(db);

            // Define collections to delete documents from
            const collectionsToDelete = ['employees', 'departments', 'admins', 'archives', 'login_logs', 'loans', 'pay_stubs', 'notifications', 'messages', 'online_users', 'justifications', 'documents'];

            for (const coll of collectionsToDelete) {
                const q = query(collection(db, coll), where("companyId", "==", companyId));
                const snapshot = await getDocs(q);
                snapshot.forEach(doc => batch.delete(doc.ref));
            }

            // Delete the company document itself
            const companyRef = doc(db, 'companies', companyId);
            batch.delete(companyRef);
            
            // Delete associated registration code if any
            const codeQuery = query(collection(db, 'registration_codes'), where("usedByCompanyId", "==", companyId));
            const codeSnapshot = await getDocs(codeQuery);
            codeSnapshot.forEach(doc => batch.delete(doc.ref));

            await batch.commit();

            toast({ title: 'Succès', description: "L'entreprise et toutes ses données ont été supprimées." });
            fetchData();
        } catch (error) {
            console.error("Error deleting company:", error);
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de supprimer l'entreprise." });
        }
    };


    if (isLoggedIn === null || loading) {
        return <div className="flex h-screen items-center justify-center">Chargement des données du propriétaire...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Tableau de Bord Propriétaire</h1>
                        <p className="text-muted-foreground">Gestion des entreprises et des codes d'inscription.</p>
                    </div>
                </div>

                <AnalyticsSection companies={companies} employees={employees} codes={registrationCodes} admins={allAdmins} />
                <MaintenanceCard />
                <RegistrationCodesCard 
                    codes={registrationCodes} 
                    onGenerate={() => handleGenerateCode(false)} 
                    onGenerateTrial={() => handleGenerateCode(true)} 
                    onReactivate={handleReactivateCode}
                />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building className="h-6 w-6"/>Liste des Entreprises</CardTitle>
                        <CardDescription>Gérez les entreprises inscrites sur la plateforme.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {companies.map(company => (
                            <Card key={company.id} className={company.status === 'suspended' ? 'border-destructive bg-destructive/10' : ''}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {editingCompany?.id === company.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Input value={editingCompany.name} onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value })} className="text-xl font-bold" />
                                                    <Input value={editingCompany.identifier} onChange={(e) => setEditingCompany({...editingCompany, identifier: e.target.value })} className="text-xl font-bold" />
                                                    <Button size="icon" onClick={handleUpdateCompany}><Save className="h-4 w-4"/></Button>
                                                    <Button size="icon" variant="ghost" onClick={() => setEditingCompany(null)}><X className="h-4 w-4" /></Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <CardTitle className="flex items-center gap-2">{company.name}</CardTitle>
                                                    <span className="text-sm text-muted-foreground">{company.companyIdentifier}</span>
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingCompany({ id: company.id, name: company.name, identifier: company.companyIdentifier })}><Pen className="h-4 w-4" /></Button>
                                                </div>
                                            )}
                                            <CardDescription className="flex flex-col gap-1 mt-2">
                                                <span>Super Admin: {company.superAdminName}</span>
                                                <a href={`mailto:${company.superAdminEmail}`} className="flex items-center gap-2 text-primary hover:underline">
                                                    <Mail className="h-4 w-4" /> {company.superAdminEmail}
                                                </a>
                                                <a href={`tel:${company.superAdminPhone}`} className="flex items-center gap-2 text-primary hover:underline">
                                                    <Phone className="h-4 w-4" /> {company.superAdminPhone}
                                                </a>
                                                {company.status === 'suspended' && <span className="text-destructive font-bold ml-2">(Suspendu)</span>}
                                            </CardDescription>
                                        </div>
                                        <span className="text-sm text-muted-foreground">Inscrit le: {company.registrationDate ? new Date(company.registrationDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold">Administrateurs :</h4>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleToggleSuspendCompany(company)}>
                                                {company.status === 'suspended' ? <PlayCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                                                {company.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/>Supprimer</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Supprimer l'entreprise {company.name} ?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Cette action est irréversible et supprimera l'entreprise, ainsi que tous ses employés, départements, archives, et historiques.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteCompany(company.id)}>Confirmer la suppression</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                    <ul className="space-y-2">
                                        {company.admins.map(admin => (
                                            <li key={admin.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                                                <span>{admin.name} ({admin.role})</span>
                                                <div className="flex items-center gap-2">
                                                {editingAdmin?.id === admin.id ? (
                                                     <div className="flex items-center gap-2">
                                                        <Input type="password" value={editingAdmin.password} onChange={(e) => setEditingAdmin({...editingAdmin, password: e.target.value})} />
                                                        <Button size="icon" onClick={handleUpdateAdminPassword}><Save className="h-4 w-4"/></Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setEditingAdmin(null)}><X className="h-4 w-4" /></Button>
                                                     </div>
                                                ) : (
                                                    <Button variant="outline" size="sm" onClick={() => setEditingAdmin({id: admin.id, password: ''})}>
                                                        <KeyRound className="mr-2 h-4 w-4"/> Réinitialiser Mdp
                                                    </Button>
                                                )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
