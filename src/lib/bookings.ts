'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';

const BookingInput = z.object({
  service: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  when: z.string().min(1),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
});

export type BookingState = { error?: string };

/** The booking form's server action: upsert the customer, insert the booking, log it, say thanks. */
export async function requestBooking(_prev: BookingState, form: FormData): Promise<BookingState> {
  const parsed = BookingInput.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success)
    return { error: 'Please check the form: every field except phone and message is needed.' };
  const input = parsed.data;
  const requestedFor = new Date(input.when);
  if (Number.isNaN(requestedFor.getTime())) return { error: 'Please pick a date and time.' };

  const service = await db.query.services.findFirst({ where: eq(schema.services.slug, input.service) });
  if (!service || service.active !== 1) return { error: 'That service is not available.' };

  const bookingId = await db.transaction(async (tx) => {
    const email = input.email.toLowerCase();
    const [customer] = await tx
      .insert(schema.customers)
      .values({ email, fullName: input.name, phone: input.phone || null })
      .onConflictDoUpdate({
        target: schema.customers.email,
        set: { fullName: input.name, ...(input.phone ? { phone: input.phone } : {}) },
      })
      .returning({ id: schema.customers.id });
    const [booking] = await tx
      .insert(schema.bookings)
      .values({
        customerId: customer!.id,
        serviceId: service.id,
        requestedFor,
        message: input.message || null,
      })
      .returning({ id: schema.bookings.id });
    await tx.insert(schema.activity).values({
      kind: 'booking.requested',
      bookingId: booking!.id,
      detail: { service: service.slug },
    });
    return booking!.id;
  });
  redirect(`/thanks?booking=${bookingId}`);
}
