import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require("../frontend/node_modules/playwright");
}
const { chromium } = playwright;

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const envPath = path.join(rootDir, ".env");
const outDir = path.join(rootDir, ".runtime", "demo-frames");
const screenshotPath = path.join(rootDir, "docs", "assets", "rag-chat-web-response.png");
const durationMs = Number(process.env.DEMO_CAPTURE_DURATION_MS || 60000);
const captureIntervalMs = Number(process.env.DEMO_CAPTURE_INTERVAL_MS || 125);

function readEnv(filePath) {
  const data = {};
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    data[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return data;
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture(page, index) {
  const name = String(index).padStart(5, "0");
  await page.screenshot({ path: path.join(outDir, `frame-${name}.png`), fullPage: false });
}

const env = readEnv(envPath);
const email = env.ROOT_EMAIL;
const password = env.ROOT_PASSWORD;
const publicPort = env.NGINX_PUBLIC_PORT || "6101";
const baseUrl = process.env.DEMO_BASE_URL || `http://127.0.0.1:${publicPort}`;

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });

let frame = 0;
let capturing = true;

const captureLoop = (async () => {
  const startedAt = Date.now();
  while (capturing && Date.now() - startedAt < durationMs) {
    try {
      await capture(page, frame++);
    } catch {
      // The page can be between navigations; skip one frame and continue.
    }
    await wait(captureIntervalMs);
  }
})();

await page.goto(`${baseUrl}/signin`, { waitUntil: "networkidle" });
await wait(1200);
await page.fill('input[type="email"]', email || "admin@example.com");
await wait(700);
await page.fill('input[type="password"]', password || "change_me");
await wait(800);
await page.click('button[type="submit"]');
await page.waitForURL(/\/chat/, { timeout: 30000 });
await page.waitForLoadState("networkidle");
await wait(2500);

await page.getByRole("button", { name: "Công cụ" }).click();
await wait(2200);
await page.keyboard.press("Escape").catch(() => {});
await wait(800);

await page.locator("textarea").last().click();
const prompt = "Demo nhanh: hệ thống RAG/vLLM đang hoạt động thế nào? Trả lời ngắn gọn.";
await page.keyboard.type(prompt, { delay: 30 });
await wait(900);
await page.locator("button").last().click();

await wait(16000);

await page.getByTitle("Mở sidebar").click().catch(() => {});
await wait(5000);

capturing = false;
await captureLoop;

await page.screenshot({ path: screenshotPath, fullPage: false });
await browser.close();

console.log(JSON.stringify({ frames: frame, durationMs, captureIntervalMs, screenshotPath, outDir, baseUrl }, null, 2));
