import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Dashboard (/)
// ---------------------------------------------------------------------------

test.describe('Dashboard /', () => {
  test('header displays "OpenClaw Dashboard" and lobster emoji', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'OpenClaw Dashboard' })).toBeVisible();
    await expect(page.getByText('🦞')).toBeVisible();
  });

  test('gateway indicator is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Connected|Disconnected/)).toBeVisible();
  });

  test('desktop: ReactFlow graph is rendered', async ({ page, viewport }) => {
    test.skip(viewport !== null && viewport.width < 768, 'Desktop only');
    await page.goto('/');
    const graph = page.getByTestId('agent-graph').or(page.locator('.react-flow'));
    await expect(graph).toBeVisible({ timeout: 15_000 });
  });

  test('mobile: SVG graph is rendered', async ({ page, viewport }) => {
    test.skip(viewport === null || viewport.width >= 768, 'Mobile only');
    await page.goto('/');
    await expect(page.locator('svg')).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// /agents
// ---------------------------------------------------------------------------

test.describe('/agents', () => {
  test('agent list displays at least 1 agent', async ({ page }) => {
    await page.goto('/agents');
    await expect(page.getByRole('heading', { name: 'Agents' })).toBeVisible();
    // Agent cards are buttons inside the grid
    const cards = page.locator('button').filter({ hasText: /agent/ });
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  });

  test('click agent opens modal with Delete agent button', async ({ page }) => {
    await page.goto('/agents');
    const cards = page.locator('button').filter({ hasText: /agent/ });
    await cards.first().click();
    await expect(page.getByRole('button', { name: /Delete agent/ })).toBeVisible({ timeout: 10_000 });
  });

  test('delete confirmation flow and cancel', async ({ page }) => {
    await page.goto('/agents');
    const cards = page.locator('button').filter({ hasText: /agent/ });
    await cards.first().click();

    // Click "Delete agent" to reveal inline confirmation
    await page.getByRole('button', { name: /Delete agent/ }).click();
    await expect(page.getByText('This action cannot be undone')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

    // Click Cancel → confirmation disappears
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('This action cannot be undone')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// /config
// ---------------------------------------------------------------------------

test.describe('/config', () => {
  test('config page loads with tabs', async ({ page }) => {
    await page.goto('/config');
    await expect(page.getByRole('heading', { name: 'Configuration' })).toBeVisible();

    // Check key tabs are visible and clickable
    for (const tab of ['Gateway', 'Models']) {
      const tabEl = page.getByRole('tab', { name: tab });
      await expect(tabEl).toBeVisible();
      await tabEl.click();
    }
  });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

test.describe('API routes', () => {
  test('GET /api/agents returns JSON array', async ({ request }) => {
    const res = await request.get('/api/agents');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /api/agents/status returns JSON object', async ({ request }) => {
    const res = await request.get('/api/agents/status');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(typeof data).toBe('object');
  });

  test('HEAD /api/openclaw-config returns 200 or 503', async ({ request }) => {
    const res = await request.head('/api/openclaw-config');
    expect([200, 503]).toContain(res.status());
  });
});
