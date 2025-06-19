import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePharmacistStore } from '../../stores/pharmacist';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { PostalCodeInput } from '../ui/PostalCodeInput';
import { Save, ArrowLeft } from 'lucide-react';

const pharmacistSchema = z.object({
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
  license_number: z.string().min(1, '薬剤師免許番号は必須です'),
  license_date: z.string().min(1, '免許取得日は必須です'),
  total_experience_years: z.number().min(0, '経験年数は0以上である必要があります'),
});

type PharmacistFormData = z.infer<typeof pharmacistSchema>;

interface PharmacistFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const PharmacistForm: React.FC<PharmacistFormProps> = ({
  onBack,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createPharmacist } = usePharmacistStore();
  const { user, profile } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PharmacistFormData>({
    resolver: zodResolver(pharmacistSchema),
  });

  const watchedValues = watch();

  const onSubmit = async (data: PharmacistFormData) => {
    if (!user || !profile?.pharmacy_id) return;

    try {
      setLoading(true);
      setError(null);
      
      await createPharmacist({
        ...data,
        user_id: user.id,
        pharmacy_id: profile.pharmacy_id,
        total_experience_years: Number(data.total_experience_years),
        is_active: true,
      });
      
      onSuccess();
    } catch (err) {
      setError('薬剤師の登録に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={onBack}
          icon={ArrowLeft}
        >
          戻る
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">薬剤師新規登録</h2>
          <p className="text-gray-600">基本情報を入力してください</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="姓"
                placeholder="山田"
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
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="携帯電話番号"
                  placeholder="09012345678"
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
                <p className="mt-1 text-xs text-gray-500">※ ハイフン（-）なしで11桁の数字を入力してください</p>
              </div>
              <div>
                <Input
                  label="固定電話番号"
                  placeholder="0312345678"
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
                <p className="mt-1 text-xs text-gray-500">※ ハイフン（-）なしで入力してください</p>
              </div>
            </div>

            <Input
              label="メールアドレス"
              type="email"
              placeholder="yamada@example.com"
              error={errors.email?.message}
              validationRules={{
                email: true,
              }}
              {...register('email')}
            />

            <PostalCodeInput
              postalCode={watchedValues.postal_code || ''}
              prefecture={watchedValues.prefecture || ''}
              city={watchedValues.city || ''}
              address={watchedValues.address || ''}
              onPostalCodeChange={(value) => setValue('postal_code', value)}
              onPrefectureChange={(value) => setValue('prefecture', value)}
              onCityChange={(value) => setValue('city', value)}
              onAddressChange={(value) => setValue('address', value)}
              errors={{
                postal_code: errors.postal_code?.message,
                prefecture: errors.prefecture?.message,
                city: errors.city?.message,
                address: errors.address?.message,
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="最寄り駅"
                placeholder="新宿駅"
                error={errors.nearest_station?.message}
                validationRules={{
                  maxLength: 100,
                }}
                {...register('nearest_station')}
              />
              <Input
                label="交通手段"
                placeholder="電車、バス、自動車など"
                error={errors.transportation?.message}
                validationRules={{
                  maxLength: 50,
                }}
                {...register('transportation')}
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">緊急連絡先</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="緊急連絡先氏名"
                  placeholder="山田花子"
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
                  <p className="mt-1 text-xs text-gray-500">※ ハイフン（-）なしで入力してください</p>
                </div>
                <Input
                  label="続柄"
                  placeholder="配偶者、親、兄弟など"
                  error={errors.emergency_contact_relation?.message}
                  validationRules={{
                    maxLength: 50,
                  }}
                  {...register('emergency_contact_relation')}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">薬剤師情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="薬剤師免許番号"
                  placeholder="第123456号"
                  error={errors.license_number?.message}
                  validationRules={{
                    required: true,
                    maxLength: 20,
                  }}
                  {...register('license_number')}
                />
                <Input
                  label="免許取得日"
                  type="date"
                  error={errors.license_date?.message}
                  validationRules={{
                    required: true,
                  }}
                  {...register('license_date')}
                />
              </div>

              <div className="mt-6">
                <Input
                  label="総経験年数"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="5"
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
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                loading={loading}
                icon={Save}
              >
                登録
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};