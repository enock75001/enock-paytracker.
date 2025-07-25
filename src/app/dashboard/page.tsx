

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
import { Download, Users, Eye, UserCog, PlusCircle, Edit, Trash2, Archive, RefreshCw, ServerCrash, CalendarCheck, Home, UserPlus, FileText, Briefcase, DollarSign, BarChart3 } from 'lucide-react';
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


// Main Page Component
export default function DashboardPage() {
    const { employees, departments, days } = useEmployees();
    const totalEmployees = employees.length;
    const weeklyPayroll = employees.reduce((total, emp) => {
        const daysPresent = days.filter(day => emp.attendance[day]).length;
        return total + (daysPresent * emp.currentWeekWage);
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
                    <div className="text-2xl font-bold">{new Intl.NumberFormat('fr-FR').format(weeklyPayroll)} FCFA</div>
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
                            <div className="ml-auto font-medium">{new Intl.NumberFormat('fr-FR').format(employee.dailyWage)} FCFA</div>
                        </div>
                    ))}
                </div>
              </CardContent>
            </Card>
        </div>
    </div>
  );
}
