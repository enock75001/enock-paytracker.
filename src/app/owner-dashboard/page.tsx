
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, writeBatch, query, where, getDoc, deleteDoc } from 'firebase/firestore';
import type { Company, Admin } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Building, Pen, Save, PlusCircle, Trash2, Ban, PlayCircle } from 'lucide-react';
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

type CompanyWithAdmins = Company & { admins: Admin[], id: string };

export default function OwnerDashboardPage() {
    const [companies, setCompanies] = useState<CompanyWithAdmins[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCompany, setEditingCompany] = useState<{ id: string, name: string, identifier: string } | null>(null);
    const [editingAdmin, setEditingAdmin] = useState<{ id: string, password: string } | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const ownerLoggedIn = sessionStorage.getItem('ownerLoggedIn');
        if (ownerLoggedIn !== 'true') {
            router.replace('/owner-login');
        } else {
            fetchData();
        }
    }, [router]);

    const fetchData = async () => {
        setLoading(true);
        const companiesSnapshot = await getDocs(collection(db, 'companies'));
        const companiesData = companiesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as (Company & {id: string})[];
        
        const companiesWithAdmins: CompanyWithAdmins[] = [];
        for (const company of companiesData) {
            const adminsQuery = query(collection(db, "admins"), where("companyId", "==", company.id));
            const adminsSnapshot = await getDocs(adminsQuery);
            const adminsData = adminsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Admin[];
            companiesWithAdmins.push({ ...company, admins: adminsData });
        }

        setCompanies(companiesWithAdmins);
        setLoading(false);
    };

    const handleGenerateCode = async () => {
        const code = Math.random().toString().slice(2, 12); // 10-digit random number as a string
        await addDoc(collection(db, 'registration_codes'), { code, isUsed: false, createdAt: new Date() });
        toast({
            title: 'Code Généré',
            description: `Le nouveau code d'inscription est : ${code}`,
        });
    };

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
            const collectionsToDelete = ['employees', 'departments', 'admins', 'archives', 'login_logs', 'loans', 'pay_stubs', 'notifications', 'messages', 'online_users'];

            for (const coll of collectionsToDelete) {
                const q = query(collection(db, coll), where("companyId", "==", companyId));
                const snapshot = await getDocs(q);
                snapshot.forEach(doc => batch.delete(doc.ref));
            }

            // Delete the company document itself
            const companyRef = doc(db, 'companies', companyId);
            batch.delete(companyRef);

            await batch.commit();

            toast({ title: 'Succès', description: "L'entreprise et toutes ses données ont été supprimées." });
            fetchData();
        } catch (error) {
            console.error("Error deleting company:", error);
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de supprimer l'entreprise." });
        }
    };


    if (loading) {
        return <div className="flex h-screen items-center justify-center">Chargement...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Tableau de Bord Propriétaire</h1>
                        <p className="text-muted-foreground">Gestion des entreprises et des codes d'inscription.</p>
                    </div>
                    <Button onClick={handleGenerateCode}><PlusCircle className="mr-2"/>Générer un Code</Button>
                </div>

                <div className="space-y-8">
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
                                                <Button size="icon" variant="ghost" onClick={() => setEditingCompany(null)}>X</Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <CardTitle className="flex items-center gap-2"><Building className="h-6 w-6"/>{company.name}</CardTitle>
                                                <span className="text-sm text-muted-foreground">{company.companyIdentifier}</span>
                                                <Button variant="ghost" size="icon" onClick={() => setEditingCompany({ id: company.id, name: company.name, identifier: company.companyIdentifier })}><Pen className="h-4 w-4" /></Button>
                                            </div>
                                        )}
                                        <CardDescription>
                                            Super Admin: {company.superAdminName} ({company.superAdminEmail})
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
                                                    <Button size="icon" variant="ghost" onClick={() => setEditingAdmin(null)}>X</Button>
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
                </div>
            </main>
        </div>
    );
}
