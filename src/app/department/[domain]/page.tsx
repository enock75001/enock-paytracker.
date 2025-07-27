
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEmployees } from '@/context/employee-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye, Download, UserPlus, CalendarCheck, ShieldCheck, ShieldAlert, AlertTriangle, Check, X, ShieldQuestion } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isSameDay, parseISO } from "date-fns"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ImagePicker } from '@/components/image-picker';
import { Header } from '@/components/header';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useEffect, useState } from 'react';
import { ChatWidget } from '@/components/chat-widget';
import { Label } from '@/components/ui/label';
import { type AbsenceJustification } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useSession } from '@/hooks/use-session';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0 }).format(amount) + ' FCFA';
};

const registerSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères.' }),
  lastName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  poste: z.string().min(2, { message: 'Le poste est requis.' }),
  domain: z.string(),
  birthDate: z.coerce.date({ required_error: 'Une date de naissance est requise.' }),
  address: z.string().min(5, { message: "L'adresse est requise." }),
  dailyWage: z.coerce.number().min(1, { message: 'Le salaire journalier doit être un nombre positif.' }),
  phone: z.string().min(9, { message: 'Un numéro de téléphone valide est requis.' }),
  photoUrl: z.string().optional(),
});


// Component for Registering an employee in a specific department
function RegisterInDepartment({ domain }: { domain: string }) {
    const { addEmployee } = useEmployees();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            poste: '',
            domain: domain,
            address: '',
            dailyWage: 0,
            phone: '',
            photoUrl: '',
        },
    });

    const watchedFirstName = form.watch('firstName');
    const watchedLastName = form.watch('lastName');

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        await addEmployee({
            ...values,
            birthDate: values.birthDate.toISOString().split('T')[0],
            photoUrl: values.photoUrl || '',
        });
        toast({
            title: "Employé Enregistré",
            description: `${values.firstName} ${values.lastName} a été ajouté avec succès au département ${values.domain}.`,
            className: 'bg-accent text-accent-foreground'
        });
        form.reset();
        form.setValue('domain', domain);
    }
    
    return (
        <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline">Enregistrer un Nouvel Employé</CardTitle>
          <CardDescription>Remplissez le formulaire pour ajouter un employé au département <span className="font-semibold">{domain}</span>.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Photo de l'employé</Label>
                      <FormControl>
                         <ImagePicker 
                           value={field.value ?? ''} 
                           onChange={field.onChange}
                           name={`${watchedFirstName} ${watchedLastName}`}
                         />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem><Label>Prénom</Label><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><Label>Nom</Label><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="poste" render={({ field }) => (
                    <FormItem><Label>Poste</Label><FormControl><Input placeholder="Ex: Maçon" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="domain" render={({ field }) => (
                    <FormItem>
                        <Label>Département</Label>
                        <FormControl>
                            <Input {...field} readOnly disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

              <FormField control={form.control} name="birthDate" render={({ field }) => (
                <FormItem><Label>Date de naissance</Label><FormControl><Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} /></FormControl><FormMessage /></FormItem>
              )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><Label>Adresse</Label><FormControl><Input placeholder="123 Rue Principale, Anytown" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="dailyWage" render={({ field }) => (
                        <FormItem><Label>Salaire Journalier (FCFA)</Label><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><Label>Numéro de téléphone</Label><FormControl><Input placeholder="+225 0102030405" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
              <Button type="submit">Enregistrer l'employé</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
}


// Component for Attendance Tab
function AttendanceTab({ domain }: { domain: string }) {
  const { employees, updateAttendance, days, weekPeriod, weekDates, company, justifications } = useEmployees();
  const employeesInDomain = employees.filter(emp => emp.domain === domain);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
  
  const getJustificationForDay = (employeeId: string, date: Date): AbsenceJustification | undefined => {
      const dateString = format(date, 'yyyy-MM-dd');
      return justifications.find(j => j.employeeId === employeeId && j.date === dateString);
  }

  const downloadAttendancePdf = () => {
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
        renderPdfContent(doc);
        doc.save(`presence_paie_${domain.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    img.onerror = () => {
        console.error("Failed to load company logo for PDF.");
        renderPdfContent(doc);
        doc.save(`presence_paie_${domain.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
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
    doc.text(`Feuille de Présence & Paie - ${domain}`, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 5;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(weekPeriod, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 10;
    
    const head = [['Employé', ...days.map(d => d.substring(0,3)), 'Présents', 'Paie']];

    let departmentTotalPay = 0;

    const body = employeesInDomain.map(employee => {
        const daysPresent = days.filter(day => employee.attendance[day]).length;
        const weeklyPay = daysPresent * (employee.currentWeekWage || employee.dailyWage || 0);
        departmentTotalPay += weeklyPay;
        const attendanceStatus = days.map(day => employee.attendance[day] ? 'P' : 'A');
        
        return [
            `${employee.firstName} ${employee.lastName}`,
            ...attendanceStatus,
            daysPresent.toString(),
            formatCurrency(weeklyPay)
        ];
    });

    (doc as any).autoTable({
        startY: cursorY,
        head: head,
        body: body,
        foot: [[
            { content: 'Total Département', colSpan: days.length + 2, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: `${formatCurrency(departmentTotalPay)}`, styles: { halign: 'right', fontStyle: 'bold' } },
        ]],
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80], halign: 'center', fontStyle: 'bold' },
        footStyles: { fillColor: [236, 240, 241], textColor: [44, 62, 80], fontStyle: 'bold' },
        columnStyles: {
            0: { fontStyle: 'bold' },
            [days.length + 1]: { halign: 'center', fontStyle: 'bold' },
            [days.length + 2]: { halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: function(data: any) {
            if (data.section === 'body' && data.column.index > 0 && data.column.index <= days.length) {
                 data.cell.styles.halign = 'center';
                if (data.cell.raw === 'P') {
                    data.cell.styles.textColor = [39, 174, 96]; // Green for Present
                } else {
                    data.cell.styles.textColor = [192, 57, 43]; // Red for Absent
                }
            }
        },
        didDrawPage: function (data: any) {
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Généré par Enock PayTracker pour ${company?.name || ''} le ${new Date().toLocaleDateString('fr-FR')}`, data.settings.margin.left, pageHeight - 10);
        }
    });
  }
  
  if (!weekDates || weekDates.length === 0 || weekDates.length !== days.length) {
      return (
          <Card className="mt-6">
              <CardContent className="pt-6 text-center">
                  Chargement des dates de la période...
              </CardContent>
          </Card>
      );
  }

  return (
    <Card className="mt-6">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-2xl font-bold font-headline capitalize">Feuille de Présence</CardTitle>
                    <CardDescription>
                        {weekPeriod}. Cochez les jours de présence pour les employés du département : <span className="font-semibold">{domain}</span>.
                    </CardDescription>
                </div>
                <Button onClick={downloadAttendancePdf}>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger la Présence
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[250px] min-w-[250px] sticky left-0 bg-card z-10">Employé</TableHead>
                    {days.map((day, index) => (
                        <TableHead key={day} className="text-center min-w-[80px]">
                            <div className='font-bold capitalize'>{day.split(' ')[0]}</div>
                            <div className="font-normal text-xs">{format(weekDates[index], 'dd')}</div>
                        </TableHead>
                    ))}
                    <TableHead className="text-right sticky right-0 bg-card z-10">Détails</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employeesInDomain.map(employee => (
                    <TableRow key={employee.id}>
                        <TableCell className="sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-3">
                            <Avatar>
                            <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} data-ai-hint="person portrait" />
                            <AvatarFallback>{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <div className="font-medium">{employee.firstName} ${employee.lastName}</div>
                            <div className="text-sm text-muted-foreground">{formatCurrency(employee.currentWeekWage || employee.dailyWage || 0)}/jour</div>
                            </div>
                        </div>
                        </TableCell>
                        {days.map((day, index) => {
                            if (!weekDates?.[index]) return null;
                            const isToday = isSameDay(weekDates[index], today);
                            const justification = getJustificationForDay(employee.id, weekDates[index]);
                            const isJustified = justification?.status === 'approved';
                            
                            return (
                                <TableCell key={day} className="text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <Checkbox
                                            checked={employee.attendance[day]}
                                            onCheckedChange={(checked) =>
                                                updateAttendance(employee.id, day, !!checked)
                                            }
                                            aria-label={`Attendance for ${day}`}
                                            disabled={!isToday}
                                        />
                                         {isJustified && employee.attendance[day] && (
                                            <span className="text-xs text-green-500 mt-1 flex items-center gap-1" title="Absence justifiée et approuvée">
                                                <ShieldCheck className="h-3 w-3" />
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                            )
                        })}
                        <TableCell className="text-right sticky right-0 bg-card z-10">
                            <Link href={`/employee/${employee.id}`} passHref>
                                <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Voir les détails</span>
                                </Button>
                            </Link>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {employeesInDomain.map(employee => (
                    <Card key={employee.id} className="w-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                             <div className="flex items-center gap-3">
                                <Avatar>
                                <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} data-ai-hint="person portrait" />
                                <AvatarFallback>{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                <div className="font-medium">{employee.firstName} ${employee.lastName}</div>
                                <div className="text-sm text-muted-foreground">{formatCurrency(employee.currentWeekWage || employee.dailyWage || 0)}/jour</div>
                                </div>
                            </div>
                            <Link href={`/employee/${employee.id}`} passHref>
                                <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Voir les détails</span>
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                                {days.map((day, index) => {
                                    if (!weekDates?.[index]) return null;
                                    const isToday = isSameDay(weekDates[index], today);
                                    const justification = getJustificationForDay(employee.id, weekDates[index]);
                                    const isJustified = justification?.status === 'approved';
                                    return (
                                        <div key={day} className="flex flex-col items-center gap-1 p-2 rounded-md bg-secondary/50">
                                            <Label htmlFor={`${employee.id}-${day}`} className="text-xs font-bold capitalize">{day.split(' ')[0]}</Label>
                                            <Checkbox
                                                id={`${employee.id}-${day}`}
                                                checked={employee.attendance[day]}
                                                onCheckedChange={(checked) =>
                                                    updateAttendance(employee.id, day, !!checked)
                                                }
                                                aria-label={`Attendance for ${day}`}
                                                disabled={!isToday}
                                                className="h-5 w-5"
                                            />
                                            {isJustified && employee.attendance[day] && <ShieldCheck className="h-3 w-3 text-green-500" title="Absence justifiée" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
      </CardContent>
    </Card>
  )
}

function JustificationTab({ domain, managerName }: { domain: string, managerName: string }) {
    const { justifications, updateJustificationStatus } = useEmployees();
    const [viewingJustification, setViewingJustification] = useState<AbsenceJustification | null>(null);
    const { toast } = useToast();
    
    const departmentJustifications = justifications.filter(j => j.departmentName === domain);

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        if (!viewingJustification) return;
        await updateJustificationStatus(id, status, managerName);
        toast({
            title: "Statut mis à jour",
            description: `La justification a été ${status === 'approved' ? 'approuvée' : 'rejetée'}.`,
        });
        setViewingJustification(null); // Close the dialog
    };

    const getStatusBadge = (status: AbsenceJustification['status']) => {
        switch (status) {
            case 'pending': return <Badge variant="secondary" className="flex items-center gap-1"><ShieldQuestion className="h-3 w-3"/>En attente</Badge>;
            case 'approved': return <Badge className="bg-green-500/20 text-green-400 flex items-center gap-1"><ShieldCheck className="h-3 w-3"/>Approuvée</Badge>;
            case 'rejected': return <Badge variant="destructive" className="flex items-center gap-1"><ShieldAlert className="h-3 w-3"/>Rejetée</Badge>;
        }
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Justifications d'Absences</CardTitle>
                <CardDescription>Validez les motifs d'absence soumis par les employés de votre département.</CardDescription>
            </CardHeader>
            <CardContent>
                {departmentJustifications.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Aucune justification en attente</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Aucun employé n'a soumis de justification d'absence pour le moment.
                        </p>
                    </div>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employé</TableHead>
                                    <TableHead>Date d'absence</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {departmentJustifications.map(j => (
                                    <TableRow key={j.id}>
                                        <TableCell className="font-medium">{j.employeeName}</TableCell>
                                        <TableCell>{j.dayName}</TableCell>
                                        <TableCell>{getStatusBadge(j.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => setViewingJustification(j)}>
                                                Voir les détails
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
            {viewingJustification && (
                 <AlertDialog open={!!viewingJustification} onOpenChange={() => setViewingJustification(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Détails de la Justification</AlertDialogTitle>
                            <AlertDialogDescription>
                                De: <strong>{viewingJustification.employeeName}</strong> pour le <strong>{viewingJustification.dayName}</strong>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <p className="font-semibold mb-1">Motif :</p>
                                <p className="p-3 bg-secondary rounded-md text-sm">{viewingJustification.reason}</p>
                            </div>
                            {viewingJustification.documentUrl && (
                                <div>
                                    <p className="mb-2 font-semibold">Document Justificatif :</p>
                                    <a href={viewingJustification.documentUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-2">
                                        <Download className="h-4 w-4" />
                                        Voir le document
                                    </a>
                                </div>
                            )}
                             {viewingJustification.status !== 'pending' && (
                                <div className="text-xs text-muted-foreground pt-2 border-t">
                                    {viewingJustification.status === 'approved' ? 'Approuvé' : 'Rejeté'} par {viewingJustification.reviewedBy} le {format(parseISO(viewingJustification.reviewedAt!), 'dd/MM/yyyy HH:mm')}
                                </div>
                            )}
                        </div>
                        <AlertDialogFooter>
                             <Button variant="ghost" onClick={() => setViewingJustification(null)}>Fermer</Button>
                             {viewingJustification.status === 'pending' && (
                                <div className="flex gap-2">
                                     <Button variant="destructive" onClick={() => handleUpdateStatus(viewingJustification.id, 'rejected')}>
                                        <X className="mr-2 h-4 w-4" /> Rejeter
                                     </Button>
                                     <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(viewingJustification.id, 'approved')}>
                                        <Check className="mr-2 h-4 w-4" /> Approuver
                                     </Button>
                                </div>
                             )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </Card>
    );
}

// Main Page Component
export default function DepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const domain = decodeURIComponent(params.domain as string);
  const { departments, isLoading, siteSettings, company } = useEmployees();
  const { sessionData, isLoggedIn } = useSession();
  const { userType, managerName, userId, companyId, departmentName } = sessionData;
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    if (isLoggedIn === false && isCheckingSession) {
      return;
    }
    setIsCheckingSession(false);

    if (userType !== 'manager' || departmentName !== domain || !userId) {
      router.replace('/manager-login');
    }
  }, [userType, userId, isLoggedIn, router, isCheckingSession, departmentName, domain]);

  const department = departments.find(d => d.name === domain);
  const isCompanyUnderMaintenance = company?.status === 'suspended';

  if (isCheckingSession || isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p className="text-lg font-semibold">Chargement...</p>
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
                          <p>{siteSettings?.maintenanceMessage || "Le compte de cette entreprise est temporairement suspendu."}</p>
                      </CardContent>
                  </Card>
              </main>
          </div>
      )
  }

  if (!department && !isLoading) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center">
                <p className="text-lg font-semibold text-destructive">Département non trouvé ou accès non autorisé.</p>
                <Button className="mt-4" onClick={() => router.push('/')}>Retour</Button>
            </div>
        </div>
      )
  }

  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
            <div className="mb-4">
                <h1 className="text-4xl font-bold font-headline">Département : {domain}</h1>
                <p className="text-muted-foreground">
                    Interface de présence pour le responsable {managerName}.
                </p>
            </div>
            <Tabs defaultValue="attendance" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="attendance"><CalendarCheck className="mr-2"/>Feuille de Présence</TabsTrigger>
                    <TabsTrigger value="justifications"><ShieldCheck className="mr-2"/>Justifications</TabsTrigger>
                    <TabsTrigger value="register"><UserPlus className="mr-2"/>Enregistrer un employé</TabsTrigger>
                </TabsList>
                <TabsContent value="attendance">
                    <AttendanceTab domain={domain} />
                </TabsContent>
                <TabsContent value="justifications">
                    <JustificationTab domain={domain} managerName={managerName || ''} />
                </TabsContent>
                <TabsContent value="register">
                    <RegisterInDepartment domain={domain} />
                </TabsContent>
            </Tabs>
        </main>
         {userType === 'manager' && companyId && userId && (
            <ChatWidget
              companyId={companyId}
              userId={userId}
              userName={managerName || ''}
              userRole="manager"
              departmentName={domain}
            />
          )}
    </div>
  );
}
