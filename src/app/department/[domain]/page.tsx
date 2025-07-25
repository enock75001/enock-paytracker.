
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
import { Eye, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères.' }),
  lastName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  domain: z.string(),
  birthDate: z.date({ required_error: 'Une date de naissance est requise.' }),
  address: z.string().min(5, { message: "L'adresse est requise." }),
  dailyWage: z.coerce.number().min(1, { message: 'Le salaire journalier doit être un nombre positif.' }),
  phone: z.string().min(9, { message: 'Un numéro de téléphone valide est requis.' }),
  photoUrl: z.string().url({ message: 'Veuillez entrer une URL valide.' }).optional().or(z.literal('')),
});


// Component for Registering an employee in a specific department
function RegisterInDepartment({ domain }: { domain: string }) {
    const { addEmployee } = useEmployees();
    const { toast } = useToast()

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            domain: domain,
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <FormControl>
                            <Input {...field} readOnly disabled />
                        </FormControl>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="dailyWage" render={({ field }) => (
                        <FormItem><FormLabel>Salaire Journalier (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Numéro de téléphone</FormLabel><FormControl><Input placeholder="+225 0102030405" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="photoUrl" render={({ field }) => (
                    <FormItem><FormLabel>URL de la Photo</FormLabel><FormControl><Input placeholder="https://example.com/photo.jpg" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              <Button type="submit">Enregistrer l'employé</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
}


// Component for Attendance Tab
function AttendanceTab({ domain }: { domain: string }) {
  const { employees, updateAttendance, days } = useEmployees();
  const employeesInDomain = employees.filter(emp => emp.domain === domain);

  return (
    <Card className="mt-6">
        <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline">Feuille de Présence</CardTitle>
            <CardDescription>
            Cochez les jours de présence pour les employés du département : <span className="font-semibold">{domain}</span>.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[250px]">Employé</TableHead>
                    <TableHead>Salaire Journalier</TableHead>
                    {days.map(day => (
                        <TableHead key={day} className="text-center">{day}</TableHead>
                    ))}
                    <TableHead className="text-right">Détails</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employeesInDomain.map(employee => (
                    <TableRow key={employee.id}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                            <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} data-ai-hint="person portrait" />
                            <AvatarFallback>{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                            <div className="text-sm text-muted-foreground">{employee.phone}</div>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>
                            {new Intl.NumberFormat('fr-FR').format(employee.dailyWage)} FCFA
                        </TableCell>
                        {days.map(day => (
                        <TableCell key={day} className="text-center">
                            <Checkbox
                            checked={employee.attendance[day]}
                            onCheckedChange={(checked) =>
                                updateAttendance(employee.id, day, !!checked)
                            }
                            aria-label={`Attendance for ${day}`}
                            className="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent"
                            />
                        </TableCell>
                        ))}
                        <TableCell className="text-right">
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
      </CardContent>
    </Card>
  )
}

// Main Page Component
export default function DepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const domain = decodeURIComponent(params.domain as string);

  return (
    <div className="container mx-auto p-4 md:p-8">
       <div className="mb-6">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au tableau de bord
            </Button>
        </div>
        <div className="mb-4">
            <h1 className="text-4xl font-bold font-headline">Gestion du Département : {domain}</h1>
            <p className="text-muted-foreground">
                Interface de présence et d'enregistrement pour le responsable du département.
            </p>
        </div>
        <AttendanceTab domain={domain} />
        <RegisterInDepartment domain={domain} />
    </div>
  );
}
