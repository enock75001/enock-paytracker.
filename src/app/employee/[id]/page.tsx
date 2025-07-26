
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEmployees } from '@/context/employee-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Calendar, Home, Phone, User, Wallet, UserCog, MoveRight, Trash2, Edit, Download, CheckCircle, XCircle, PlusCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { differenceInWeeks, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Department, Employee, Adjustment } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ImagePicker } from '@/components/image-picker';
import { Header } from '@/components/header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const employeeSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères.' }),
  lastName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  domain: z.string({ required_error: 'Le département est requis.' }),
  birthDate: z.coerce.date({ required_error: 'Une date de naissance est requise.' }),
  address: z.string().min(5, { message: "L'adresse est requise." }),
  dailyWage: z.coerce.number().min(1, { message: 'Le salaire journalier doit être un nombre positif.' }),
  phone: z.string().min(9, { message: 'Un numéro de téléphone valide est requis.' }),
  photoUrl: z.string().optional(),
});

function EditEmployeeDialog({ employee, departments, updateEmployee }: { employee: Employee, departments: Department[], updateEmployee: Function }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const domains = departments.map(d => d.name);

    const form = useForm<z.infer<typeof employeeSchema>>({
        resolver: zodResolver(employeeSchema),
    });

    useEffect(() => {
        if (employee) {
            form.reset({
                ...employee,
                birthDate: parseISO(employee.birthDate),
            });
        }
    }, [employee, form, isOpen]);
    
    const watchedFirstName = form.watch('firstName');
    const watchedLastName = form.watch('lastName');

    async function onSubmit(values: z.infer<typeof employeeSchema>) {
        await updateEmployee(employee.id, {
            ...values,
            birthDate: values.birthDate.toISOString().split('T')[0],
        });
        toast({
            title: "Succès",
            description: "Les informations de l'employé ont été mises à jour. Le nouveau salaire prendra effet la semaine prochaine.",
        });
        setIsOpen(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><Edit className="mr-2"/>Modifier</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Modifier les informations de l'employé</DialogTitle>
                    <DialogDescription>
                        Mettez à jour les détails de {employee.firstName} {employee.lastName}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="photoUrl" render={({ field }) => (
                            <FormItem><FormLabel>Photo de l'employé</FormLabel><FormControl><ImagePicker value={field.value ?? ''} onChange={field.onChange} name={`${watchedFirstName} ${watchedLastName}`} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Prénom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="domain" render={({ field }) => (<FormItem><FormLabel>Département</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez un département" /></SelectTrigger></FormControl><SelectContent>{domains.map((d: any) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="birthDate" render={({ field }) => (<FormItem><FormLabel>Date de naissance</FormLabel><FormControl><Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="dailyWage" render={({ field }) => (<FormItem><FormLabel>Salaire Journalier de Base (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Numéro de téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                            <Button type="submit">Sauvegarder les modifications</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}


function TransferEmployeeDialog({ employee, departments, transferEmployee }: { employee: any, departments: Department[], transferEmployee: Function }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const { toast } = useToast();

  const handleTransfer = async () => {
    if (!selectedDepartment) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Veuillez sélectionner un nouveau département.",
        });
        return;
    }
    await transferEmployee(employee.id, selectedDepartment);
    toast({
        title: "Succès",
        description: `${employee.firstName} ${employee.lastName} a été transféré.`,
    });
    setIsOpen(false);
    setSelectedDepartment('');
  }

  const availableDepartments = departments.filter(d => d.name !== employee.domain);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><MoveRight className="mr-2"/>Transférer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transférer l'employé</DialogTitle>
          <DialogDescription>
            Transférer {employee.firstName} {employee.lastName} vers un autre département.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-department" className="text-right">Département</Label>
            <Select onValueChange={setSelectedDepartment}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Choisir un département" />
                </SelectTrigger>
                <SelectContent>
                    {availableDepartments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
          <Button onClick={handleTransfer}>Confirmer le transfert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteEmployeeDialog({ employee, deleteEmployee }: { employee: any, deleteEmployee: Function }) {
    const router = useRouter();
    const { toast } = useToast();

    const handleDelete = async () => {
        await deleteEmployee(employee.id);
        toast({
            title: "Employé Supprimé",
            description: `${employee.firstName} ${employee.lastName} a été supprimé du système.`,
        });
        router.push(`/dashboard/departments`);
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="mr-2"/>Supprimer</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. L'employé {employee.firstName} {employee.lastName} sera définitivement supprimé.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

const adjustmentSchema = z.object({
  type: z.enum(['bonus', 'deduction'], { required_error: "Le type est requis." }),
  amount: z.coerce.number().min(1, "Le montant doit être positif."),
  reason: z.string().min(3, "La raison est requise."),
});

function AdjustmentsCard({ employee }: { employee: Employee }) {
    const { addAdjustment, deleteAdjustment } = useEmployees();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    
    const form = useForm<z.infer<typeof adjustmentSchema>>({
        resolver: zodResolver(adjustmentSchema),
        defaultValues: { type: 'bonus', amount: 0, reason: '' },
    });

    async function onSubmit(values: z.infer<typeof adjustmentSchema>) {
        await addAdjustment(employee.id, values);
        toast({ title: 'Succès', description: 'Ajustement ajouté.' });
        form.reset();
        setIsOpen(false);
    }
    
    const handleDelete = async (adjustmentId: string) => {
        await deleteAdjustment(employee.id, adjustmentId);
        toast({ title: 'Succès', description: 'Ajustement supprimé.' });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Primes et Avances</CardTitle>
                    <CardDescription>Ajustements sur la paie de la période en cours.</CardDescription>
                </div>
                 <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Ajouter</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ajouter une Prime ou une Avance</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField name="type" control={form.control} render={({ field }) => (<FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="bonus">Prime (Bonus)</SelectItem><SelectItem value="deduction">Avance (Déduction)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField name="amount" control={form.control} render={({ field }) => (<FormItem><FormLabel>Montant (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField name="reason" control={form.control} render={({ field }) => (<FormItem><FormLabel>Raison</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                                    <Button type="submit">Sauvegarder</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {employee.adjustments?.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Raison</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employee.adjustments.map(adj => (
                                <TableRow key={adj.id}>
                                    <TableCell>
                                        {adj.type === 'bonus' ? 
                                         <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Prime</Badge> : 
                                         <Badge variant="destructive">Avance</Badge>}
                                    </TableCell>
                                    <TableCell>{adj.reason}</TableCell>
                                    <TableCell className={`text-right font-medium ${adj.type === 'bonus' ? 'text-green-400' : 'text-red-400'}`}>
                                        {adj.type === 'deduction' && '-'}{(adj.amount || 0).toLocaleString('fr-FR')} FCFA
                                    </TableCell>
                                    <TableCell className="text-right">
                                         <Button variant="ghost" size="icon" onClick={() => handleDelete(adj.id)}>
                                            <Trash2 className="h-4 w-4" />
                                         </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucune prime ou avance pour cette période.</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function EmployeeRecapPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { employees, days, departments, updateEmployee, transferEmployee, deleteEmployee, isLoading, weekPeriod, company } = useEmployees();
  
   useEffect(() => {
    const userType = sessionStorage.getItem('userType');
    const companyId = sessionStorage.getItem('companyId');
    if (!userType || !companyId) {
      router.replace('/');
    }
  }, [router]);

  const employee = employees.find(emp => emp.id === id);

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
             <p className="text-lg font-semibold">Chargement des données de l'employé...</p>
        </div>
    );
  }

  if (!employee) {
    return (
         <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto p-4 md:p-8 text-center">
                <h1 className="text-2xl font-bold">Employé non trouvé</h1>
                <p className="text-muted-foreground">L'employé que vous recherchez n'existe pas ou n'appartient pas à votre entreprise.</p>
                <Button asChild className="mt-4">
                    <Link href="/dashboard">Retour au tableau de bord</Link>
                </Button>
            </main>
        </div>
    );
  }

  const currentWage = employee.currentWeekWage || employee.dailyWage || 0;
  const daysPresent = days.filter(day => employee.attendance[day]).length;
  const basePay = daysPresent * currentWage;
  const totalAdjustments = (employee.adjustments || []).reduce((acc, adj) => adj.type === 'bonus' ? acc + adj.amount : acc - adj.amount, 0);
  const weeklyPay = basePay + totalAdjustments;
  
  const registrationDate = parseISO(employee.registrationDate);
  const weeksSinceRegistration = differenceInWeeks(new Date(), registrationDate);
  const estimatedTotalEarnings = weeksSinceRegistration * (5 * employee.dailyWage); 

  const downloadWeeklySummary = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    if (company?.logoUrl) {
      doc.addImage(company.logoUrl, 'PNG', 14, 15, 30, 15);
    }
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 58, 90);
    doc.text(company?.name || "Fiche de Paie", pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(weekPeriod, pageWidth / 2, 30, { align: 'center' });

    (doc as any).autoTable({
        startY: 45,
        body: [
            ['Employé:', `${employee.firstName} ${employee.lastName}`],
            ['Département:', employee.domain],
            ['Salaire Journalier de Base:', `${(currentWage || 0).toLocaleString('fr-FR')} FCFA`],
        ],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
    });
    
    let finalY = (doc as any).autoTable.previous.finalY;

    (doc as any).autoTable({
        startY: finalY + 5,
        head: [['Résumé de Paie', 'Montant']],
        body: [
            ['Paie de base (Présence)', `${basePay.toLocaleString('fr-FR')} FCFA`],
            ['Total Primes', `${(employee.adjustments?.filter(a => a.type === 'bonus').reduce((s, a) => s + a.amount, 0) || 0).toLocaleString('fr-FR')} FCFA`],
            ['Total Avances', `${(employee.adjustments?.filter(a => a.type === 'deduction').reduce((s, a) => s + a.amount, 0) || 0).toLocaleString('fr-FR')} FCFA`],
        ],
        foot: [[
             { content: 'Total Net à Payer', styles: { fontStyle: 'bold', fontSize: 12 } },
             { content: `${weeklyPay.toLocaleString('fr-FR')} FCFA`, styles: { fontStyle: 'bold', fontSize: 12, halign: 'right' } }],
        ],
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [22, 163, 74], textColor: 255 },
    });
    finalY = (doc as any).autoTable.previous.finalY;

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Généré par Enock PayTracker pour ${company?.name || ''} le ${new Date().toLocaleDateString('fr-FR')}`, 14, pageHeight - 10);
    

    doc.save(`fiche_paie_${employee.lastName}_${employee.firstName}.pdf`);
  };

  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
            <div className="mb-6">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
            </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
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
                         <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <strong>Né(e) le:</strong> {format(parseISO(employee.birthDate), 'dd MMMM yyyy', { locale: fr })}</div>
                        <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /> <strong>Téléphone:</strong> {employee.phone}</div>
                        <div className="flex items-center gap-3"><Home className="h-4 w-4 text-muted-foreground" /> <strong>Adresse:</strong> {employee.address}</div>
                        <div className="flex items-center gap-3"><Wallet className="h-4 w-4 text-muted-foreground" /> <strong>Salaire/Jour:</strong> {(employee.dailyWage || 0).toLocaleString('fr-FR')} FCFA</div>
                         <div className="text-xs text-muted-foreground pt-2 border-t">
                            Inscrit le : {format(parseISO(employee.registrationDate), 'dd MMMM yyyy', { locale: fr })}
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-2">
                        <Button onClick={downloadWeeklySummary} variant="outline">
                            <Download className="mr-2 h-4 w-4"/>
                            PDF de la Période
                        </Button>
                        <div className="flex gap-2">
                            <EditEmployeeDialog employee={employee} departments={departments} updateEmployee={updateEmployee} />
                            <TransferEmployeeDialog employee={employee} departments={departments} transferEmployee={transferEmployee} />
                            <DeleteEmployeeDialog employee={employee} deleteEmployee={deleteEmployee} />
                        </div>
                    </CardFooter>
                </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Récapitulatif de la Période</CardTitle>
                            <CardDescription>{weekPeriod}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Salaire pour cette période:</span>
                            <span className="font-semibold">{(currentWage || 0).toLocaleString('fr-FR')} FCFA / jour</span>
                        </div>
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
                         <div className="space-y-2 pt-4 border-t">
                             <div className="flex justify-between items-center">
                                <span>Paie de base (jours travaillés):</span>
                                <span className="font-medium">{(basePay || 0).toLocaleString('fr-FR')} FCFA</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span>Total Primes / Avances:</span>
                                <span className={`font-medium ${totalAdjustments > 0 ? 'text-green-400' : totalAdjustments < 0 ? 'text-red-400' : ''}`}>{(totalAdjustments || 0).toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t text-lg">
                                <span className="font-semibold">Paie totale de la période:</span>
                                <span className="font-bold text-2xl text-primary">{(weeklyPay || 0).toLocaleString('fr-FR')} FCFA</span>
                            </div>
                         </div>
                    </CardContent>
                </Card>
                
                <AdjustmentsCard employee={employee} />
            </div>
        </div>
        </main>
    </div>
  );
}
