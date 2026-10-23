import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { getSite } from '@/lib/content';
import { BookingForm } from '@/components/BookingForm';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const site = getSite();
  const services = await db.query.services.findMany({
    where: eq(schema.services.active, 1),
    orderBy: (s, { asc }) => [asc(s.name)],
  });
  return (
    <div className="grid gap-10">
      <section className="grid gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{site.tagline}</h1>
        <p className="text-lg text-zinc-700">{site.intro}</p>
      </section>
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">Services</h2>
        <ul className="grid gap-2">
          {services.map((s) => (
            <li key={s.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{s.name}</span>
                <span className="text-zinc-600">${(s.priceCents / 100).toFixed(2)}</span>
              </div>
              {s.description ? <p className="mt-1 text-sm text-zinc-600">{s.description}</p> : null}
            </li>
          ))}
          {services.length === 0 ? (
            <li className="text-zinc-600">No services are open for booking right now.</li>
          ) : null}
        </ul>
      </section>
      <section id="book" className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-xl font-semibold">Request a booking</h2>
        {services.length > 0 ? (
          <BookingForm services={services} />
        ) : (
          <p className="text-zinc-600">Bookings open soon.</p>
        )}
      </section>
    </div>
  );
}
