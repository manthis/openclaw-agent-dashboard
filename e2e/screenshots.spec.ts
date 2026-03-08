import { test } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, '..', 'public', 'screenshots');

test.use({ viewport: { width: 1400, height: 900 } });

test('screenshot: dashboard main page', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Wait for ReactFlow to render
  await page.waitForTimeout(2000);
  // Zoom out to 0.5 via ReactFlow's zoom controls
  await page.evaluate(() => {
    // ReactFlow stores its instance on the window or we can use the viewport transform
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (viewport) {
      viewport.style.transform = 'translate(350px, 225px) scale(0.5)';
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard-main.png') });
});

test('screenshot: dashboard with agent card', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  // Click on the first agent node
  const node = page.locator('.react-flow__node').first();
  await node.click();
  // Wait for agent card to appear
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard-agent-card.png') });
});

test('screenshot: agents list page', async ({ page }) => {
  await page.goto('http://localhost:3000/agents');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'agents-list.png') });
});

test('screenshot: agents edit panel', async ({ page }) => {
  await page.goto('http://localhost:3000/agents');
  await page.waitForTimeout(1000);
  // Click the first agent card button
  const agentCard = page.locator('button.bg-slate-900').first();
  await agentCard.click();
  // Wait for edit panel to appear
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'agents-edit.png') });
});
