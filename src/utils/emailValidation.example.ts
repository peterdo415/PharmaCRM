/**
 * メールアドレスバリデーションの使用例
 * cleanEmail関数ベースの実装
 */

import { 
  validateEmail, 
  validateEmailForForm, 
  validateMultipleEmails,
  extractEmailDomain,
  isCommonEmailProvider,
  prepareEmailForAuth,
  cleanEmail,
  EmailValidationResult 
} from './emailValidation';

// =============================================================================
// 1. Supabase認証での使用例（推奨パターン）
// =============================================================================

console.log('=== Supabase認証での使用例 ===');

async function signUpExample(formEmail: string, password: string) {
  // メールアドレスをクリーニング
  const emailToSend = prepareEmailForAuth(formEmail);
  
  console.log('入力されたメール:', formEmail);
  console.log('送信用メール:', emailToSend);
  
  // バリデーション
  const validation = validateEmail(formEmail);
  if (!validation.isValid) {
    console.error('バリデーションエラー:', validation.error);
    return;
  }
  
  // Supabase認証（実際のコード例）
  /*
  const { data, error } = await supabase.auth.signUp({
    email: emailToSend,
    password: password,
  });
  */
  
  console.log('認証処理を実行（サンプル）');
}

// テスト実行
await signUpExample('  ＴＥＳＴ　＠　ＧＭＡＩＬ．ＣＯＭ  ', 'password123');
console.log('---');

// =============================================================================
// 2. cleanEmail関数の詳細テスト
// =============================================================================

console.log('=== cleanEmail関数の詳細テスト ===');

const testCases = [
  '  test@example.com  ',           // 前後の空白
  'TEST@EXAMPLE.COM',               // 大文字
  'ｔｅｓｔ＠ｅｘａｍｐｌｅ．ｃｏｍ',     // 全角文字
  'test　@　example.com',           // 全角スペース
  'test\t@\nexample.com',          // タブと改行
  'test\u200B@\uFEFFexample.com',  // ゼロ幅スペース
  '  ＴＥＳＴ　＠　ＥＸＡＭＰＬＥ．ＣＯＭ  ', // 複合
];

testCases.forEach((testCase, index) => {
  const cleaned = cleanEmail(testCase);
  console.log(`${index + 1}. 入力: "${testCase}"`);
  console.log(`   結果: "${cleaned}"`);
  console.log('---');
});

// =============================================================================
// 3. React Hook Formでの使用例
// =============================================================================

console.log('=== React Hook Form での使用例 ===');

// useFormのvalidationRulesで使用
const formValidationRules = {
  email: {
    required: 'メールアドレスは必須です',
    validate: validateEmailForForm
  }
};

// カスタムバリデーション関数の例
function validateEmailWithCleaning(value: string): string | true {
  // まずクリーニングを実行
  const cleanedEmail = cleanEmail(value);
  
  // クリーニング後の値でバリデーション
  const result = validateEmail(cleanedEmail);
  
  if (!result.isValid) {
    return result.error || 'メールアドレスが正しくありません';
  }
  
  // 元の値とクリーニング後の値が大きく異なる場合の警告
  if (value !== cleanedEmail) {
    console.log(`メールアドレスが正規化されました: ${value} → ${cleanedEmail}`);
  }
  
  return true;
}

console.log('フォームバリデーション設定:', formValidationRules);
console.log('カスタムバリデーション例:', validateEmailWithCleaning('  ＴＥＳＴ＠ＧＭＡＩＬ．ＣＯＭ  '));
console.log('---');

// =============================================================================
// 4. 複数メールアドレスの一括処理
// =============================================================================

console.log('=== 複数メールアドレスの一括処理 ===');

const emailList = [
  'test@example.com',
  '  ＵＳＥＲ　＠　ＹＡＨＯＯ．ＣＯ．ＪＰ  ',
  'invalid-email',
  'admin\t@\ncompany.co.jp',
  'CONTACT@GMAIL.COM'
];

console.log('入力メールアドレス一覧:');
emailList.forEach((email, index) => {
  console.log(`${index + 1}. "${email}"`);
});

console.log('\nバリデーション結果:');
const multipleResults = validateMultipleEmails(emailList);

multipleResults.forEach((result, index) => {
  console.log(`${index + 1}. 入力: "${emailList[index]}"`);
  console.log(`   正規化: "${result.normalizedEmail}"`);
  console.log(`   有効: ${result.isValid}`);
  if (result.error) {
    console.log(`   エラー: ${result.error}`);
  }
  console.log('---');
});

// =============================================================================
// 5. 実用的なヘルパー関数の例
// =============================================================================

console.log('=== 実用的なヘルパー関数の例 ===');

/**
 * フォーム送信前の最終チェック関数
 */
function validateAndPrepareEmail(inputEmail: string): {
  isValid: boolean;
  preparedEmail: string;
  error?: string;
  wasNormalized: boolean;
} {
  // バリデーション実行
  const validation = validateEmail(inputEmail);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      preparedEmail: '',
      error: validation.error,
      wasNormalized: false
    };
  }
  
  // 認証用に準備
  const preparedEmail = prepareEmailForAuth(inputEmail);
  
  return {
    isValid: true,
    preparedEmail,
    wasNormalized: inputEmail !== preparedEmail
  };
}

/**
 * メールアドレスの統計情報を取得する関数
 */
function getEmailStatistics(emails: string[]): {
  total: number;
  valid: number;
  invalid: number;
  normalized: number;
  commonProviders: number;
} {
  const results = validateMultipleEmails(emails);
  
  const stats = {
    total: emails.length,
    valid: 0,
    invalid: 0,
    normalized: 0,
    commonProviders: 0
  };
  
  results.forEach((result, index) => {
    if (result.isValid) {
      stats.valid++;
      
      // 正規化されたかチェック
      if (cleanEmail(emails[index]) !== emails[index]) {
        stats.normalized++;
      }
      
      // 一般的なプロバイダーかチェック
      if (isCommonEmailProvider(result.normalizedEmail)) {
        stats.commonProviders++;
      }
    } else {
      stats.invalid++;
    }
  });
  
  return stats;
}

// ヘルパー関数のテスト
const testEmails = [
  'test@gmail.com',
  '  ＵＳＥＲ＠ＹＡＨＯＯ．ＣＯ．ＪＰ  ',
  'invalid',
  'admin@company.co.jp',
  'CONTACT　@　OUTLOOK.COM'
];

console.log('フォーム送信前チェックの例:');
testEmails.forEach(email => {
  const result = validateAndPrepareEmail(email);
  console.log(`入力: "${email}"`);
  console.log(`結果: ${result.isValid ? '有効' : '無効'}`);
  if (result.isValid) {
    console.log(`準備済み: "${result.preparedEmail}"`);
    console.log(`正規化: ${result.wasNormalized ? 'あり' : 'なし'}`);
  } else {
    console.log(`エラー: ${result.error}`);
  }
  console.log('---');
});

const statistics = getEmailStatistics(testEmails);
console.log('メールアドレス統計:');
console.log(`総数: ${statistics.total}`);
console.log(`有効: ${statistics.valid}`);
console.log(`無効: ${statistics.invalid}`);
console.log(`正規化済み: ${statistics.normalized}`);
console.log(`一般的なプロバイダー: ${statistics.commonProviders}`);

// =============================================================================
// 6. パフォーマンス比較
// =============================================================================

console.log('=== パフォーマンス比較 ===');

function performanceComparison() {
  const testEmail = '  ＴＥＳＴ＠ＧＭＡＩＬ．ＣＯＭ  ';
  const iterations = 10000;
  
  console.log(`${iterations}回のバリデーション実行...`);
  
  // cleanEmail + validateEmailFormat の組み合わせ
  const startTime1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    validateEmail(testEmail);
  }
  const endTime1 = performance.now();
  
  // cleanEmail単体
  const startTime2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    cleanEmail(testEmail);
  }
  const endTime2 = performance.now();
  
  console.log(`validateEmail: ${(endTime1 - startTime1).toFixed(2)}ms`);
  console.log(`cleanEmail単体: ${(endTime2 - startTime2).toFixed(2)}ms`);
  console.log(`1回あたりの平均時間（validateEmail）: ${((endTime1 - startTime1) / iterations).toFixed(4)}ms`);
}

// パフォーマンステスト実行（ブラウザ環境でのみ）
if (typeof performance !== 'undefined') {
  performanceComparison();
} else {
  console.log('パフォーマンステストはブラウザ環境でのみ実行可能です');
}

export {
  validateAndPrepareEmail,
  getEmailStatistics,
  validateEmailWithCleaning
};