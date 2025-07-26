
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type LoginLog } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Calendar, Clock, User, Briefcase, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployees } from '@/context/employee-provider';

export default function LogsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { companyId } = useEmployees();

  useEffect(() => {
    const fetchLogs = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const logsQuery = query(collection(db, 'login_logs'), where("companyId", "==", companyId), orderBy('timestamp', 'desc'), limit(100));
        const logsSnapshot = await getDocs(logsQuery);
        const logsData = logsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as LoginLog[];
        setLogs(logsData);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'historique:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [companyId]);

  const renderLogDetails = (log: LoginLog) => {
    if (log.userType === 'admin') {
      return (
        <Badge variant={log.details === 'Super Administrateur' ? 'default' : 'secondary'} className="flex items-center gap-2">
            <Shield className="h-3 w-3" />
            {log.details}
        </Badge>
      );
    }
    return (
        <Badge variant="outline" className="flex items-center gap-2">
            <Briefcase className="h-3 w-3" />
            {log.details}
        </Badge>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Historique des Connexions</h2>
          <p className="text-muted-foreground">
            Suivez les accès des responsables et des administrateurs de votre entreprise.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <History className="h-6 w-6" />
                Dernières Activités
            </CardTitle>
            <CardDescription>
                Liste des 100 dernières connexions enregistrées pour votre entreprise.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date & Heure</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Rôle / Département</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                            </TableRow>
                        ))
                    ) : logs.length > 0 ? (
                        logs.map(log => (
                        <TableRow key={log.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/>{format(new Date(log.timestamp), 'eeee dd MMMM yyyy', { locale: fr })}</span>
                                    <span className="text-muted-foreground text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/>{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {log.userType === 'admin' ? 
                                     <Shield className="h-4 w-4 text-muted-foreground"/> :
                                     <User className="h-4 w-4 text-muted-foreground"/> 
                                    }
                                    <span>{log.userName}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {renderLogDetails(log)}
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                Aucun historique de connexion trouvé.
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
