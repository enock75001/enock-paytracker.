
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
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Menu, WalletCards, LogOut, User, Shield, PanelLeft, Building } from 'lucide-react';
import { useEmployees } from '@/context/employee-provider';
import { useSidebar } from './ui/sidebar';
import { useEffect, useState } from 'react';

export function Header({variant = 'default'}: {variant?: 'default' | 'sidebar'}) {
  const router = useRouter();
  const { clearData } = useEmployees();
  const [sessionData, setSessionData] = useState({
      userType: '',
      adminName: '',
      companyName: '',
      departmentName: '',
      managerName: ''
  });
  
  // This is needed to prevent hydration mismatch errors, as sessionStorage is client-side only.
  useEffect(() => {
    setSessionData({
      userType: sessionStorage.getItem('userType') || '',
      adminName: sessionStorage.getItem('adminName') || '',
      companyName: sessionStorage.getItem('companyName') || '',
      departmentName: sessionStorage.getItem('department') || '',
      managerName: sessionStorage.getItem('managerName') || '',
    });
  }, [router]);


  const { userType, adminName, companyName, departmentName, managerName } = sessionData;
  const isLoggedIn = !!userType;
  
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
