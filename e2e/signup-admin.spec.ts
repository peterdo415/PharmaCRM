import { test, expect } from '@playwright/test';

test.describe('Pharmacy Admin Sign Up Flow', () => {
  // 各テスト前にセッション（localStorage）をクリア
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    });
  });

  test('sign up as pharmacy admin shows dashboard', async ({ page }) => {
    // 画面に遷移
    await page.goto('/');

    // 1. 役割選択: 新規登録 → 薬局管理者
    await page.getByRole('button', { name: '新規登録' }).click();
    await page.getByRole('button', { name: '薬局管理者' }).click();

    // 2. 基本情報入力
    const uniqueEmail = `admin-${Date.now()}@gmail.com`;
    await page.getByPlaceholder('you@gmail.com').fill(uniqueEmail);
    await page.getByPlaceholder('パスワードを入力').fill('password123');
    await page.getByPlaceholder('パスワードを再入力').fill('password123');

    // 3. 薬局情報入力
    await page.getByPlaceholder('○○薬局').fill('テスト薬局');
    await page.getByRole('combobox', { name: /都道府県/ }).selectOption('東京都');
    await page.getByPlaceholder('新宿区').fill('渋谷区');
    await page.getByPlaceholder('西新宿1-1-1').fill('神南1-1-1');
    await page.getByPlaceholder('0312345679').fill('0312345678');

    // 4. フォーム送信
    await page.getByRole('button', { name: 'アカウント作成' }).click();

    // 5. 成功検証: ダッシュボード見出しに管理者ポータルが表示される
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
  });
});
