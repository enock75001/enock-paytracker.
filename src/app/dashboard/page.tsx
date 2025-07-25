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
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

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

export default function DashboardPage() {
  const { employees, updateAttendance, days } = useEmployees();
  const groupedEmployees = groupEmployeesByDomain(employees);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-headline">Employee Dashboard</h1>
        <p className="text-muted-foreground">
          Manage daily attendance for all employees.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={Object.keys(groupedEmployees)} className="w-full space-y-4">
        {Object.entries(groupedEmployees).map(([domain, employeesInDomain]) => (
          <Card key={domain} className="overflow-hidden">
            <AccordionItem value={domain} className="border-b-0">
              <AccordionTrigger className="p-6 bg-card hover:bg-secondary/50 [&[data-state=open]]:border-b">
                  <div className='flex items-center gap-4'>
                    <h2 className="text-xl font-semibold font-headline">{domain}</h2>
                    <Badge variant="secondary">{employeesInDomain.length} employees</Badge>
                  </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[250px]">Employee</TableHead>
                        <TableHead>Daily Wage</TableHead>
                        {days.map(day => (
                            <TableHead key={day} className="text-center">{day}</TableHead>
                        ))}
                        <TableHead className="text-right">Actions</TableHead>
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
                                        <span className="sr-only">View Details</span>
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Card>
        ))}
      </Accordion>
    </div>
  );
}
