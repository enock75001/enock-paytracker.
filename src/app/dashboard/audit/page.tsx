
'use client';

import { useEffect, useState } from 'react';
import { type AuditLog } from '@/lib/types';
import { useEmployees } from '@/context/employee-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ListChecks, Calendar, Clock, User, Shield, Activity, FilePlus, FilePen, FileX, Building, Wallet, RefreshCcw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const auditTypeDetails: { [key in AuditLog['type']]: { label: string; icon: React.ElementType } } = {
    employee_add: { label: 'Ajout Employé', icon: FilePlus },
    employee_update: { label: 'Modif. Employé', icon: FilePen },
    employee_delete: { label: 'Suppr. Employé', icon: FileX },
    department_add: { label: 'Ajout Département', icon: Building },
    department_update: { label: 'Modif. Département', icon: Building },
    department_delete: { label: 'Suppr. Département', icon: Building },
    payroll_archive: { label: 'Archivage Paie', icon: RefreshCcw },
    loan_add: { label: 'Octroi Avance', icon: Wallet },
    loan_update_status: { label: 'Statut Avance', icon: Wallet },
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchAuditLogs } = useEmployees();

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const fetchedLogs = await fetchAuditLogs();
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Erreur lors de la récupération du journal d'audit:", error);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, [fetchAuditLogs]);

  const renderLogIcon = (logType: AuditLog['type']) => {
    const Icon = auditTypeDetails[logType]?.icon || Activity;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Journal d'Audit</h2>
          <p className="text-muted-foreground">
            Suivez les actions importantes effectuées sur la plateforme.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-6 w-6" />
                Dernières Actions
            </CardTitle>
            <CardDescription>
                Liste chronologique des opérations enregistrées pour votre entreprise.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date & Heure</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Type d'Action</TableHead>
                        <TableHead>Détails</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : logs.length > 0 ? (
                        logs.map(log => (
                        <TableRow key={log.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/>{format(parseISO(log.timestamp), 'eeee dd MMM yyyy', { locale: fr })}</span>
                                    <span className="text-muted-foreground text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/>{format(parseISO(log.timestamp), 'HH:mm:ss')}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground"/> 
                                    <span>{log.user.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                               <Badge variant="secondary" className="flex items-center gap-2">
                                {renderLogIcon(log.type)}
                                {auditTypeDetails[log.type]?.label || log.type}
                               </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {log.details}
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Aucun événement enregistré dans le journal d'audit.
                            </TableCell>
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
