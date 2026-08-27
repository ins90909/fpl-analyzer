import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FPL Squad Analyzer',
  description: 'Instant squad analysis, captain suggestions, and transfer optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}