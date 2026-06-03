import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(root, 'index.html').replace(/\\/g, '/');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto(url);
await page.waitForTimeout(300);

async function report(label) {
  const data = await page.evaluate(() => {
    const out = {};
    const title = document.querySelector('.nav-section-title');
    const titleIcon = title?.querySelector('.nav-icon');
    const titleLabel = title?.querySelector('.nav-label');
    const link = document.querySelector('.nav-sidebar-external .nav-link');
    const linkIcon = link?.querySelector('.nav-icon');
    const linkLabel = link?.querySelector('.nav-label');
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { left: +b.left.toFixed(1), width: +b.width.toFixed(1) }; };
    out.titleIcon = r(titleIcon);
    out.titleLabel = r(titleLabel);
    out.linkIcon = r(linkIcon);
    out.linkLabel = r(linkLabel);
    return out;
  });
  console.log('===', label, '===');
  console.log('title icon  left/width:', data.titleIcon);
  console.log('title label left/width:', data.titleLabel);
  console.log('link  icon  left/width:', data.linkIcon);
  console.log('link  label left/width:', data.linkLabel);
}

// collapsed (default desktop)
await report('COLLAPSED');

// pinned
await page.evaluate(() => document.getElementById('navHamburger').click());
await page.waitForTimeout(300);
await report('PINNED');
await page.screenshot({ path: path.join(root, 'shot-pinned.png'), clip: { x: 0, y: 0, width: 300, height: 800 } });

await browser.close();
