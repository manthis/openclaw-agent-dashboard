import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:9000';
const OUT = '/tmp/screenshots-light';

// Checks if RGB color is dark (near slate-900 #1e293b = rgb(30,41,59))
function isDark(r: number, g: number, b: number): boolean {
  return r < 80 && g < 80 && b < 100;
}

const pages = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'agents', path: '/agents' },
  { name: 'config', path: '/config' },
];

for (const { name, path: pagePath } of pages) {
  test(`${name} - light mode background is not dark`, async ({ page }) => {
    // Load the page
    await page.goto(`${BASE}${pagePath}`, { waitUntil: 'networkidle' });

    // Force light mode by removing dark class from html element
    // (next-themes uses defaultTheme="dark" regardless of color scheme)
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    console.log(`Screenshot saved: ${OUT}/${name}.png`);

    // Check the outer wrapper div background (has bg-gray-50 in light mode)
    const bgColor = await page.evaluate(() => {
      // Find the first element that has a real (non-transparent) background
      const candidates = [
        document.querySelector('div.flex.h-screen'),
        document.body,
        document.documentElement,
      ];
      for (const el of candidates) {
        if (!el) continue;
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          return bg;
        }
      }
      return window.getComputedStyle(document.body).backgroundColor;
    });

    console.log(`${name} bg: ${bgColor}`);

    const match = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const dark = isDark(r, g, b);
      console.log(`${name}: rgb(${r},${g},${b}) → dark=${dark}`);
      expect(dark, `${name} should have light background in light mode, got ${bgColor}`).toBe(false);
    } else {
      // Transparent is acceptable for html element - skip
      console.log(`${name}: transparent background (acceptable)`);
    }
  });
}
