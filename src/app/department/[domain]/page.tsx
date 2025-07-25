
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEmployees } from '@/context/employee-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye, ArrowLeft } from 'lucide-react';


// Component for Attendance Tab
function AttendanceTab({ domain }: { domain: string }) {
  const { employees, updateAttendance, days } = useEmployees();
  const employeesInDomain = employees.filter(emp => emp.domain === domain);

  return (
    <Card className="mt-6">
        <CardHeader>
            <CardTitle className="text-2xl font-bold font-headline">Feuille de Présence</CardTitle>
            <CardDescription>
            Cochez les jours de présence pour les employés du département : <span className="font-semibold">{domain}</span>.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[250px]">Employé</TableHead>
                    <TableHead>Salaire Journalier</TableHead>
                    {days.map(day => (
                        <TableHead key={day} className="text-center">{day}</TableHead>
                    ))}
                    <TableHead className="text-right">Détails</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employeesInDomain.map(employee => (
                    <TableRow key={employee.id}>
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                            <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} data-ai-hint="person portrait" />
                            <AvatarFallback>{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                            <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                            <div className="text-sm text-muted-foreground">{employee.phone}</div>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>
                            {new Intl.NumberFormat('fr-FR').format(employee.dailyWage)} FCFA
                        </TableCell>
                        {days.map(day => (
                        <TableCell key={day} className="text-center">
                            <Checkbox
                            checked={employee.attendance[day]}
                            onCheckedChange={(checked) =>
                                updateAttendance(employee.id, day, !!checked)
                            }
                            aria-label={`Attendance for ${day}`}
                            className="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground border-accent"
                            />
                        </TableCell>
                        ))}
                        <TableCell className="text-right">
                            <Link href={`/employee/${employee.id}`} passHref>
                                <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Voir les détails</span>
                                </Button>
                            </Link>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
      </CardContent>
    </Card>
  )
}

// Main Page Component
export default function DepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const domain = decodeURIComponent(params.domain as string);

  return (
    <div className="container mx-auto p-4 md:p-8">
       <div className="mb-6">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au tableau de bord
            </Button>
        </div>
        <div className="mb-4">
            <h1 className="text-4xl font-bold font-headline">Gestion du Département : {domain}</h1>
            <p className="text-muted-foreground">
                Interface de présence pour le responsable du département.
            </p>
        </div>
        <AttendanceTab domain={domain} />
    </div>
  );
}

    