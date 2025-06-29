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
    invalid_type_error: '性別を選択してください'
  }),
  phone_mobile: z.string().optional(),
  phone_home: z.string().optional(),
  email: z.string().email('正しいメールアドレスを入力してください').optional().or(z.literal('')),
  postal_code: z.string().min(1, '郵便番号は必須です'),
  prefecture: z.string().min(1, '都道府県は必須です'),
  city: z.string().min(1, '市区町村は必須です'),
  address: z.string().min(1, '住所は必須です'),
  nearest_station: z.string().optional(),
  transportation: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  experience_years: z.number({
    required_error: '総経験年数は必須です',
    invalid_type_error: '数値を入力してください'
  }).min(0, '経験年数は0以上である必要があります'),
});

type PharmacistProfileData = z.infer<typeof pharmacistProfileSchema>;

export const PharmacistProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pharmacistData, setPharmacistData] = useState<any>(null);
  const [pharmacyList, setPharmacyList] = useState<any[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('');
  
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

  // 薬剤師データと薬局リストを取得
  useEffect(() => {
    const loadData = async () => {
      if (user && profile?.role === 'pharmacist') {
        try {
          // 薬局リストを取得
          const { data: pharmacies, error: pharmacyListError } = await supabase
            .from('pharmacies')
            .select('id, name, prefecture, city, address')
            .order('name');

          if (pharmacyListError) {
            console.error('Failed to load pharmacy list:', pharmacyListError);
          } else {
            setPharmacyList(pharmacies || []);
          }

          // プロフィールから薬剤師データを取得（既に authService.getProfile で取得済み）
          if (profile.pharmacist) {
            const data = profile.pharmacist;
            setPharmacistData(data);
            setSelectedPharmacyId(data.pharmacy_id || '');
            
            // フォームにデータを設定
            reset({
              first_name: data.first_name || '',
              last_name: data.last_name || '',
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
              experience_years: data.experience_years || 0,
            });
          } else {
            // 薬剤師データが存在しない場合、初期値でフォームを設定
            reset({
              first_name: '',
              last_name: '',
              first_name_kana: '',
              last_name_kana: '',
              birth_date: '',
              gender: undefined,
              phone_mobile: '',
              phone_home: '',
              email: '',
              postal_code: '',
              prefecture: '',
              city: '',
              address: '',
              nearest_station: '',
              transportation: '',
              emergency_contact_name: '',
              emergency_contact_phone: '',
              emergency_contact_relation: '',
              experience_years: 0,
            });
          }
        } catch (err) {
          console.error('Failed to load data:', err);
          setError('データの取得に失敗しました。');
        }
      }
    };

    loadData();
  }, [user, profile, reset]);

  const onSubmit = async (data: PharmacistProfileData) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // pharmacistsテーブルに存在するカラムのみを送信データとして準備
      const pharmacistTableData = {
        last_name: data.last_name,
        first_name: data.first_name,
        first_name_kana: data.first_name_kana || null,
        last_name_kana: data.last_name_kana || null,
        birth_date: data.birth_date,
        gender: data.gender,
        phone_mobile: data.phone_mobile || null,
        phone_home: data.phone_home || null,
        email: data.email || null,
        postal_code: data.postal_code,
        prefecture: data.prefecture,
        city: data.city,
        address: data.address,
        nearest_station: data.nearest_station || null,
        transportation: data.transportation || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relation: data.emergency_contact_relation || null,
        experience_years: data.experience_years,
        pharmacy_id: selectedPharmacyId || null,
        updated_at: new Date().toISOString(),
      };

      if (pharmacistData) {
        // 既存の薬剤師データを更新
        const { error } = await supabase
          .from('pharmacists')
          .update(pharmacistTableData)
          .eq('id', pharmacistData.id);

        if (error) {
          console.error('Supabase update error:', error);
          throw new Error(`データの更新に失敗しました: ${error.message}`);
        }

        // 更新されたデータを再取得
        const { data: updatedData, error: fetchError } = await supabase
          .from('pharmacists')
          .select('*')
          .eq('id', pharmacistData.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Supabase fetch error:', fetchError);
        } else if (updatedData) {
          setPharmacistData(updatedData);
        }
      } else {
        // 新規薬剤師データを作成
        const { data: newData, error } = await supabase
          .from('pharmacists')
          .insert({
            ...pharmacistTableData,
            user_id: user.id,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase insert error:', error);
          throw new Error(`データの作成に失敗しました: ${error.message}`);
        }

        if (newData) {
          setPharmacistData(newData);
        }
      }

      setSuccess(true);
      
      // 成功メッセージを3秒後に非表示
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      console.error('Failed to save profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'プロフィールの保存に失敗しました。';
      setError(errorMessage);
    } finally {
      setLoading(false);
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
                disabled={false}
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
                disabled={false}
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
                disabled={false}
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
                disabled={false}
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
                disabled={false}
                error={errors.birth_date?.message}
                validationRules={{
                  required: true,
                  custom: (value) => {
                    if (!value) return '生年月日は必須です';
                    const birthDate = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    if (age < 18 || age > 100) {
                      return '18歳以上100歳以下で入力してください';
                    }
                    return null;
                  },
                }}
                {...register('birth_date')}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  性別 <span className="text-red-500">*</span>
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  disabled={false}
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
              disabled={false}
              error={errors.experience_years?.message}
              validationRules={{
                required: true,
                number: true,
                custom: (value) => {
                  if (!value) return '総経験年数は必須です';
                  const num = Number(value);
                  if (isNaN(num)) return '数値を入力してください';
                  if (num < 0 || num > 50) {
                    return '経験年数は0〜50年の範囲で入力してください';
                  }
                  return null;
                },
              }}
              {...register('experience_years', { valueAsNumber: true })}
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
                  disabled={false}
                  error={errors.phone_mobile?.message}
                  validationRules={{
                    custom: (value) => {
                      if (!value) return null;
                      const phonePattern = /^[0-9]{11}$/;
                      if (!phonePattern.test(value)) {
                        return '携帯電話番号は11桁の数字で入力してください（ハイフンなし）';
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
                  disabled={false}
                  error={errors.phone_home?.message}
                  validationRules={{
                    custom: (value) => {
                      if (!value) return null;
                      const phonePattern = /^[0-9]{10,11}$/;
                      if (!phonePattern.test(value)) {
                        return '固定電話番号は10-11桁の数字で入力してください（ハイフンなし）';
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
              disabled={false}
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
            <div className="space-y-4">
              <Input
                label="郵便番号"
                placeholder="1600023"
                disabled={false}
                error={errors.postal_code?.message}
                validationRules={{
                  required: true,
                  pattern: /^[0-9]{7}$/,
                  custom: (value) => {
                    if (!value) return '郵便番号は必須です';
                    if (!/^[0-9]{7}$/.test(value)) {
                      return '郵便番号は7桁の数字で入力してください';
                    }
                    return null;
                  },
                }}
                {...register('postal_code')}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  都道府県 <span className="text-red-500">*</span>
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  disabled={false}
                  {...register('prefecture')}
                >
                  <option value="">選択してください</option>
                  <option value="北海道">北海道</option>
                  <option value="青森県">青森県</option>
                  <option value="岩手県">岩手県</option>
                  <option value="宮城県">宮城県</option>
                  <option value="秋田県">秋田県</option>
                  <option value="山形県">山形県</option>
                  <option value="福島県">福島県</option>
                  <option value="茨城県">茨城県</option>
                  <option value="栃木県">栃木県</option>
                  <option value="群馬県">群馬県</option>
                  <option value="埼玉県">埼玉県</option>
                  <option value="千葉県">千葉県</option>
                  <option value="東京都">東京都</option>
                  <option value="神奈川県">神奈川県</option>
                  <option value="新潟県">新潟県</option>
                  <option value="富山県">富山県</option>
                  <option value="石川県">石川県</option>
                  <option value="福井県">福井県</option>
                  <option value="山梨県">山梨県</option>
                  <option value="長野県">長野県</option>
                  <option value="岐阜県">岐阜県</option>
                  <option value="静岡県">静岡県</option>
                  <option value="愛知県">愛知県</option>
                  <option value="三重県">三重県</option>
                  <option value="滋賀県">滋賀県</option>
                  <option value="京都府">京都府</option>
                  <option value="大阪府">大阪府</option>
                  <option value="兵庫県">兵庫県</option>
                  <option value="奈良県">奈良県</option>
                  <option value="和歌山県">和歌山県</option>
                  <option value="鳥取県">鳥取県</option>
                  <option value="島根県">島根県</option>
                  <option value="岡山県">岡山県</option>
                  <option value="広島県">広島県</option>
                  <option value="山口県">山口県</option>
                  <option value="徳島県">徳島県</option>
                  <option value="香川県">香川県</option>
                  <option value="愛媛県">愛媛県</option>
                  <option value="高知県">高知県</option>
                  <option value="福岡県">福岡県</option>
                  <option value="佐賀県">佐賀県</option>
                  <option value="長崎県">長崎県</option>
                  <option value="熊本県">熊本県</option>
                  <option value="大分県">大分県</option>
                  <option value="宮崎県">宮崎県</option>
                  <option value="鹿児島県">鹿児島県</option>
                  <option value="沖縄県">沖縄県</option>
                </select>
                {errors.prefecture && (
                  <p className="mt-1 text-sm text-red-600">{errors.prefecture.message}</p>
                )}
              </div>
              
              <Input
                label="市区町村"
                placeholder="新宿区"
                disabled={false}
                error={errors.city?.message}
                validationRules={{
                  required: true,
                  maxLength: 50,
                }}
                {...register('city')}
              />
              
              <Input
                label="住所"
                placeholder="西新宿1-1-1"
                disabled={false}
                error={errors.address?.message}
                validationRules={{
                  required: true,
                  maxLength: 100,
                }}
                {...register('address')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="最寄り駅"
                placeholder="新宿駅"
                disabled={false}
                error={errors.nearest_station?.message}
                validationRules={{
                  maxLength: 100,
                }}
                {...register('nearest_station')}
              />
              <Input
                label="交通手段"
                placeholder="電車、バス、自動車など"
                disabled={false}
                error={errors.transportation?.message}
                validationRules={{
                  maxLength: 50,
                }}
                {...register('transportation')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 勤務先薬局 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              勤務先薬局
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属薬局
              </label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                value={selectedPharmacyId}
                onChange={(e) => setSelectedPharmacyId(e.target.value)}
              >
                <option value="">薬局を選択してください</option>
                {pharmacyList.map((pharmacy) => (
                  <option key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.name} ({pharmacy.prefecture} {pharmacy.city})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">※ 薬局を選択することで、その薬局での勤務が可能になります</p>
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
                disabled={false}
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
                  disabled={false}
                  error={errors.emergency_contact_phone?.message}
                  validationRules={{
                    custom: (value) => {
                      if (!value) return null;
                      const phonePattern = /^[0-9]{10,11}$/;
                      if (!phonePattern.test(value)) {
                        return '緊急連絡先電話番号は10-11桁の数字で入力してください（ハイフンなし）';
                      }
                      return null;
                    },
                  }}
                  {...register('emergency_contact_phone')}
                />
                <p className="mt-1 text-xs text-gray-500">※ ハイフン（-）なしで入力してください</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  続柄
                </label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  disabled={false}
                  {...register('emergency_contact_relation')}
                >
                  <option value="">選択してください</option>
                  <option value="父">父</option>
                  <option value="母">母</option>
                  <option value="夫">夫</option>
                  <option value="妻">妻</option>
                  <option value="息子">息子</option>
                  <option value="娘">娘</option>
                  <option value="兄">兄</option>
                  <option value="弟">弟</option>
                  <option value="姉">姉</option>
                  <option value="妹">妹</option>
                  <option value="祖父">祖父</option>
                  <option value="祖母">祖母</option>
                  <option value="叔父">叔父</option>
                  <option value="伯父">伯父</option>
                  <option value="叔母">叔母</option>
                  <option value="伯母">伯母</option>
                  <option value="いとこ">いとこ</option>
                  <option value="友人">友人</option>
                  <option value="その他">その他</option>
                </select>
                {errors.emergency_contact_relation && (
                  <p className="mt-1 text-sm text-red-600">{errors.emergency_contact_relation.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={loading}
            icon={Save}
          >
            保存
          </Button>
        </div>
      </form>
    </div>
  );
};