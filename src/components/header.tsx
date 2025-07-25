
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
import { Menu, WalletCards, LogOut } from 'lucide-react';

const navLinks = [
  { href: '/dashboard', label: 'Tableau de Bord' },
];

export function Header() {
  const pathname = usePathname();
  const isAdminView = !pathname.startsWith('/department');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link
            href={isAdminView ? "/dashboard" : "#"}
            className={cn("flex items-center gap-2 font-bold text-lg", !isAdminView && "pointer-events-none")}
          >
            <WalletCards className="h-6 w-6 text-primary" />
            <span className="font-headline">PayTracker</span>
          </Link>
          {isAdminView && (
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'transition-colors hover:text-primary',
                    pathname.startsWith(link.href)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src="https://placehold.co/40x40.png"
                    alt="User avatar"
                    data-ai-hint="user avatar"
                  />
                  <AvatarFallback>{isAdminView ? 'A' : 'M'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
               {isAdminView ? (
                 <>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Admin</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            admin@paytracker.com
                        </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <LogOut className="mr-2 h-4 w-4" />
                        <Link href="/" className="w-full">
                            Log out
                        </Link>
                    </DropdownMenuItem>
                 </>
               ) : (
                 <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <Link href="/" className="w-full">
                        Déconnexion
                    </Link>
                </DropdownMenuItem>
               )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <SheetClose asChild>
                   <Link
                    href={isAdminView ? "/dashboard" : "#"}
                    className={cn("flex items-center gap-2 text-lg font-semibold", !isAdminView && "pointer-events-none")}
                  >
                    <WalletCards className="h-6 w-6 text-primary" />
                    <span>PayTracker</span>
                  </Link>
                </SheetClose>
                {isAdminView && navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'transition-colors hover:text-primary',
                        pathname.startsWith(link.href)
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
