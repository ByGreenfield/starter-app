import Link from 'next/link';
import { getSite } from '@/lib/content';

export default async function Thanks({ searchParams }: PageProps<'/thanks'>) {
  const { booking } = await searchParams;
  const site = getSite();
  return (
    <div className="grid gap-3">
      <h1 className="text-3xl font-semibold tracking-tight">Thanks, we got your request.</h1>
      <p className="text-lg text-zinc-700">
        {site.name} will confirm by email.{booking ? ` Your booking number is ${booking}.` : ''}
      </p>
      <Link href="/" className="underline">
        Back to the start
      </Link>
    </div>
  );
}
