

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, History } from 'lucide-react';
import { useEmployees } from '@/context/employee-provider';
import type { PayStub } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE').format(amount) + ' FCFA';
};

function PayHistoryTab({ employeeId }: { employeeId: string }) {
    const { fetchEmployeePayStubs } = useEmployees();
    const [payStubs, setPayStubs] = useState<PayStub[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!employeeId) return;
        const loadPayStubs = async () => {
            setLoading(true);
            const stubs = await fetchEmployeePayStubs(employeeId);
            setPayStubs(stubs);
            setLoading(false);
        };
        loadPayStubs();
    }, [employeeId, fetchEmployeePayStubs]);

    if (loading) {
        return (
            <div className="space-y-2 pt-6">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        )
    }

    if (payStubs.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun historique de paie trouvé pour le moment.</p>
            </div>
        )
    }
    
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-6 w-6"/>
                    Historique de Paie
                </CardTitle>
                <CardDescription>Liste de toutes vos fiches de paie générées.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Période</TableHead>
                                <TableHead className="text-right">Paie Nette Reçue</TableHead>
                                <TableHead className="text-right">Date de Paiement</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payStubs.map(stub => (
                                <TableRow key={stub.id}>
                                    <TableCell className="font-medium">{stub.period}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">{formatCurrency(stub.totalPay)}</TableCell>
                                    <TableCell className="text-right">{format(parseISO(stub.payDate), 'dd/MM/yyyy')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

export default function EmployeeDashboardPage() {
    const router = useRouter();
    const { sessionData, isLoggedIn } = useSession();
    const { employeeName, userId } = sessionData;
    const { siteSettings } = useEmployees();
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        if (isLoggedIn === false && isCheckingSession) {
            return;
        }
        setIsCheckingSession(false);

        if (sessionData.userType !== 'employee' || !userId) {
            router.replace('/employee-login');
        }
    }, [sessionData, isLoggedIn, router, isCheckingSession, userId]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push('/');
    };

    if (isCheckingSession || !isLoggedIn || !userId) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Vérification de la session...</p>
            </div>
        );
    }
    
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
            <main className="flex-1 container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Mon Espace Employé</h1>
                        <p className="text-muted-foreground">Bienvenue, {employeeName}.</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2"/>Déconnexion</Button>
                </div>

                <PayHistoryTab employeeId={userId} />
                
            </main>
        </div>
    )
}
