
'use client';

import { useEmployees } from '@/context/employee-provider';
import type { Employee, Department } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Download, Users, Eye, UserCog, PlusCircle, Edit, Trash2, Archive } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
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
import { useToast } from "@/hooks/use-toast"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { useState } from 'react';
import { mockArchives, ArchivedPayroll } from '@/lib/data';


function groupEmployeesByDomain(employees: Employee[]): Record<string, Employee[]> {
  return employees.reduce((acc, employee) => {
    const domain = employee.domain;
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push(employee);
    return acc;
  }, {} as Record<string, Employee[]>);
}

const departmentSchema = z.object({
  name: z.string().min(3, "Le nom du département est requis."),
  managerName: z.string().min(3, "Le nom du manager est requis."),
  managerPin: z.string().length(4, "Le code PIN doit contenir 4 chiffres."),
});

// Component for Departments Tab
function DepartmentsTab() {
  const { employees, departments, addDepartment, updateDepartment, deleteDepartment } = useEmployees();
  const groupedEmployees = groupEmployeesByDomain(employees);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [defaultValues, setDefaultValues] = useState({ name: '', managerName: '', managerPin: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalDepartmentName, setOriginalDepartmentName] = useState('');

  const form = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues,
  });

  const openDialog = (department?: Department) => {
    if (department) {
      setIsEditMode(true);
      setOriginalDepartmentName(department.name);
      form.reset({ name: department.name, managerName: department.manager.name, managerPin: department.manager.pin });
    } else {
      setIsEditMode(false);
      form.reset({ name: '', managerName: '', managerPin: '' });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof departmentSchema>) => {
    try {
      if (isEditMode) {
        updateDepartment(originalDepartmentName, {
          name: values.name,
          manager: { name: values.managerName, pin: values.managerPin }
        });
        toast({ title: "Succès", description: "Département mis à jour." });
      } else {
        addDepartment({
          name: values.name,
          manager: { name: values.managerName, pin: values.managerPin }
        });
        toast({ title: "Succès", description: "Nouveau département ajouté." });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Erreur", description: error.message });
    }
  };


  return (
    <Card>
        <CardHeader className='flex-row items-center justify-between'>
            <div className="space-y-1.5">
                <CardTitle>Gestion des Départements</CardTitle>
                <CardDescription>Ajoutez, modifiez ou supprimez des départements.</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => openDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nouveau Département
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? "Modifier le département" : "Créer un nouveau département"}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField name="name" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Nom du département</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="managerName" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Nom du Manager</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name="managerPin" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Code PIN du Manager (4 chiffres)</FormLabel><FormControl><Input type="password" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => {
                const employeesInDomain = groupedEmployees[department.name] || [];
                return (
                    <Card key={department.name}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <span>{department.name}</span>
                                <Users className="h-6 w-6 text-muted-foreground" />
                            </CardTitle>
                            <CardDescription className="flex items-center pt-1">
                                <UserCog className="mr-2 h-4 w-4" />
                                <span>Manager: {department.manager.name}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{employeesInDomain.length} employés</div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                             <div className="flex gap-2">
                                 <Button variant="outline" size="icon" onClick={() => openDialog(department)}><Edit className="h-4 w-4" /></Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" disabled={employeesInDomain.length > 0}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le département sera supprimé définitivement.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteDepartment(department.name)}>Supprimer</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                 </AlertDialog>
                             </div>
                             <Button asChild>
                                <Link href={`/department/${encodeURIComponent(department.name)}`}>Gérer</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                )
            })}
            </div>
             <p className="text-xs text-muted-foreground mt-4">Pour supprimer un département, vous devez d'abord réaffecter ou supprimer tous ses employés.</p>
        </CardContent>
    </Card>
  )
}

// Logic from recap page
interface WeeklySummary {
  employee: Employee;
  daysPresent: number;
  daysAbsent: number;
  totalPay: number;
}
const calculateWeeklyPay = (employee: Employee, days: string[]): WeeklySummary => {
    const daysPresent = days.filter(day => employee.attendance[day]).length;
    const totalPay = daysPresent * employee.dailyWage;
    return {
        employee,
        daysPresent,
        daysAbsent: days.length - daysPresent,
        totalPay
    };
}

const groupSummariesByDomain = (summaries: WeeklySummary[]): Record<string, WeeklySummary[]> => {
    return summaries.reduce((acc, summary) => {
        const domain = summary.employee.domain;
        if (!acc[domain]) {
            acc[domain] = [];
        }
        acc[domain].push(summary);
        return acc;
    }, {} as Record<string, WeeklySummary[]>);
};

// Component for Recap Tab
function RecapTab() {
  const { employees, days } = useEmployees();
  const weeklySummaries = employees.map(emp => calculateWeeklyPay(emp, days));
  const groupedSummaries = groupSummariesByDomain(weeklySummaries);
  const totalPayroll = weeklySummaries.reduce((sum, summary) => sum + summary.totalPay, 0);

  const downloadPdf = () => {
    const doc = new jsPDF();
    const pageTitle = "Récapitulatif de Paie Hebdomadaire";
    const titleWidth = doc.getTextWidth(pageTitle);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.text(pageTitle, (pageWidth - titleWidth) / 2, 20);

    Object.entries(groupedSummaries).forEach(([domain, summaries]) => {
        (doc as any).autoTable({
            startY: (doc as any).autoTable.previous.finalY + 15 || 30,
            head: [[{ content: domain, colSpan: 5, styles: { fillColor: [22, 163, 74], textColor: 255 } }]],
            body: summaries.map(s => [
                `${s.employee.firstName} ${s.employee.lastName}`,
                s.daysPresent,
                s.daysAbsent,
                new Intl.NumberFormat('fr-FR').format(s.totalPay),
                ''
            ]),
            headStyles: { halign: 'center'},
            foot: [[
                { content: 'Total Département', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: new Intl.NumberFormat('fr-FR').format(summaries.reduce((acc, curr) => acc + curr.totalPay, 0)), styles: { halign: 'right', fontStyle: 'bold' } },
                ''
            ]],
            footStyles: { fillColor: [240, 240, 240] },
            columns: [
                { header: 'Employé' },
                { header: 'Présents', styles: { halign: 'center' } },
                { header: 'Absents', styles: { halign: 'center' } },
                { header: 'Salaire', styles: { halign: 'right' } },
                { header: 'Actions', styles: { halign: 'center'} }
            ],
            theme: 'striped',
            didDrawPage: function (data: any) {
                // Footer
                doc.setFontSize(10);
                doc.text('PayTracker - ' + new Date().toLocaleDateString('fr-FR'), data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
            }
        });
    });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Général à Payer: ${new Intl.NumberFormat('fr-FR').format(totalPayroll)} FCFA`, 14, (doc as any).autoTable.previous.finalY + 20);

    doc.save(`recap_paie_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <>
      <div className="mb-6 mt-6 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline">Récapitulatif Hebdomadaire</h1>
            <p className="text-muted-foreground">
              Résumé de la présence et des paiements des employés pour la semaine.
            </p>
        </div>
        <Button onClick={downloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger en PDF
        </Button>
      </div>
      
      <Accordion type="multiple" defaultValue={Object.keys(groupedSummaries)} className="w-full space-y-4">
        {Object.entries(groupedSummaries).map(([domain, summaries]) => {
          const domainTotal = summaries.reduce((sum, s) => sum + s.totalPay, 0);
          return (
            <Card key={domain} className="overflow-hidden">
                <AccordionItem value={domain} className="border-b-0">
                    <AccordionTrigger className="p-6 bg-card hover:bg-secondary/50 [&[data-state=open]]:border-b">
                        <div className='flex items-center justify-between w-full'>
                            <div className='flex items-center gap-4'>
                                <h2 className="text-xl font-semibold font-headline">{domain}</h2>
                                <Badge variant="secondary">{summaries.length} employés</Badge>
                            </div>
                            <div className="text-lg font-semibold pr-4">
                                Total: {new Intl.NumberFormat('fr-FR').format(domainTotal)} FCFA
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employé</TableHead>
                                    <TableHead className="text-center">Jours Présents</TableHead>
                                    <TableHead className="text-center">Jours Absents</TableHead>
                                    <TableHead className="text-right">Paie Totale</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {summaries.map(summary => (
                                <TableRow key={summary.employee.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={summary.employee.photoUrl} alt={`${summary.employee.firstName} ${summary.employee.lastName}`} data-ai-hint="person portrait" />
                                                <AvatarFallback>{summary.employee.firstName.charAt(0)}{summary.employee.lastName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">
                                                {summary.employee.firstName} {summary.employee.lastName}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-accent/80 text-accent-foreground hover:bg-accent">{summary.daysPresent}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{summary.daysAbsent}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {new Intl.NumberFormat('fr-FR').format(summary.totalPay)} FCFA
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Link href={`/employee/${summary.employee.id}`} passHref>
                                            <Button variant="ghost" size="icon">
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">Voir les détails</span>
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className='bg-secondary/80 hover:bg-secondary/80'>
                                    <TableCell colSpan={3} className="text-right font-bold text-lg">Total Département</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{new Intl.NumberFormat('fr-FR').format(domainTotal)} FCFA</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableFooter>
                        </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Card>
          )
        })}
      </Accordion>

      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="text-2xl">Total Général de la Semaine</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-4xl font-bold text-primary">
                {new Intl.NumberFormat('fr-FR').format(totalPayroll)} FCFA
            </div>
             <p className="text-muted-foreground mt-2">
                Ceci est la somme totale à payer à tous les employés pour la semaine en cours.
            </p>
        </CardContent>
      </Card>
    </>
  );
}

// Schema from register page
const registerSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères.' }),
  lastName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  domain: z.string({ required_error: 'Le département est requis.' }),
  birthDate: z.date({ required_error: 'Une date de naissance est requise.' }),
  address: z.string().min(5, { message: "L'adresse est requise." }),
  dailyWage: z.coerce.number().min(1, { message: 'Le salaire journalier doit être un nombre positif.' }),
  phone: z.string().min(9, { message: 'Un numéro de téléphone valide est requis.' }),
  photoUrl: z.string().url({ message: 'Veuillez entrer une URL valide.' }).optional().or(z.literal('')),
});

// Component for Register Tab
function RegisterTab() {
    const { addEmployee, departments } = useEmployees();
    const { toast } = useToast()
    const domains = departments.map(d => d.name);

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            domain: '',
            address: '',
            dailyWage: 5000,
            phone: '',
            photoUrl: '',
        },
    });

    function onSubmit(values: z.infer<typeof registerSchema>) {
        addEmployee({
            ...values,
            birthDate: values.birthDate.toISOString().split('T')[0],
        });
        toast({
            title: "Employé Enregistré",
            description: `${values.firstName} ${values.lastName} a été ajouté avec succès au département ${values.domain}.`,
            className: 'bg-accent text-accent-foreground'
        });
        form.reset();
    }
    
    return (
        <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Enregistrer un Nouvel Employé</CardTitle>
          <CardDescription>Remplissez le formulaire pour ajouter un employé à un département.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                
                 <FormField control={form.control} name="domain" render={({ field }) => (
                     <FormItem>
                        <FormLabel>Département</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un département" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {domains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

              <FormField control={form.control} name="birthDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Date de naissance</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? (format(field.value, "PPP")) : (<span>Choisissez une date</span>)}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1930-01-01")} initialFocus />
                    </PopoverContent>
                  </Popover><FormMessage />
                </FormItem>
              )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input placeholder="123 Rue Principale, Anytown" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="dailyWage" render={({ field }) => (
                        <FormItem><FormLabel>Salaire Journalier (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Numéro de téléphone</FormLabel><FormControl><Input placeholder="+225 0102030405" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="photoUrl" render={({ field }) => (
                    <FormItem><FormLabel>URL de la Photo</FormLabel><FormControl><Input placeholder="https://placehold.co/photo.jpg" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              <Button type="submit">Enregistrer l'employé</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
}

function ArchivesTab() {
  const [archives] = useState<ArchivedPayroll[]>(mockArchives);

  const groupArchivesByYear = (archives: ArchivedPayroll[]): Record<string, ArchivedPayroll[]> => {
    return archives.reduce((acc, archive) => {
      const year = archive.period.split('-')[0];
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(archive);
      return acc;
    }, {} as Record<string, ArchivedPayroll[]>);
  };
  
  const groupedArchives = groupArchivesByYear(archives);
  const years = Object.keys(groupedArchives).sort((a, b) => b.localeCompare(a));

  const monthNames: Record<string, string> = {
    "01": "Janvier", "02": "Février", "03": "Mars", "04": "Avril",
    "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Août",
    "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Décembre"
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Archives des Fiches de Paie</CardTitle>
        <CardDescription>Consultez l'historique des paiements passés.</CardDescription>
      </CardHeader>
      <CardContent>
        {years.length === 0 ? (
          <p>Aucune archive disponible pour le moment.</p>
        ) : (
          <Accordion type="multiple" defaultValue={years} className="w-full space-y-4">
            {years.map(year => (
              <Card key={year} className="overflow-hidden">
                <AccordionItem value={year} className="border-b-0">
                  <AccordionTrigger className="p-6 bg-card hover:bg-secondary/50 [&[data-state=open]]:border-b">
                    <h2 className="text-xl font-semibold font-headline">Année {year}</h2>
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    {groupedArchives[year]
                        .sort((a,b) => b.period.localeCompare(a.period))
                        .map(archive => {
                            const month = archive.period.split('-')[1];
                            const monthName = monthNames[month] || "Mois Inconnu";
                            return (
                                <div key={archive.period} className="border-t p-4">
                                    <h3 className="font-semibold text-lg">{monthName} {year}</h3>
                                    <p className="text-muted-foreground mb-2">
                                      Total payé : <span className="font-bold text-primary">{new Intl.NumberFormat('fr-FR').format(archive.totalPayroll)} FCFA</span>
                                    </p>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Département</TableHead>
                                                <TableHead>Employés</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {archive.departments.map(dept => (
                                                <TableRow key={dept.name}>
                                                    <TableCell>{dept.name}</TableCell>
                                                    <TableCell>{dept.employeeCount}</TableCell>
                                                    <TableCell className="text-right">{new Intl.NumberFormat('fr-FR').format(dept.total)} FCFA</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )
                        })
                    }
                  </AccordionContent>
                </AccordionItem>
              </Card>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}

// Main Page Component
export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold font-headline">Tableau de Bord Administrateur</h1>
            <p className="text-muted-foreground">
                Gérez les départements, les employés et la paie depuis une interface centralisée.
            </p>
        </div>
       <Tabs defaultValue="departments" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="departments">Gestion des Départements</TabsTrigger>
                <TabsTrigger value="register">Enregistrer un Employé</TabsTrigger>
                <TabsTrigger value="recap">Récapitulatif de Paie</TabsTrigger>
                <TabsTrigger value="archives">
                  <Archive className="mr-2 h-4 w-4" />
                  Archives
                </TabsTrigger>
            </TabsList>
            <TabsContent value="departments" className="mt-6">
                <DepartmentsTab />
            </TabsContent>
            <TabsContent value="register" className="mt-6">
                <RegisterTab />
            </TabsContent>
            <TabsContent value="recap" className="mt-6">
                <RecapTab />
            </TabsContent>
             <TabsContent value="archives" className="mt-6">
                <ArchivesTab />
            </TabsContent>
        </Tabs>
    </div>
  );
}
