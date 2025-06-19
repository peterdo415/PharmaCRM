/**
 * Supabaseで許可されているメールドメインの管理
 * 
 * 注意: この設定はフロントエンド側の参考情報です。
 * 実際の制限はSupabaseダッシュボードの設定で行われます。
 */

/**
 * Supabaseで許可されているメールドメインのリスト
 * Supabaseダッシュボードの設定と同期させる必要があります
 */
export const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  // 必要に応じて他のドメインも追加
  // 'yahoo.co.jp',
  // 'yahoo.com',
  // 'outlook.com',
  // 'hotmail.com',
  // 'icloud.com',
] as const;

/**
 * メールアドレスのドメインが許可されているかチェックする関数
 * @param email メールアドレス
 * @returns 許可されているドメインかどうか
 */
export function isAllowedEmailDomain(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) {
    return false;
  }

  const domain = email.substring(atIndex + 1).toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain as any);
}

/**
 * 許可されていないドメインの場合のエラーメッセージを生成
 * @param email メールアドレス
 * @returns エラーメッセージ
 */
export function getEmailDomainErrorMessage(email: string): string {
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) {
    return 'メールアドレスの形式が正しくありません';
  }

  const domain = email.substring(atIndex + 1);
  const allowedDomainsText = ALLOWED_EMAIL_DOMAINS.join(', ');
  
  return `${domain} は許可されていないドメインです。許可されているドメイン: ${allowedDomainsText}`;
}

/**
 * フォーム用のドメインバリデーション関数
 * @param email メールアドレス
 * @returns エラーメッセージまたはtrue
 */
export function validateEmailDomain(email: string): string | true {
  if (!email) {
    return 'メールアドレスを入力してください';
  }

  if (!isAllowedEmailDomain(email)) {
    return getEmailDomainErrorMessage(email);
  }

  return true;
}

/**
 * 許可されているドメインの一覧を取得
 * @returns 許可されているドメインの配列
 */
export function getAllowedDomains(): readonly string[] {
  return ALLOWED_EMAIL_DOMAINS;
}

/**
 * ユーザーフレンドリーなドメイン制限メッセージを生成
 * @returns ユーザー向けのメッセージ
 */
export function getDomainRestrictionMessage(): string {
  const domainsText = ALLOWED_EMAIL_DOMAINS.join(', ');
  return `現在、以下のメールドメインのみご利用いただけます: ${domainsText}`;
}