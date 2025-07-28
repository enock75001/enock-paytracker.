

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEmployees } from '@/context/employee-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Calendar, Home, Phone, User, Wallet, UserCog, MoveRight, Trash2, Edit, Download, CheckCircle, XCircle, PlusCircle, History, Receipt, TrendingUp, TrendingDown, Building, Route, FileSignature, Loader2 } from 'lucide-react';
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
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Department, Employee, Adjustment, PayStub, CareerEvent, Document } from '@/lib/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/hooks/use-session';
import { GanttChartSquare } from 'lucide-react';
import { generateContract } from '@/ai/flows/generate-contract-flow';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE').format(amount) + ' FCFA';
};

const employeeSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères.' }),
  lastName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  poste: z.string().min(2, { message: 'Le poste est requis.' }),
  domain: z.string({ required_error: 'Le département est requis.' }),
  birthDate: z.coerce.date({ required_error: 'Une date de naissance est requise.' }),
  address: z.string().min(5, { message: "L'adresse est requise." }),
  dailyWage: z.coerce.number().min(1, { message: 'Le salaire journalier doit être un nombre positif.' }),
  phone: z.string().min(9, { message: 'Un numéro de téléphone valide est requis.' }),
  photoUrl: z.string().optional(),
});

function GenerateContractDialog({ employee, company }: { employee: Employee, company: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [contractText, setContractText] = useState('');
    const { addDocument } = useEmployees();
    const { toast } = useToast();

    const handleGenerate = async () => {
        setIsLoading(true);
        setContractText('');
        try {
            const result = await generateContract({
                companyName: company?.name || "Nom de l'entreprise non défini",
                employeeName: `${employee.firstName} ${employee.lastName}`,
                employeeAddress: employee.address,
                employeePoste: employee.poste,
                monthlyWage: employee.dailyWage * 26, // Estimation
                hireDate: employee.registrationDate
            });
            setContractText(result.contractText);
        } catch (error) {
            console.error("Failed to generate contract:", error);
            toast({
                variant: 'destructive',
                title: 'Erreur de Génération',
                description: 'Impossible de générer le contrat pour le moment.'
            });
        } finally {
            setIsLoading(false);
        }
    }

    const downloadAndSaveContract = () => {
        const doc = new jsPDF();
        const logoUrl = company?.logoUrl;
        const fileName = `contrat_${employee.lastName}_${employee.firstName}.pdf`;
        
        const renderPdf = (logoImage?: HTMLImageElement) => {
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            let cursorY = 20;

            // --- Header ---
            if (logoImage) {
                doc.addImage(logoImage, 'PNG', 15, 15, 30, 15);
            }
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(company?.name || 'Entreprise', pageWidth - 15, cursorY, { align: 'right' });
            cursorY += 7;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(company?.description || '', pageWidth - 15, cursorY, { align: 'right' });
            cursorY += 10;
            doc.setDrawColor(221, 221, 221);
            doc.line(15, cursorY, pageWidth - 15, cursorY);
            cursorY += 20;

            // --- Body ---
            doc.setFontSize(11);
            const text = contractText.replace(/#\s/g, '').replace(/##\s/g, '').replace(/\*\*/g, '');
            const splitText = doc.splitTextToSize(text, pageWidth - 30);
            doc.text(splitText, 15, cursorY);

            // --- Footer ---
            for (let i = 1; i <= doc.getNumberOfPages(); i++) {
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setTextColor(150);
                doc.text(`Page ${i}/${doc.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                doc.text(`Généré par Enock PayTracker pour ${company?.name || ''}`, 15, pageHeight - 10);
            }
            
            // --- Save and Store ---
            const dataUrl = doc.output('datauristring');
            addDocument({
                employeeId: employee.id,
                documentType: 'contract',
                fileName: fileName,
                dataUrl: dataUrl,
                createdAt: new Date().toISOString(),
            });

            toast({ title: "Contrat Sauvegardé", description: "Le contrat a été généré et sauvegardé pour l'employé." });
            doc.save(fileName);
            setIsOpen(false);
        }

        if (logoUrl) {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = logoUrl;
            img.onload = () => renderPdf(img);
            img.onerror = () => { renderPdf(); }
        } else {
            renderPdf();
        }
    }

    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><FileSignature className="mr-2"/>Générer Contrat</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Générer un contrat de travail</DialogTitle>
                    <DialogDescription>
                        L'IA va générer un contrat de travail (CDD) basé sur les informations de l'employé. Vous pouvez modifier le texte avant de télécharger.
                    </DialogDescription>
                </DialogHeader>
                 <div className="flex-1 overflow-y-auto pr-4">
                     {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="mt-4 text-muted-foreground">Génération du contrat en cours...</p>
                        </div>
                     )}
                     {!isLoading && contractText && (
                        <Textarea
                            value={contractText}
                            onChange={(e) => setContractText(e.target.value)}
                            className="h-full min-h-[40vh] text-sm"
                            placeholder="Le contrat généré apparaîtra ici..."
                        />
                     )}
                 </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Fermer</Button></DialogClose>
                     {contractText && !isLoading && <Button onClick={downloadAndSaveContract}><Download className="mr-2 h-4 w-4"/>Sauvegarder & Télécharger</Button>}
                    <Button onClick={handleGenerate} disabled={isLoading}>
                       {isLoading ? 'Génération...' : contractText ? 'Régénérer' : 'Générer le contrat'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

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
            description: "Les informations de l'employé ont été mises à jour. Les changements prendront effet la semaine prochaine.",
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
                        <FormField control={form.control} name="photoUrl" render={({ field }) => (<FormItem><FormLabel>Photo de l'employé</FormLabel><FormControl><ImagePicker value={field.value ?? ''} onChange={field.onChange} name={`${watchedFirstName} ${watchedLastName}`} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Prénom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="poste" render={({ field }) => (<FormItem><FormLabel>Poste</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
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
        try {
            await deleteEmployee(employee.id);
            toast({
                title: "Employé Supprimé",
                description: `${employee.firstName} ${employee.lastName} a été supprimé du système.`,
            });
            router.push(`/dashboard/departments`);
        } catch(e: any) {
            toast({
                variant: 'destructive',
                title: "Action Impossible",
                description: e.message,
            });
        }
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
                                        {adj.type === 'deduction' && '-'}{formatCurrency(adj.amount)}
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

function PayHistoryTab({ employeeId }: { employeeId: string }) {
    const { fetchEmployeePayStubs } = useEmployees();
    const [payStubs, setPayStubs] = useState<PayStub[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
            <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        )
    }

    if (payStubs.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun historique de paie trouvé.</p>
            </div>
        )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Historique de Paie</CardTitle>
                <CardDescription>Liste de toutes les fiches de paie générées pour cet employé.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Période</TableHead>
                            <TableHead className="text-right">Paie Nette</TableHead>
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
            </CardContent>
        </Card>
    )
}

function CareerHistoryTab({ careerHistory }: { careerHistory: CareerEvent[] }) {
    
    const getIconForEvent = (type: CareerEvent['type']) => {
        switch (type) {
            case 'hire': return <PlusCircle className="h-5 w-5 text-green-500" />;
            case 'promotion': return <TrendingUp className="h-5 w-5 text-blue-500" />;
            case 'wage_change': return <Wallet className="h-5 w-5 text-amber-500" />;
            case 'transfer': return <Route className="h-5 w-5 text-purple-500" />;
            default: return <History className="h-5 w-5" />;
        }
    }
    
    if (!careerHistory || careerHistory.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun historique de carrière trouvé.</p>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historique de Carrière</CardTitle>
                <CardDescription>Suivi des évolutions professionnelles et salariales.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {careerHistory.map(event => (
                        <div key={event.id} className="flex items-start gap-4">
                            <div className="mt-1">
                                {getIconForEvent(event.type)}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{format(parseISO(event.date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                                {event.oldValue !== undefined && (
                                    <p className="text-xs text-muted-foreground/80 flex items-center gap-2">
                                        <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3"/>Ancien: {typeof event.oldValue === 'number' ? formatCurrency(event.oldValue) : event.oldValue}</span>
                                        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3"/>Nouveau: {typeof event.newValue === 'number' ? formatCurrency(event.newValue) : event.newValue}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export default function EmployeeRecapPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { employees, days, departments, updateEmployee, transferEmployee, deleteEmployee, isLoading, weekPeriod, company, loans, justifications, weekDates } = useEmployees();
  const { sessionData, isLoggedIn } = useSession();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  useEffect(() => {
    if (isLoggedIn === false && isCheckingSession) {
      return;
    }
    setIsCheckingSession(false);

    if (sessionData.userType !== 'admin') {
      router.replace('/admin-login');
    }
  }, [sessionData, isLoggedIn, router, isCheckingSession]);

  const employee = employees.find(emp => emp.id === id);

  if (isCheckingSession || isLoading) {
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
  const daysPresent = days.filter(day => {
    const date = weekDates[days.indexOf(day)];
    const isJustified = justifications.some(j => j.employeeId === employee.id && j.status === 'approved' && j.date === format(date, 'yyyy-MM-dd'));
    return employee.attendance[day] || isJustified;
  }).length;
  const basePay = daysPresent * currentWage;
  const totalAdjustments = (employee.adjustments || []).reduce((acc, adj) => adj.type === 'bonus' ? acc + adj.amount : acc - adj.amount, 0);
  
  const activeLoan = loans.find(l => l.employeeId === employee.id && l.status === 'active');
  const loanRepayment = activeLoan ? Math.min(activeLoan.balance, activeLoan.repaymentAmount) : 0;
  
  const weeklyPay = basePay + totalAdjustments - loanRepayment;
  
  const downloadWeeklySummary = () => {
    const doc = new jsPDF();
    const logoUrl = company?.logoUrl || 'https://i.postimg.cc/xdLntsjG/Chat-GPT-Image-27-juil-2025-19-35-13.png';
    const img = new (window as any).Image();
    img.crossOrigin = "Anonymous";
    img.src = logoUrl;

    img.onload = () => {
      try {
        doc.addImage(img, 'PNG', 14, 15, 30, 15, undefined, 'FAST');
      } catch (e) {
          console.error("Error adding image to PDF:", e);
      }
      renderPdfContent(doc);
    };

    img.onerror = () => {
        console.error("Failed to load company logo for PDF.");
        renderPdfContent(doc);
    }
  };

  const renderPdfContent = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = 15;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 58, 90);
    doc.text(company?.name || "Entreprise", pageWidth / 2, cursorY + 7, { align: 'center' });
    cursorY += 10;
    
    if (company?.description) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text(company.description, pageWidth / 2, cursorY + 5, { align: 'center' });
        cursorY += 5;
    }
    cursorY += 5;
    
    doc.setDrawColor(221, 221, 221);
    doc.line(14, cursorY, pageWidth - 14, cursorY);
    cursorY += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 58, 90);
    doc.text("Fiche de Paie", pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 5;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(weekPeriod, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 10;


    (doc as any).autoTable({
        startY: cursorY,
        body: [
            ['Employé:', `${employee.firstName} ${employee.lastName}`],
            ['Département:', employee.domain],
            ['Poste:', employee.poste],
            ['Salaire Journalier de Base:', formatCurrency(currentWage)],
        ],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
    });
    
    let finalY = (doc as any).autoTable.previous.finalY;

    (doc as any).autoTable({
        startY: finalY + 5,
        head: [['Résumé de Paie', 'Montant']],
        body: [
            [`Paie de base (${daysPresent} jours travaillés/justifiés)`, formatCurrency(basePay)],
            ['Total Primes', formatCurrency((employee.adjustments?.filter(a => a.type === 'bonus').reduce((s, a) => s + a.amount, 0) || 0))],
            ['Total Avances', formatCurrency((employee.adjustments?.filter(a => a.type === 'deduction').reduce((s, a) => s + a.amount, 0) || 0))],
            ['Remboursement avance', `-${formatCurrency(loanRepayment)}`],
        ],
        foot: [[
             { content: 'Total Net à Payer', styles: { fontStyle: 'bold', fontSize: 12 } },
             { content: formatCurrency(weeklyPay), styles: { fontStyle: 'bold', fontSize: 12, halign: 'right' } }],
        ],
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [22, 163, 74], textColor: 255 },
        didParseCell: function(data: any) {
            if (data.row.section === 'body' && data.column.index === 1) {
                data.cell.styles.halign = 'right';
            }
        },
    });
    finalY = (doc as any).autoTable.previous.finalY;

    doc.setFontSize(9);
    doc.setTextColor(150);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.text(`Généré par Enock PayTracker pour ${company?.name || ''} le ${new Date().toLocaleDateString('fr-FR')}`, 14, pageHeight - 10);
    
    doc.save(`fiche_paie_${employee.lastName}_${employee.firstName}.pdf`);
  }

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
                            <CardTitle className="text-2xl font-headline">{employee.firstName} ${employee.lastName}</CardTitle>
                            <CardDescription className="text-md">{employee.domain}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                         <div className="flex items-center gap-3"><GanttChartSquare className="h-4 w-4 text-muted-foreground" /> <strong>Poste:</strong> {employee.poste}</div>
                         <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <strong>Né(e) le:</strong> {format(parseISO(employee.birthDate), 'dd MMMM yyyy', { locale: fr })}</div>
                        <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /> <strong>Téléphone:</strong> {employee.phone}</div>
                        <div className="flex items-center gap-3"><Home className="h-4 w-4 text-muted-foreground" /> <strong>Adresse:</strong> {employee.address}</div>
                        <div className="flex items-center gap-3"><Wallet className="h-4 w-4 text-muted-foreground" /> <strong>Salaire/Jour:</strong> {formatCurrency(employee.dailyWage)}</div>
                         {activeLoan && (
                            <div className="flex items-center gap-3 pt-2 border-t text-amber-500"><Receipt className="h-4 w-4"/> <strong>Avance en cours:</strong> {formatCurrency(activeLoan.balance)}</div>
                         )}
                         <div className="text-xs text-muted-foreground pt-2 border-t">
                            Inscrit le : {format(parseISO(employee.registrationDate), 'dd MMMM yyyy', { locale: fr })}
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-2">
                         <div className="flex gap-2 w-full">
                           <GenerateContractDialog employee={employee} company={company} />
                           <Button onClick={downloadWeeklySummary} variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4"/>
                            Fiche de Paie
                           </Button>
                         </div>
                        <div className="flex gap-2">
                            <EditEmployeeDialog employee={employee} departments={departments} updateEmployee={updateEmployee} />
                            <TransferEmployeeDialog employee={employee} departments={departments} transferEmployee={transferEmployee} />
                            <DeleteEmployeeDialog employee={employee} deleteEmployee={deleteEmployee} />
                        </div>
                    </CardFooter>
                </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
                 <Tabs defaultValue="current_period" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="current_period">Période Actuelle</TabsTrigger>
                        <TabsTrigger value="history"><History className="mr-2 h-4 w-4"/>Historique de Paie</TabsTrigger>
                        <TabsTrigger value="career">Carrière</TabsTrigger>
                    </TabsList>
                    <TabsContent value="current_period">
                        <Card>
                            <CardHeader>
                                <CardTitle>Récapitulatif de la Période</CardTitle>
                                    <CardDescription>{weekPeriod}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Salaire pour cette période:</span>
                                    <span className="font-semibold">{formatCurrency(currentWage)} / jour</span>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Jour</TableHead>
                                            <TableHead className="text-right">Statut</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {days.map(day => {
                                            const date = weekDates[days.indexOf(day)];
                                            const isJustified = justifications.some(j => j.employeeId === employee.id && j.status === 'approved' && j.date === format(date, 'yyyy-MM-dd'));

                                            return (
                                                <TableRow key={day}>
                                                    <TableCell>{day}</TableCell>
                                                    <TableCell className="text-right">
                                                        {employee.attendance[day] ? 
                                                            <Badge variant="outline" className="text-green-400 border-green-400/50"><CheckCircle className="mr-1 h-3 w-3"/>Présent</Badge> : 
                                                            isJustified ?
                                                            <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30"><CheckCircle className="mr-1 h-3 w-3"/>Justifié</Badge> :
                                                            <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3"/>Absent</Badge>
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                                 <div className="space-y-2 pt-4 border-t">
                                     <div className="flex justify-between items-center">
                                        <span>Paie de base ({daysPresent} jours payés):</span>
                                        <span className="font-medium">{formatCurrency(basePay)}</span>
                                    </div>
                                     <div className="flex justify-between items-center">
                                        <span>Total Primes / Avances ponctuelles:</span>
                                        <span className={`font-medium ${totalAdjustments > 0 ? 'text-green-400' : totalAdjustments < 0 ? 'text-red-400' : ''}`}>{formatCurrency(totalAdjustments)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Remboursement avance programmée:</span>
                                        <span className={`font-medium ${loanRepayment > 0 ? 'text-red-400' : ''}`}>-{formatCurrency(loanRepayment)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t text-lg">
                                        <span className="font-semibold">Paie totale de la période:</span>
                                        <span className="font-bold text-2xl text-primary">{formatCurrency(weeklyPay)}</span>
                                    </div>
                                 </div>
                            </CardContent>
                        </Card>
                        <div className="mt-8">
                            <AdjustmentsCard employee={employee} />
                        </div>
                    </TabsContent>
                    <TabsContent value="history">
                       <PayHistoryTab employeeId={employee.id} />
                    </TabsContent>
                    <TabsContent value="career">
                       <CareerHistoryTab careerHistory={employee.careerHistory || []} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
        </main>
    </div>
  );
}

