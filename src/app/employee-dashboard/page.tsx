

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Briefcase, Calendar, Home, Phone, Wallet, Receipt, User, CheckCircle, XCircle, FileText, UserCircle, Download, FilePlus } from 'lucide-react';
import { useEmployees } from '@/context/employee-provider';
import type { PayStub, Employee, AbsenceJustification, Company } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { ImagePicker } from '@/components/image-picker';

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
                    <CardTitle className="text-2xl font-headline">{employee.firstName} ${employee.lastName}</CardTitle>
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

const justificationSchema = z.object({
  reason: z.string().min(10, { message: 'Veuillez fournir un motif d\'au moins 10 caractères.' }),
  documentUrl: z.string().optional(),
});

function JustificationDialog({ employee, day, date, onOpenChange }: { employee: Employee, day: string, date: Date, onOpenChange: (open: boolean) => void }) {
    const { submitAbsenceJustification } = useEmployees();
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof justificationSchema>>({
        resolver: zodResolver(justificationSchema),
        defaultValues: { reason: '', documentUrl: '' },
    });

    const onSubmit = async (values: z.infer<typeof justificationSchema>) => {
        await submitAbsenceJustification({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            departmentName: employee.domain,
            date: format(date, 'yyyy-MM-dd'),
            dayName: day,
            reason: values.reason,
            documentUrl: values.documentUrl,
        });
        toast({ title: 'Succès', description: 'Votre justification a été soumise.' });
        onOpenChange(false);
    };
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Justifier l'absence du {day}</DialogTitle>
                <DialogDescription>
                    Veuillez expliquer la raison de votre absence. Vous pouvez joindre un document si nécessaire.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField name="reason" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Motif de l'absence</FormLabel><FormControl><Textarea {...field} placeholder="Ex: Rendez-vous médical..." /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="documentUrl" control={form.control} render={({ field }) => (
                        <FormItem>
                            <Label>Document justificatif (optionnel)</Label>
                            <FormControl>
                                <ImagePicker value={field.value ?? ''} onChange={field.onChange} name="Justificatif" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose>
                        <Button type="submit">Soumettre</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    );
}

function CurrentPayCard({ employee }: { employee: Employee | undefined }) {
    const { days, loans, weekPeriod, weekDates, justifications } = useEmployees();
    const [justificationDialogOpen, setJustificationDialogOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<{ day: string; date: Date } | null>(null);

    if (!employee) return <Card><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;
    
    const currentWage = employee.currentWeekWage || employee.dailyWage || 0;
    const daysPresent = days.filter(day => employee.attendance[day]).length;
    const basePay = daysPresent * currentWage;
    const totalAdjustments = (employee.adjustments || []).reduce((acc, adj) => adj.type === 'bonus' ? acc + adj.amount : acc - adj.amount, 0);
  
    const activeLoan = loans.find(l => l.employeeId === employee.id && l.status === 'active');
    const loanRepayment = activeLoan ? Math.min(activeLoan.balance, activeLoan.repaymentAmount) : 0;
  
    const weeklyPay = basePay + totalAdjustments - loanRepayment;
    
    const handleDayClick = (day: string, date: Date, isAbsent: boolean) => {
        if (isAbsent) {
            setSelectedDay({ day, date });
            setJustificationDialogOpen(true);
        }
    }
    
    const getJustificationStatusForDay = (date: Date): AbsenceJustification['status'] | null => {
        const justification = justifications.find(j => j.employeeId === employee.id && j.date === format(date, 'yyyy-MM-dd'));
        return justification ? justification.status : null;
    }


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
                            {days.map((day, index) => {
                                const isAbsent = !employee.attendance[day];
                                const date = weekDates[index];
                                const justificationStatus = getJustificationStatusForDay(date);
                                
                                return (
                                <TableRow 
                                    key={day} 
                                    onClick={() => handleDayClick(day, date, isAbsent)}
                                    className={isAbsent ? "cursor-pointer hover:bg-muted/80" : ""}
                                >
                                    <TableCell>{day}</TableCell>
                                    <TableCell className="text-right">
                                        {isAbsent ? (
                                            justificationStatus ? (
                                                 <Badge variant={
                                                     justificationStatus === 'approved' ? 'default' :
                                                     justificationStatus === 'rejected' ? 'destructive' : 'secondary'
                                                 }>{justificationStatus}</Badge>
                                            ) : (
                                                 <Badge variant="secondary" className="hover:bg-primary/20">
                                                    <FilePlus className="mr-1 h-3 w-3" /> Justifier
                                                 </Badge>
                                            )
                                        ) : (
                                            <Badge variant="outline" className="text-green-400 border-green-400/50">
                                                <CheckCircle className="mr-1 h-3 w-3"/>Présent
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})}
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
            
            <Dialog open={justificationDialogOpen} onOpenChange={setJustificationDialogOpen}>
                {selectedDay && (
                    <JustificationDialog 
                        employee={employee} 
                        day={selectedDay.day} 
                        date={selectedDay.date} 
                        onOpenChange={setJustificationDialogOpen} 
                    />
                )}
            </Dialog>
        </Card>
    );
}


function PayHistoryCard({ employeeId }: { employeeId: string }) {
    const { fetchEmployeePayStubs, company, employees } = useEmployees();
    const [payStubs, setPayStubs] = useState<PayStub[]>([]);
    const [loading, setLoading] = useState(true);
    const employee = employees.find(e => e.id === employeeId);

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

    const downloadPayStub = (stub: PayStub) => {
        if (!employee || !company) return;

        const doc = new jsPDF();
        const logoUrl = company?.logoUrl || 'https://i.postimg.cc/xdLntsjG/Chat-GPT-Image-27-juil-2025-19-35-13.png';
        const img = new (window as any).Image();
        img.crossOrigin = "Anonymous";
        img.src = logoUrl;
        
        img.onload = () => {
            try {
                 doc.addImage(img, 'PNG', 14, 15, 30, 15, undefined, 'FAST');
            } catch(e) {
                console.error("Error adding image to PDF:", e);
            }
            renderPayStubContent(doc, stub, employee, company);
        };
        
        img.onerror = () => {
            console.error("Failed to load company logo for PDF.");
            renderPayStubContent(doc, stub, employee, company);
        };
    };

    const renderPayStubContent = (doc: jsPDF, stub: PayStub, employee: Employee, company: Company) => {
        const pageWidth = doc.internal.pageSize.getWidth();
        let cursorY = 15;

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(company.name, pageWidth / 2, cursorY + 7, { align: 'center' });
        cursorY += 10;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Fiche de Paie", pageWidth / 2, cursorY, { align: 'center' });
        cursorY += 5;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(stub.period, pageWidth / 2, cursorY, { align: 'center' });
        cursorY += 10;

        (doc as any).autoTable({
            startY: cursorY,
            body: [
                ['Employé:', `${employee.firstName} ${employee.lastName}`],
                ['Département:', employee.domain],
                ['Date de paiement:', format(parseISO(stub.payDate), 'dd/MM/yyyy')],
            ],
            theme: 'plain',
            styles: { fontSize: 11, cellPadding: 2 },
        });
        
        let finalY = (doc as any).autoTable.previous.finalY;

        (doc as any).autoTable({
            startY: finalY + 5,
            head: [['Description', 'Montant']],
            body: [
                [`Paie de base (${stub.daysPresent} jours travaillés)`, formatCurrency(stub.basePay)],
                ...stub.adjustments.map(adj => [`${adj.type === 'bonus' ? 'Prime' : 'Avance'}: ${adj.reason}`, formatCurrency(adj.amount)]),
                ['Remboursement avance programmée', `-${formatCurrency(stub.loanRepayment)}`],
            ],
            foot: [[
                 { content: 'Total Net à Payer', styles: { fontStyle: 'bold', fontSize: 12 } },
                 { content: formatCurrency(stub.totalPay), styles: { fontStyle: 'bold', fontSize: 12, halign: 'right' } }],
            ],
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
            footStyles: { fillColor: [22, 163, 74], textColor: 255 },
            didParseCell: (data: any) => {
                if (data.row.section === 'body' && data.column.index === 1) {
                    data.cell.styles.halign = 'right';
                }
            },
        });
        doc.save(`fiche_paie_${employee.lastName}_${stub.period.replace(/\s/g, '_')}.pdf`);
    };

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
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payStubs.map(stub => (
                                    <TableRow key={stub.id}>
                                        <TableCell className="font-medium">{stub.period}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{formatCurrency(stub.totalPay)}</TableCell>
                                        <TableCell className="text-right">{format(parseISO(stub.payDate), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => downloadPayStub(stub)}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
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
    const { siteSettings, employees, company, isLoading } = useEmployees();
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    
    const employee = employees.find(e => e.id === userId);
    const isCompanyUnderMaintenance = company?.status === 'suspended';

    useEffect(() => {
        if (isLoggedIn === false && isCheckingSession) {
            return;
        }
        setIsCheckingSession(false);

        if (sessionData.userType !== 'employee' || !userId) {
            router.replace('/employee-login');
        }
    }, [sessionData, isLoggedIn, router, isCheckingSession, userId]);

    if (isCheckingSession || isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Chargement de votre espace...</p>
            </div>
        );
    }
    
    if (siteSettings?.isUnderMaintenance || isCompanyUnderMaintenance) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 flex items-center justify-center container mx-auto p-4">
                    <Card className="mx-auto max-w-md w-full text-center">
                        <CardHeader>
                            <CardTitle className="text-2xl font-headline">Site en Maintenance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{siteSettings?.maintenanceMessage || "Le compte de votre entreprise est temporairement suspendu."}</p>
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
                        <PayHistoryCard employeeId={userId!} />
                    </TabsContent>
                </Tabs>
                
            </main>
        </div>
    )
}
