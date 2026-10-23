import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { getSite } from '@/lib/content';

const site = getSite();

export const metadata: Metadata = {
  title: site.name,
  description: site.tagline,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold">
              {site.name}
            </Link>
            <Link href="/#book" className="text-sm font-medium underline">
              Book
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-2xl px-4 py-6 text-sm text-zinc-600">
            <p>{site.hours.join(' · ')}</p>
            {site.email ? <p>{site.email}</p> : null}
          </div>
        </footer>
      </body>
    </html>
  );
}
