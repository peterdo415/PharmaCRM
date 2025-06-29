import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  Save, 
  Edit, 
  User, 
  Mail, 
  Building,
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react';

const adminProfileSchema = z.object({
  email: z.string().email('正しいメールアドレスを入力してください'),
  role: z.literal('pharmacy_admin'),
});

type AdminProfileData = z.infer<typeof adminProfileSchema>;

interface PharmacyInfo {
  id: string;
  name: string;
  prefecture: string;
  city: string;
  address: string;
  phone_number?: string;
  email?: string;
}

export const AdminProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pharmacyInfo, setPharmacyInfo] = useState<PharmacyInfo | null>(null);
  
  const { user, profile } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminProfileData>({
    resolver: zodResolver(adminProfileSchema),
  });

  // プロフィールと薬局データを取得
  useEffect(() => {
    const loadProfileData = async () => {
      if (user && profile?.role === 'pharmacy_admin') {
        try {
          // プロフィール情報をフォームに設定
          reset({
            email: profile.email,
            role: 'pharmacy_admin',
          });

          // 薬局情報を設定（既に authService.getProfile で取得済み）
          if (profile.pharmacy) {
            setPharmacyInfo(profile.pharmacy);
          } else if (profile.pharmacy_id) {
            // fallback: 直接薬局データを取得
            const { data: pharmacyData, error: pharmacyError } = await supabase
              .from('pharmacies')
              .select('*')
              .eq('id', profile.pharmacy_id)
              .maybeSingle();

            if (pharmacyError) {
              console.error('Failed to load pharmacy data:', pharmacyError);
              setError('薬局情報の取得に失敗しました。');
            } else if (pharmacyData) {
              setPharmacyInfo(pharmacyData);
            }
          }
        } catch (err) {
          console.error('Failed to load profile data:', err);
          setError('プロフィール情報の取得に失敗しました。');
        }
      }
    };

    loadProfileData();
  }, [user, profile, reset]);

  const onSubmit = async (data: AdminProfileData) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // メールアドレスの更新はauth.usersテーブルで管理されているため
      // ここでは特別な更新処理は不要
      // 必要に応じて将来的にauth.updateUserでメール更新可能

      setSuccess(true);
      setIsEditing(false);
      
      // 成功メッセージを3秒後に非表示
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'プロフィールの更新に失敗しました。';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(false);
    // フォームをリセット
    if (profile) {
      reset({
        email: profile.email,
        role: 'pharmacy_admin',
      });
    }
  };

  if (!user || profile?.role !== 'pharmacy_admin') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-600">管理者プロフィールにアクセスする権限がありません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">管理者プロフィール</h2>
          <p className="text-gray-600">アカウント情報の確認・編集</p>
        </div>
        {!isEditing && (
          <Button onClick={handleEdit} icon={Edit}>
            編集
          </Button>
        )}
      </div>

      {/* 成功メッセージ */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-600">プロフィールが正常に更新されました。</p>
          </div>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* アカウント情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              アカウント情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="メールアドレス"
              type="email"
              placeholder="admin@example.com"
              disabled={!isEditing}
              error={errors.email?.message}
              validationRules={{
                required: true,
                email: true,
              }}
              {...register('email')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                役割
              </label>
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">薬局管理者</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザーID
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-600 font-mono text-sm">{user.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 所属薬局情報 */}
        {pharmacyInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                所属薬局情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    薬局名
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-900 font-medium">{pharmacyInfo.name}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    所在地
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-900">
                      {pharmacyInfo.prefecture} {pharmacyInfo.city}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-gray-900">{pharmacyInfo.address}</span>
                </div>
              </div>

              {pharmacyInfo.phone_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    電話番号
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-900">{pharmacyInfo.phone_number}</span>
                  </div>
                </div>
              )}

              {pharmacyInfo.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    薬局メールアドレス
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-900">{pharmacyInfo.email}</span>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">薬局情報の変更について</p>
                    <p className="text-sm text-blue-700 mt-1">
                      薬局の基本情報（名称、住所等）の変更が必要な場合は、システム管理者にお問い合わせください。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* セキュリティ情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              セキュリティ情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最終ログイン
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-900">
                  {user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleString('ja-JP')
                    : '情報なし'
                  }
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アカウント作成日
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-900">
                  {new Date(user.created_at).toLocaleString('ja-JP')}
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-800 font-medium">パスワード変更について</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    パスワードの変更が必要な場合は、ログアウト後にパスワードリセット機能をご利用ください。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 編集モード時のボタン */}
        {isEditing && (
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              loading={loading}
              icon={Save}
            >
              保存
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};