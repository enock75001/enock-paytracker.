
'use client';

import { useEmployees } from '@/context/employee-provider';
import type { Department } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCog, PlusCircle, Edit, Trash2 } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast"
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
import Link from 'next/link';

function groupEmployeesByDomain(employees: any[]): Record<string, any[]> {
  return employees.reduce((acc, employee) => {
    const domain = employee.domain;
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push(employee);
    return acc;
  }, {} as Record<string, any[]>);
}

const departmentSchema = z.object({
  name: z.string().min(3, "Le nom du département est requis."),
  managerName: z.string().min(3, "Le nom du manager est requis."),
  managerPin: z.string().length(4, "Le code PIN doit contenir 4 chiffres."),
});

// Component for Departments Tab
export default function DepartmentsPage() {
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
    <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Gestion des Départements</h2>
                <p className="text-muted-foreground">
                    Ajoutez, modifiez ou supprimez des départements.
                </p>
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
        </div>
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
    </div>
  )
}
