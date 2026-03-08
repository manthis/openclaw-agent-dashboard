import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE = 'http://localhost:9000';
const OUT = '/tmp/screenshots-light';

// Returns true only if the color is explicitly dark (near slate-800/900)
// Transparent (rgba(0,0,0,0)) = browser default white = light = OK
function isExplicitlyDark(bgColor: string): boolean {
  const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
  if (!match) return false;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  const a = match[4] !== undefined ? Number(match[4]) : 1;
  // Transparent = not dark
  if (a === 0) return false;
  // Explicitly dark: r<80 && g<80 && b<100 and not fully transparent
  return r < 80 && g < 80 && b < 100;
}

fs.mkdirSync(OUT, { recursive: true });

const pages = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'agents', path: '/agents' },
  { name: 'config', path: '/config' },
];

for (const { name, path: pagePath } of pages) {
  test(`${name} - light mode background is not dark`, async ({ page }) => {
    // Use domcontentloaded to avoid waiting for SSE/streaming connections
    await page.goto(`${BASE}${pagePath}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Force light mode: remove dark class applied by next-themes
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(300);

    // Take screenshot
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    console.log(`Screenshot saved: ${OUT}/${name}.png`);

    // Check background colors of key elements
    const result = await page.evaluate(() => {
      const selectors = ['body', 'div.flex.h-screen', 'main', '#__next', '.bg-gray-50'];
      const colors: Record<string, string> = {};
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          colors[sel] = window.getComputedStyle(el).backgroundColor;
        }
      }
      return colors;
    });

    console.log(`${name} colors:`, JSON.stringify(result));

    // Assert none of the key elements have explicitly dark backgrounds
    for (const [sel, color] of Object.entries(result)) {
      const dark = isExplicitlyDark(color);
      console.log(`  ${sel}: ${color} → dark=${dark}`);
      expect(
        dark,
        `${name} element "${sel}" should not have dark background in light mode, got: ${color}`
      ).toBe(false);
    }
  });
}
