

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, History, Briefcase, Calendar, Home, Phone, Wallet, Receipt, User, CheckCircle, XCircle, BarChart2, FileText, UserCircle } from 'lucide-react';
import { useEmployees } from '@/context/employee-provider';
import type { PayStub, Employee } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

function CurrentPayCard({ employee }: { employee: Employee | undefined }) {
    const { days, loans, weekPeriod } = useEmployees();

    if (!employee) return <Card><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
    
    const currentWage = employee.currentWeekWage || employee.dailyWage || 0;
    const daysPresent = days.filter(day => employee.attendance[day]).length;
    const basePay = daysPresent * currentWage;
    const totalAdjustments = (employee.adjustments || []).reduce((acc, adj) => adj.type === 'bonus' ? acc + adj.amount : acc - adj.amount, 0);
  
    const activeLoan = loans.find(l => l.employeeId === employee.id && l.status === 'active');
    const loanRepayment = activeLoan ? Math.min(activeLoan.balance, activeLoan.repaymentAmount) : 0;
  
    const weeklyPay = basePay + totalAdjustments - loanRepayment;


    return (
        <Card>
            <CardHeader>
                <CardTitle>Paie de la Période Actuelle</CardTitle>
                <CardDescription>{weekPeriod}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Jour</TableHead>
                                <TableHead className="text-right">Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {days.map(day => (
                                <TableRow key={day}>
                                    <TableCell>{day}</TableCell>
                                    <TableCell className="text-right">
                                        {employee.attendance[day] ? 
                                            <Badge variant="outline" className="text-green-400 border-green-400/50"><CheckCircle className="mr-1 h-3 w-3"/>Présent</Badge> : 
                                            <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3"/>Absent</Badge>
                                        }
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <div className="space-y-2 pt-4 border-t">
                     <div className="flex justify-between items-center">
                        <span>Paie de base ({daysPresent} jours):</span>
                        <span className="font-medium">{formatCurrency(basePay)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span>Primes / Avances ponctuelles:</span>
                        <span className={`font-medium ${totalAdjustments > 0 ? 'text-green-400' : totalAdjustments < 0 ? 'text-red-400' : ''}`}>{formatCurrency(totalAdjustments)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Remboursement avance programmée:</span>
                        <span className={`font-medium ${loanRepayment > 0 ? 'text-red-400' : ''}`}>-{formatCurrency(loanRepayment)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t text-lg">
                        <span className="font-semibold">Total Net Période:</span>
                        <span className="font-bold text-2xl text-primary">{formatCurrency(weeklyPay)}</span>
                    </div>
                 </div>
            </CardContent>
        </Card>
    );
}


function PayHistoryCard({ employeeId }: { employeeId: string }) {
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
                 {loading ? (
                    <div className="space-y-2 pt-6">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : payStubs.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Aucun historique de paie trouvé pour le moment.</p>
                    </div>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Période</TableHead>
                                    <TableHead className="text-right">Paie Nette Reçue</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
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
                )}
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

                <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="dashboard"><UserCircle className="mr-2"/>Mon Profil</TabsTrigger>
                        <TabsTrigger value="current_pay"><FileText className="mr-2"/>Paie Actuelle</TabsTrigger>
                        <TabsTrigger value="history"><History className="mr-2"/>Historique</TabsTrigger>
                    </TabsList>
                    <TabsContent value="dashboard" className="mt-6">
                        <EmployeeInfoCard employee={employee} />
                    </TabsContent>
                    <TabsContent value="current_pay" className="mt-6">
                        <CurrentPayCard employee={employee} />
                    </TabsContent>
                    <TabsContent value="history" className="mt-6">
                        <PayHistoryCard employeeId={userId} />
                    </TabsContent>
                </Tabs>
                
            </main>
        </div>
    )
}
