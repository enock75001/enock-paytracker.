
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Download, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


function groupEmployeesByDomain(employees: Employee[]): Record<string, Employee[]> {
  return employees.reduce((acc, employee) => {
    const domain = employee.domain;
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push(employee);
    return acc;
  }, {} as Record<string, Employee[]>);
}

// Component for Departments Tab
function DepartmentsTab() {
  const { employees } = useEmployees();
  const groupedEmployees = groupEmployeesByDomain(employees);

  return (
    <>
        <div className="mb-6 mt-6">
            <h1 className="text-3xl font-bold font-headline">Vue d'ensemble des Départements</h1>
            <p className="text-muted-foreground">
            Gérez chaque département individuellement.
            </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(groupedEmployees).map(([domain, employeesInDomain]) => (
            <Card key={domain}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-headline font-medium">
                        {domain}
                    </CardTitle>
                    <Users className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{employeesInDomain.length} employés</div>
                    <p className="text-xs text-muted-foreground">
                        Total des employés dans ce département.
                    </p>
                </CardContent>
                <CardFooter>
                     <Button asChild className="w-full">
                        <Link href={`/department/${encodeURIComponent(domain)}`}>Gérer le département</Link>
                    </Button>
                </CardFooter>
            </Card>
        ))}
        </div>
    </>
  )
}

// Logic from recap page
interface WeeklySummary {
  employee: Employee;
  daysPresent: number;
  daysAbsent: number;
  totalPay: number;
}
const calculateWeeklyPay = (employee: Employee, days: string[]): WeeklySummary => {
    const daysPresent = days.filter(day => employee.attendance[day]).length;
    const totalPay = daysPresent * employee.dailyWage;
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

// Component for Recap Tab
function RecapTab() {
  const { employees, days } = useEmployees();
  const weeklySummaries = employees.map(emp => calculateWeeklyPay(emp, days));
  const groupedSummaries = groupSummariesByDomain(weeklySummaries);
  const totalPayroll = weeklySummaries.reduce((sum, summary) => sum + summary.totalPay, 0);

  const downloadPdf = () => {
    const doc = new jsPDF();
    const pageTitle = "Récapitulatif de Paie Hebdomadaire";
    const titleWidth = doc.getTextWidth(pageTitle);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.text(pageTitle, (pageWidth - titleWidth) / 2, 20);

    Object.entries(groupedSummaries).forEach(([domain, summaries]) => {
        (doc as any).autoTable({
            startY: (doc as any).autoTable.previous.finalY + 15 || 30,
            head: [[{ content: domain, colSpan: 4, styles: { fillColor: [22, 163, 74], textColor: 255 } }]],
            body: summaries.map(s => [
                `${s.employee.firstName} ${s.employee.lastName}`,
                s.daysPresent,
                s.daysAbsent,
                new Intl.NumberFormat('fr-FR').format(s.totalPay)
            ]),
            headStyles: { halign: 'center'},
            foot: [[
                { content: 'Total Département', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: new Intl.NumberFormat('fr-FR').format(summaries.reduce((acc, curr) => acc + curr.totalPay, 0)), styles: { halign: 'right', fontStyle: 'bold' } }
            ]],
            footStyles: { fillColor: [240, 240, 240] },
            columns: [
                { header: 'Employé' },
                { header: 'Présents', styles: { halign: 'center' } },
                { header: 'Absents', styles: { halign: 'center' } },
                { header: 'Salaire', styles: { halign: 'right' } }
            ],
            theme: 'striped',
            didDrawPage: function (data: any) {
                // Footer
                doc.setFontSize(10);
                doc.text('PayTracker - ' + new Date().toLocaleDateString('fr-FR'), data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
            }
        });
    });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Général à Payer: ${new Intl.NumberFormat('fr-FR').format(totalPayroll)} FCFA`, 14, (doc as any).autoTable.previous.finalY + 20);

    doc.save(`recap_paie_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <>
      <div className="mb-6 mt-6 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline">Weekly Recap</h1>
            <p className="text-muted-foreground">
              Summary of employee attendance and payments for the week.
            </p>
        </div>
        <Button onClick={downloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Télécharger en PDF
        </Button>
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
                                Total: {new Intl.NumberFormat('fr-FR').format(domainTotal)} FCFA
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead className="text-center">Days Present</TableHead>
                                    <TableHead className="text-center">Days Absent</TableHead>
                                    <TableHead className="text-right">Total Pay</TableHead>
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
                                             <Link href={`/employee/${summary.employee.id}`} className="font-medium hover:underline">
                                                {summary.employee.firstName} {summary.employee.lastName}
                                             </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-accent/80 text-accent-foreground hover:bg-accent">{summary.daysPresent}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{summary.daysAbsent}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {new Intl.NumberFormat('fr-FR').format(summary.totalPay)} FCFA
                                    </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className='bg-secondary/80 hover:bg-secondary/80'>
                                    <TableCell colSpan={3} className="text-right font-bold text-lg">Total Département</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{new Intl.NumberFormat('fr-FR').format(domainTotal)} FCFA</TableCell>
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
                {new Intl.NumberFormat('fr-FR').format(totalPayroll)} FCFA
            </div>
             <p className="text-muted-foreground mt-2">
                Ceci est la somme totale à payer à tous les employés pour la semaine en cours.
            </p>
        </CardContent>
      </Card>
    </>
  );
}


// Main Page Component
export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
       <Tabs defaultValue="departments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="departments">Départements</TabsTrigger>
                <TabsTrigger value="recap">Récapitulatif Global</TabsTrigger>
            </TabsList>
            <TabsContent value="departments">
                <DepartmentsTab />
            </TabsContent>
            <TabsContent value="recap">
                <RecapTab />
            </TabsContent>
        </Tabs>
    </div>
  );
}
