

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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye, LogOut, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, startOfWeek, addDays, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { fr } from 'date-fns/locale';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { FormLabel } from '@/components/ui/form';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE').format(amount) + ' FCFA';
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
            dailyWage: 5000,
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
        form.setValue('dailyWage', 5000);
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
                      <FormLabel>Photo de l'employé</FormLabel>
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
                        <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="poste" render={({ field }) => (
                    <FormItem><FormLabel>Poste</FormLabel><FormControl><Input placeholder="Ex: Maçon" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="domain" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Département</FormLabel>
                        <FormControl>
                            <Input {...field} readOnly disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

              <FormField control={form.control} name="birthDate" render={({ field }) => (
                <FormItem><FormLabel>Date de naissance</FormLabel><FormControl><Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} /></FormControl><FormMessage /></FormItem>
              )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input placeholder="123 Rue Principale, Anytown" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="dailyWage" render={({ field }) => (
                        <FormItem><FormLabel>Salaire Journalier (FCFA)</FormLabel><FormControl><Input type="number" {...field} defaultValue={5000} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Numéro de téléphone</FormLabel><FormControl><Input placeholder="+225 0102030405" {...field} /></FormControl><FormMessage /></FormItem>
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
  const { employees, updateAttendance, days, weekPeriod, weekDates, company } = useEmployees();
  const employeesInDomain = employees.filter(emp => emp.domain === domain);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

  const downloadAttendancePdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = 15;

    // Header
    if (company?.logoUrl) {
        try {
            doc.addImage(company.logoUrl, 'PNG', 14, cursorY, 30, 15, undefined, 'FAST');
        } catch(e) {
             console.error("Erreur d'ajout de l'image:", e);
        }
    }
    
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

    doc.save(`presence_paie_${domain.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  
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
                            <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                            <div className="text-sm text-muted-foreground">{formatCurrency(employee.currentWeekWage || employee.dailyWage || 0)}/jour</div>
                            </div>
                        </div>
                        </TableCell>
                        {days.map((day, index) => {
                            if (!weekDates?.[index]) return null;
                            const isToday = isSameDay(weekDates[index], today);
                            return (
                                <TableCell key={day} className="text-center">
                                    <Checkbox
                                    checked={employee.attendance[day]}
                                    onCheckedChange={(checked) =>
                                        updateAttendance(employee.id, day, !!checked)
                                    }
                                    aria-label={`Attendance for ${day}`}
                                    disabled={!isToday}
                                    />
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
                                <div className="font-medium">{employee.firstName} {employee.lastName}</div>
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
                                    return (
                                        <div key={day} className="flex flex-col items-center gap-2 p-2 rounded-md bg-secondary/50">
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

// Main Page Component
export default function DepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const domain = decodeURIComponent(params.domain as string);
  const { employees, departments, isLoading, clearData, companyId } = useEmployees();
  const [sessionData, setSessionData] = useState({
      managerId: '',
      managerName: '',
      userType: ''
  });

  const getManagerName = (managerId: string | null) => {
      if (!managerId) return null;
      const manager = employees.find(e => e.id === managerId);
      return manager ? `${manager.firstName} ${manager.lastName}` : null;
  };
  
  useEffect(() => {
    const userType = sessionStorage.getItem('userType');
    const departmentName = sessionStorage.getItem('department');
    const sessionCompanyId = sessionStorage.getItem('companyId');
    const sessionManagerId = sessionStorage.getItem('managerId');


    if (userType !== 'manager' || departmentName !== domain || !sessionCompanyId || !sessionManagerId) {
      router.replace('/');
      return;
    }

    setSessionData({
      managerId: sessionManagerId,
      managerName: sessionStorage.getItem('managerName') || '',
      userType: userType,
    });

  }, [router, domain]);

  const department = departments.find(d => d.name === domain);
  const managerName = department ? getManagerName(department.managerId) : 'Chargement...';

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p className="text-lg font-semibold">Chargement...</p>
        </div>
    );
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

  const handleLogout = () => {
    clearData();
    sessionStorage.clear();
    router.push('/');
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
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="attendance">Feuille de Présence</TabsTrigger>
                    <TabsTrigger value="register">Enregistrer un employé</TabsTrigger>
                </TabsList>
                <TabsContent value="attendance">
                    <AttendanceTab domain={domain} />
                </TabsContent>
                <TabsContent value="register">
                    <RegisterInDepartment domain={domain} />
                </TabsContent>
            </Tabs>
        </main>
         {sessionData.userType === 'manager' && companyId && sessionData.managerId && (
            <ChatWidget
              companyId={companyId}
              userId={sessionData.managerId}
              userName={sessionData.managerName}
              userRole="manager"
              departmentName={domain}
            />
          )}
    </div>
  );
}

