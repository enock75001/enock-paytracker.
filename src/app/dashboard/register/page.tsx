

'use client';

import { useEmployees } from '@/context/employee-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ImagePicker } from '@/components/image-picker';

const registerSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom doit contenir au moins 2 caractères.' }),
  lastName: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  poste: z.string().min(2, { message: 'Le poste doit contenir au moins 2 caractères.' }),
  domain: z.string({ required_error: 'Le département est requis.' }),
  birthDate: z.coerce.date({ required_error: 'Une date de naissance est requise.' }),
  address: z.string().min(5, { message: "L'adresse est requise." }),
  dailyWage: z.coerce.number().min(1, { message: 'Le salaire journalier doit être un nombre positif.' }),
  phone: z.string().min(9, { message: 'Un numéro de téléphone valide est requis.' }),
  photoUrl: z.string().optional(),
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE').format(amount) + ' FCFA';
};

export default function RegisterPage() {
    const { addEmployee, departments } = useEmployees();
    const { toast } = useToast()
    const domains = departments.map(d => d.name);

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            poste: '',
            domain: '',
            address: '',
            dailyWage: 0,
            phone: '',
            photoUrl: '',
        },
    });

    const watchedFirstName = form.watch('firstName');
    const watchedLastName = form.watch('lastName');
    const watchedDailyWage = form.watch('dailyWage');
    const monthlyWage = watchedDailyWage * 26; // Assuming 26 working days in a month

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        await addEmployee({
            ...values,
            birthDate: values.birthDate.toISOString().split('T')[0],
            photoUrl: values.photoUrl || '',
        });
        toast({
            title: "Employé Enregistré",
            description: `${values.firstName} ${values.lastName} a été ajouté avec succès au département ${values.domain}.`,
            className: 'bg-green-600'
        });
        form.reset();
    }
    
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Enregistrer un Nouvel Employé</h2>
                    <p className="text-muted-foreground">
                        Remplissez le formulaire pour ajouter un employé à un département.
                    </p>
                </div>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
                            <FormField
                            control={form.control}
                            name="photoUrl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Photo de l'employé</FormLabel>
                                <FormControl>
                                    <ImagePicker 
                                    value={field.value ?? ''} 
                                    onChange={field.onChange}
                                    name={`${watchedFirstName} ${watchedLastName}`}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormField control={form.control} name="firstName" render={({ field }) => (
                                    <FormItem><FormLabel>Prénom</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="lastName" render={({ field }) => (
                                    <FormItem><FormLabel>Nom</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            
                            <FormField control={form.control} name="poste" render={({ field }) => (
                                <FormItem><FormLabel>Poste</FormLabel><FormControl><Input placeholder="Ex: Maçon, Gardien..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            
                            <FormField control={form.control} name="domain" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Département</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez un département" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {domains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        <FormField control={form.control} name="birthDate" render={({ field }) => (
                            <FormItem><FormLabel>Date de naissance</FormLabel><FormControl><Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} /></FormControl><FormMessage /></FormItem>
                        )} />
                            <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input placeholder="123 Rue Principale, Anytown" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormField control={form.control} name="dailyWage" render={({ field }) => (
                                    <FormItem><FormLabel>Salaire Journalier (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <div className="space-y-2">
                                    <FormLabel>Salaire Mensuel (estimation)</FormLabel>
                                    <Input value={formatCurrency(monthlyWage)} readOnly disabled />
                                    <p className="text-xs text-muted-foreground">Basé sur 26 jours de travail.</p>
                                </div>
                            </div>
                             <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Numéro de téléphone</FormLabel><FormControl><Input placeholder="+225 0102030405" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        <Button type="submit">Enregistrer l'employé</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
