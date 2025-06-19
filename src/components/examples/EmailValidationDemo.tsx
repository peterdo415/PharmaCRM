import React, { useState } from 'react';
import { EmailInput } from '../ui/EmailInput';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  validateEmail, 
  validateMultipleEmails, 
  isCommonEmailProvider,
  EmailValidationResult 
} from '../../utils/emailValidation';
import { CheckCircle, AlertCircle, Mail, Users } from 'lucide-react';

export const EmailValidationDemo: React.FC = () => {
  const [singleEmail, setSingleEmail] = useState('');
  const [singleEmailResult, setSingleEmailResult] = useState<EmailValidationResult | null>(null);
  const [multipleEmails, setMultipleEmails] = useState('');
  const [multipleEmailsResults, setMultipleEmailsResults] = useState<EmailValidationResult[]>([]);

  // テスト用のサンプルメールアドレス
  const testEmails = [
    'test@example.com',
    'ＴＥＳＴ＠ＧＭＡＩＬ．ＣＯＭ', // 全角文字
    '  user@yahoo.co.jp  ', // 前後に空白
    'invalid-email', // 無効
    'user@', // @の後が空
    '@domain.com', // @の前が空
    'user@domain', // ドットなし
    'user name@domain.com', // 空白文字含む
    'test@gmail.com', // 一般的なプロバイダー
    'business@company.co.jp' // 企業ドメイン
  ];

  const handleSingleEmailValidation = () => {
    const result = validateEmail(singleEmail);
    setSingleEmailResult(result);
  };

  const handleMultipleEmailsValidation = () => {
    const emailList = multipleEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    const results = validateMultipleEmails(emailList);
    setMultipleEmailsResults(results);
  };

  const handleTestEmail = (email: string) => {
    setSingleEmail(email);
    const result = validateEmail(email);
    setSingleEmailResult(result);
  };

  const handleEmailInputChange = (value: string, validationResult: EmailValidationResult) => {
    setSingleEmail(value);
    setSingleEmailResult(validationResult);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          メールアドレスバリデーション デモ
        </h1>
        <p className="text-gray-600">
          前処理（trim、全角→半角正規化）とフォーマット検証の動作確認
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 単一メールアドレス検証 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              単一メールアドレス検証
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EmailInput
              label="メールアドレス"
              placeholder="メールアドレスを入力してください"
              value={singleEmail}
              onChange={handleEmailInputChange}
              fullWidth
            />

            <Button onClick={handleSingleEmailValidation} fullWidth>
              バリデーション実行
            </Button>

            {singleEmailResult && (
              <div className={`p-4 rounded-lg border ${
                singleEmailResult.isValid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  {singleEmailResult.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  )}
                  <span className={`font-medium ${
                    singleEmailResult.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {singleEmailResult.isValid ? '有効なメールアドレス' : '無効なメールアドレス'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">入力値:</span>
                    <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                      "{singleEmail}"
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">正規化後:</span>
                    <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                      "{singleEmailResult.normalizedEmail}"
                    </span>
                  </div>
                  {singleEmailResult.error && (
                    <div>
                      <span className="font-medium text-red-700">エラー:</span>
                      <span className="ml-2 text-red-600">{singleEmailResult.error}</span>
                    </div>
                  )}
                  {singleEmailResult.isValid && (
                    <div>
                      <span className="font-medium text-gray-700">プロバイダー:</span>
                      <span className="ml-2">
                        {isCommonEmailProvider(singleEmailResult.normalizedEmail) 
                          ? '一般的なプロバイダー' 
                          : '企業・独自ドメイン'
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 複数メールアドレス検証 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              複数メールアドレス検証
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス（1行に1つずつ入力）
              </label>
              <textarea
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                rows={6}
                placeholder="test@example.com&#10;user@gmail.com&#10;invalid-email"
                value={multipleEmails}
                onChange={(e) => setMultipleEmails(e.target.value)}
              />
            </div>

            <Button onClick={handleMultipleEmailsValidation} fullWidth>
              一括バリデーション実行
            </Button>

            {multipleEmailsResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">検証結果:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {multipleEmailsResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-sm ${
                        result.isValid 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{result.normalizedEmail}</span>
                        {result.isValid ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      {result.error && (
                        <div className="mt-1 text-red-600">{result.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* テスト用サンプル */}
      <Card>
        <CardHeader>
          <CardTitle>テスト用サンプル</CardTitle>
          <p className="text-sm text-gray-600">
            以下のサンプルをクリックして動作を確認できます
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {testEmails.map((email, index) => (
              <button
                key={index}
                onClick={() => handleTestEmail(email)}
                className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
              >
                <div className="font-mono text-sm text-gray-900">{email}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {email.includes('ＴＥＳＴ') && '全角文字含む'}
                  {email.startsWith(' ') && '前後に空白'}
                  {email === 'invalid-email' && '無効な形式'}
                  {email === 'user@' && '@の後が空'}
                  {email === '@domain.com' && '@の前が空'}
                  {email === 'user@domain' && 'ドットなし'}
                  {email.includes(' ') && email !== '  user@yahoo.co.jp  ' && '空白文字含む'}
                  {email === 'test@gmail.com' && '一般的なプロバイダー'}
                  {email === 'business@company.co.jp' && '企業ドメイン'}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 実装詳細 */}
      <Card>
        <CardHeader>
          <CardTitle>実装詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. 前処理機能</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>前後の空白文字を削除（trim）</li>
                <li>大文字を小文字に変換</li>
                <li>全角英数字・記号を半角に正規化</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. フォーマット検証</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>@記号を1つ含むこと</li>
                <li>@の前後に文字列があること</li>
                <li>ドメイン部分にドット(.)を含むこと</li>
                <li>空白文字を含まないこと</li>
                <li>適切な文字長制限（ローカル部64文字、ドメイン部253文字、全体320文字）</li>
                <li>TLD（トップレベルドメイン）が2文字以上であること</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. エラーハンドリング</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>詳細なエラーメッセージの提供</li>
                <li>段階的な検証による適切なエラー特定</li>
                <li>例外処理による安全な動作保証</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};