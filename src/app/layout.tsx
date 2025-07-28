
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { EmployeeProvider } from '@/context/employee-provider';
import { Toaster } from '@/components/ui/toaster';
import { PageProgressBar } from '@/components/page-progress-bar';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.variable)}>
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
