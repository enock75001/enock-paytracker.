

'use client';

import { useEmployees } from '@/context/employee-provider';
import { type ArchivedPayroll } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Button } from '@/components/ui/button';
import { ServerCrash, CalendarCheck, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


function groupArchivesByYear(archives: ArchivedPayroll[]): Record<string, ArchivedPayroll[]> {
  return archives.reduce((acc, archive) => {
    const year = new Date().getFullYear().toString(); // Simple grouping for now
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(archive);
    return acc;
  }, {} as Record<string, ArchivedPayroll[]>);
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE').format(amount) + ' FCFA';
};

export default function ArchivesPage() {
  const { archives, deleteArchive } = useEmployees();
  const { toast } = useToast();
  
  const groupedArchives = groupArchivesByYear(archives);
  const years = Object.keys(groupedArchives).sort((a, b) => b.localeCompare(a));
  
  const handleDelete = async (archiveId: string) => {
      try {
        await deleteArchive(archiveId);
        toast({
            title: "Archive Supprimée",
            description: "L'archive de paie a été supprimée avec succès.",
        });
      } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: error.message || "Impossible de supprimer l'archive.",
        });
      }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Archives des Fiches de Paie</h2>
                <p className="text-muted-foreground">
                    Consultez l'historique des paiements passés.
                </p>
            </div>
        </div>
        
        {archives.length === 0 ? (
          <Card className="mt-6">
              <CardContent className="pt-6">
                 <div className="text-center py-12">
                    <ServerCrash className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Aucune Archive</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                    Commencez une nouvelle semaine depuis l'onglet "Récapitulatif" pour créer votre première archive.
                    </p>
                </div>
              </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={years} className="w-full space-y-4">
            {years.map(year => (
              <Card key={year} className="overflow-hidden">
                <AccordionItem value={year} className="border-b-0">
                  <AccordionTrigger className="p-6 bg-card hover:bg-secondary/50 [&[data-state=open]]:border-b">
                     <div className='flex items-center gap-4'>
                        <CalendarCheck className="h-6 w-6 text-primary"/>
                        <h2 className="text-xl font-semibold font-headline">Archives de {year}</h2>
                     </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    {groupedArchives[year]
                        .map(archive => (
                            <div key={archive.id} className="border-t p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-semibold text-lg">{archive.period}</h3>
                                    <p className="text-muted-foreground mb-2">
                                      Total payé : <span className="font-bold text-primary">{formatCurrency(archive.totalPayroll)}</span>
                                    </p>
                                  </div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="icon">
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette archive ?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Cette action est irréversible. L'archive pour la période <strong>{archive.period}</strong> sera définitivement supprimée.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(archive.id!)}>Confirmer</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Département</TableHead>
                                            <TableHead>Employés</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {archive.departments.map(dept => (
                                            <TableRow key={dept.name}>
                                                <TableCell>{dept.name}</TableCell>
                                                <TableCell>{dept.employeeCount}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(dept.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ))
                    }
                  </AccordionContent>
                </AccordionItem>
              </Card>
            ))}
          </Accordion>
        )}
    </div>
  )
}
