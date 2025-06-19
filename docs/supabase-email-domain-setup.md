# Supabaseメールドメイン設定ガイド

## 概要
Supabaseの認証設定でメールアドレスのドメインを制限し、gmail.comを許可ドメインに追加する手順です。

## 設定手順

### 1. Supabaseダッシュボードにアクセス
1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. 対象のプロジェクトを選択

### 2. 認証設定の変更
1. 左サイドバーから **Authentication** を選択
2. **Settings** タブをクリック
3. **Email** セクションを探す

### 3. メールドメイン制限の設定
1. **Email domain restrictions** セクションを見つける
2. **Enable email domain restrictions** を有効にする
3. **Allowed domains** フィールドに以下を追加：
   ```
   gmail.com
   ```

### 4. 追加の推奨ドメイン（必要に応じて）
一般的なメールプロバイダーも許可する場合：
```
gmail.com
yahoo.co.jp
yahoo.com
outlook.com
hotmail.com
icloud.com
```

### 5. 設定の保存
1. **Save** ボタンをクリックして設定を保存
2. 設定が反映されるまで数分待つ

## 設定後の動作

### 許可されるメールアドレス
- `user@gmail.com` ✅
- `test.user@gmail.com` ✅
- `user+tag@gmail.com` ✅

### 拒否されるメールアドレス
- `user@yahoo.com` ❌ (yahoo.comが許可リストにない場合)
- `user@company.co.jp` ❌ (企業ドメイン)
- `user@example.com` ❌ (その他のドメイン)

## 注意事項

### 1. 既存ユーザーへの影響
- 既にサインアップ済みのユーザーは影響を受けません
- 新規サインアップのみが制限されます

### 2. パスワードリセット
- 許可されていないドメインのユーザーはパスワードリセットができなくなります
- 既存ユーザーの場合は事前に通知が必要です

### 3. 管理者アカウント
- 管理者用のメールアドレスも許可ドメインに含める必要があります
- 設定前に管理者のドメインを確認してください

## トラブルシューティング

### エラー: "Email domain not allowed"
**原因**: 入力されたメールアドレスのドメインが許可リストにない

**解決方法**:
1. 許可ドメインリストを確認
2. 必要に応じてドメインを追加
3. ユーザーに許可されたドメインのメールアドレス使用を案内

### 設定が反映されない
**原因**: 設定変更の反映に時間がかかる場合がある

**解決方法**:
1. 5-10分待ってから再試行
2. ブラウザのキャッシュをクリア
3. Supabaseダッシュボードで設定を再確認

## 開発環境での確認

### 1. フロントエンドでの確認
```typescript
// src/utils/emailValidation.ts の isCommonEmailProvider 関数で
// gmail.com が含まれていることを確認
export function isCommonEmailProvider(email: string): boolean {
  const domain = extractEmailDomain(email);
  if (!domain) return false;

  const commonProviders = [
    'gmail.com', // ← 含まれていることを確認
    'yahoo.co.jp',
    'yahoo.com',
    // ...
  ];

  return commonProviders.includes(domain.toLowerCase());
}
```

### 2. サインアップテスト
```typescript
// テスト用のメールアドレス
const testEmails = [
  'test@gmail.com',        // ✅ 許可される
  'user@yahoo.com',        // ❌ 許可されない（設定による）
  'admin@company.co.jp'    // ❌ 許可されない
];

// 各メールアドレスでサインアップを試行
testEmails.forEach(async (email) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: 'testpassword123'
    });
    
    if (error) {
      console.log(`${email}: エラー - ${error.message}`);
    } else {
      console.log(`${email}: 成功`);
    }
  } catch (err) {
    console.log(`${email}: 例外 - ${err.message}`);
  }
});
```

## 設定完了後のチェックリスト

- [ ] Supabaseダッシュボードで設定を確認
- [ ] gmail.comが許可ドメインリストに含まれている
- [ ] 設定が保存されている
- [ ] テスト用のgmail.comアドレスでサインアップを試行
- [ ] 許可されていないドメインでサインアップが拒否されることを確認
- [ ] フロントエンドのバリデーション関数が適切に動作することを確認

## 関連ファイル

- `src/utils/emailValidation.ts` - メールバリデーション関数
- `src/components/auth/LoginForm.tsx` - ログインフォーム
- `src/components/auth/SignUpForm.tsx` - サインアップフォーム
- `src/lib/auth.ts` - 認証サービス

## 参考リンク

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Domain Restrictions](https://supabase.com/docs/guides/auth/auth-email#email-domain-restrictions)