
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
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import Link from 'next/link';
import { Home, Briefcase, UserPlus, FileText, Archive, HandCoins, Settings, History, Users, ListChecks } from 'lucide-react';
import { Header } from "@/components/header";
import { useEffect, useState } from "react";
import { useEmployees } from "@/context/employee-provider";
import { Button } from "@/components/ui/button";
import { ChatWidget } from "@/components/chat-widget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import Image from "next/image";

const menuGroups = [
    {
        label: "Général",
        items: [
            { href: '/dashboard', label: 'Tableau de bord', icon: Home },
            { href: '/dashboard/recap', label: 'Récapitulatif', icon: FileText },
            { href: '/dashboard/archives', label: 'Archives', icon: Archive },
        ]
    },
    {
        label: "Gestion",
        items: [
            { href: '/dashboard/departments', label: 'Départements', icon: Briefcase },
            { href: '/dashboard/employees', label: 'Employés', icon: Users },
            { href: '/dashboard/register', label: 'Enregistrer', icon: UserPlus },
            { href: '/dashboard/loans', label: 'Avances sur Salaire', icon: HandCoins },
        ]
    },
    {
        label: "Système",
        items: [
            { href: '/dashboard/logs', label: 'Historique Connexions', icon: History },
            { href: '/dashboard/audit', label: "Journal d'Audit", icon: ListChecks },
            { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
        ]
    }
]


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, companyId, siteSettings, company } = useEmployees();
  const { sessionData, isLoggedIn } = useSession();
  const { userType, adminName, userId, companyName } = sessionData;

  useEffect(() => {
    if (isLoggedIn === null) return; // Wait for session check
    
    if (!isLoggedIn || userType !== 'admin' || !userId) {
      router.replace('/admin-login');
    }
  }, [userType, userId, isLoggedIn, router]);


  if (isLoggedIn === null || (isLoggedIn && isLoading)) {
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

  if (!companyId && isLoggedIn) {
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
                <Image src={company?.logoUrl || 'https://i.postimg.cc/xdLntsjG/Chat-GPT-Image-27-juil-2025-19-35-13.png'} alt="Company Logo" width={32} height={32} className="rounded-sm" />
                <span className="font-headline text-primary">{companyName}</span>
             </Link>
        </SidebarHeader>
        <SidebarContent>
            {menuGroups.map(group => (
                 <SidebarGroup key={group.label}>
                    <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                    <SidebarMenu>
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === item.href}
                                    tooltip={item.label}
                                    className="justify-start gap-3"
                                >
                                    <Link href={item.href}>
                                        <item.icon className="size-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                 </SidebarGroup>
            ))}
        </SidebarContent>
      </Sidebar>
      <div className="flex flex-col flex-1">
        <Header variant="sidebar" />
        <SidebarInset>{children}</SidebarInset>
         {userType === 'admin' && companyId && userId && adminName && (
            <ChatWidget
              companyId={companyId}
              userId={userId}
              userName={adminName}
              userRole="admin"
            />
          )}
      </div>
    </SidebarProvider>
  );
}
