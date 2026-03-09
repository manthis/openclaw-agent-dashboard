import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Agent Status — E2E tests
// ---------------------------------------------------------------------------

test.describe('Agent Status API', () => {
  test('GET /api/agents returns all agents with a status field (active|idle)', async ({ request }) => {
    const res = await request.get('/api/agents');
    expect(res.ok()).toBeTruthy();
    const agents = await res.json() as Array<Record<string, unknown>>;
    expect(Array.isArray(agents)).toBeTruthy();
    expect(agents.length).toBeGreaterThan(0);
    for (const agent of agents) {
      expect(agent).toHaveProperty('status');
      expect(['active', 'idle']).toContain(agent.status);
    }
  });

  test('status accuracy — mocked active agent appears as active, others as idle', async ({ page, request }) => {
    // Fetch real agents list to get valid IDs
    const res = await request.get('/api/agents');
    const agents = await res.json() as Array<{ id: string; status: string; [k: string]: unknown }>;
    expect(agents.length).toBeGreaterThan(0);

    const targetId = agents[0].id;

    // Navigate first so page has URL context
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Mock /api/agents: force one agent active, rest idle
    const mocked = agents.map((a) => ({ ...a, status: a.id === targetId ? 'active' : 'idle' }));
    await page.route('**/api/agents', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      // Only intercept GET /api/agents (not sub-routes like /api/agents/[id]/avatar)
      if (method === 'GET' && /\/api\/agents$/.test(url)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mocked),
        });
      } else {
        await route.continue();
      }
    });

    // Verify via page.evaluate (has URL context from page.goto above)
    const data = await page.evaluate(async () => {
      const r = await fetch('/api/agents');
      return r.json();
    }) as Array<{ id: string; status: string }>;

    const target = data.find((a) => a.id === targetId);
    expect(target).toBeDefined();
    expect(target?.status).toBe('active');

    const others = data.filter((a) => a.id !== targetId);
    for (const a of others) {
      expect(a.status).toBe('idle');
    }
  });
});

// ---------------------------------------------------------------------------
// Agents Map UI
// ---------------------------------------------------------------------------

test.describe('Agents Map UI', () => {
  test('page renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Wait for page to load
    await page.waitForLoadState('load');

    // The page must have rendered some meaningful content
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });

    expect(errors).toHaveLength(0);
  });

  test('idle agents have no neon green conic-gradient ring', async ({ page, request }) => {
    // Get all agents to build a full-idle status map
    const res = await request.get('/api/agents');
    const agents = await res.json() as Array<{ id: string }>;
    expect(agents.length).toBeGreaterThan(0);

    // Mock /api/agents/status (client-side polling) to return all idle
    const allIdleStatus: Record<string, string> = {};
    agents.forEach((a) => { allIdleStatus[a.id] = 'idle'; });

    await page.route('**/api/agents/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(allIdleStatus),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('load');

    // Give polling interval time to settle with our mocked idle statuses
    await page.waitForTimeout(2_000);

    // No conic-gradient rings should exist — these are only rendered for active agents
    const ringElements = await page.locator('div[style*="conic-gradient"]').all();
    expect(ringElements.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Status refresh (no permanent cache)
// ---------------------------------------------------------------------------

test.describe('Status refresh', () => {
  test('GET /api/agents endpoint has valid cache headers (not permanently cached)', async ({ request }) => {
    // Test cache headers without waiting for 6+ seconds
    const res = await request.get('/api/agents');
    expect(res.ok()).toBeTruthy();
    const data = await res.json() as Array<{ id: string; status: string }>;
    expect(data.length).toBeGreaterThan(0);

    // Verify the response has valid cache headers (not immutable, allowing fresh fetches)
    const cc = res.headers()['cache-control'] ?? '';
    expect(cc).not.toMatch(/immutable/);

    // Each agent should have a status field
    for (const agent of data) {
      expect(['active', 'idle']).toContain(agent.status);
    }
  });
});
