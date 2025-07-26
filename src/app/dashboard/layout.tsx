
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
import { Home, Briefcase, UserPlus, FileText, Archive, WalletCards, Settings, History } from 'lucide-react';
import { Header } from "@/components/header";
import { useEffect, useState } from "react";
import { useEmployees } from "@/context/employee-provider";
import { Button } from "@/components/ui/button";

const menuItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: Home },
    { href: '/dashboard/departments', label: 'Départements', icon: Briefcase },
    { href: '/dashboard/register', label: 'Enregistrer', icon: UserPlus },
    { href: '/dashboard/recap', label: 'Récapitulatif', icon: FileText },
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
  const { isLoading, companyId } = useEmployees();
  const [companyName, setCompanyName] = useState("Enock PayTracker");

  useEffect(() => {
    const userType = sessionStorage.getItem('userType');
    const sessionCompanyId = sessionStorage.getItem('companyId');
    if (userType !== 'admin' || !sessionCompanyId) {
      router.replace('/');
    }
    setCompanyName(sessionStorage.getItem('companyName') || "Enock PayTracker");
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
      </div>
    </SidebarProvider>
  );
}
