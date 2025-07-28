
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { EmployeeProvider } from '@/context/employee-provider';
import { Toaster } from '@/components/ui/toaster';
import { PageProgressBar } from '@/components/page-progress-bar';
import { Suspense } from 'react';


export const metadata: Metadata = {
  title: 'Enock PayTracker',
  description: 'Employee management and payroll application for multiple companies.',
};

function SuspenseWrapper({children}: {children: React.ReactNode}) {
    return <Suspense fallback={null}>{children}</Suspense>
}

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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <EmployeeProvider>
            <SuspenseWrapper>
              <PageProgressBar />
            </SuspenseWrapper>
            {children}
            <Toaster />
        </EmployeeProvider>
      </body>
    </html>
  );
}
