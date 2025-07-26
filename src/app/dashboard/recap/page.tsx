

'use client';

import { useEmployees } from '@/context/employee-provider';
import type { Employee } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Download, Eye, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WeeklySummary {
  employee: Employee;
  daysPresent: number;
  daysAbsent: number;
  totalPay: number;
}

const calculateWeeklyPay = (employee: Employee, days: string[]): WeeklySummary => {
    const currentWage = employee.currentWeekWage || employee.dailyWage || 0;
    const daysPresent = days.filter(day => employee.attendance[day]).length;
    const totalPay = daysPresent * currentWage;
    return {
        employee,
        daysPresent,
        daysAbsent: days.length - daysPresent,
        totalPay
    };
}

const groupSummariesByDomain = (summaries: WeeklySummary[]): Record<string, WeeklySummary[]> => {
    return summaries.reduce((acc, summary) => {
        const domain = summary.employee.domain;
        if (!acc[domain]) {
            acc[domain] = [];
        }
        acc[domain].push(summary);
        return acc;
    }, {} as Record<string, WeeklySummary[]>);
};

export default function RecapPage() {
  const { employees, days, startNewWeek } = useEmployees();
  const weeklySummaries = employees.map(emp => calculateWeeklyPay(emp, days));
  const groupedSummaries = groupSummariesByDomain(weeklySummaries);
  const totalPayroll = weeklySummaries.reduce((sum, summary) => sum + summary.totalPay, 0);
  const { toast } = useToast();
  
  const today = new Date();
  const firstDayOfWeek = startOfWeek(today, { weekStartsOn: 1 });
  const lastDayOfWeek = endOfWeek(today, { weekStartsOn: 1 });
  const weekPeriod = `Semaine du ${format(firstDayOfWeek, 'dd MMMM', { locale: fr })} au ${format(lastDayOfWeek, 'dd MMMM yyyy', { locale: fr })}`;


  const handleStartNewWeek = () => {
    startNewWeek();
    toast({
        title: "Nouvelle Semaine Initiée",
        description: "La paie a été archivée, les présences réinitialisées et les salaires mis à jour.",
        className: 'bg-accent text-accent-foreground'
    });
  }

  const downloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 58, 90); // Dark Blue
    doc.text("Récapitulatif de Paie Hebdomadaire", pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128); // Grey
    doc.text(weekPeriod, pageWidth / 2, 30, { align: 'center' });

    let finalY = 38;

    Object.entries(groupedSummaries).forEach(([domain, summaries]) => {
        const domainTotal = summaries.reduce((acc, curr) => acc + (curr.totalPay || 0), 0);

        (doc as any).autoTable({
            startY: finalY + 5,
            head: [[{ content: domain, colSpan: 5, styles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold', halign: 'center' } }]],
            columns: [
                { header: 'Employé', dataKey: 'name' },
                { header: 'Présents', dataKey: 'present' },
                { header: 'Absents', dataKey: 'absent' },
                { header: 'Salaire/Jour', dataKey: 'daily' },
                { header: 'Paie Totale', dataKey: 'total' },
            ],
            body: summaries.map(s => ({
                name: `${s.employee.firstName} ${s.employee.lastName}`,
                present: s.daysPresent,
                absent: s.daysAbsent,
                daily: `${(s.employee.currentWeekWage || s.employee.dailyWage || 0).toLocaleString('de-DE')} FCFA`,
                total: `${(s.totalPay || 0).toLocaleString('de-DE')} FCFA`,
            })),
            foot: [[
                { content: 'Total Département', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11 } },
                { content: `${domainTotal.toLocaleString('de-DE')} FCFA`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11 } },
            ]],
            theme: 'striped',
            headStyles: { halign: 'center', fillColor: [44, 62, 80], fontStyle: 'bold' },
            footStyles: { fillColor: [236, 240, 241], textColor: [44, 62, 80], fontStyle: 'bold' },
            columnStyles: {
                present: { halign: 'center' },
                absent: { halign: 'center' },
                daily: { halign: 'right' },
                total: { halign: 'right', fontStyle: 'bold' },
            },
            didDrawPage: function (data: any) {
                const pageHeight = doc.internal.pageSize.getHeight();
                doc.setFontSize(9);
                doc.setTextColor(150);
                doc.text('Généré par Enock PayTracker le ' + new Date().toLocaleDateString('fr-FR'), data.settings.margin.left, pageHeight - 10);
            }
        });
        finalY = (doc as any).autoTable.previous.finalY;
    });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 58, 90);
    doc.text(`Total Général à Payer: ${totalPayroll.toLocaleString('de-DE')} FCFA`, 14, finalY + 20);

    doc.save(`recap_paie_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Récapitulatif Hebdomadaire</h2>
            <p className="text-muted-foreground">
              {weekPeriod}.
            </p>
        </div>
        <div className="flex gap-2">
            <Button onClick={downloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger en PDF
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Commencer une Nouvelle Semaine
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr de vouloir commencer une nouvelle semaine ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est importante : la paie actuelle sera archivée, les présences de tous les employés seront réinitialisées à zéro, et tout changement de salaire prendra effet.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleStartNewWeek}>Confirmer et Continuer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
      
      <Accordion type="multiple" defaultValue={Object.keys(groupedSummaries)} className="w-full space-y-4">
        {Object.entries(groupedSummaries).map(([domain, summaries]) => {
          const domainTotal = summaries.reduce((sum, s) => sum + s.totalPay, 0);
          return (
            <Card key={domain} className="overflow-hidden">
                <AccordionItem value={domain} className="border-b-0">
                    <AccordionTrigger className="p-6 bg-card hover:bg-secondary/50 [&[data-state=open]]:border-b">
                        <div className='flex items-center justify-between w-full'>
                            <div className='flex items-center gap-4'>
                                <h2 className="text-xl font-semibold font-headline">{domain}</h2>
                                <Badge variant="secondary">{summaries.length} employés</Badge>
                            </div>
                            <div className="text-lg font-semibold pr-4">
                                Total: {(domainTotal || 0).toLocaleString('de-DE')} FCFA
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employé</TableHead>
                                    <TableHead className="text-center">Jours Présents</TableHead>
                                    <TableHead className="text-center">Jours Absents</TableHead>
                                    <TableHead className="text-right">Salaire Journalier</TableHead>
                                    <TableHead className="text-right">Paie Totale</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {summaries.map(summary => (
                                <TableRow key={summary.employee.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={summary.employee.photoUrl} alt={`${summary.employee.firstName} ${summary.employee.lastName}`} data-ai-hint="person portrait" />
                                                <AvatarFallback>{summary.employee.firstName.charAt(0)}{summary.employee.lastName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">
                                                {summary.employee.firstName} {summary.employee.lastName}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">{summary.daysPresent}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{summary.daysAbsent}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(summary.employee.currentWeekWage || summary.employee.dailyWage || 0).toLocaleString('de-DE')} FCFA
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {(summary.totalPay || 0).toLocaleString('de-DE')} FCFA
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Link href={`/employee/${summary.employee.id}`} passHref>
                                            <Button variant="ghost" size="icon">
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">Voir les détails</span>
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className='bg-secondary/80 hover:bg-secondary/80'>
                                    <TableCell colSpan={4} className="text-right font-bold text-lg">Total Département</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{(domainTotal || 0).toLocaleString('de-DE')} FCFA</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableFooter>
                        </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Card>
          )
        })}
      </Accordion>

      <Card className="mt-8">
        <CardHeader>
            <CardTitle className="text-2xl">Total Général de la Semaine</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-4xl font-bold text-primary">
                {(totalPayroll || 0).toLocaleString('de-DE')} FCFA
            </div>
             <p className="text-muted-foreground mt-2">
                Ceci est la somme totale à payer à tous les employés pour la semaine en cours.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
