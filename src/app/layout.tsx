import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/navbar';
import { AuthProvider } from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'YouTube Content Search',
  description: 'Search for YouTube videos and channels',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 