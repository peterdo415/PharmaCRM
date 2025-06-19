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
import { validateEmailForForm } from '../../utils/emailValidation';
import { getDomainRestrictionMessage } from '../../utils/supabaseEmailDomains';
import { Mail, Lock, UserPlus, AlertCircle, CheckCircle, User, Building, Info } from 'lucide-react';

// 基本スキーマ
const baseSchema = z.object({
  email: z.string().min(1, 'メールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
  confirmPassword: z.string(),
  role: z.enum(['pharmacy_admin', 'pharmacist'], {
    required_error: '役割を選択してください',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

// 薬剤師用スキーマ
const pharmacistSchema = z.object({
  email: z.string().min(1, 'メールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
  confirmPassword: z.string(),
  role: z.enum(['pharmacy_admin', 'pharmacist'], {
    required_error: '役割を選択してください',
  }),
  // 基本情報（必須）
  first_name: z.string().min(1, '名前（名）は必須です'),
  last_name: z.string().min(1, '名前（姓）は必須です'),
  license_number: z.string().min(1, '薬剤師免許番号は必須です'),
  license_date: z.string().min(1, '免許取得日は必須です'),
  birth_date: z.string().min(1, '生年月日は必須です'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: '性別は必須です',
  }),
  total_experience_years: z.number().min(0, '経験年数は0以上である必要があります'),
  
  // 連絡先（必須）
  phone_mobile: z.string().min(1, '携帯電話番号は必須です'),
  
  // 住所（必須）
  prefecture: z.string().min(1, '都道府県は必須です'),
  city: z.string().min(1, '市区町村は必須です'),
  address: z.string().min(1, '住所は必須です'),
  
  // オプション項目
  first_name_kana: z.string().optional(),
  last_name_kana: z.string().optional(),
  phone_home: z.string().optional(),
  postal_code: z.string().optional(),
  nearest_station: z.string().optional(),
  transportation: z.string().optional(),
  
  // 緊急連絡先
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

// 管理者用スキーマ
const adminSchema = z.object({
  email: z.string().min(1, 'メールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
  confirmPassword: z.string(),
  role: z.enum(['pharmacy_admin', 'pharmacist'], {
    required_error: '役割を選択してください',
  }),
  // 薬局情報（必須）
  pharmacy_name: z.string().min(1, '薬局名は必須です'),
  pharmacy_prefecture: z.string().min(1, '薬局の都道府県は必須です'),
  pharmacy_city: z.string().min(1, '薬局の市区町村は必須です'),
  pharmacy_address: z.string().min(1, '薬局の住所は必須です'),
  pharmacy_phone: z.string().min(1, '薬局の電話番号は必須です'),
  
  // オプション項目
  pharmacy_postal_code: z.string().optional(),
  pharmacy_fax: z.string().optional(),
  pharmacy_email: z.string().email('正しいメールアドレスを入力してください').optional().or(z.literal('')),
  pharmacy_license_number: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

type BaseFormData = z.infer<typeof baseSchema>;
type PharmacistFormData = z.infer<typeof pharmacistSchema>;
type AdminFormData = z.infer<typeof adminSchema>;
type FormData = PharmacistFormData | AdminFormData;

// 日付選択用のヘルパー関数
const generateYears = (startYear: number, endYear: number) => {
  const years = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push(year);
  }
  return years;
};

const generateMonths = () => {
  return Array.from({ length: 12 }, (_, i) => i + 1);
};

const generateDays = (year: number, month: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
};

interface DateSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

const DateSelector: React.FC<DateSelectorProps> = ({ label, value, onChange, error, required }) => {
  // valueプロップから年、月、日を導出
  const parseDate = (dateString: string) => {
    if (!dateString) return { year: '', month: '', day: '' };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { year: '', month: '', day: '' };
    return {
      year: date.getFullYear().toString(),
      month: (date.getMonth() + 1).toString(),
      day: date.getDate().toString(),
    };
  };

  const { year, month, day } = parseDate(value);

  const handleYearChange = (newYear: string) => {
    if (!newYear) {
      onChange('');
      return;
    }
    
    const currentMonth = month || '1';
    const currentDay = day || '1';
    
    // 新しい年と月で有効な日数をチェック
    const maxDays = generateDays(Number(newYear), Number(currentMonth)).length;
    const validDay = Number(currentDay) > maxDays ? '1' : currentDay;
    
    const newDate = `${newYear}-${currentMonth.padStart(2, '0')}-${validDay.padStart(2, '0')}`;
    onChange(newDate);
  };

  const handleMonthChange = (newMonth: string) => {
    if (!newMonth || !year) {
      if (!year) onChange('');
      return;
    }
    
    const currentDay = day || '1';
    
    // 新しい月で有効な日数をチェック
    const maxDays = generateDays(Number(year), Number(newMonth)).length;
    const validDay = Number(currentDay) > maxDays ? '1' : currentDay;
    
    const newDate = `${year}-${newMonth.padStart(2, '0')}-${validDay.padStart(2, '0')}`;
    onChange(newDate);
  };

  const handleDayChange = (newDay: string) => {
    if (!newDay || !year || !month) {
      return;
    }
    
    const newDate = `${year}-${month.padStart(2, '0')}-${newDay.padStart(2, '0')}`;
    onChange(newDate);
  };

  const currentYear = new Date().getFullYear();
  const years = generateYears(1900, currentYear);
  const months = generateMonths();
  const days = year && month ? generateDays(Number(year), Number(month)) : [];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
        >
          <option value="">年</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
        >
          <option value="">月</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}月</option>
          ))}
        </select>
        <select
          value={day}
          onChange={(e) => handleDayChange(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
          disabled={!year || !month}
        >
          <option value="">日</option>
          {days.map((d) => (
            <option key={d} value={d}>{d}日</option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

interface SignUpFormProps {
  onToggleMode: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleMode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'pharmacy_admin' | 'pharmacist' | ''>('');
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);
  const [pendingRole, setPendingRole] = useState<'pharmacy_admin' | 'pharmacist' | ''>('');
  const { signUp, signOut, user, session } = useAuthStore();

  // セッションが残っている場合はサインアウトしてから登録を開始
  useEffect(() => {
    if (session) {
      signOut().catch((err) => {
        console.error('Failed to clear session before signup:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 動的スキーマの選択
  const getSchema = () => {
    switch (selectedRole) {
      case 'pharmacist':
        return pharmacistSchema;
      case 'pharmacy_admin':
        return adminSchema;
      default:
        return baseSchema;
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getSchema()),
  });

  // フォームの値を監視
  const watchedValues = watch();

  // 入力内容があるかチェック
  const hasFormData = () => {
    const values = watchedValues;
    const baseFields = ['email', 'password', 'confirmPassword'];
    
    // 基本フィールド以外に入力があるかチェック
    return Object.keys(values).some(key => {
      if (baseFields.includes(key) || key === 'role') return false;
      const value = values[key as keyof typeof values];
      return value && value !== '';
    });
  };

  // 役割変更ハンドラー
  const handleRoleChange = (newRole: 'pharmacy_admin' | 'pharmacist') => {
    if (selectedRole && selectedRole !== newRole && hasFormData()) {
      setPendingRole(newRole);
      setShowRoleChangeDialog(true);
    } else {
      setSelectedRole(newRole);
      setValue('role', newRole);
    }
  };

  // 役割変更確認ダイアログの処理
  const confirmRoleChange = () => {
    // フォームをリセット（基本情報は保持）
    const currentEmail = watchedValues.email;
    const currentPassword = watchedValues.password;
    const currentConfirmPassword = watchedValues.confirmPassword;
    
    reset();
    
    // 基本情報を復元
    setValue('email', currentEmail);
    setValue('password', currentPassword);
    setValue('confirmPassword', currentConfirmPassword);
    setValue('role', pendingRole);
    
    setSelectedRole(pendingRole);
    setShowRoleChangeDialog(false);
    setPendingRole('');
  };

  const cancelRoleChange = () => {
    setShowRoleChangeDialog(false);
    setPendingRole('');
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      // 薬局管理者の場合は薬局情報も一緒に登録
      if (data.role === 'pharmacy_admin') {
        const adminData = data as AdminFormData;
        
        // 薬局を先に作成
        const { data: pharmacyData, error: pharmacyError } = await supabase
          .from('pharmacies')
          .insert({
            name: adminData.pharmacy_name,
            postal_code: adminData.pharmacy_postal_code,
            prefecture: adminData.pharmacy_prefecture,
            city: adminData.pharmacy_city,
            address: adminData.pharmacy_address,
            phone_number: adminData.pharmacy_phone,
            fax_number: adminData.pharmacy_fax,
            email: adminData.pharmacy_email,
            license_number: adminData.pharmacy_license_number,
          })
          .select()
          .single();

        if (pharmacyError) {
          throw new Error('薬局の登録に失敗しました: ' + pharmacyError.message);
        }

        // ユーザー登録（薬局IDを含む）
        await signUp(data.email, data.password, data.role, pharmacyData.id);
      } else {
        // 薬剤師の場合は薬剤師情報も一緒に登録
        const pharmacistData = data as PharmacistFormData;
        
        // サンプル薬局のIDを取得
        const { data: samplePharmacy, error: pharmacyError } = await supabase
          .from('pharmacies')
          .select('id')
          .eq('name', 'サンプル薬局')
          .single();

        if (pharmacyError || !samplePharmacy) {
          throw new Error('薬局情報の取得に失敗しました');
        }

        // ユーザー登録
        const { user: newUser } = await signUp(data.email, data.password, data.role, samplePharmacy.id);

        if (newUser) {
          // 薬剤師詳細情報を登録
          const { error: pharmacistError } = await supabase
            .from('pharmacists')
            .insert({
              user_id: newUser.id,
              pharmacy_id: samplePharmacy.id,
              first_name: pharmacistData.first_name,
              last_name: pharmacistData.last_name,
              first_name_kana: pharmacistData.first_name_kana,
              last_name_kana: pharmacistData.last_name_kana,
              birth_date: pharmacistData.birth_date,
              gender: pharmacistData.gender,
              phone_mobile: pharmacistData.phone_mobile,
              phone_home: pharmacistData.phone_home,
              email: pharmacistData.email || data.email,
              postal_code: pharmacistData.postal_code,
              prefecture: pharmacistData.prefecture,
              city: pharmacistData.city,
              address: pharmacistData.address,
              nearest_station: pharmacistData.nearest_station,
              transportation: pharmacistData.transportation,
              emergency_contact_name: pharmacistData.emergency_contact_name,
              emergency_contact_phone: pharmacistData.emergency_contact_phone,
              emergency_contact_relation: pharmacistData.emergency_contact_relation,
              license_number: pharmacistData.license_number,
              license_date: pharmacistData.license_date,
              total_experience_years: pharmacistData.total_experience_years,
              is_active: true,
            });

          if (pharmacistError) {
            throw new Error('薬剤師情報の登録に失敗しました: ' + pharmacistError.message);
          }
        }
      }

    } catch (err: any) {
      console.error('Sign up error:', err);
      
      if (err.message?.includes('User already registered')) {
        setError('このメールアドレスは既に登録されています。');
      } else if (err.message?.includes('Password should be at least')) {
        setError('パスワードは6文字以上である必要があります。');
      } else if (err.message?.includes('Invalid email')) {
        setError('正しいメールアドレスを入力してください。');
      } else if (err.message?.includes('Email domain not allowed') || err.message?.includes('許可されていないドメイン')) {
        setError('このメールドメインは許可されていません。' + getDomainRestrictionMessage());
      } else {
        setError(err.message || 'アカウント作成に失敗しました。しばらくしてから再度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  // ユーザーがログインしている場合は何も表示しない（ダッシュボードに遷移済み）
  if (user && session) {
    return null;
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>新規登録</CardTitle>
          <p className="text-sm text-gray-600">
            薬局CRMシステムのアカウントを作成してください
          </p>
          
          {/* ドメイン制限の案内 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800 font-medium">メールアドレスについて</p>
                <p className="text-sm text-blue-700 mt-1">
                  {getDomainRestrictionMessage()}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 役割選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                役割を選択してください <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleRoleChange('pharmacist')}
                  className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                    selectedRole === 'pharmacist'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <User className={`w-5 h-5 mr-2 ${
                      selectedRole === 'pharmacist' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className={`font-medium ${
                      selectedRole === 'pharmacist' ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      薬剤師
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    薬剤師として登録し、勤務管理やスケジュール確認を行います
                  </p>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleRoleChange('pharmacy_admin')}
                  className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                    selectedRole === 'pharmacy_admin'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Building className={`w-5 h-5 mr-2 ${
                      selectedRole === 'pharmacy_admin' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className={`font-medium ${
                      selectedRole === 'pharmacy_admin' ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      薬局管理者
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    薬局の管理者として薬剤師の管理やシフト調整を行います
                  </p>
                </button>
              </div>
              {errors.role && (
                <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* 基本情報 */}
            {selectedRole && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
                  <div className="space-y-4">
                    <Input
                      label="メールアドレス"
                      type="email"
                      icon={Mail}
                      placeholder="you@gmail.com"
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

                    <Input
                      label="パスワード確認"
                      type="password"
                      icon={Lock}
                      placeholder="パスワードを再入力"
                      error={errors.confirmPassword?.message}
                      validationRules={{
                        required: true,
                        custom: (value) => {
                          if (value !== watchedValues.password) {
                            return 'パスワードが一致しません';
                          }
                          return null;
                        },
                      }}
                      {...register('confirmPassword')}
                    />
                  </div>
                </div>

                {/* 薬剤師用フィールド */}
                {selectedRole === 'pharmacist' && (
                  <>
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">個人情報</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        <DateSelector
                          label="生年月日"
                          value={watchedValues.birth_date || ''}
                          onChange={(value) => setValue('birth_date', value)}
                          error={errors.birth_date?.message}
                          required
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
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">連絡先情報</h3>
                      <div className="space-y-4">
                        <div>
                          <Input
                            label="携帯電話番号"
                            placeholder="09012345678"
                            error={errors.phone_mobile?.message}
                            validationRules={{
                              required: true,
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
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">住所情報</h3>
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

                      <div className="mt-4 space-y-4">
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
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">薬剤師情報</h3>
                      <div className="space-y-4">
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
                        
                        <DateSelector
                          label="免許取得日"
                          value={watchedValues.license_date || ''}
                          onChange={(value) => setValue('license_date', value)}
                          error={errors.license_date?.message}
                          required
                        />

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

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">緊急連絡先</h3>
                      <div className="space-y-4">
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
                  </>
                )}

                {/* 管理者用フィールド */}
                {selectedRole === 'pharmacy_admin' && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">薬局情報</h3>
                    <div className="space-y-4">
                      <Input
                        label="薬局名"
                        placeholder="○○薬局"
                        error={errors.pharmacy_name?.message}
                        validationRules={{
                          required: true,
                          maxLength: 100,
                        }}
                        {...register('pharmacy_name')}
                      />

                      <PostalCodeInput
                        postalCode={watchedValues.pharmacy_postal_code || ''}
                        prefecture={watchedValues.pharmacy_prefecture || ''}
                        city={watchedValues.pharmacy_city || ''}
                        address={watchedValues.pharmacy_address || ''}
                        onPostalCodeChange={(value) => setValue('pharmacy_postal_code', value)}
                        onPrefectureChange={(value) => setValue('pharmacy_prefecture', value)}
                        onCityChange={(value) => setValue('pharmacy_city', value)}
                        onAddressChange={(value) => setValue('pharmacy_address', value)}
                        errors={{
                          postal_code: errors.pharmacy_postal_code?.message,
                          prefecture: errors.pharmacy_prefecture?.message,
                          city: errors.pharmacy_city?.message,
                          address: errors.pharmacy_address?.message,
                        }}
                      />

                      <div className="mt-4 space-y-4">
                        <div>
                          <Input
                            label="電話番号"
                            placeholder="0312345678"
                            error={errors.pharmacy_phone?.message}
                            validationRules={{
                              required: true,
                              custom: (value) => {
                                if (!value) return null;
                                const phonePattern = /^[0-9]{10,11}$/;
                                if (!phonePattern.test(value)) {
                                  return '正しい電話番号を入力してください（ハイフンなし、10-11桁）';
                                }
                                return null;
                              },
                            }}
                            {...register('pharmacy_phone')}
                          />
                          <p className="mt-1 text-xs text-gray-500">※ ハイフン（-）なしで入力してください</p>
                        </div>
                        
                        <div>
                          <Input
                            label="FAX番号"
                            placeholder="0312345679"
                            error={errors.pharmacy_fax?.message}
                            validationRules={{
                              custom: (value) => {
                                if (!value) return null;
                                const phonePattern = /^[0-9]{10,11}$/;
                                if (!phonePattern.test(value)) {
                                  return '正しいFAX番号を入力してください（ハイフンなし、10-11桁）';
                                }
                                return null;
                              },
                            }}
                            {...register('pharmacy_fax')}
                          />
                          <p className="mt-1 text-xs text-gray-500">※ ハイフン（-）なしで入力してください</p>
                        </div>

                        <Input
                          label="薬局メールアドレス"
                          type="email"
                          placeholder="info@pharmacy.com"
                          error={errors.pharmacy_email?.message}
                          validationRules={{
                            email: true,
                          }}
                          {...register('pharmacy_email')}
                        />
                        
                        <Input
                          label="薬局免許番号"
                          placeholder="薬局-123456"
                          error={errors.pharmacy_license_number?.message}
                          validationRules={{
                            maxLength: 50,
                          }}
                          {...register('pharmacy_license_number')}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-red-600 font-medium">登録エラー</p>
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  icon={UserPlus}
                >
                  アカウント作成
                </Button>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              既にアカウントをお持ちの場合は{' '}
              <button
                onClick={onToggleMode}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                ログイン
              </button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 役割変更確認ダイアログ */}
      {showRoleChangeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">役割変更の確認</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              役割を変更すると、現在入力されている情報が削除されます。
              基本情報（メールアドレス、パスワード）は保持されますが、
              その他の入力内容は失われます。
            </p>
            
            <p className="text-gray-600 mb-6 font-medium">
              本当に役割を変更しますか？
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={cancelRoleChange}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                variant="danger"
                onClick={confirmRoleChange}
                className="flex-1"
              >
                変更する
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};