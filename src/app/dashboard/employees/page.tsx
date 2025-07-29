

'use client';

import { useEmployees } from '@/context/employee-provider';
import type { Employee } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Eye, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';

export default function EmployeesPage() {
  const { employees, departments, transferEmployee, deleteEmployee } = useEmployees();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDepartmentChange = async (employeeId: string, newDepartmentName: string) => {
    try {
      await transferEmployee(employeeId, newDepartmentName);
      toast({
        title: 'Succès',
        description: 'Le département de l\'employé a été mis à jour.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message,
      });
    }
  };

  const handleDelete = async (employee: Employee) => {
    try {
        await deleteEmployee(employee.id);
        toast({
            title: "Employé Supprimé",
            description: `${employee.firstName} ${employee.lastName} a été supprimé du système.`,
        });
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Erreur",
            description: error.message,
        });
    }
  };
  
  const filteredEmployees = employees.filter(employee =>
    `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Employés</h2>
          <p className="text-muted-foreground">
            Visualisez et gérez la liste de tous vos employés.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Liste des Employés ({employees.length})
          </CardTitle>
          <CardDescription>
            Changez le département d'un employé ou consultez son profil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
             <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Rechercher un employé par nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full md:w-1/3"
                />
             </div>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={employee.photoUrl}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            data-ai-hint="person portrait"
                          />
                          <AvatarFallback>
                            {employee.firstName.charAt(0)}
                            {employee.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.poste}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={employee.domain}
                        onValueChange={(value) => handleDepartmentChange(employee.id, value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Choisir un département" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                       <Link href={`/employee/${employee.id}`} passHref>
                        <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Voir</span>
                        </Button>
                       </Link>
                       <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Supprimer</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action est irréversible. L'employé {employee.firstName} {employee.lastName} sera supprimé.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(employee)}>Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {filteredEmployees.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    Aucun employé trouvé pour "{searchTerm}".
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
