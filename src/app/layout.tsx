import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { EmployeeProvider } from '@/context/employee-provider';
import { Toaster } from '@/components/ui/toaster';


export const metadata: Metadata = {
  title: 'Enock PayTracker',
  description: 'Employee management and payroll application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <EmployeeProvider>
          {children}
          <Toaster />
        </EmployeeProvider>
      </body>
    </html>
  );
}
