
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { Header } from '@/components/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function EmployeeDashboardPage() {
    const router = useRouter();
    const { sessionData, isLoggedIn } = useSession();
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        // Wait for the session to be hydrated on the client
        if (isLoggedIn === false && isCheckingSession) {
             // Still loading session
            return;
        }
        setIsCheckingSession(false);

        if (sessionData.userType !== 'employee') {
            router.replace('/employee-login');
        }
    }, [sessionData, isLoggedIn, router, isCheckingSession]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push('/');
    };

    if (isCheckingSession || !isLoggedIn) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Vérification de la session...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto p-4 md:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Mon Espace Employé</h1>
                    <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2"/>Déconnexion</Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Bienvenue, {sessionData.employeeName}</CardTitle>
                        <CardDescription>
                           Voici votre tableau de bord personnel. D'autres fonctionnalités arriveront bientôt.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Bientôt, vous pourrez consulter ici vos fiches de paie, suivre vos avances et plus encore.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
