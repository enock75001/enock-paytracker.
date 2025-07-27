
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import Link from 'next/link';
import { Home, Briefcase, UserPlus, FileText, Archive, WalletCards, Settings, History, Users, HandCoins } from 'lucide-react';
import { Header } from "@/components/header";
import { useEffect, useState } from "react";
import { useEmployees } from "@/context/employee-provider";
import { Button } from "@/components/ui/button";
import { ChatWidget } from "@/components/chat-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const menuItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: Home },
    { href: '/dashboard/departments', label: 'Départements', icon: Briefcase },
    { href: '/dashboard/employees', label: 'Employés', icon: Users },
    { href: '/dashboard/register', label: 'Enregistrer', icon: UserPlus },
    { href: '/dashboard/recap', label: 'Récapitulatif', icon: FileText },
    { href: '/dashboard/loans', label: 'Avances sur Salaire', icon: HandCoins },
    { href: '/dashboard/archives', label: 'Archives', icon: Archive },
    { href: '/dashboard/logs', label: 'Historique Connexions', icon: History },
    { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, companyId, siteSettings } = useEmployees();
  const [companyName, setCompanyName] = useState("Enock PayTracker");
  const [adminName, setAdminName] = useState("");
  const [adminId, setAdminId] = useState("");
  const [userType, setUserType] = useState<"admin" | "manager" | null>(null);

  useEffect(() => {
    const sessionUserType = sessionStorage.getItem('userType');
    const sessionCompanyId = sessionStorage.getItem('companyId');
    const sessionAdminId = sessionStorage.getItem('adminId');

    if (sessionUserType !== 'admin' || !sessionCompanyId || !sessionAdminId) {
      router.replace('/');
      return;
    }

    setCompanyName(sessionStorage.getItem('companyName') || "Enock PayTracker");
    setAdminName(sessionStorage.getItem('adminName') || "");
    setAdminId(sessionAdminId);
    setUserType(sessionUserType as "admin" | "manager");
  }, [router]);


  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center">
                <p className="text-lg font-semibold">Chargement des données de l'entreprise...</p>
                <p className="text-sm text-muted-foreground">Veuillez patienter.</p>
            </div>
        </div>
      );
  }
  
    if (siteSettings?.isUnderMaintenance) {
      return (
          <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 flex items-center justify-center container mx-auto p-4">
                  <Card className="mx-auto max-w-md w-full text-center">
                      <CardHeader>
                          <CardTitle className="text-2xl font-headline">Site en Maintenance</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p>{siteSettings.maintenanceMessage}</p>
                      </CardContent>
                  </Card>
              </main>
          </div>
      )
  }

  if (!companyId && !isLoading) {
      // This can happen if the context is loaded but no companyId is set.
      // Redirecting should be handled by the useEffect, but this is a fallback.
       return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-center">
                <p className="text-lg font-semibold text-destructive">Erreur: Aucune entreprise sélectionnée.</p>
                <p className="text-sm text-muted-foreground">Redirection vers la page de connexion...</p>
                <Button onClick={() => router.push('/')} className="mt-4">Retour</Button>
            </div>
        </div>
      );
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
             <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                <WalletCards className="h-6 w-6 text-primary" />
                <span className="font-headline text-primary">{companyName}</span>
             </Link>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                         <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
                            tooltip={item.label}
                            size="lg"
                            className="justify-start gap-4"
                        >
                            <Link href={item.href}>
                                <item.icon className="size-5" />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div className="flex flex-col flex-1">
        <Header variant="sidebar" />
        <SidebarInset>{children}</SidebarInset>
         {userType === 'admin' && companyId && adminId && (
            <ChatWidget
              companyId={companyId}
              userId={adminId}
              userName={adminName}
              userRole="admin"
            />
          )}
      </div>
    </SidebarProvider>
  );
}
