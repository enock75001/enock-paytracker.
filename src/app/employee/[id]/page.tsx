

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEmployees } from '@/context/employee-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Calendar, Home, Phone, User, Wallet, UserCog, MoveRight, Trash2, Edit, Download, CheckCircle, XCircle } from 'lucide-react';
import { differenceInWeeks, parseISO } from 'date-fns';
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
import type { Department, Employee } from '@/lib/types';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { ImagePicker } from '@/components/image-picker';
import { Header } from '@/components/header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


const employeeSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères.' }),
  lastName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  domain: z.string({ required_error: 'Le département est requis.' }),
  birthDate: z.date({ required_error: 'Une date de naissance est requise.' }),
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

    function onSubmit(values: z.infer<typeof employeeSchema>) {
        updateEmployee(employee.id, {
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
                        <FormField control={form.control} name="domain" render={({ field }) => (<FormItem><FormLabel>Département</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez un département" /></SelectTrigger></FormControl><SelectContent>{domains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="birthDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date de naissance</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP", { locale: fr })) : (<span>Choisissez une date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1930-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
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

  const handleTransfer = () => {
    if (!selectedDepartment) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Veuillez sélectionner un nouveau département.",
        });
        return;
    }
    transferEmployee(employee.id, selectedDepartment);
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
                    {availableDepartments.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
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

    const handleDelete = () => {
        deleteEmployee(employee.id);
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

export default function EmployeeRecapPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { employees, days, departments, updateEmployee, transferEmployee, deleteEmployee } = useEmployees();

  const employee = employees.find(emp => emp.id === id);

  if (!employee) {
    return (
        <div className="container mx-auto p-4 md:p-8 text-center">
            <h1 className="text-2xl font-bold">Employé non trouvé</h1>
            <p className="text-muted-foreground">L'employé que vous recherchez n'existe pas.</p>
            <Button asChild className="mt-4">
                <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
        </div>
    );
  }

  const daysPresent = days.filter(day => employee.attendance[day]).length;
  const weeklyPay = daysPresent * employee.currentWeekWage;
  
  const registrationDate = parseISO(employee.registrationDate);
  const weeksSinceRegistration = differenceInWeeks(new Date(), registrationDate);
  const estimatedTotalEarnings = weeksSinceRegistration * (5 * employee.dailyWage); 

  const downloadWeeklySummary = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Titre
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("Récapitulatif de Paie Hebdomadaire", pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Période: Semaine du ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, pageWidth / 2, 28, { align: 'center' });

    // Informations de l'employé
    (doc as any).autoTable({
        startY: 40,
        body: [
            ['Nom Complet', `${employee.firstName} ${employee.lastName}`],
            ['Département', employee.domain],
            ['Salaire Journalier (Semaine)', `${new Intl.NumberFormat('fr-FR').format(employee.currentWeekWage)} FCFA`],
        ],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
    });

    // Tableau de présence
    const attendanceData = days.map(day => [
        day, 
        employee.attendance[day] ? 'Présent' : 'Absent'
    ]);
    (doc as any).autoTable({
        head: [['Jour', 'Statut']],
        body: attendanceData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        didParseCell: function(data: any) {
            if (data.section === 'body' && data.column.index === 1) {
                if (data.cell.raw === 'Présent') {
                    data.cell.styles.textColor = [39, 174, 96];
                    data.cell.styles.fontStyle = 'bold';
                } else {
                    data.cell.styles.textColor = [192, 57, 43];
                }
            }
        }
    });

    // Résumé financier
    const finalY = (doc as any).autoTable.previous.finalY;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Résumé Financier", 14, finalY + 15);
    (doc as any).autoTable({
        startY: finalY + 20,
        body: [
            ['Jours Présents', `${daysPresent} jour(s)`],
            ['Jours Absents', `${days.length - daysPresent} jour(s)`],
            ['Total Paie Hebdomadaire', `${new Intl.NumberFormat('fr-FR').format(weeklyPay)} FCFA`],
        ],
        theme: 'grid',
        styles: { fontSize: 12, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold' } },
    });

    doc.save(`recap_hebdo_${employee.lastName}_${employee.firstName}.pdf`);
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

        <Card className="max-w-4xl mx-auto">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} data-ai-hint="person portrait" />
                    <AvatarFallback className="text-3xl">{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle className="text-4xl font-headline">{employee.firstName} {employee.lastName}</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground">{employee.domain}</CardDescription>
                    <div className="text-sm text-muted-foreground mt-2">
                        Inscrit le : {format(parseISO(employee.registrationDate), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                </div>
                <Button onClick={downloadWeeklySummary} variant="outline">
                    <Download className="mr-2 h-4 w-4"/>
                    PDF de la Semaine
                </Button>
            </CardHeader>
            <CardContent className="grid gap-8 pt-6">
                <div>
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2">Informations Personnelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /> <strong>Nom Complet:</strong> {employee.firstName} {employee.lastName}</div>
                        <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <strong>Date de Naissance:</strong> {format(parseISO(employee.birthDate), 'dd MMMM yyyy', { locale: fr })}</div>
                        <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /> <strong>Téléphone:</strong> {employee.phone}</div>
                        <div className="flex items-center gap-3"><Home className="h-4 w-4 text-muted-foreground" /> <strong>Adresse:</strong> {employee.address}</div>
                        <div className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-muted-foreground" /> <strong>Domaine:</strong> {employee.domain}</div>
                        <div className="flex items-center gap-3"><Wallet className="h-4 w-4 text-muted-foreground" /> <strong>Salaire Journalier de Base:</strong> {new Intl.NumberFormat('fr-FR').format(employee.dailyWage)} FCFA</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="bg-secondary/50">
                        <CardHeader>
                            <CardTitle>Récapitulatif de la Semaine</CardTitle>
                             <CardDescription>Détail des présences et de la paie pour la semaine en cours.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Salaire pour cette semaine:</span>
                                <span className="font-semibold">{new Intl.NumberFormat('fr-FR').format(employee.currentWeekWage)} FCFA / jour</span>
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
                            <div className="flex justify-between items-center pt-4 border-t">
                                <span className="font-semibold text-lg">Paie de la semaine:</span>
                                <span className="font-bold text-2xl text-primary">{new Intl.NumberFormat('fr-FR').format(weeklyPay)} FCFA</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Récapitulatif Global</CardTitle>
                            <CardDescription>Estimation depuis l'inscription</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Salaire total estimé:</span>
                                    <span className="font-bold text-2xl text-primary">{new Intl.NumberFormat('fr-FR').format(estimatedTotalEarnings)} FCFA</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Basé sur {weeksSinceRegistration} semaines de travail depuis l'inscription, avec une estimation de 5 jours de travail par semaine.
                                </p>
                                <Alert>
                                    <AlertTitle>Note sur l'estimation</AlertTitle>
                                    <AlertDescription>
                                        Ce montant est une estimation et ne prend pas en compte l'historique détaillé des présences ou les changements de salaire passés.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t pt-6">
                <EditEmployeeDialog employee={employee} departments={departments} updateEmployee={updateEmployee} />
                <TransferEmployeeDialog employee={employee} departments={departments} transferEmployee={transferEmployee} />
                <DeleteEmployeeDialog employee={employee} deleteEmployee={deleteEmployee} />
            </CardFooter>
        </Card>
        </main>
    </div>
  );
}
