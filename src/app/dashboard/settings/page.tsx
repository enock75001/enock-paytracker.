
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEmployees } from '@/context/employee-provider';
import type { Admin, PayPeriod } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, KeyRound, User, Shield, UserCog, Building, Pen, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { addAdmin as addAdminAction, updateAdminPin, deleteAdmin as deleteAdminAction } from '@/lib/auth';
import { ImagePicker } from '@/components/image-picker';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { payPeriods } from '@/lib/data';

const adminSchema = z.object({
  name: z.string().min(3, "Le nom est requis."),
  pin: z.string().length(4, "Le PIN doit contenir 4 chiffres."),
});

const pinSchema = z.object({
    currentPin: z.string().length(4, "Le PIN actuel est requis."),
    newPin: z.string().length(4, "Le nouveau PIN doit contenir 4 chiffres."),
    confirmPin: z.string().length(4, "La confirmation est requise."),
}).refine(data => data.newPin === data.confirmPin, {
    message: "Les nouveaux PINs ne correspondent pas.",
    path: ["confirmPin"],
});

const companyProfileSchema = z.object({
    name: z.string().min(3, "Le nom de l'entreprise est requis."),
    description: z.string().optional(),
    logoUrl: z.string().optional(),
    payPeriod: z.enum(['weekly', 'bi-weekly', 'monthly']),
});

function CompanyProfileCard() {
    const { company, updateCompanyProfile } = useEmployees();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);

    const form = useForm<z.infer<typeof companyProfileSchema>>({
        resolver: zodResolver(companyProfileSchema),
        defaultValues: {
            name: '',
            description: '',
            logoUrl: '',
            payPeriod: 'weekly',
        }
    });

    useEffect(() => {
        if (company) {
            form.reset({
                name: company.name,
                description: company.description || '',
                logoUrl: company.logoUrl || '',
                payPeriod: company.payPeriod || 'weekly',
            });
        }
    }, [company, form]);

    const onSubmit = async (values: z.infer<typeof companyProfileSchema>) => {
        await updateCompanyProfile(values);
        toast({ title: 'Succès', description: 'Profil de l\'entreprise mis à jour.' });
        setIsEditing(false);
    };

    if (!company) return null;

    return (
        <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Profil de l'Entreprise</CardTitle>
                            <CardDescription>Gérez les informations publiques de votre entreprise.</CardDescription>
                        </div>
                        {isEditing ? (
                            <Button type="submit" size="sm"><Save className="mr-2 h-4 w-4" />Sauvegarder</Button>
                        ) : (
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}><Pen className="mr-2 h-4 w-4" />Modifier</Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="logoUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Logo de l'entreprise</FormLabel>
                                    <FormControl>
                                        <ImagePicker 
                                            value={field.value ?? ''} 
                                            onChange={field.onChange}
                                            name={form.getValues('name')}
                                            disabled={!isEditing}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom de l'entreprise</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled={!isEditing} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} disabled={!isEditing} placeholder="Décrivez brièvement votre entreprise..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="payPeriod"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Période de Paie</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choisir une période de paie" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {payPeriods.map(period => (
                                                <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </form>
            </Form>
        </Card>
    )
}

export default function SettingsPage() {
    const { admins, fetchAdmins, companyId } = useEmployees();
    const { toast } = useToast();
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
    const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        setCurrentAdminId(sessionStorage.getItem('adminId'));
      }
    }, []);

    const form = useForm({
        resolver: zodResolver(adminSchema),
        defaultValues: { name: '', pin: '' },
    });
    
    const pinForm = useForm({
        resolver: zodResolver(pinSchema),
        defaultValues: { currentPin: '', newPin: '', confirmPin: '' },
    });

    const onAddAdjointSubmit = async (values: z.infer<typeof adminSchema>) => {
        if (!companyId) return;
        try {
            await addAdminAction(companyId, values.name, values.pin);
            toast({ title: 'Succès', description: 'Administrateur adjoint ajouté.' });
            fetchAdmins();
            setIsFormDialogOpen(false);
            form.reset();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        }
    };
    
    const onChangePinSubmit = async (values: z.infer<typeof pinSchema>) => {
        if (!currentAdminId || !companyId) return;
        try {
            await updateAdminPin(companyId, currentAdminId, values.currentPin, values.newPin);
            toast({ title: 'Succès', description: 'Votre code PIN a été modifié.' });
            setIsPinDialogOpen(false);
            pinForm.reset();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        }
    }
    
    const handleDeleteAdmin = async (adminId: string) => {
        try {
            await deleteAdminAction(adminId);
            toast({ title: 'Succès', description: 'Administrateur supprimé.' });
            fetchAdmins();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        }
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
                <p className="text-muted-foreground">Gérez le profil de votre entreprise et les accès administrateur.</p>
            </div>

            <CompanyProfileCard />

            <Card>
                <CardHeader>
                    <CardTitle>Changer mon code PIN</CardTitle>
                    <CardDescription>Modifiez votre code PIN de connexion administrateur.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><KeyRound className="mr-2 h-4 w-4" />Changer mon PIN</Button>
                        </DialogTrigger>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>Changer le code PIN</DialogTitle>
                            </DialogHeader>
                            <Form {...pinForm}>
                                <form onSubmit={pinForm.handleSubmit(onChangePinSubmit)} className="space-y-4">
                                    <FormField name="currentPin" control={pinForm.control} render={({ field }) => (
                                        <FormItem><FormLabel>PIN Actuel</FormLabel><FormControl><Input type="password" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField name="newPin" control={pinForm.control} render={({ field }) => (
                                        <FormItem><FormLabel>Nouveau PIN</FormLabel><FormControl><Input type="password" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField name="confirmPin" control={pinForm.control} render={({ field }) => (
                                        <FormItem><FormLabel>Confirmer le nouveau PIN</FormLabel><FormControl><Input type="password" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                                        <Button type="submit">Sauvegarder</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gestion des Administrateurs</CardTitle>
                        <CardDescription>Ajoutez ou supprimez des administrateurs adjoints.</CardDescription>
                    </div>
                     <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Ajouter un adjoint
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Ajouter un administrateur adjoint</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onAddAdjointSubmit)} className="space-y-4">
                                    <FormField name="name" control={form.control} render={({ field }) => (
                                        <FormItem><FormLabel>Nom de l'adjoint</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField name="pin" control={form.control} render={({ field }) => (
                                        <FormItem><FormLabel>Code PIN (4 chiffres)</FormLabel><FormControl><Input type="password" maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                                        <Button type="submit">Sauvegarder</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {admin.role === 'superadmin' ? <Shield className="h-4 w-4 text-primary" /> : <UserCog className="h-4 w-4 text-muted-foreground" />}
                                        {admin.name}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 text-xs rounded-full ${admin.role === 'superadmin' ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                                            {admin.role === 'superadmin' ? 'Super Administrateur' : 'Adjoint'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {admin.role !== 'superadmin' && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                        <AlertDialogDescription>Cette action est irréversible. L'administrateur sera supprimé.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteAdmin(admin.id)}>Supprimer</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

    