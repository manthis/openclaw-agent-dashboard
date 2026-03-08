import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OpenClaw Dashboard',
  description: 'Agent orchestration dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-950 text-white`}>
        <div className="flex h-screen bg-neutral-950 overflow-hidden">
          <div className="hidden md:flex">
            <Sidebar />
          </div>
          <main className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <div className="flex-1 overflow-auto pb-16 md:pb-0">
              {children}
            </div>
          </main>
        </div>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
