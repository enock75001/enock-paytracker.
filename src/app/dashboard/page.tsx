

'use client';

import { useEmployees } from '@/context/employee-provider';
import type { Employee, Department } from '@/lib/types';
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
import { Download, Users, Eye, UserCog, PlusCircle, Edit, Trash2, Archive, RefreshCw, ServerCrash, CalendarCheck, Home, UserPlus, FileText, Briefcase, DollarSign, BarChart3, Sparkles, Loader2 } from 'lucide-react';
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
import { type ArchivedPayroll } from '@/lib/types';
import { ImagePicker } from '@/components/image-picker';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { generateWeeklyReport } from '@/ai/flows/generate-report-flow';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE').format(amount) + ' FCFA';
};

function SmartReportCard() {
    const { employees, days, weekPeriod } = useEmployees();
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const { toast } = useToast();

    const weeklyPayroll = employees.reduce((total, emp) => {
        const daysPresent = days.filter(day => emp.attendance[day]).length;
        const weeklyWage = emp.currentWeekWage || emp.dailyWage;
        return total + (daysPresent * weeklyWage);
    }, 0);
    
    const recentlyAddedEmployees = employees.filter(e => {
        const regDate = new Date(e.registrationDate);
        const today = new Date();
        const diffDays = (today.getTime() - regDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
    }).map(e => `${e.firstName} ${e.lastName}`);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setReport(null);
        try {
            const result = await generateWeeklyReport({
                totalEmployees: employees.length,
                totalPayroll: weeklyPayroll,
                period: weekPeriod,
                recentlyAddedEmployees: recentlyAddedEmployees
            });
            setReport(result.reportText);
        } catch (error) {
            console.error("Failed to generate report:", error);
            toast({
                variant: 'destructive',
                title: 'Erreur de Génération',
                description: 'Impossible de générer le rapport pour le moment.'
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Rapport Intelligent de la Semaine
                </CardTitle>
                <CardDescription>
                    Obtenez une analyse rapide de la période actuelle grâce à l'IA.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-muted-foreground">Analyse en cours...</p>
                    </div>
                )}
                {report && (
                    <div className="prose prose-sm prose-invert max-w-none">
                        <p>{report}</p>
                    </div>
                )}
                {!report && !isLoading && (
                    <div className="text-center text-muted-foreground py-4">
                        Cliquez sur le bouton pour générer une analyse.
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button onClick={handleGenerateReport} disabled={isLoading}>
                    {isLoading ? 'Analyse en cours...' : report ? 'Régénérer le rapport' : 'Analyser la semaine'}
                </Button>
            </CardFooter>
        </Card>
    )
}

// Main Page Component
export default function DashboardPage() {
    const { employees, departments, days } = useEmployees();
    const totalEmployees = employees.length;
    const weeklyPayroll = employees.reduce((total, emp) => {
        const daysPresent = days.filter(day => emp.attendance[day]).length;
        const weeklyWage = emp.currentWeekWage || emp.dailyWage;
        return total + (daysPresent * weeklyWage);
    }, 0);

    const employeesByDept = departments.map(dept => ({
        name: dept.name,
        total: employees.filter(emp => emp.domain === dept.name).length
    }));

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Masse Salariale (Semaine)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(weeklyPayroll || 0)}</div>
                    <p className="text-xs text-muted-foreground">Total à payer pour cette semaine</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Employés Total</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalEmployees}</div>
                    <p className="text-xs text-muted-foreground">Personnes travaillant dans l'entreprise</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Départements</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{departments.length}</div>
                    <p className="text-xs text-muted-foreground">Nombre de départements actifs</p>
                </CardContent>
            </Card>
        </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
             <div className="col-span-full lg:col-span-7 space-y-4">
                <SmartReportCard />
            </div>
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Vue d'ensemble des départements</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={employeesByDept}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Employés Récents</CardTitle>
                <CardDescription>
                  Les {employees.slice(-5).length} derniers employés ajoutés.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                    {employees.slice(-5).reverse().map(employee => (
                         <div key={employee.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={employee.photoUrl} alt="Avatar" data-ai-hint="person portrait" />
                                <AvatarFallback>{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{employee.firstName} {employee.lastName}</p>
                                <p className="text-sm text-muted-foreground">{employee.domain}</p>
                            </div>
                            <div className="ml-auto font-medium">{formatCurrency(employee.dailyWage || 0)}</div>
                        </div>
                    ))}
                </div>
              </CardContent>
            </Card>
        </div>
    </div>
  );
}
