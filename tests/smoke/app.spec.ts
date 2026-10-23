import { expect, test } from '@playwright/test';

/** Runs against the local server in CI, a Render preview once it is live, and production after a release. */
test('home loads with services', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Services' })).toBeVisible();
});

test('health answers', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toEqual({ ok: true });
});

test('booking form submits', async ({ page }) => {
  await page.goto('/');
  const form = page.getByRole('form', { name: 'Request a booking' });
  await form.getByLabel('Your name').fill('Smoke Test');
  await form.getByLabel('Email').fill(`smoke-${Date.now()}@example.test`);
  await form.getByLabel('When').fill('2030-01-15T10:30');
  await form.getByRole('button', { name: 'Request booking' }).click();
  await expect(page.getByRole('heading', { name: /Thanks/ })).toBeVisible();
});
