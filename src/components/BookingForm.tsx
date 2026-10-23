'use client';

import { useActionState } from 'react';
import { requestBooking, type BookingState } from '@/lib/bookings';

interface Service {
  slug: string;
  name: string;
  priceCents: number;
  durationMinutes: number;
}

const field = 'w-full rounded-md border border-zinc-300 px-3 py-2 text-base';

export function BookingForm({ services }: { services: Service[] }) {
  const [state, action, pending] = useActionState<BookingState, FormData>(requestBooking, {});
  return (
    <form action={action} className="grid gap-4" aria-label="Request a booking">
      <label className="grid gap-1">
        <span className="font-medium">Service</span>
        <select name="service" className={field} required defaultValue={services[0]?.slug}>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name} ({s.durationMinutes} min, ${(s.priceCents / 100).toFixed(2)})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">
        <span className="font-medium">Your name</span>
        <input name="name" className={field} required autoComplete="name" />
      </label>
      <label className="grid gap-1">
        <span className="font-medium">Email</span>
        <input name="email" type="email" className={field} required autoComplete="email" />
      </label>
      <label className="grid gap-1">
        <span className="font-medium">Phone (optional)</span>
        <input name="phone" type="tel" className={field} autoComplete="tel" />
      </label>
      <label className="grid gap-1">
        <span className="font-medium">When</span>
        <input name="when" type="datetime-local" className={field} required />
      </label>
      <label className="grid gap-1">
        <span className="font-medium">Anything we should know? (optional)</span>
        <textarea name="message" className={field} rows={3} />
      </label>
      {state.error ? (
        <p role="alert" className="text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Sending...' : 'Request booking'}
      </button>
    </form>
  );
}
