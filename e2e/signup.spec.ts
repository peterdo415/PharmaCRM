import { test, expect } from '@playwright/test';

// 新規登録後にダッシュボードへ遷移するかを確認するE2Eテスト。
// アプリが `npm run dev` で起動していることを前提としています。

test('sign up redirects to dashboard', async ({ page }) => {
  // Ensure no previous session interferes with the signup flow
  await page.addInitScript(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  });

  await page.goto('/');

  // switch to sign up form and select role first
  await page.getByRole('button', { name: '新規登録' }).click();
  await page.getByRole('button', { name: '薬剤師' }).click();

  // 基本情報
  const uniqueEmail = `test-${Date.now()}@gmail.com`;
  await page.getByRole('textbox', { name: /メールアドレス/ }).fill(uniqueEmail);
  await page.getByRole('textbox', { name: /パスワード$/ }).fill('password123');
  await page.getByRole('textbox', { name: /パスワード確認/ }).fill('password123');

  // 必須項目の入力
  await page.getByRole('textbox', { name: '姓' }).fill('田中');
  await page.getByRole('textbox', { name: '名' }).fill('一郎');

  await page.getByLabel('生年月日').locator('select').nth(0).selectOption('1990');
  await page.getByLabel('生年月日').locator('select').nth(1).selectOption('1');
  await page.getByLabel('生年月日').locator('select').nth(2).selectOption('1');
  await page.getByRole('combobox', { name: /性別/ }).selectOption('male');
  await page.getByRole('textbox', { name: /携帯電話番号/ }).fill('09012345678');

  // 住所情報
  await page.getByRole('textbox', { name: /郵便番号/ }).fill('1600023');
  await page.getByRole('combobox', { name: /都道府県/ }).selectOption('東京都');
  await page.getByRole('textbox', { name: /市区町村/ }).fill('新宿区');
  await page.getByRole('textbox', { name: /住所/ }).fill('西新宿1-1-1');

  // 薬剤師情報
  await page.getByRole('textbox', { name: /薬剤師免許番号/ }).fill('123456');
  await page.getByLabel('免許取得日').locator('select').nth(0).selectOption('2015');
  await page.getByLabel('免許取得日').locator('select').nth(1).selectOption('1');
  await page.getByLabel('免許取得日').locator('select').nth(2).selectOption('1');
  await page.getByRole('spinbutton', { name: /総経験年数/ }).fill('5');

  // フォーム送信
  await page.getByRole('button', { name: 'アカウント作成' }).click();

  // expect dashboard heading
  await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
});
