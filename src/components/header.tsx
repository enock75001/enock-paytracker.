
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Menu, WalletCards, LogOut, User, Shield, PanelLeft } from 'lucide-react';
import { useEmployees } from '@/context/employee-provider';
import { useSidebar } from './ui/sidebar';

export function Header({variant = 'default'}: {variant?: 'default' | 'sidebar'}) {
  const pathname = usePathname();
  const { departments } = useEmployees();
  
  // Determine view type based on URL
  const isAdminPath = pathname.startsWith('/dashboard') || pathname.startsWith('/employee');
  const isManagerPath = pathname.startsWith('/department');
  const isLoginPage = pathname === '/' || pathname.startsWith('/manager-login') || pathname.startsWith('/admin-login');
  
  // Get manager name if on a manager page
  const domain = isManagerPath ? decodeURIComponent(pathname.split('/')[2]) : null;
  const managerName = domain ? departments.find(d => d.name === domain)?.manager.name : null;


  const renderHomeLink = () => {
    let href = "/";
    let isClickable = true;

    if(isAdminPath) {
      href = "/dashboard";
    } else if (isManagerPath) {
      href = "#"; // Manager should not navigate away from their page via logo
      isClickable = false;
    }

    return (
       <Link
          href={href}
          className={cn("flex items-center gap-2 font-bold text-lg", !isClickable && "pointer-events-none")}
        >
          <WalletCards className="h-6 w-6 text-primary" />
          <span className="font-headline">Enock PayTracker</span>
        </Link>
    )
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
            {variant === 'sidebar' && <SidebarToggle />}
            {!isManagerPath && !isAdminPath && renderHomeLink()}
        </div>

        {!isLoginPage && (
             <div className="flex items-center gap-4">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                   <Avatar className="h-10 w-10">
                     <AvatarImage
                       src={`https://placehold.co/40x40.png?text=${isAdminPath ? 'A' : managerName?.charAt(0) || 'M'}`}
                       alt="User avatar"
                       data-ai-hint="user avatar"
                     />
                     <AvatarFallback>{isAdminPath ? 'A' : managerName?.charAt(0) || 'M'}</AvatarFallback>
                   </Avatar>
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent className="w-56" align="end" forceMount>
                   {isAdminPath ? (
                     <>
                       <DropdownMenuLabel className="font-normal">
                         <div className="flex flex-col space-y-1">
                           <p className="text-sm font-medium leading-none flex items-center"><Shield className="mr-2 h-4 w-4" />Admin</p>
                           <p className="text-xs leading-none text-muted-foreground">admin@paytracker.com</p>
                         </div>
                       </DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem asChild>
                           <Link href="/admin-login" className="w-full flex items-center"><LogOut className="mr-2 h-4 w-4" />Se Déconnecter</Link>
                       </DropdownMenuItem>
                     </>
                   ) : (
                     <>
                        <DropdownMenuLabel className="font-normal">
                         <div className="flex flex-col space-y-1">
                           <p className="text-sm font-medium leading-none flex items-center"><User className="mr-2 h-4 w-4" />{managerName || 'Manager'}</p>
                           <p className="text-xs leading-none text-muted-foreground">{domain}</p>
                         </div>
                       </DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem asChild>
                           <Link href="/manager-login" className="w-full flex items-center"><LogOut className="mr-2 h-4 w-4" />Se Déconnecter</Link>
                       </DropdownMenuItem>
                     </>
                   )}
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
