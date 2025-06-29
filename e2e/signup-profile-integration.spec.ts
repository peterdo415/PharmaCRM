/*
 * 使い方:
 * 1. アプリケーションを起動: npm run dev
 * 2. このテストファイルを実行: npx playwright test e2e/signup-profile-integration.spec.ts
 * 
 * このテストでは以下を確認します:
 * - 新規登録フローの動作確認（薬剤師・管理者両方）
 * - 新規登録後のダッシュボード遷移
 * - プロフィールページへのアクセス
 * - プロフィールコンポーネントでのエラーが出ないか確認
 * - profilesテーブル削除後の動作確認（user_roles + pharmacists/pharmacies テーブル使用）
 * 
 * データ構造:
 * - auth.users: Supabase認証テーブル
 * - user_roles: ユーザー役割管理（role, pharmacy_id含む）
 * - pharmacists: 薬剤師詳細情報（pharmacy_id は nullable）
 * - pharmacies: 薬局情報
 * 
 * 注意事項:
 * - Supabaseが正常に動作している必要があります
 * - メール確認が必要な設定の場合、手動で確認する必要があります
 * - テスト用のメールアドレスは自動生成されます
 */

import { test, expect } from '@playwright/test';

// 共通のセットアップ関数
const setupCleanSession = async (page) => {
  // 既存のセッションをクリア
  await page.addInitScript(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  });
};

// 薬剤師用の登録フロー
const fillPharmacistSignupForm = async (page, email: string) => {
  // 役割選択
  await page.getByRole('button', { name: '薬剤師' }).click();

  // 基本情報
  await page.getByRole('textbox', { name: /メールアドレス/ }).fill(email);
  await page.getByRole('textbox', { name: /パスワード$/ }).fill('password123');
  await page.getByRole('textbox', { name: /パスワード確認/ }).fill('password123');

  // 個人情報
  await page.getByRole('textbox', { name: '姓' }).fill('田中');
  await page.getByRole('textbox', { name: '名' }).fill('太郎');
  await page.getByRole('textbox', { name: '姓（カナ）' }).fill('タナカ');
  await page.getByRole('textbox', { name: '名（カナ）' }).fill('タロウ');

  // 生年月日
  await page.getByLabel('生年月日').locator('select').nth(0).selectOption('1990');
  await page.getByLabel('生年月日').locator('select').nth(1).selectOption('1');
  await page.getByLabel('生年月日').locator('select').nth(2).selectOption('1');
  await page.getByRole('combobox', { name: /性別/ }).selectOption('male');

  // 連絡先
  await page.getByRole('textbox', { name: /携帯電話番号/ }).fill('09012345678');
  await page.getByRole('textbox', { name: /固定電話番号/ }).fill('0312345678');

  // 住所情報
  await page.getByRole('textbox', { name: /郵便番号/ }).fill('1600023');
  await page.getByRole('combobox', { name: /都道府県/ }).selectOption('東京都');
  await page.getByRole('textbox', { name: /市区町村/ }).fill('新宿区');
  await page.getByRole('textbox', { name: /住所/ }).fill('西新宿1-1-1');
  await page.getByRole('textbox', { name: /最寄り駅/ }).fill('新宿駅');
  await page.getByRole('textbox', { name: /交通手段/ }).fill('電車');

  // 薬剤師情報
  await page.getByRole('textbox', { name: /薬剤師免許番号/ }).fill('第123456号');
  await page.getByLabel('免許取得日').locator('select').nth(0).selectOption('2015');
  await page.getByLabel('免許取得日').locator('select').nth(1).selectOption('1');
  await page.getByLabel('免許取得日').locator('select').nth(2).selectOption('1');
  await page.getByRole('spinbutton', { name: /総経験年数/ }).fill('5');

  // 緊急連絡先
  await page.getByRole('textbox', { name: /緊急連絡先氏名/ }).fill('田中花子');
  await page.getByRole('textbox', { name: /緊急連絡先電話番号/ }).fill('09087654321');
  await page.getByRole('combobox', { name: /続柄/ }).selectOption('妻');
};

// 薬局管理者用の登録フロー
const fillAdminSignupForm = async (page, email: string) => {
  // 役割選択
  await page.getByRole('button', { name: '薬局管理者' }).click();

  // 基本情報
  await page.getByRole('textbox', { name: /メールアドレス/ }).fill(email);
  await page.getByRole('textbox', { name: /パスワード$/ }).fill('password123');
  await page.getByRole('textbox', { name: /パスワード確認/ }).fill('password123');

  // 薬局情報
  await page.getByRole('textbox', { name: /薬局名/ }).fill('テスト薬局');
  await page.getByRole('textbox', { name: /郵便番号/ }).fill('1600023');
  await page.getByRole('combobox', { name: /都道府県/ }).selectOption('東京都');
  await page.getByRole('textbox', { name: /市区町村/ }).fill('新宿区');
  await page.getByRole('textbox', { name: /住所/ }).fill('西新宿2-2-2');
  await page.getByRole('textbox', { name: /電話番号/ }).fill('0312345678');
  await page.getByRole('textbox', { name: /FAX番号/ }).fill('0312345679');
  await page.getByRole('textbox', { name: /薬局メールアドレス/ }).fill('pharmacy@test.com');
  await page.getByRole('textbox', { name: /薬局免許番号/ }).fill('東保第12345号');
};

test.describe('新規登録とプロフィール統合テスト（user_roles + pharmacists/pharmacies構成）', () => {
  test.beforeEach(async ({ page }) => {
    await setupCleanSession(page);
    await page.goto('/');
  });

  test('薬剤師の新規登録からプロフィール確認まで', async ({ page }) => {
    // 新規登録ページに遷移
    await page.getByRole('button', { name: '新規登録' }).click();
    
    // フォーム入力
    const uniqueEmail = `pharmacist-${Date.now()}@gmail.com`;
    await fillPharmacistSignupForm(page, uniqueEmail);

    // フォーム送信
    await page.getByRole('button', { name: 'アカウント作成' }).click();

    // ダッシュボードへの遷移を確認
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('薬剤師ポータル')).toBeVisible();

    // ヘッダーにユーザー情報が表示されていることを確認（薬剤師の場合、pharmacistsテーブルから取得）
    await expect(page.locator('header')).toContainText('田中 太郎');

    // プロフィールページに遷移
    await page.getByRole('link', { name: 'プロフィール' }).click();
    
    // プロフィールページが正常に表示されることを確認
    await expect(page.getByRole('heading', { name: 'プロフィール' })).toBeVisible();
    
    // エラーメッセージが表示されていないことを確認
    await expect(page.locator('.text-red-600')).not.toBeVisible();
    
    // 基本情報が正しく表示されていることを確認（pharmacistsテーブルから取得）
    await expect(page.getByText('田中 太郎')).toBeVisible();
    await expect(page.getByText('第123456号')).toBeVisible();
    
    // メールアドレスはauth.usersから取得されるため表示される
    await expect(page.getByText(uniqueEmail)).toBeVisible();
    
    // 保存ボタンが表示されていることを確認（常時編集可能）
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
  });

  test('薬局管理者の新規登録からプロフィール確認まで', async ({ page }) => {
    // 新規登録ページに遷移
    await page.getByRole('button', { name: '新規登録' }).click();
    
    // フォーム入力
    const uniqueEmail = `admin-${Date.now()}@gmail.com`;
    await fillAdminSignupForm(page, uniqueEmail);

    // フォーム送信
    await page.getByRole('button', { name: 'アカウント作成' }).click();

    // ダッシュボードへの遷移を確認
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('薬局CRMシステムの管理画面')).toBeVisible();

    // 管理者用のクイックアクションが表示されていることを確認（user_rolesで役割判定）
    await expect(page.getByText('クイックアクション')).toBeVisible();
    await expect(page.getByText('薬剤師管理')).toBeVisible();

    // プロフィールページに遷移
    await page.getByRole('link', { name: 'プロフィール' }).click();
    
    // プロフィールページが正常に表示されることを確認
    await expect(page.getByRole('heading', { name: '管理者プロフィール' })).toBeVisible();
    
    // エラーメッセージが表示されていないことを確認
    await expect(page.locator('.text-red-600')).not.toBeVisible();
    
    // 基本情報が正しく表示されていることを確認（user_rolesから取得）
    await expect(page.getByText(uniqueEmail)).toBeVisible();
    await expect(page.getByText('薬局管理者')).toBeVisible();
    
    // 所属薬局情報が表示されていることを確認（pharmaciesテーブルから取得）
    await expect(page.getByText('所属薬局情報')).toBeVisible();
    await expect(page.getByText('テスト薬局')).toBeVisible();
    await expect(page.getByText('東京都 新宿区')).toBeVisible();
    
    // 保存ボタンが表示されていることを確認（常時編集可能）
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
  });

  test('プロフィール編集機能の確認（管理者）', async ({ page }) => {
    // 新規登録フロー（管理者）
    await page.getByRole('button', { name: '新規登録' }).click();
    const uniqueEmail = `admin-edit-${Date.now()}@gmail.com`;
    await fillAdminSignupForm(page, uniqueEmail);
    await page.getByRole('button', { name: 'アカウント作成' }).click();
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible({ timeout: 10000 });

    // プロフィールページに遷移
    await page.getByRole('link', { name: 'プロフィール' }).click();
    await expect(page.getByRole('heading', { name: '管理者プロフィール' })).toBeVisible();

    // フォームがデフォルトで編集可能であることを確認
    const emailInput = page.getByRole('textbox', { name: /メールアドレス/ });
    await expect(emailInput).not.toBeDisabled();
    
    // 保存ボタンが表示されていることを確認
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
    
    // 保存をクリック（実際には変更なし）
    await page.getByRole('button', { name: '保存' }).click();
    
    // 成功メッセージが表示されることを確認
    await expect(page.getByText('プロフィールが正常に更新されました')).toBeVisible();
  });

  test('認証状態の確認とセッション管理（profilesテーブルなし）', async ({ page }) => {
    // 新規登録フロー（薬剤師）
    await page.getByRole('button', { name: '新規登録' }).click();
    const uniqueEmail = `session-${Date.now()}@gmail.com`;
    await fillPharmacistSignupForm(page, uniqueEmail);
    await page.getByRole('button', { name: 'アカウント作成' }).click();
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible({ timeout: 10000 });

    // ページをリロードしてもログイン状態が保持されることを確認
    await page.reload();
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
    
    // プロフィールページに遷移してエラーが出ないことを確認（profilesテーブルなしでも動作）
    await page.getByRole('link', { name: 'プロフィール' }).click();
    await expect(page.getByRole('heading', { name: 'プロフィール' })).toBeVisible();
    
    // ユーザー情報が正しく取得できていることを確認（user_roles + pharmacistsから構成）
    await expect(page.getByText('田中 太郎')).toBeVisible();
    
    // ログアウト機能の確認
    await page.getByRole('button', { name: 'ログアウト' }).click();
    
    // ログイン画面に戻ることを確認
    await expect(page.getByRole('heading', { name: 'PharmaCRM' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  });

  test('エラーハンドリングの確認', async ({ page }) => {
    // 新規登録ページに遷移
    await page.getByRole('button', { name: '新規登録' }).click();
    
    // 役割選択せずにフォーム送信を試行
    await page.getByRole('button', { name: 'アカウント作成' }).click();
    
    // バリデーションエラーが表示されることを確認
    await expect(page.getByText('役割を選択してください')).toBeVisible();
    
    // 薬剤師を選択してから必須項目なしで送信
    await page.getByRole('button', { name: '薬剤師' }).click();
    await page.getByRole('button', { name: 'アカウント作成' }).click();
    
    // 必須項目のエラーが表示されることを確認
    await expect(page.getByText('メールアドレスを入力してください')).toBeVisible();
  });

  test('ナビゲーションとページ遷移の確認', async ({ page }) => {
    // 新規登録フロー（管理者）
    await page.getByRole('button', { name: '新規登録' }).click();
    const uniqueEmail = `nav-${Date.now()}@gmail.com`;
    await fillAdminSignupForm(page, uniqueEmail);
    await page.getByRole('button', { name: 'アカウント作成' }).click();
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible({ timeout: 10000 });

    // 各ページへの遷移を確認
    await page.getByRole('link', { name: '薬剤師管理' }).click();
    await expect(page.getByRole('heading', { name: '薬剤師管理' })).toBeVisible();
    
    await page.getByRole('link', { name: 'ダッシュボード' }).click();
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
    
    await page.getByRole('link', { name: 'プロフィール' }).click();
    await expect(page.getByRole('heading', { name: '管理者プロフィール' })).toBeVisible();
    
    // パンくずナビゲーションが表示されていることを確認
    await expect(page.locator('nav[aria-label="breadcrumb"]')).toBeVisible();
  });

  test('データベース構造の確認: profiles テーブルなしでの動作', async ({ page }) => {
    // 薬剤師登録フロー
    await page.getByRole('button', { name: '新規登録' }).click();
    const uniqueEmail = `db-test-${Date.now()}@gmail.com`;
    await fillPharmacistSignupForm(page, uniqueEmail);
    await page.getByRole('button', { name: 'アカウント作成' }).click();
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible({ timeout: 10000 });

    // プロフィールページに遷移
    await page.getByRole('link', { name: 'プロフィール' }).click();
    await expect(page.getByRole('heading', { name: 'プロフィール' })).toBeVisible();

    // profiles テーブルを参照していないことを確認（エラーが出ないこと）
    await expect(page.locator('.text-red-600')).not.toBeVisible();
    
    // 実際にデータが取得できていることを確認
    // - user_roles テーブルから role が取得されている
    // - pharmacists テーブルから詳細情報が取得されている
    // - auth.users からメールアドレスが取得されている
    await expect(page.getByText('田中 太郎')).toBeVisible();
    await expect(page.getByText('第123456号')).toBeVisible();
    await expect(page.getByText('男性')).toBeVisible();
    await expect(page.getByText('09012345678')).toBeVisible();
    await expect(page.getByText('東京都')).toBeVisible();
    await expect(page.getByText('新宿区')).toBeVisible();
    await expect(page.getByText('5')).toBeVisible(); // 経験年数

    // 編集機能が正常に動作することを確認（デフォルトで編集可能）
    await expect(page.getByRole('textbox', { name: '姓' })).not.toBeDisabled();
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
  });

  test('管理者のpharmacy_id連携確認', async ({ page }) => {
    // 管理者登録フロー
    await page.getByRole('button', { name: '新規登録' }).click();
    const uniqueEmail = `admin-pharmacy-${Date.now()}@gmail.com`;
    await fillAdminSignupForm(page, uniqueEmail);
    await page.getByRole('button', { name: 'アカウント作成' }).click();
    await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible({ timeout: 10000 });

    // プロフィールページで薬局情報が正しく表示されることを確認
    await page.getByRole('link', { name: 'プロフィール' }).click();
    await expect(page.getByRole('heading', { name: '管理者プロフィール' })).toBeVisible();
    
    // user_roles テーブルの pharmacy_id が pharmacies テーブルと正しく連携していることを確認
    await expect(page.getByText('テスト薬局')).toBeVisible();
    await expect(page.getByText('東京都 新宿区')).toBeVisible();
    await expect(page.getByText('西新宿2-2-2')).toBeVisible();
    await expect(page.getByText('0312345678')).toBeVisible();
    
    // profiles テーブルを使わずに薬局情報が取得できていることを確認
    await expect(page.locator('.text-red-600')).not.toBeVisible();
  });
});