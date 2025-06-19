import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { PostalCodeInput } from '../ui/PostalCodeInput';
import { 
  Save, 
  Edit, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Award,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const pharmacistProfileSchema = z.object({
  first_name: z.string().min(1, '名前（名）は必須です'),
  last_name: z.string().min(1, '名前（姓）は必須です'),
  first_name_kana: z.string().optional(),
  last_name_kana: z.string().optional(),
  birth_date: z.string().min(1, '生年月日は必須です'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: '性別は必須です',
  }),
  phone_mobile: z.string().optional(),
  phone_home: z.string().optional(),
  email: z.string().email('正しいメールアドレスを入力してください').optional().or(z.literal('')),
  postal_code: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  nearest_station: z.string().optional(),
  transportation: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  total_experience_years: z.number().min(0, '経験年数は0以上である必要があります'),
});

type PharmacistProfileData = z.infer<typeof pharmacistProfileSchema>;

export const PharmacistProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pharmacistData, setPharmacistData] = useState<any>(null);
  
  const { user, profile } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PharmacistProfileData>({
    resolver: zodResolver(pharmacistProfileSchema),
  });

  const watchedValues = watch();

  // 薬剤師データを取得
  useEffect(() => {
    const loadPharmacistData = async () => {
      if (user && profile?.role === 'pharmacist') {
        try {
          // 現在のユーザーの薬剤師データを取得
          const { data, error } = await supabase
            .from('pharmacists')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) throw error;
          
          if (data) {
            setPharmacistData(data);
            // フォームにデータを設定
            reset({
              first_name: data.first_name,
              last_name: data.last_name,
              first_name_kana: data.first_name_kana || '',
              last_name_kana: data.last_name_kana || '',
              birth_date: data.birth_date || '',
              gender: data.gender || undefined,
              phone_mobile: data.phone_mobile || '',
              phone_home: data.phone_home || '',
              email: data.email || '',
              postal_code: data.postal_code || '',
              prefecture: data.prefecture || '',
              city: data.city || '',
              address: data.address || '',
              nearest_station: data.nearest_station || '',
              transportation: data.transportation || '',
              emergency_contact_name: data.emergency_contact_name || '',
              emergency_contact_phone: data.emergency_contact_phone || '',
              emergency_contact_relation: data.emergency_contact_relation || '',
              total_experience_years: data.total_experience_years || 0,
            });
          }
        } catch (err) {
          console.error('Failed to load pharmacist data:', err);
          setError('プロフィール情報の取得に失敗しました。');
        }
      }
    };

    loadPharmacistData();
  }, [user, profile, reset]);

  const onSubmit = async (data: PharmacistProfileData) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // 薬剤師データを更新
      const { error } = await supabase
        .from('pharmacists')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSuccess(true);
      setIsEditing(false);
      
      // 成功メッセージを3秒後に非表示
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('プロフィールの更新に失敗しました。');
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
    // フォームをリセット（元のデータに戻す）
    if (pharmacistData) {
      reset({
        first_name: pharmacistData.first_name,
        last_name: pharmacistData.last_name,
        first_name_kana: pharmacistData.first_name_kana || '',
        last_name_kana: pharmacistData.last_name_kana || '',
        birth_date: pharmacistData.birth_date || '',
        gender: pharmacistData.gender || undefined,
        phone_mobile: pharmacistData.phone_mobile || '',
        phone_home: pharmacistData.phone_home || '',
        email: pharmacistData.email || '',
        postal_code: pharmacistData.postal_code || '',
        prefecture: pharmacistData.prefecture || '',
        city: pharmacistData.city || '',
        address: pharmacistData.address || '',
        nearest_station: pharmacistData.nearest_station || '',
        transportation: pharmacistData.transportation || '',
        emergency_contact_name: pharmacistData.emergency_contact_name || '',
        emergency_contact_phone: pharmacistData.emergency_contact_phone || '',
        emergency_contact_relation: pharmacistData.emergency_contact_relation || '',
        total_experience_years: pharmacistData.total_experience_years || 0,
      });
    }
  };

  if (!user || profile?.role !== 'pharmacist') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-600">薬剤師プロフィールにアクセスする権限がありません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">プロフィール</h2>
          <p className="text-gray-600">個人情報の確認・編集</p>
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
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              基本情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="姓"
                placeholder="山田"
                disabled={!isEditing}
                error={errors.last_name?.message}
                validationRules={{
                  required: true,
                  maxLength: 50,
                }}
                {...register('last_name')}
              />
              <Input
                label="名"
                placeholder="太郎"
                disabled={!isEditing}
                error={errors.first_name?.message}
                validationRules={{
                  required: true,
                  maxLength: 50,
                }}
                {...register('first_name')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="姓（カナ）"
                placeholder="ヤマダ"
                disabled={!isEditing}
                error={errors.last_name_kana?.message}
                validationRules={{
                  maxLength: 50,
                  pattern: /^[ァ-ヶー]*$/,
                }}
                {...register('last_name_kana')}
              />
              <Input
                label="名（カナ）"
                placeholder="タロウ"
                disabled={!isEditing}
                error={errors.first_name_kana?.message}
                validationRules={{
                  maxLength: 50,
                  pattern: /^[ァ-ヶー]*$/,
                }}
                {...register('first_name_kana')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="生年月日"
                type="date"
                disabled={!isEditing}
                error={errors.birth_date?.message}
                validationRules={{
                  required: true,
                }}
                {...register('birth_date')}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  性別 <span className="text-red-500">*</span>
                </label>
                <select
                  className={`block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${
                    !isEditing ? 'bg-gray-50 text-gray-500' : ''
                  }`}
                  disabled={!isEditing}
                  {...register('gender')}
                >
                  <option value="">選択してください</option>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">その他</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>
            </div>

            <Input
              label="総経験年数"
              type="number"
              min="0"
              max="50"
              placeholder="5"
              disabled={!isEditing}
              error={errors.total_experience_years?.message}
              validationRules={{
                required: true,
                number: true,
                custom: (value) => {
                  if (!value) return '総経験年数は必須です';
                  const num = Number(value);
                  if (num < 0 || num > 50) {
                    return '経験年数は0〜50年の範囲で入力してください';
                  }
                  return null;
                },
              }}
              {...register('total_experience_years', { valueAsNumber: true })}
            />

            {/* 薬剤師免許情報（読み取り専用） */}
            {pharmacistData && (
              <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  薬剤師免許情報
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      薬剤師免許番号
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-gray-900">{pharmacistData.license_number}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      免許取得日
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-gray-900">
                        {new Date(pharmacistData.license_date).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      薬剤師免許情報の変更が必要な場合は、管理者にお問い合わせください。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 連絡先情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              連絡先情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="携帯電話番号"
                  placeholder="09012345678"
                  disabled={!isEditing}
                  error={errors.phone_mobile?.message}
                  validationRules={{
                    custom: (value) => {
                      if (!value) return null;
                      const phonePattern = /^[0-9]{11}$/;
                      if (!phonePattern.test(value)) {
                        return '携帯電話番号は11桁の数字で入力してください';
                      }
                      return null;
                    },
                  }}
                  {...register('phone_mobile')}
                />
                {isEditing && (
                  <p className="mt-1 text-xs text-gray-500">※ ハイフン（-）なしで11桁の数字を入力してください</p>
                )}
              </div>
              <div>
                <Input
                  label="固定電話番号"
                  placeholder="0312345678"
                  disabled={!isEditing}
                  error={errors.phone_home?.message}
                  validationRules={{
                    custom: (value) => {
                      if (!value) return null;
                      const phonePattern = /^[0-9]{10,11}$/;
                      if (!phonePattern.test(value)) {
                        return '正しい電話番号を入力してください（ハイフンなし、10-11桁）';
                      }
                      return null;
                    },
                  }}
                  {...register('phone_home')}
                />
                {isEditing && (
                  <p className="mt-1 text-xs text-gray-500">※ ハイフン（-）なしで入力してください</p>
                )}
              </div>
            </div>

            <Input
              label="メールアドレス"
              type="email"
              placeholder="yamada@example.com"
              disabled={!isEditing}
              error={errors.email?.message}
              validationRules={{
                email: true,
              }}
              {...register('email')}
            />
          </CardContent>
        </Card>

        {/* 住所情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              住所情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <PostalCodeInput
                postalCode={watchedValues.postal_code || ''}
                prefecture={watchedValues.prefecture || ''}
                city={watchedValues.city || ''}
                address={watchedValues.address || ''}
                onPostalCodeChange={(value) => setValue('postal_code', value)}
                onPrefectureChange={(value) => setValue('prefecture', value)}
                onCityChange={(value) => setValue('city', value)}
                onAddressChange={(value) => setValue('address', value)}
                disabled={!isEditing}
                errors={{
                  postal_code: errors.postal_code?.message,
                  prefecture: errors.prefecture?.message,
                  city: errors.city?.message,
                  address: errors.address?.message,
                }}
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <Input
                    label="郵便番号"
                    placeholder="1600023"
                    disabled={!isEditing}
                    error={errors.postal_code?.message}
                    {...register('postal_code')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    都道府県
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-900">{watchedValues.prefecture || '未設定'}</span>
                  </div>
                </div>
                <Input
                  label="市区町村"
                  placeholder="新宿区"
                  disabled={!isEditing}
                  error={errors.city?.message}
                  {...register('city')}
                />
                <Input
                  label="住所"
                  placeholder="西新宿1-1-1"
                  disabled={!isEditing}
                  error={errors.address?.message}
                  {...register('address')}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="最寄り駅"
                placeholder="新宿駅"
                disabled={!isEditing}
                error={errors.nearest_station?.message}
                validationRules={{
                  maxLength: 100,
                }}
                {...register('nearest_station')}
              />
              <Input
                label="交通手段"
                placeholder="電車、バス、自動車など"
                disabled={!isEditing}
                error={errors.transportation?.message}
                validationRules={{
                  maxLength: 50,
                }}
                {...register('transportation')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 緊急連絡先 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              緊急連絡先
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="緊急連絡先氏名"
                placeholder="山田花子"
                disabled={!isEditing}
                error={errors.emergency_contact_name?.message}
                validationRules={{
                  maxLength: 100,
                }}
                {...register('emergency_contact_name')}
              />
              <div>
                <Input
                  label="緊急連絡先電話番号"
                  placeholder="09098765432"
                  disabled={!isEditing}
                  error={errors.emergency_contact_phone?.message}
                  validationRules={{
                    custom: (value) => {
                      if (!value) return null;
                      const phonePattern = /^[0-9]{10,11}$/;
                      if (!phonePattern.test(value)) {
                        return '正しい電話番号を入力してください（ハイフンなし、10-11桁）';
                      }
                      return null;
                    },
                  }}
                  {...register('emergency_contact_phone')}
                />
                {isEditing && (
                  <p className="mt-1 text-xs text-gray-500">※ ハイフン（-）なしで入力してください</p>
                )}
              </div>
              <Input
                label="続柄"
                placeholder="配偶者、親、兄弟など"
                disabled={!isEditing}
                error={errors.emergency_contact_relation?.message}
                validationRules={{
                  maxLength: 50,
                }}
                {...register('emergency_contact_relation')}
              />
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