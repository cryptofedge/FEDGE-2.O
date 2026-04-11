import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FEDGE 2.0 Music Division | Artist OS',
  description: 'Enterprise-grade multi-agent operating system for recording artists.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-zinc-50 text-zinc-900 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
