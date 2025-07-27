
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
import { Download, Eye, RefreshCw, ArrowDownCircle, ArrowUpCircle, Receipt } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface WeeklySummary {
  employee: Employee;
  daysPresent: number;
  totalHoursPay: number;
  totalAdjustments: number;
  loanRepayment: number;
  totalPay: number;
  totalBonus: number;
  totalDeduction: number;
  currentWage: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0 }).format(amount) + ' FCFA';
};

const calculateWeeklyPay = (employee: Employee, days: string[], loans: any[]): WeeklySummary => {
    const currentWage = employee.currentWeekWage || employee.dailyWage || 0;
    const daysPresent = days.filter(day => employee.attendance[day]).length;
    const totalHoursPay = daysPresent * currentWage;
    
    const totalBonus = (employee.adjustments || []).filter(adj => adj.type === 'bonus').reduce((acc, adj) => acc + adj.amount, 0);
    const totalDeduction = (employee.adjustments || []).filter(adj => adj.type === 'deduction').reduce((acc, adj) => acc + adj.amount, 0);
    const totalAdjustments = totalBonus - totalDeduction;

    const activeLoan = loans.find(l => l.employeeId === employee.id && l.status === 'active');
    const loanRepayment = activeLoan ? Math.min(activeLoan.balance, activeLoan.repaymentAmount) : 0;

    const totalPay = totalHoursPay + totalAdjustments - loanRepayment;

    return {
        employee,
        daysPresent,
        totalHoursPay,
        totalAdjustments,
        loanRepayment,
        totalPay,
        totalBonus,
        totalDeduction,
        currentWage,
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
  const { employees, days, startNewWeek, weekPeriod, company, loans } = useEmployees();
  const weeklySummaries = employees.map(emp => calculateWeeklyPay(emp, days, loans));
  const groupedSummaries = groupSummariesByDomain(weeklySummaries);
  const totalPayroll = weeklySummaries.reduce((sum, summary) => sum + summary.totalPay, 0);
  const { toast } = useToast();

  const handleStartNewWeek = () => {
    startNewWeek();
    toast({
        title: "Nouvelle Période Initiée",
        description: "La paie a été archivée, les présences réinitialisées et les salaires mis à jour.",
        className: 'bg-accent text-accent-foreground'
    });
  }

  const downloadPdf = () => {
    const doc = new jsPDF();
    const logoUrl = company?.logoUrl || 'https://i.postimg.cc/xdLntsjG/Chat-GPT-Image-27-juil-2025-19-35-13.png';
    
    // We create an Image object to load the image first.
    // This is necessary because jsPDF might not handle all image formats or data URLs correctly without preloading.
    const img = new (window as any).Image();
    img.src = logoUrl;
    img.crossOrigin = "Anonymous"; // Important for external images
    
    img.onload = () => {
      // Once the image is loaded, we add it to the PDF and then render the rest of the content.
      try {
        doc.addImage(img, 'PNG', 14, 15, 30, 15, undefined, 'FAST');
      } catch (e) {
        console.error("Error adding image to PDF:", e);
      }
      renderPdfContent(doc);
      doc.save(`recap_paie_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    img.onerror = () => {
      console.error("Failed to load company logo for PDF.");
      // If the image fails to load, we render the PDF without it.
      renderPdfContent(doc);
      doc.save(`recap_paie_${new Date().toISOString().split('T')[0]}.pdf`);
    };
  };

  const renderPdfContent = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = 15;
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 58, 90);
    doc.text(company?.name || "Entreprise", pageWidth / 2, cursorY + 7, { align: 'center' });
    cursorY += 10;
    
    if (company?.description) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text(company.description, pageWidth / 2, cursorY + 5, { align: 'center' });
        cursorY += 5;
    }
    cursorY += 5;
    
    doc.setDrawColor(221, 221, 221);
    doc.line(14, cursorY, pageWidth - 14, cursorY);
    cursorY += 10;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 58, 90);
    doc.text("Récapitulatif de Paie", pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 5;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(weekPeriod, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 10;

    const tableBody = [];
    Object.entries(groupedSummaries).forEach(([domain, summaries]) => {
        tableBody.push([{ 
            content: domain, 
            colSpan: 7, 
            styles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold', halign: 'left' } 
        }]);
        
        summaries.forEach(s => {
            tableBody.push([
                { content: `${s.employee.firstName} ${s.employee.lastName}` },
                { content: s.daysPresent.toString(), styles: { halign: 'center' } },
                { content: formatCurrency(s.totalHoursPay), styles: { halign: 'right' } },
                { content: formatCurrency(s.totalBonus), styles: { halign: 'right' } },
                { content: formatCurrency(s.totalDeduction), styles: { halign: 'right' } },
                { content: formatCurrency(s.loanRepayment), styles: { halign: 'right' } },
                { content: formatCurrency(s.totalPay), styles: { halign: 'right', fontStyle: 'bold' } },
            ]);
        });
    });

    (doc as any).autoTable({
        startY: cursorY,
        head: [['Employé', 'Jours', 'Base', 'Primes', 'Avances', 'Remb. Avance', 'Paie Nette']],
        body: tableBody,
        theme: 'striped',
        headStyles: { halign: 'center', fillColor: [44, 62, 80], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { cellWidth: 15 },
            6: { fontStyle: 'bold' },
        },
        didDrawPage: function (data: any) {
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Généré par Enock PayTracker pour ${company?.name || ''} le ${new Date().toLocaleDateString('fr-FR')}`, data.settings.margin.left, pageHeight - 10);
        }
    });

    let finalY = (doc as any).autoTable.previous.finalY;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 58, 90);
    doc.text(`Total Général à Payer: ${formatCurrency(totalPayroll)}`, 14, finalY + 20);
  }


  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Récapitulatif de la période</h2>
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
                  Commencer une Nouvelle Période
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr de vouloir commencer une nouvelle période ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est importante : la paie actuelle sera archivée, les présences de tous les employés seront réinitialisées à zéro, et tout changement de salaire prendra effet. Les remboursements d'avances seront aussi déduits.
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
                                Total: {formatCurrency(domainTotal)}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Employé</TableHead>
                                    <TableHead className="text-center">Jours</TableHead>
                                    <TableHead className="text-right">Paie de Base</TableHead>
                                    <TableHead className="text-right">Primes</TableHead>
                                    <TableHead className="text-right">Avances</TableHead>
                                    <TableHead className="text-right">Remb. Avance</TableHead>
                                    <TableHead className="text-right font-bold">Paie Nette</TableHead>
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
                                        <Badge variant="outline">{summary.daysPresent}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(summary.totalHoursPay)}
                                    </TableCell>
                                     <TableCell className="text-right">
                                        <div className={cn("flex items-center justify-end gap-1 font-medium", summary.totalBonus > 0 ? "text-green-400" : "text-muted-foreground")}>
                                            <ArrowUpCircle className="h-4 w-4" />
                                            {formatCurrency(summary.totalBonus)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                         <div className={cn("flex items-center justify-end gap-1 font-medium", summary.totalDeduction > 0 ? "text-red-400" : "text-muted-foreground")}>
                                            <ArrowDownCircle className="h-4 w-4" />
                                            {formatCurrency(summary.totalDeduction)}
                                        </div>
                                    </TableCell>
                                     <TableCell className="text-right">
                                         <div className={cn("flex items-center justify-end gap-1 font-medium", summary.loanRepayment > 0 ? "text-red-400" : "text-muted-foreground")}>
                                            <Receipt className="h-4 w-4" />
                                            {formatCurrency(summary.loanRepayment)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-lg text-primary">
                                        {formatCurrency(summary.totalPay)}
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
                                <TableRow className='bg-secondary/50 hover:bg-secondary/50'>
                                    <TableCell colSpan={6} className="text-right font-bold text-lg">Total Département</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{formatCurrency(domainTotal)}</TableCell>
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
            <CardTitle className="text-2xl">Total Général de la Période</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-4xl font-bold text-primary">
                {formatCurrency(totalPayroll)}
            </div>
             <p className="text-muted-foreground mt-2">
                Ceci est la somme totale à payer à tous les employés pour la période en cours.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
