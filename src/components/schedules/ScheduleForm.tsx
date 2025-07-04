import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Schedule, CreateScheduleData, UpdateScheduleData, scheduleService } from '../../lib/schedules';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  Save, 
  X, 
  Clock, 
  FileText,
  AlertCircle,
  Edit,
  History
} from 'lucide-react';

const scheduleFormSchema = z.object({
  pharmacist_id: z.string().min(1, '薬剤師を選択してください'),
  schedule_date: z.string().min(1, '勤務日を入力してください'),
  start_time: z.string().min(1, '開始時間を入力してください'),
  end_time: z.string().min(1, '終了時間を入力してください'),
  break_duration: z.number().min(0, '休憩時間は0分以上で入力してください').optional(),
  work_type: z.enum(['regular', 'overtime', 'holiday', 'emergency']).optional(),
  work_location: z.string().optional(),
  work_description: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).optional(),
}).refine((data) => {
  const startTime = new Date(`2000-01-01T${data.start_time}`);
  const endTime = new Date(`2000-01-01T${data.end_time}`);
  return endTime > startTime;
}, {
  message: '終了時間は開始時間より後に設定してください',
  path: ['end_time'],
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

interface ScheduleFormProps {
  schedule?: Schedule;
  defaultDate?: string;
  defaultPharmacistId?: string;
  onSubmit: (schedule: Schedule) => void;
  onCancel: () => void;
  onShowChangeDialog?: () => void;
  onShowHistory?: () => void;
}

interface Pharmacist {
  id: string;
  first_name: string;
  last_name: string;
  user_id: string;
  pharmacy_id: string;
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  schedule,
  defaultDate,
  defaultPharmacistId,
  onSubmit,
  onCancel,
  onShowChangeDialog,
  onShowHistory
}) => {
  console.log('ScheduleForm props:', { schedule: !!schedule, defaultDate, defaultPharmacistId });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([]);
  const { user, profile } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      pharmacist_id: schedule?.pharmacist_id || defaultPharmacistId || '',
      schedule_date: schedule?.schedule_date || defaultDate || '',
      start_time: schedule?.start_time || '09:00',
      end_time: schedule?.end_time || '18:00',
      break_duration: schedule?.break_duration || 0,
      work_type: schedule?.work_type || 'regular',
      work_location: schedule?.work_location || '',
      work_description: schedule?.work_description || '',
      status: schedule?.status || 'scheduled',
    },
  });

  // 薬剤師リストを取得
  useEffect(() => {
    const loadPharmacists = async () => {
      try {
        setError(null);

        if (profile?.role === 'admin') {
          // 管理者の場合は全ての薬剤師を取得
          const { data: pharmacistData, error: pharmacistError } = await supabase
            .from('pharmacists')
            .select('id, first_name, last_name, user_id, pharmacy_id')
            .order('last_name');

          if (pharmacistError) {
            throw new Error('薬剤師情報の取得に失敗しました');
          }

          setPharmacists(pharmacistData || []);
        } else if (profile?.role === 'pharmacist' && profile.pharmacist) {
          // 薬剤師の場合は自分のみ
          setPharmacists([{
            id: profile.pharmacist.id,
            first_name: profile.pharmacist.first_name,
            last_name: profile.pharmacist.last_name,
            user_id: profile.pharmacist.user_id,
            pharmacy_id: profile.pharmacist.pharmacy_id,
          }]);
        }
      } catch (err) {
        console.error('Failed to load pharmacists:', err);
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
      }
    };

    loadPharmacists();
  }, [profile]);

  // スケジュールが変更されたときにフォーム全体を再初期化
  useEffect(() => {
    if (schedule) {
      // 編集モード：スケジュールのデータでフォームを初期化
      reset({
        pharmacist_id: schedule.pharmacist_id,
        schedule_date: schedule.schedule_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        break_duration: schedule.break_duration,
        work_type: schedule.work_type,
        work_location: schedule.work_location || '',
        work_description: schedule.work_description || '',
        status: schedule.status,
      });
    } else {
      // 新規作成モード：デフォルト値でフォームを初期化
      reset({
        pharmacist_id: defaultPharmacistId || '',
        schedule_date: defaultDate || '',
        start_time: '09:00',
        end_time: '18:00',
        break_duration: 0,
        work_type: 'regular',
        work_location: '',
        work_description: '',
        status: 'scheduled',
      });
    }
  }, [schedule, defaultDate, defaultPharmacistId, reset]);

  // 新規作成時のdefaultDateが変更されたときに日付フィールドのみ更新
  useEffect(() => {
    if (!schedule && defaultDate) {
      console.log('Setting schedule_date to:', defaultDate);
      setValue('schedule_date', defaultDate, { shouldValidate: true, shouldDirty: true });
    }
  }, [defaultDate, schedule, setValue]);

  // 新規作成時のdefaultPharmacistIdが変更されたときに薬剤師フィールドのみ更新
  useEffect(() => {
    if (!schedule && defaultPharmacistId) {
      setValue('pharmacist_id', defaultPharmacistId);
    }
  }, [defaultPharmacistId, schedule, setValue]);

  const onFormSubmit = async (data: ScheduleFormData) => {
    try {
      setLoading(true);
      setError(null);

      let result: Schedule;

      if (schedule) {
        // 更新
        const updateData: UpdateScheduleData = {
          schedule_date: data.schedule_date,
          start_time: data.start_time,
          end_time: data.end_time,
          break_duration: data.break_duration || 0,
          work_type: data.work_type,
          work_location: data.work_location || undefined,
          work_description: data.work_description || undefined,
          status: data.status,
        };

        result = await scheduleService.updateSchedule(schedule.id, updateData);
      } else {
        // 新規作成 - pharmacy_idを薬剤師情報から取得
        const selectedPharmacist = pharmacists.find(p => p.id === data.pharmacist_id);
        if (!selectedPharmacist) {
          throw new Error('選択された薬剤師が見つかりません');
        }

        console.log('🔍 Debug Info:');
        console.log('Selected pharmacist:', selectedPharmacist);
        console.log('All pharmacists:', pharmacists);
        console.log('Current user:', user);
        console.log('Current profile:', profile);

        const createData: CreateScheduleData = {
          pharmacist_id: data.pharmacist_id,
          pharmacy_id: selectedPharmacist.pharmacy_id,
          user_id: selectedPharmacist.user_id, // RLSポリシー用にuser_idを追加
          schedule_date: data.schedule_date,
          start_time: data.start_time,
          end_time: data.end_time,
          break_duration: data.break_duration || 0,
          work_type: data.work_type || 'regular',
          work_location: data.work_location || undefined,
          work_description: data.work_description || undefined,
          status: data.status || 'scheduled',
        };

        console.log('🚀 Create data payload:', createData);

        result = await scheduleService.createSchedule(createData);
      }

      onSubmit(result);
    } catch (err) {
      console.error('Failed to save schedule:', err);
      setError(err instanceof Error ? err.message : 'スケジュールの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;
    
    if (!confirm('このスケジュールを削除しますか？')) return;

    try {
      setLoading(true);
      setError(null);

      await scheduleService.deleteSchedule(schedule.id);
      onCancel(); // フォームを閉じる
    } catch (err) {
      console.error('Failed to delete schedule:', err);
      setError(err instanceof Error ? err.message : 'スケジュールの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            {schedule ? 'スケジュール編集' : 'スケジュール作成'}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {schedule && onShowChangeDialog && (
              <Button variant="outline" size="sm" onClick={onShowChangeDialog}>
                <Edit className="w-4 h-4 mr-1" />
                変更
              </Button>
            )}
            {schedule && onShowHistory && (
              <Button variant="outline" size="sm" onClick={onShowHistory}>
                <History className="w-4 h-4 mr-1" />
                履歴
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                薬剤師 <span className="text-red-500">*</span>
              </label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                disabled={profile?.role === 'pharmacist'}
                {...register('pharmacist_id')}
              >
                <option value="">選択してください</option>
                {pharmacists.map((pharmacist) => (
                  <option key={pharmacist.id} value={pharmacist.id}>
                    {pharmacist.last_name} {pharmacist.first_name}
                  </option>
                ))}
              </select>
              {errors.pharmacist_id && (
                <p className="mt-1 text-sm text-red-600">{errors.pharmacist_id.message}</p>
              )}
            </div>

            <Input
              label="勤務日"
              type="date"
              readOnly={true}
              error={errors.schedule_date?.message}
              validationRules={{
                required: true,
              }}
              value={watch('schedule_date')}
              {...register('schedule_date')}
            />
          </div>

          {/* 勤務時間 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">勤務時間</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="開始時間"
                type="time"
                error={errors.start_time?.message}
                validationRules={{
                  required: true,
                }}
                {...register('start_time')}
              />

              <Input
                label="終了時間"
                type="time"
                error={errors.end_time?.message}
                validationRules={{
                  required: true,
                }}
                {...register('end_time')}
              />
            </div>

            <Input
              label="休憩時間（分）"
              type="number"
              min="0"
              error={errors.break_duration?.message}
              {...register('break_duration', { valueAsNumber: true })}
            />
          </div>

          {/* 勤務詳細 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">勤務詳細</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                勤務区分
              </label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                {...register('work_type')}
              >
                <option value="regular">通常勤務</option>
                <option value="overtime">残業</option>
                <option value="holiday">休日勤務</option>
                <option value="emergency">緊急勤務</option>
              </select>
              {errors.work_type && (
                <p className="mt-1 text-sm text-red-600">{errors.work_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                {...register('status')}
              >
                <option value="scheduled">予定</option>
                <option value="confirmed">確定</option>
                <option value="completed">完了</option>
                <option value="cancelled">キャンセル</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            <Input
              label="勤務場所"
              type="text"
              placeholder="勤務場所を入力してください"
              error={errors.work_location?.message}
              {...register('work_location')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                業務内容
              </label>
              <textarea
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                rows={3}
                placeholder="業務内容の詳細"
                {...register('work_description')}
              />
              {errors.work_description && (
                <p className="mt-1 text-sm text-red-600">{errors.work_description.message}</p>
              )}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-between">
            <div>
              {schedule && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  削除
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                loading={loading}
                icon={Save}
              >
                {schedule ? '更新' : '作成'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};