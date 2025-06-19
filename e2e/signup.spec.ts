import { test, expect } from '@playwright/test';

// This test verifies that a new user can sign up and is redirected to the dashboard.
// It assumes that the application is running locally via `npm run dev`.

test('sign up redirects to dashboard', async ({ page }) => {
  await page.goto('/');

  // switch to sign up form
  await page.getByRole('button', { name: '新規登録' }).click();

  // fill in minimal fields required for sign up
  await page.getByLabel('メールアドレス').fill('test-user@example.com');
  await page.getByLabel('パスワード').fill('password123');
  await page.getByLabel('パスワード（確認）').fill('password123');

  // select role pharmacist for simplicity
  await page.getByRole('button', { name: '薬剤師' }).click();

  // submit the form
  await page.getByRole('button', { name: '登録' }).click();

  // expect dashboard heading
  await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
});
