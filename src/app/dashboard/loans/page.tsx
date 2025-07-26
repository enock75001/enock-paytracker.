
'use client';

import { useState } from 'react';
import { useEmployees } from '@/context/employee-provider';
import type { Loan, Employee } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HandCoins, PlusCircle, User, Calendar, MoreHorizontal, Pause, Play, Ban, Receipt } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const loanSchema = z.object({
  employeeId: z.string({ required_error: 'Veuillez sélectionner un employé.' }),
  amount: z.coerce.number().min(1, "Le montant de l'avance doit être positif."),
  repaymentAmount: z.coerce.number().min(1, "Le montant du remboursement doit être positif."),
  startDate: z.coerce.date({ required_error: 'Une date de début est requise.' }),
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

export default function LoansPage() {
    const { employees, loans, addLoan, updateLoanStatus } = useEmployees();
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);

    const form = useForm<z.infer<typeof loanSchema>>({
        resolver: zodResolver(loanSchema),
        defaultValues: {
            employeeId: '',
            amount: 0,
            repaymentAmount: 0,
        },
    });

    const onSubmit = async (values: z.infer<typeof loanSchema>) => {
        const hasActiveLoan = loans.some(l => l.employeeId === values.employeeId && l.status === 'active');
        if (hasActiveLoan) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Cet employé a déjà une avance active.' });
            return;
        }

        await addLoan({
            ...values,
            startDate: values.startDate.toISOString(),
        });
        toast({ title: 'Succès', description: 'Avance accordée.' });
        setIsFormOpen(false);
        form.reset();
    };

    const handleUpdateStatus = async (loanId: string, status: Loan['status']) => {
        await updateLoanStatus(loanId, status);
        toast({ title: 'Statut mis à jour', description: `L'avance a été marquée comme ${status}.` });
    };

    const getEmployeeName = (employeeId: string) => {
        const employee = employees.find(e => e.id === employeeId);
        return employee ? `${employee.firstName} ${employee.lastName}` : 'Inconnu';
    };

    const getStatusBadge = (status: Loan['status']) => {
        switch (status) {
            case 'active': return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Active</Badge>;
            case 'paused': return <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">En Pause</Badge>;
            case 'repaid': return <Badge variant="secondary">Remboursée</Badge>;
            case 'cancelled': return <Badge variant="destructive">Annulée</Badge>;
        }
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestion des Avances sur Salaire</h2>
                    <p className="text-muted-foreground">
                        Accordez et suivez les avances sur salaire de vos employés.
                    </p>
                </div>
                 <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Accorder une Avance
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nouvelle Avance sur Salaire</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField name="employeeId" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Employé</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez un employé" /></SelectTrigger></FormControl><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )} />
                                <FormField name="amount" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Montant Total de l'Avance (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="repaymentAmount" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Montant à Rembourser par Période (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField name="startDate" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel>Date de Début du Remboursement</FormLabel><FormControl><Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} /></FormControl><FormMessage /></FormItem>
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
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HandCoins className="h-6 w-6" />
                        Avances en Cours et Historique
                    </CardTitle>
                    <CardDescription>
                        Liste de toutes les avances accordées aux employés.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employé</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Montant Total</TableHead>
                                    <TableHead className="text-right">Reste à Payer</TableHead>
                                    <TableHead className="text-right">Remboursement/Période</TableHead>
                                    <TableHead>Date de Début</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loans.length > 0 ? loans.map(loan => (
                                    <TableRow key={loan.id}>
                                        <TableCell className="font-medium">{getEmployeeName(loan.employeeId)}</TableCell>
                                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(loan.amount)}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{formatCurrency(loan.balance)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(loan.repaymentAmount)}</TableCell>
                                        <TableCell>{format(new Date(loan.startDate), 'dd MMMM yyyy', { locale: fr })}</TableCell>
                                        <TableCell className="text-right">
                                            {loan.status === 'active' || loan.status === 'paused' ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {loan.status === 'active' ? (
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(loan.id, 'paused')}><Pause className="mr-2 h-4 w-4" />Mettre en pause</DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(loan.id, 'active')}><Play className="mr-2 h-4 w-4" />Reprendre</DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(loan.id, 'cancelled')} className="text-red-500"><Ban className="mr-2 h-4 w-4" />Annuler l'avance</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <Receipt className="h-5 w-5 mx-auto text-muted-foreground" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">Aucune avance enregistrée.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
