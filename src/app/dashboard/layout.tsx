
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
import { useEffect } from "react";

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

  useEffect(() => {
    const userType = sessionStorage.getItem('userType');
    if (userType !== 'admin') {
      router.replace('/');
    }
  }, [router]);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
             <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                <WalletCards className="h-6 w-6 text-primary" />
                <span className="font-headline text-primary">Enock PayTracker</span>
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
