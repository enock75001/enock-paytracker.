
'use client';

import { useEmployees } from '@/context/employee-provider';
import type { Department, Employee } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCog, PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


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
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
  const [defaultValues, setDefaultValues] = useState({ name: '', managerName: '', managerPin: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalDepartmentName, setOriginalDepartmentName] = useState('');

  const form = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues,
  });

  const openFormDialog = (department?: Department) => {
    if (department) {
      setIsEditMode(true);
      setOriginalDepartmentName(department.name);
      form.reset({ name: department.name, managerName: department.manager.name, managerPin: department.manager.pin });
    } else {
      setIsEditMode(false);
      form.reset({ name: '', managerName: '', managerPin: '' });
    }
    setIsFormDialogOpen(true);
  };
  
  const openViewDialog = (department: Department) => {
    setViewingDepartment(department);
    setIsViewDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof departmentSchema>) => {
    try {
      if (isEditMode) {
        await updateDepartment(originalDepartmentName, {
          name: values.name,
          manager: { name: values.managerName, pin: values.managerPin }
        });
        toast({ title: "Succès", description: "Département mis à jour." });
      } else {
        await addDepartment({
          name: values.name,
          manager: { name: values.managerName, pin: values.managerPin }
        });
        toast({ title: "Succès", description: "Nouveau département ajouté." });
      }
      setIsFormDialogOpen(false);
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
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => openFormDialog()}>
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
                <Card key={department.id}>
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
                             <Button variant="outline" size="icon" onClick={() => openViewDialog(department)}><Eye className="h-4 w-4" /></Button>
                             <Button variant="outline" size="icon" onClick={() => openFormDialog(department)}><Edit className="h-4 w-4" /></Button>
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
                    </CardFooter>
                </Card>
            )
        })}
        </div>
         <p className="text-xs text-muted-foreground mt-4">Pour supprimer un département, vous devez d'abord réaffecter ou supprimer tous ses employés.</p>
        
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Employés du département : {viewingDepartment?.name}</DialogTitle>
                    <DialogDescription>
                        Liste de tous les employés actuellement dans ce département.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employé</TableHead>
                                <TableHead>Téléphone</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(groupedEmployees[viewingDepartment?.name || ''] || []).map((employee: Employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} data-ai-hint="person portrait" />
                                                <AvatarFallback>{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">
                                                {employee.firstName} {employee.lastName}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{employee.phone}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/employee/${employee.id}`} passHref>
                                            <Button variant="ghost" size="icon">
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">Voir le profil</span>
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  )
}
