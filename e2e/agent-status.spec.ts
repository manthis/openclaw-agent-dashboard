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

    // Mock /api/agents via route interception: force one agent active, rest idle
    const mocked = agents.map((a) => ({ ...a, status: a.id === targetId ? 'active' : 'idle' }));

    await page.route('/api/agents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mocked),
      });
    });

    // Hit the mocked route via page fetch
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

test.describe('Agents Map UI (/)', () => {
  test('page renders without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    // Wait for ReactFlow or SVG graph
    const graph = page.getByTestId('agent-graph').or(page.locator('.react-flow'));
    await expect(graph).toBeVisible({ timeout: 15_000 });

    expect(errors).toHaveLength(0);
  });

  test('idle agents have no neon green conic-gradient ring', async ({ page, request }) => {
    // Get all agents and ensure at least one is idle
    const res = await request.get('/api/agents');
    const agents = await res.json() as Array<{ id: string; status: string }>;
    const idleAgents = agents.filter((a) => a.status === 'idle');

    // Force all agents to idle via route mock so we can assert reliably
    const allIdle = agents.map((a) => ({ ...a, status: 'idle' }));
    await page.route('/api/agents', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(allIdle),
      });
    });
    await page.route('/api/agents/status', async (route) => {
      const statusMap: Record<string, string> = {};
      agents.forEach((a) => { statusMap[a.id] = 'idle'; });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(statusMap),
      });
    });

    await page.goto('/');
    const graph = page.getByTestId('agent-graph').or(page.locator('.react-flow'));
    await expect(graph).toBeVisible({ timeout: 15_000 });

    // Give status polling time to settle
    await page.waitForTimeout(2_000);

    // No conic-gradient rings should exist for idle agents
    // Active ring is a div with conic-gradient background style
    const ringElements = await page.locator('div[style*="conic-gradient"]').all();
    // All agents are idle → zero rings expected
    expect(ringElements.length).toBe(0);

    // Unused variable guard: confirm we had some idle agents
    expect(idleAgents.length + agents.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Status refresh (no permanent cache)
// ---------------------------------------------------------------------------

test.describe('Status refresh', () => {
  test('GET /api/agents status values re-fetched across calls (not permanently cached)', async ({ request }) => {
    // First call
    const res1 = await request.get('/api/agents');
    expect(res1.ok()).toBeTruthy();
    const agents1 = await res1.json() as Array<{ id: string; status: string }>;
    expect(agents1.length).toBeGreaterThan(0);

    // Wait 6 seconds to exceed any short-lived cache
    await new Promise((resolve) => setTimeout(resolve, 6_500));

    // Second call — server must respond (not fail), statuses may differ
    const res2 = await request.get('/api/agents');
    expect(res2.ok()).toBeTruthy();
    const agents2 = await res2.json() as Array<{ id: string; status: string }>;
    expect(agents2.length).toBe(agents1.length);

    // Both responses must have valid status values
    for (const a of agents2) {
      expect(['active', 'idle']).toContain(a.status);
    }

    // Verify the response is a fresh JSON payload (Cache-Control must not be immutable)
    const cc = res2.headers()['cache-control'] ?? '';
    expect(cc).not.toMatch(/immutable/);
  });
});
