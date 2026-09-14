import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'Participant Management System',
  description: 'Enterprise Participant Management System with Next.js and Supabase',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans min-h-screen">
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 md:pl-64 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
