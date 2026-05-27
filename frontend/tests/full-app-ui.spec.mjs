import { test, expect } from '@playwright/test';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const evidenceDir = path.join(repoRoot, 'test/type test/full-app-stability-evidence-2026-05-27/frontend');
const baseURL = process.env.PUBLIC_BASE_URL || 'http://localhost:6101';
const email = process.env.ROOT_EMAIL || 'admin@example.com';
const password = process.env.ROOT_PASSWORD || '';

test('public auth pages and authenticated workspace have visible outcomes', async ({ page }) => {
  test.setTimeout(180000);

  await page.goto(`${baseURL}/signin`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: /Sign in to NTC AI/i })).toBeVisible();
  await page.locator('input[type="email"]').fill('wrong@example.com');
  await page.locator('input[type="password"]').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText(/không đúng|không thể kết nối|chưa được kích hoạt/i)).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: path.join(evidenceDir, 'signin-error-with-input-and-result.png'), fullPage: true });

  await page.goto(`${baseURL}/signup`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading')).toBeVisible();
  await page.screenshot({ path: path.join(evidenceDir, 'signup-page-visible.png'), fullPage: true });

  await page.goto(`${baseURL}/forgot-password`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading')).toBeVisible();
  await page.screenshot({ path: path.join(evidenceDir, 'forgot-password-page-visible.png'), fullPage: true });

  await page.goto(`${baseURL}/signin`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/chat', { timeout: 30000 });
  await expect(page.getByText(/Hãy bắt đầu nhập câu hỏi của bạn/i)).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: path.join(evidenceDir, 'chat-workspace-after-login.png'), fullPage: true });

  await page.getByRole('button', { name: /Công cụ/i }).click();
  await expect(page.getByText('Truy vấn dữ liệu').first()).toBeVisible();
  await page.screenshot({ path: path.join(evidenceDir, 'tool-menu-visible.png'), fullPage: true });
  await page.keyboard.press('Escape');

  await page.locator('button[class*="profileToggleBtn"]').click();
  await expect(page.getByText('Cài đặt')).toBeVisible();
  await page.getByText('Cài đặt').click();
  await expect(page.getByRole('heading', { name: /Cài đặt NTC chat/i })).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(evidenceDir, 'settings-modal-visible.png'), fullPage: true });
});
