
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEmployees } from '@/context/employee-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Calendar, Home, Phone, User, Wallet, UserCog, MoveRight, Trash2 } from 'lucide-react';
import { differenceInWeeks, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
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
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Department } from '@/lib/types';


function TransferEmployeeDialog({ employee, departments, transferEmployee }: { employee: any, departments: Department[], transferEmployee: Function }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const { toast } = useToast();

  const handleTransfer = () => {
    if (!selectedDepartment) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Veuillez sélectionner un nouveau département.",
        });
        return;
    }
    transferEmployee(employee.id, selectedDepartment);
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
                    {availableDepartments.map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
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

    const handleDelete = () => {
        deleteEmployee(employee.id);
        toast({
            title: "Employé Supprimé",
            description: `${employee.firstName} ${employee.lastName} a été supprimé du système.`,
        });
        router.push(`/department/${encodeURIComponent(employee.domain)}`);
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

export default function EmployeeRecapPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { employees, days, departments, transferEmployee, deleteEmployee } = useEmployees();

  const employee = employees.find(emp => emp.id === id);

  if (!employee) {
    return (
        <div className="container mx-auto p-4 md:p-8 text-center">
            <h1 className="text-2xl font-bold">Employé non trouvé</h1>
            <p className="text-muted-foreground">L'employé que vous recherchez n'existe pas.</p>
            <Button asChild className="mt-4">
                <Link href="/dashboard">Retour au tableau de bord</Link>
            </Button>
        </div>
    );
  }

  const daysPresent = days.filter(day => employee.attendance[day]).length;
  const weeklyPay = daysPresent * employee.dailyWage;
  
  const registrationDate = parseISO(employee.registrationDate);
  const weeksSinceRegistration = differenceInWeeks(new Date(), registrationDate);
  const estimatedTotalEarnings = weeksSinceRegistration * (5 * employee.dailyWage); 

  return (
    <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
            </Button>
        </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
            <Avatar className="h-24 w-24 border-2 border-primary">
                <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} data-ai-hint="person portrait" />
                <AvatarFallback className="text-3xl">{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <CardTitle className="text-4xl font-headline">{employee.firstName} {employee.lastName}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">{employee.domain}</CardDescription>
                <div className="text-sm text-muted-foreground mt-2">
                    Inscrit le : {new Date(employee.registrationDate).toLocaleDateString('fr-FR', { locale: fr })}
                </div>
            </div>
             <Button asChild variant="outline">
                <Link href={`/department/${encodeURIComponent(employee.domain)}`}>
                    <UserCog className="mr-2 h-4 w-4" />
                    Gérer le Département
                </Link>
            </Button>
        </CardHeader>
        <CardContent className="grid gap-8 pt-6">
            <div>
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Informations Personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /> <strong>Nom Complet:</strong> {employee.firstName} {employee.lastName}</div>
                    <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <strong>Date de Naissance:</strong> {new Date(employee.birthDate).toLocaleDateString('fr-FR', { locale: fr })}</div>
                    <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /> <strong>Téléphone:</strong> {employee.phone}</div>
                    <div className="flex items-center gap-3"><Home className="h-4 w-4 text-muted-foreground" /> <strong>Adresse:</strong> {employee.address}</div>
                    <div className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-muted-foreground" /> <strong>Domaine:</strong> {employee.domain}</div>
                    <div className="flex items-center gap-3"><Wallet className="h-4 w-4 text-muted-foreground" /> <strong>Salaire Journalier:</strong> {new Intl.NumberFormat('fr-FR').format(employee.dailyWage)} FCFA</div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-secondary/50">
                    <CardHeader>
                        <CardTitle>Récapitulatif de la Semaine</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Jours de présence:</span>
                            <Badge className="text-lg bg-accent/80 text-accent-foreground hover:bg-accent">{daysPresent}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Jours d'absence:</span>
                            <Badge className="text-lg" variant="secondary">{days.length - daysPresent}</Badge>
                        </div>
                         <div className="flex justify-between items-center pt-4 border-t">
                            <span className="font-semibold">Salaire de la semaine:</span>
                            <span className="font-bold text-xl text-primary">{new Intl.NumberFormat('fr-FR').format(weeklyPay)} FCFA</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Récapitulatif Global</CardTitle>
                        <CardDescription>Estimation depuis l'inscription</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex justify-between items-center">
                            <span className="font-semibold">Salaire total estimé:</span>
                            <span className="font-bold text-2xl text-primary">{new Intl.NumberFormat('fr-FR').format(estimatedTotalEarnings)} FCFA</span>
                        </div>
                         <p className="text-xs text-muted-foreground mt-2">
                            Basé sur {weeksSinceRegistration} semaines de travail depuis l'inscription, avec une estimation de 5 jours de travail par semaine.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t pt-6">
            <TransferEmployeeDialog employee={employee} departments={departments} transferEmployee={transferEmployee} />
            <DeleteEmployeeDialog employee={employee} deleteEmployee={deleteEmployee} />
        </CardFooter>
      </Card>
    </div>
  );
}
