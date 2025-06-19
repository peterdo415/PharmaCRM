/**
 * メールアドレスバリデーションのテストファイル
 */

import {
  cleanEmail,
  validateEmailFormat,
  validateEmail,
  validateEmailForForm,
  validateMultipleEmails,
  extractEmailDomain,
  isCommonEmailProvider,
  prepareEmailForAuth
} from '../emailValidation';

describe('cleanEmail', () => {
  test('前後の空白を削除', () => {
    expect(cleanEmail('  test@example.com  ')).toBe('test@example.com');
  });

  test('全角スペースを削除', () => {
    expect(cleanEmail('test　@　example.com')).toBe('test@example.com');
  });

  test('タブと改行を削除', () => {
    expect(cleanEmail('test\t@\nexample.com')).toBe('test@example.com');
  });

  test('ゼロ幅スペースを削除', () => {
    expect(cleanEmail('test\u200B@\uFEFFexample.com')).toBe('test@example.com');
  });

  test('NFKC正規化（全角→半角）', () => {
    expect(cleanEmail('ｔｅｓｔ＠ｅｘａｍｐｌｅ．ｃｏｍ')).toBe('test@example.com');
  });

  test('大文字を小文字に変換', () => {
    expect(cleanEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
  });

  test('複合的なクリーニング', () => {
    expect(cleanEmail('  ＴＥＳＴ　＠　ＥＸＡＭＰＬＥ．ＣＯＭ  ')).toBe('test@example.com');
  });

  test('複雑な空白文字の組み合わせ', () => {
    expect(cleanEmail('test\u3000\t\n@\u200B\uFEFF example.com')).toBe('test@example.com');
  });
});

describe('validateEmailFormat', () => {
  test('正常なメールアドレス', () => {
    const result = validateEmailFormat('test@example.com');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('空文字の場合', () => {
    const result = validateEmailFormat('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('メールアドレスを入力してください');
  });

  test('@記号がない場合', () => {
    const result = validateEmailFormat('testexample.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('メールアドレスに@記号が含まれていません');
  });

  test('@記号が複数ある場合', () => {
    const result = validateEmailFormat('test@@example.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('@記号は1つである必要があります');
  });

  test('@記号の前に文字列がない場合', () => {
    const result = validateEmailFormat('@example.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('@記号の前に文字列が必要です');
  });

  test('@記号の後に文字列がない場合', () => {
    const result = validateEmailFormat('test@');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('@記号の後に文字列が必要です');
  });

  test('ドメイン部にドットがない場合', () => {
    const result = validateEmailFormat('test@example');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('ドメイン部分にドット(.)が含まれている必要があります');
  });

  test('連続するドットがある場合', () => {
    const result = validateEmailFormat('test@example..com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('ドメイン部分の形式が正しくありません');
  });

  test('TLDが1文字の場合', () => {
    const result = validateEmailFormat('test@example.c');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('トップレベルドメインは2文字以上である必要があります');
  });

  test('ローカル部が長すぎる場合', () => {
    const longLocal = 'a'.repeat(65);
    const result = validateEmailFormat(`${longLocal}@example.com`);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('@記号より前の部分は64文字以下である必要があります');
  });

  test('ドメイン部が長すぎる場合', () => {
    const longDomain = 'a'.repeat(250) + '.com';
    const result = validateEmailFormat(`test@${longDomain}`);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('ドメイン部分は253文字以下である必要があります');
  });

  test('全体が長すぎる場合', () => {
    const longEmail = 'a'.repeat(300) + '@' + 'b'.repeat(300) + '.com';
    const result = validateEmailFormat(longEmail);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('メールアドレスは320文字以下である必要があります');
  });
});

describe('validateEmail', () => {
  test('正常なメールアドレス（前処理あり）', () => {
    const result = validateEmail('  ＴＥＳＴ　＠　ＥＸＡＭＰＬＥ．ＣＯＭ  ');
    expect(result.isValid).toBe(true);
    expect(result.normalizedEmail).toBe('test@example.com');
    expect(result.error).toBeUndefined();
  });

  test('無効なメールアドレス', () => {
    const result = validateEmail('invalid-email');
    expect(result.isValid).toBe(false);
    expect(result.normalizedEmail).toBe('invalid-email');
    expect(result.error).toBe('メールアドレスに@記号が含まれていません');
  });

  test('非文字列の入力', () => {
    const result = validateEmail(null as any);
    expect(result.isValid).toBe(false);
    expect(result.normalizedEmail).toBe('');
    expect(result.error).toBe('メールアドレスは文字列である必要があります');
  });

  test('複雑な空白文字を含むメールアドレス', () => {
    const result = validateEmail('test\u3000\t\n@\u200B\uFEFF example.com');
    expect(result.isValid).toBe(true);
    expect(result.normalizedEmail).toBe('test@example.com');
  });
});

describe('validateEmailForForm', () => {
  test('正常なメールアドレス', () => {
    expect(validateEmailForForm('test@example.com')).toBe(true);
  });

  test('無効なメールアドレス', () => {
    expect(validateEmailForForm('invalid')).toBe('メールアドレスに@記号が含まれていません');
  });
});

describe('validateMultipleEmails', () => {
  test('複数のメールアドレスをバリデーション', () => {
    const emails = ['test1@example.com', 'invalid', 'ＴＥＳＴ２＠ＥＸＡＭＰＬＥ．ＣＯＭ'];
    const results = validateMultipleEmails(emails);
    
    expect(results).toHaveLength(3);
    expect(results[0].isValid).toBe(true);
    expect(results[1].isValid).toBe(false);
    expect(results[2].isValid).toBe(true);
    expect(results[2].normalizedEmail).toBe('test2@example.com');
  });
});

describe('extractEmailDomain', () => {
  test('正常なメールアドレスからドメインを抽出', () => {
    expect(extractEmailDomain('test@example.com')).toBe('example.com');
  });

  test('全角文字を含むメールアドレスからドメインを抽出', () => {
    expect(extractEmailDomain('ＴＥＳＴ＠ＥＸＡＭＰＬＥ．ＣＯＭ')).toBe('example.com');
  });

  test('無効なメールアドレスの場合はnullを返す', () => {
    expect(extractEmailDomain('invalid')).toBe(null);
  });
});

describe('isCommonEmailProvider', () => {
  test('一般的なプロバイダー', () => {
    expect(isCommonEmailProvider('test@gmail.com')).toBe(true);
    expect(isCommonEmailProvider('test@yahoo.co.jp')).toBe(true);
    expect(isCommonEmailProvider('test@outlook.com')).toBe(true);
  });

  test('一般的でないプロバイダー', () => {
    expect(isCommonEmailProvider('test@company.co.jp')).toBe(false);
    expect(isCommonEmailProvider('test@university.edu')).toBe(false);
  });

  test('無効なメールアドレス', () => {
    expect(isCommonEmailProvider('invalid')).toBe(false);
  });

  test('全角文字を含むメールアドレス', () => {
    expect(isCommonEmailProvider('ＴＥＳＴ＠ＧＭＡＩＬ．ＣＯＭ')).toBe(true);
  });
});

describe('prepareEmailForAuth', () => {
  test('認証用メールアドレスの前処理', () => {
    expect(prepareEmailForAuth('  ＴＥＳＴ　＠　ＧＭＡＩＬ．ＣＯＭ  ')).toBe('test@gmail.com');
  });

  test('複雑な空白文字の処理', () => {
    expect(prepareEmailForAuth('test\u3000\t\n@\u200B\uFEFF gmail.com')).toBe('test@gmail.com');
  });
});