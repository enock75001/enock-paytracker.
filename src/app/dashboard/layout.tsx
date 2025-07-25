

'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from 'next/link';
import { Home, Briefcase, UserPlus, FileText, Archive, WalletCards, Settings } from 'lucide-react';
import { Header } from "@/components/header";

const menuItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: Home },
    { href: '/dashboard/departments', label: 'Départements', icon: Briefcase },
    { href: '/dashboard/register', label: 'Enregistrer', icon: UserPlus },
    { href: '/dashboard/recap', label: 'Récapitulatif', icon: FileText },
    { href: '/dashboard/archives', label: 'Archives', icon: Archive },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
                         <Link href={item.href} passHref legacyBehavior>
                            <SidebarMenuButton
                                isActive={pathname === item.href}
                                tooltip={item.label}
                                size="lg"
                                className="justify-start gap-4"
                            >
                                <item.icon className="size-5" />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
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
