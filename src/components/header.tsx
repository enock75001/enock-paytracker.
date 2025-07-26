
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Menu, WalletCards, LogOut, User, Shield, PanelLeft, Building, Bell, CheckCheck } from 'lucide-react';
import { useEmployees } from '@/context/employee-provider';
import { useSidebar } from './ui/sidebar';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSession } from '@/hooks/use-session';


function NotificationsDropdown() {
    const { notifications, markAllNotificationsAsRead, markNotificationAsRead } = useEmployees();
    const router = useRouter();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = (notification: any) => {
        markNotificationAsRead(notification.id);
        if (notification.link) {
            router.push(notification.link);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                            {unreadCount}
                        </span>
                    )}
                 </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>
                    <div className="flex items-center justify-between">
                        <span>Notifications</span>
                        {notifications.length > 0 && (
                             <Button variant="link" size="sm" className="h-auto p-0" onClick={markAllNotificationsAsRead}>
                                <CheckCheck className="mr-2 h-3 w-3" />
                                Tout marquer comme lu
                             </Button>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {notifications.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Aucune nouvelle notification.</p>
                 ) : (
                    notifications.map(n => (
                        <DropdownMenuItem key={n.id} onSelect={() => handleNotificationClick(n)} className={cn("cursor-pointer flex-col items-start gap-1", !n.isRead && "bg-secondary")}>
                            <p className="font-semibold">{n.title}</p>
                            <p className="text-xs text-muted-foreground">{n.description}</p>
                            <p className="text-xs text-muted-foreground/80">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}</p>
                        </DropdownMenuItem>
                    ))
                 )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


export function Header({variant = 'default'}: {variant?: 'default' | 'sidebar'}) {
  const router = useRouter();
  const { clearData } = useEmployees();
  const { sessionData, isClient, isLoggedIn } = useSession();
  const { userType, adminName, companyName, departmentName, managerName } = sessionData;
  
  const handleLogout = () => {
    clearData();
    sessionStorage.clear();
    router.push('/');
  };

  const renderHomeLink = () => (
     <Link href="/" className="flex items-center gap-2 font-bold text-lg">
        <WalletCards className="h-6 w-6 text-primary" />
        <span className="font-headline">Enock PayTracker</span>
      </Link>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
            {variant === 'sidebar' && <SidebarToggle />}
            {variant === 'default' && renderHomeLink()}
        </div>

        {isLoggedIn && (
             <div className="flex items-center gap-4">
              {userType === 'admin' && <NotificationsDropdown />}
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                   <Avatar className="h-10 w-10">
                     <AvatarImage
                       src={`https://placehold.co/40x40.png?text=${adminName?.charAt(0) || managerName?.charAt(0) || 'U'}`}
                       alt="User avatar"
                       data-ai-hint="user avatar"
                     />
                     <AvatarFallback>{adminName?.charAt(0) || managerName?.charAt(0) || 'U'}</AvatarFallback>
                   </Avatar>
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent className="w-64" align="end" forceMount>
                   <DropdownMenuLabel className="font-normal">
                     <div className="flex flex-col space-y-1">
                       <p className="text-sm font-medium leading-none flex items-center">
                         {userType === 'admin' ? <Shield className="mr-2 h-4 w-4" /> : <User className="mr-2 h-4 w-4" />}
                         {adminName || managerName || 'Utilisateur'}
                       </p>
                       <p className="text-xs leading-none text-muted-foreground flex items-center">
                         <Building className="mr-2 h-4 w-4" />
                         {companyName} {departmentName && `(${departmentName})`}
                       </p>
                     </div>
                   </DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                       <LogOut className="mr-2 h-4 w-4" />Se Déconnecter
                   </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
        )}
      </div>
    </header>
  );
}


function SidebarToggle() {
    const { toggleSidebar } = useSidebar();
    return (
        <Button variant="ghost" size="icon" onClick={() => toggleSidebar()} className="md:hidden">
            <PanelLeft />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    )
}

    