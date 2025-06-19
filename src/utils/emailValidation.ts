/**
 * メールアドレスバリデーションユーティリティ
 * 
 * 機能:
 * 1. 入力値の前処理（trim、空白除去、正規化）
 * 2. メールアドレスのフォーマット検証
 * 3. Supabaseドメイン制限の確認
 * 4. 詳細なエラーメッセージの提供
 */

import { isAllowedEmailDomain, getEmailDomainErrorMessage } from './supabaseEmailDomains';

export interface EmailValidationResult {
  isValid: boolean;
  normalizedEmail: string;
  error?: string;
}

/**
 * メールアドレスのクリーニング処理
 * 全角スペースやタブ・改行を含むすべての空白類を除去し、正規化を行う
 * @param input 入力されたメールアドレス
 * @returns クリーニング済みのメールアドレス
 */
function cleanEmail(input: string): string {
  return input
    .trim()
    // 全角スペースやタブ・改行を含むすべての空白類を除去
    .replace(/[\s\u3000\u200B\uFEFF]+/g, '')
    // 可能なら正規化（半角・全角の違いを吸収）
    .normalize('NFKC')
    // 大文字を小文字に変換
    .toLowerCase();
}

/**
 * メールアドレスのフォーマット検証を行う関数
 * @param email 検証対象のメールアドレス
 * @returns 検証結果の詳細情報
 */
export function validateEmailFormat(email: string): { isValid: boolean; error?: string } {
  // 空文字チェック
  if (!email) {
    return {
      isValid: false,
      error: 'メールアドレスを入力してください'
    };
  }

  // @記号の存在チェック
  if (!email.includes('@')) {
    return {
      isValid: false,
      error: 'メールアドレスに@記号が含まれていません'
    };
  }

  // @記号の数チェック
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) {
    return {
      isValid: false,
      error: '@記号は1つである必要があります'
    };
  }

  // @記号で分割
  const [localPart, domainPart] = email.split('@');

  // ローカル部（@より前）のチェック
  if (!localPart || localPart.length === 0) {
    return {
      isValid: false,
      error: '@記号の前に文字列が必要です'
    };
  }

  // ドメイン部（@より後）のチェック
  if (!domainPart || domainPart.length === 0) {
    return {
      isValid: false,
      error: '@記号の後に文字列が必要です'
    };
  }

  // ドメイン部にドット(.)が含まれているかチェック
  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      error: 'ドメイン部分にドット(.)が含まれている必要があります'
    };
  }

  // ドメイン部の詳細チェック
  const domainParts = domainPart.split('.');
  
  // 空の部分がないかチェック（連続するドットや先頭・末尾のドット）
  if (domainParts.some(part => part.length === 0)) {
    return {
      isValid: false,
      error: 'ドメイン部分の形式が正しくありません'
    };
  }

  // 最後の部分（TLD）が2文字以上かチェック
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return {
      isValid: false,
      error: 'トップレベルドメインは2文字以上である必要があります'
    };
  }

  // 基本的な文字チェック（英数字、ハイフン、ドット、アンダースコア、プラス）
  const validEmailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!validEmailRegex.test(email)) {
    return {
      isValid: false,
      error: 'メールアドレスの形式が正しくありません'
    };
  }

  // ローカル部の長さチェック（64文字以下）
  if (localPart.length > 64) {
    return {
      isValid: false,
      error: '@記号より前の部分は64文字以下である必要があります'
    };
  }

  // ドメイン部の長さチェック（253文字以下）
  if (domainPart.length > 253) {
    return {
      isValid: false,
      error: 'ドメイン部分は253文字以下である必要があります'
    };
  }

  // 全体の長さチェック（320文字以下）
  if (email.length > 320) {
    return {
      isValid: false,
      error: 'メールアドレスは320文字以下である必要があります'
    };
  }

  return { isValid: true };
}

/**
 * メールアドレスの包括的なバリデーション関数
 * 前処理、フォーマット検証、ドメイン制限チェックを組み合わせて実行
 * @param email 入力されたメールアドレス
 * @param checkDomainRestriction ドメイン制限をチェックするかどうか（デフォルト: true）
 * @returns バリデーション結果
 */
export function validateEmail(email: string, checkDomainRestriction: boolean = true): EmailValidationResult {
  try {
    // 型チェック
    if (typeof email !== 'string') {
      return {
        isValid: false,
        normalizedEmail: '',
        error: 'メールアドレスは文字列である必要があります'
      };
    }

    // 1. 前処理（cleanEmail関数を使用）
    const normalizedEmail = cleanEmail(email);

    // 2. フォーマット検証
    const formatValidation = validateEmailFormat(normalizedEmail);
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        normalizedEmail,
        error: formatValidation.error
      };
    }

    // 3. ドメイン制限チェック（オプション）
    if (checkDomainRestriction && !isAllowedEmailDomain(normalizedEmail)) {
      return {
        isValid: false,
        normalizedEmail,
        error: getEmailDomainErrorMessage(normalizedEmail)
      };
    }

    return {
      isValid: true,
      normalizedEmail
    };
  } catch (error) {
    return {
      isValid: false,
      normalizedEmail: '',
      error: 'メールアドレスの検証中にエラーが発生しました'
    };
  }
}

/**
 * React Hook Form用のバリデーション関数
 * @param value 入力値
 * @param checkDomainRestriction ドメイン制限をチェックするかどうか（デフォルト: true）
 * @returns エラーメッセージまたはtrue
 */
export function validateEmailForForm(value: string, checkDomainRestriction: boolean = true): string | true {
  const result = validateEmail(value, checkDomainRestriction);
  return result.isValid ? true : (result.error || 'メールアドレスが正しくありません');
}

/**
 * 複数のメールアドレスを一括でバリデーションする関数
 * @param emails メールアドレスの配列
 * @param checkDomainRestriction ドメイン制限をチェックするかどうか（デフォルト: true）
 * @returns バリデーション結果の配列
 */
export function validateMultipleEmails(emails: string[], checkDomainRestriction: boolean = true): EmailValidationResult[] {
  return emails.map(email => validateEmail(email, checkDomainRestriction));
}

/**
 * メールアドレスのドメイン部分を取得する関数
 * @param email メールアドレス
 * @returns ドメイン部分（無効な場合はnull）
 */
export function extractEmailDomain(email: string): string | null {
  const result = validateEmail(email, false); // ドメイン制限チェックなし
  if (!result.isValid) {
    return null;
  }
  
  const atIndex = result.normalizedEmail.indexOf('@');
  return atIndex !== -1 ? result.normalizedEmail.substring(atIndex + 1) : null;
}

/**
 * 一般的なメールプロバイダーかどうかを判定する関数
 * @param email メールアドレス
 * @returns 一般的なプロバイダーかどうか
 */
export function isCommonEmailProvider(email: string): boolean {
  const domain = extractEmailDomain(email);
  if (!domain) return false;

  const commonProviders = [
    'gmail.com',
    'yahoo.co.jp',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'live.com',
    'msn.com',
    'docomo.ne.jp',
    'ezweb.ne.jp',
    'softbank.ne.jp',
    'au.com',
    'i.softbank.jp'
  ];

  return commonProviders.includes(domain.toLowerCase());
}

/**
 * Supabase認証用のメールアドレス前処理関数
 * サインアップ・サインイン時に使用
 * @param email 入力されたメールアドレス
 * @returns クリーニング済みのメールアドレス
 */
export function prepareEmailForAuth(email: string): string {
  return cleanEmail(email);
}

// cleanEmail関数をエクスポート（直接使用したい場合）
export { cleanEmail };