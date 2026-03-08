import { test, expect, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE = 'http://localhost:9000';
const OUT = '/tmp/screenshots-light';

// Hex color #1e293b (slate-900) in RGB: r=30 g=41 b=59
// We assert that the average background is NOT close to that
function isDark(r: number, g: number, b: number): boolean {
  // dark means r < 80 && g < 80 && b < 100
  return r < 80 && g < 80 && b < 100;
}

test.use({ colorScheme: 'light' });

const pages = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'agents', path: '/agents' },
  { name: 'config', path: '/config' },
];

for (const { name, path: pagePath } of pages) {
  test(`${name} - light mode background is not dark`, async ({ page }) => {
    await page.goto(`${BASE}${pagePath}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const screenshot = await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    console.log(`Screenshot saved: ${OUT}/${name}.png`);
    
    // Check body background color
    const bgColor = await page.evaluate(() => {
      const el = document.querySelector('main') || document.body;
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log(`${name} bg: ${bgColor}`);
    
    // Parse rgb(r, g, b)
    const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const dark = isDark(r, g, b);
      console.log(`${name}: rgb(${r},${g},${b}) → dark=${dark}`);
      expect(dark, `${name} should have light background, got ${bgColor}`).toBe(false);
    }
  });
}
