import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/auth';
import { prepareEmailForAuth, validateEmailForForm } from '../../utils/emailValidation';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'メールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      // メールアドレスをクリーニング
      const cleanedEmail = prepareEmailForAuth(data.email);
      
      await signIn(cleanedEmail, data.password);
    } catch (err: any) {
      console.error('Login error:', err);
      
      // エラーメッセージの詳細化
      if (err.message?.includes('Email not confirmed') || err.message?.includes('メールアドレスが確認されていません')) {
        setError('アカウントが有効化されていません。管理者にお問い合わせください。');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('メールアドレスまたはパスワードが正しくありません。');
      } else if (err.message?.includes('Too many requests')) {
        setError('ログイン試行回数が上限に達しました。しばらく時間をおいてから再度お試しください。');
      } else {
        setError(err.message || 'ログインに失敗しました。メールアドレスとパスワードを確認してください。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>ログイン</CardTitle>
        <p className="text-sm text-gray-600">
          薬局CRMシステムにログインしてください
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="メールアドレス"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            error={errors.email?.message}
            validationRules={{
              required: true,
              custom: validateEmailForForm,
            }}
            {...register('email')}
          />

          <Input
            label="パスワード"
            type="password"
            icon={Lock}
            placeholder="パスワードを入力"
            error={errors.password?.message}
            validationRules={{
              required: true,
              minLength: 6,
            }}
            {...register('password')}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-600 font-medium">ログインエラー</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                  {error.includes('アカウントが有効化されていません') && (
                    <p className="text-xs text-red-500 mt-2">
                      ※ 新規登録後、管理者による承認が必要です
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            loading={loading}
            icon={LogIn}
          >
            ログイン
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない場合は{' '}
            <button
              onClick={onToggleMode}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              新規登録
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};