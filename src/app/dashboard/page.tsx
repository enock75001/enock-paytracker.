
'use client';

import { useEmployees } from '@/context/employee-provider';
import type { Employee } from '@/lib/types';
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
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


// Common function from old dashboard page
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

// Component for Dashboard Tab
function DashboardTab() {
  const { employees, updateAttendance, days } = useEmployees();
  const groupedEmployees = groupEmployeesByDomain(employees);

  return (
    <>
        <div className="mb-6 mt-6">
            <h1 className="text-3xl font-bold font-headline">Employee Dashboard</h1>
            <p className="text-muted-foreground">
            Manage daily attendance for all employees.
            </p>
        </div>
        <Accordion type="multiple" defaultValue={Object.keys(groupedEmployees)} className="w-full space-y-4">
        {Object.entries(groupedEmployees).map(([domain, employeesInDomain]) => (
          <Card key={domain} className="overflow-hidden">
            <AccordionItem value={domain} className="border-b-0">
              <AccordionTrigger className="p-6 bg-card hover:bg-secondary/50 [&[data-state=open]]:border-b">
                  <div className='flex items-center gap-4'>
                    <h2 className="text-xl font-semibold font-headline">{domain}</h2>
                    <Badge variant="secondary">{employeesInDomain.length} employees</Badge>
                  </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[250px]">Employee</TableHead>
                        <TableHead>Daily Wage</TableHead>
                        {days.map(day => (
                            <TableHead key={day} className="text-center">{day}</TableHead>
                        ))}
                        <TableHead className="text-right">Actions</TableHead>
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
                                        <span className="sr-only">View Details</span>
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>
        ))}
      </Accordion>
    </>
  )
}

// Schema from register page
const registerSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  domain: z.string().min(2, { message: 'Domain is required.' }),
  birthDate: z.date({ required_error: 'A date of birth is required.' }),
  address: z.string().min(5, { message: 'Address is required.' }),
  dailyWage: z.coerce.number().min(1, { message: 'Daily wage must be a positive number.' }),
  phone: z.string().min(9, { message: 'A valid phone number is required.' }),
  photoUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

// Component for Register Tab
function RegisterTab() {
    const { addEmployee } = useEmployees();
    const { toast } = useToast()

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
            title: "Employee Registered",
            description: `${values.firstName} ${values.lastName} has been successfully added.`,
            className: 'bg-accent text-accent-foreground'
        });
        form.reset();
    }
    
    return (
        <Card className="max-w-3xl mx-auto mt-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline">Register New Employee</CardTitle>
          <CardDescription>Fill out the form below to add a new employee to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="domain" render={({ field }) => (
                    <FormItem><FormLabel>Domain</FormLabel><FormControl><Input placeholder="e.g. Construction, Renovation" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

              <FormField control={form.control} name="birthDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Date of birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
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
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input placeholder="123 Main St, Anytown" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField control={form.control} name="dailyWage" render={({ field }) => (
                        <FormItem><FormLabel>Daily Wage (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+225 0102030405" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="photoUrl" render={({ field }) => (
                    <FormItem><FormLabel>Photo URL</FormLabel><FormControl><Input placeholder="https://example.com/photo.jpg" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              <Button type="submit">Register Employee</Button>
            </form>
          </Form>
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

// Component for Recap Tab
function RecapTab() {
  const { employees, days } = useEmployees();
  const weeklySummaries = employees.map(emp => calculateWeeklyPay(emp, days));
  const totalPayroll = weeklySummaries.reduce((sum, summary) => sum + summary.totalPay, 0);

  return (
    <>
       <div className="mb-6 mt-6">
        <h1 className="text-3xl font-bold font-headline">Weekly Recap</h1>
        <p className="text-muted-foreground">
          Summary of employee attendance and payments for the week.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Weekly Payroll</CardTitle>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{new Intl.NumberFormat('fr-FR').format(totalPayroll)} FCFA</div>
            </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Breakdown of payments for each employee.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-center">Days Present</TableHead>
                        <TableHead className="text-center">Days Absent</TableHead>
                        <TableHead className="text-right">Total Pay</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {weeklySummaries.map(summary => (
                            <TableRow key={summary.employee.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={summary.employee.photoUrl} alt={`${summary.employee.firstName} ${summary.employee.lastName}`} data-ai-hint="person portrait" />
                                            <AvatarFallback>{summary.employee.firstName.charAt(0)}{summary.employee.lastName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium">{summary.employee.firstName} {summary.employee.lastName}</div>
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </>
  );
}

// Main Page Component
export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
       <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="recap">Recap</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
                <DashboardTab />
            </TabsContent>
            <TabsContent value="register">
                <RegisterTab />
            </TabsContent>
            <TabsContent value="recap">
                <RecapTab />
            </TabsContent>
        </Tabs>
    </div>
  );
}
