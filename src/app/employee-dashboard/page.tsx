

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, History, Briefcase, Calendar, Home, Phone, Wallet, Receipt, User } from 'lucide-react';
import { useEmployees } from '@/context/employee-provider';
import type { PayStub, Employee } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE').format(amount) + ' FCFA';
};

function EmployeeInfoCard({ employee }: { employee: Employee | undefined }) {
    const { loans } = useEmployees();
    const activeLoan = loans.find(l => l.employeeId === employee?.id && l.status === 'active');
    
    if (!employee) {
        return (
             <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="items-center text-center">
                <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} data-ai-hint="person portrait" />
                    <AvatarFallback className="text-3xl">{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="pt-2">
                    <CardTitle className="text-2xl font-headline">{employee.firstName} {employee.lastName}</CardTitle>
                    <CardDescription className="text-md">{employee.domain}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
                 <div className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-muted-foreground" /> <strong>Poste:</strong> {employee.poste}</div>
                 <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <strong>Né(e) le:</strong> {format(parseISO(employee.birthDate), 'dd MMMM yyyy', { locale: fr })}</div>
                <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /> <strong>Téléphone:</strong> {employee.phone}</div>
                <div className="flex items-center gap-3"><Home className="h-4 w-4 text-muted-foreground" /> <strong>Adresse:</strong> {employee.address}</div>
                <div className="flex items-center gap-3"><Wallet className="h-4 w-4 text-muted-foreground" /> <strong>Salaire/Jour:</strong> {formatCurrency(employee.dailyWage)}</div>
                 {activeLoan && (
                    <div className="flex items-center gap-3 pt-2 border-t text-amber-500"><Receipt className="h-4 w-4"/> <strong>Avance en cours:</strong> {formatCurrency(activeLoan.balance)}</div>
                 )}
            </CardContent>
        </Card>
    )
}

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
        <Card>
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
    const { siteSettings, employees } = useEmployees();
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    
    const employee = employees.find(e => e.id === userId);

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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <EmployeeInfoCard employee={employee} />
                    </div>
                    <div className="lg:col-span-2">
                        <PayHistoryTab employeeId={userId} />
                    </div>
                </div>
                
            </main>
        </div>
    )
}
