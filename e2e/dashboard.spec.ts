import { test, expect } from '@playwright/test';
test('loads homepage', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('h1')).toContainText('OpenClaw Dashboard');
});
test('API /api/agents returns JSON array', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/agents');
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(Array.isArray(data)).toBeTruthy();
});
test('API /api/agents/hal9000 returns agent', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/agents/hal9000');
  expect(res.ok()).toBeTruthy();
  const agent = await res.json();
  expect(agent.id).toBe('hal9000');
});
test('API /api/agents/invalid 404', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/agents/__invalid__');
  expect(res.status()).toBe(404);
});
test('API /api/agents/status returns object', async ({ request }) => {
  const res = await request.get('http://localhost:3000/api/agents/status');
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(typeof data).toBe('object');
});
