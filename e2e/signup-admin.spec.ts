import { test, expect } from '@playwright/test';

// 薬局管理者としての新規登録後にダッシュボードが表示されるかを確認するE2Eテスト

test('sign up as pharmacy admin shows dashboard', async ({ page }) => {
  // セッションをクリア
  await page.addInitScript(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  });

  await page.goto('/');

  // 新規登録フォームへ: 役割を最初に選択
  await page.getByRole('button', { name: '新規登録' }).click();
  await page.getByRole('button', { name: '薬局管理者' }).click();

  // 基本情報
  const uniqueEmail = `admin-${Date.now()}@gmail.com`;
  await page.getByRole('textbox', { name: /メールアドレス/ }).fill(uniqueEmail);
  await page.getByRole('textbox', { name: /パスワード$/ }).fill('password123');
  await page.getByRole('textbox', { name: /パスワード確認/ }).fill('password123');

  // 薬局情報（必須項目）
  await page.getByRole('textbox', { name: /薬局名/ }).fill('テスト薬局');
  await page.getByRole('combobox', { name: /都道府県/ }).selectOption('東京都');
  await page.getByRole('textbox', { name: /市区町村/ }).fill('渋谷区');
  await page.getByRole('textbox', { name: /住所/ }).fill('神南1-1-1');
  await page.getByRole('textbox', { name: /電話番号/ }).fill('0312345678');

  // フォーム送信
  await page.getByRole('button', { name: 'アカウント作成' }).click();

  // ダッシュボードが表示されることを確認
  await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
});
