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
    <html lang="en">
      <body className="bg-[#f4fbff] text-[#16324f] min-h-screen">
        {children}
      </body>
    </html>
  );
}