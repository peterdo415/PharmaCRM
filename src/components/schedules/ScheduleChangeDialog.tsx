import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Schedule, 
  ScheduleCancelData, 
  ScheduleRescheduleData, 
  ScheduleSubstituteData,
  scheduleService 
} from '../../lib/schedules';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  X, 
  Clock, 
  Calendar, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

type ChangeType = 'cancel' | 'reschedule' | 'substitute';

interface ScheduleChangeDialogProps {
  schedule: Schedule;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Cancel form schema
const cancelSchema = z.object({
  reason: z.string().optional(),
  suggestSubstitute: z.boolean().optional(),
});

// Reschedule form schema
const rescheduleSchema = z.object({
  new_schedule_date: z.string().min(1, '新しい勤務日を入力してください'),
  new_start_time: z.string().min(1, '新しい開始時間を入力してください'),
  new_end_time: z.string().min(1, '新しい終了時間を入力してください'),
  reason: z.string().optional(),
}).refine((data) => {
  const startTime = new Date(`2000-01-01T${data.new_start_time}`);
  const endTime = new Date(`2000-01-01T${data.new_end_time}`);
  return endTime > startTime;
}, {
  message: '終了時間は開始時間より後に設定してください',
  path: ['new_end_time'],
});

// Substitute form schema
const substituteSchema = z.object({
  new_pharmacist_id: z.string().min(1, '代替薬剤師を選択してください'),
  reason: z.string().optional(),
});

interface Pharmacist {
  id: string;
  first_name: string;
  last_name: string;
  user_id: string;
  compatibilityScore?: number;
  commonSpecialties?: number;
  experienceDiff?: number;
  experience_years?: number;
}

export const ScheduleChangeDialog: React.FC<ScheduleChangeDialogProps> = ({
  schedule,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [changeType, setChangeType] = useState<ChangeType>('cancel');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedPharmacists, setSuggestedPharmacists] = useState<Pharmacist[]>([]);

  // Forms
  const cancelForm = useForm({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      reason: '',
      suggestSubstitute: false,
    },
  });

  const rescheduleForm = useForm({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      new_schedule_date: schedule.schedule_date,
      new_start_time: schedule.start_time,
      new_end_time: schedule.end_time,
      reason: '',
    },
  });

  const substituteForm = useForm({
    resolver: zodResolver(substituteSchema),
    defaultValues: {
      new_pharmacist_id: '',
      reason: '',
    },
  });

  // Load suggested pharmacists for substitute
  useEffect(() => {
    if (changeType === 'substitute') {
      loadSuggestedPharmacists();
    }
  }, [changeType, schedule.id]);

  const loadSuggestedPharmacists = async () => {
    try {
      const pharmacists = await scheduleService.getSmartSubstituteSuggestions(schedule.id);
      setSuggestedPharmacists(pharmacists);
    } catch (err) {
      console.error('Failed to load suggested pharmacists:', err);
      setError('代替薬剤師の取得に失敗しました');
    }
  };

  const handleCancel = async (data: ScheduleCancelData) => {
    try {
      setLoading(true);
      setError(null);
      
      await scheduleService.cancelSchedule(schedule.id, data);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'キャンセルに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (data: ScheduleRescheduleData) => {
    try {
      setLoading(true);
      setError(null);
      
      await scheduleService.rescheduleSchedule(schedule.id, data);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スケジュール変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubstitute = async (data: ScheduleSubstituteData) => {
    try {
      setLoading(true);
      setError(null);
      
      await scheduleService.substitutePharmacist(schedule.id, data);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '代替薬剤師の設定に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getChangeTypeIcon = (type: ChangeType) => {
    switch (type) {
      case 'cancel':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'reschedule':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'substitute':
        return <Users className="w-5 h-5 text-green-500" />;
    }
  };

  const getChangeTypeLabel = (type: ChangeType) => {
    switch (type) {
      case 'cancel':
        return 'キャンセル';
      case 'reschedule':
        return '日時変更';
      case 'substitute':
        return '代替薬剤師';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              スケジュール変更
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current schedule info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">現在のスケジュール</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>日時: {schedule.schedule_date} {schedule.start_time} - {schedule.end_time}</p>
              <p>薬剤師: {schedule.pharmacist?.last_name} {schedule.pharmacist?.first_name}</p>
              {schedule.work_location && <p>場所: {schedule.work_location}</p>}
              {schedule.work_description && <p>業務: {schedule.work_description}</p>}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Change type selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              変更内容を選択してください
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['cancel', 'reschedule', 'substitute'] as ChangeType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    changeType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setChangeType(type)}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {getChangeTypeIcon(type)}
                    <span className="text-sm font-medium">{getChangeTypeLabel(type)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cancel form */}
          {changeType === 'cancel' && (
            <form onSubmit={cancelForm.handleSubmit(handleCancel)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  キャンセル理由（任意）
                </label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  rows={3}
                  placeholder="キャンセルの理由を入力してください"
                  {...cancelForm.register('reason')}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="suggestSubstitute"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...cancelForm.register('suggestSubstitute')}
                />
                <label htmlFor="suggestSubstitute" className="ml-2 text-sm text-gray-700">
                  代替薬剤師の提案を求める
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  キャンセル
                </Button>
                <Button type="submit" variant="danger" loading={loading}>
                  スケジュールをキャンセル
                </Button>
              </div>
            </form>
          )}

          {/* Reschedule form */}
          {changeType === 'reschedule' && (
            <form onSubmit={rescheduleForm.handleSubmit(handleReschedule)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="新しい勤務日"
                  type="date"
                  error={rescheduleForm.formState.errors.new_schedule_date?.message}
                  {...rescheduleForm.register('new_schedule_date')}
                />
                <Input
                  label="新しい開始時間"
                  type="time"
                  error={rescheduleForm.formState.errors.new_start_time?.message}
                  {...rescheduleForm.register('new_start_time')}
                />
                <Input
                  label="新しい終了時間"
                  type="time"
                  error={rescheduleForm.formState.errors.new_end_time?.message}
                  {...rescheduleForm.register('new_end_time')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  変更理由（任意）
                </label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  rows={3}
                  placeholder="変更の理由を入力してください"
                  {...rescheduleForm.register('reason')}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  キャンセル
                </Button>
                <Button type="submit" loading={loading}>
                  スケジュールを変更
                </Button>
              </div>
            </form>
          )}

          {/* Substitute form */}
          {changeType === 'substitute' && (
            <form onSubmit={substituteForm.handleSubmit(handleSubstitute)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  代替薬剤師 <span className="text-red-500">*</span>
                </label>
                
                {suggestedPharmacists.length > 0 ? (
                  <div className="space-y-3">
                    {suggestedPharmacists.map((pharmacist) => (
                      <div
                        key={pharmacist.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          substituteForm.watch('new_pharmacist_id') === pharmacist.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => substituteForm.setValue('new_pharmacist_id', pharmacist.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="new_pharmacist_id"
                              value={pharmacist.id}
                              checked={substituteForm.watch('new_pharmacist_id') === pharmacist.id}
                              onChange={() => substituteForm.setValue('new_pharmacist_id', pharmacist.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {pharmacist.last_name} {pharmacist.first_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                経験年数: {pharmacist.experience_years || 0}年
                                {pharmacist.commonSpecialties && pharmacist.commonSpecialties > 0 && (
                                  <span className="ml-2">
                                    • 共通専門分野: {pharmacist.commonSpecialties}個
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {pharmacist.compatibilityScore && (
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                pharmacist.compatibilityScore >= 7 ? 'text-green-600' :
                                pharmacist.compatibilityScore >= 5 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                適合度: {pharmacist.compatibilityScore}/10
                              </div>
                              <div className="text-xs text-gray-500">
                                {pharmacist.compatibilityScore >= 8 ? '非常に適合' :
                                 pharmacist.compatibilityScore >= 6 ? '適合' :
                                 pharmacist.compatibilityScore >= 4 ? 'やや適合' : '要検討'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-lg">
                    代替薬剤師が見つかりませんでした
                  </div>
                )}
                
                {substituteForm.formState.errors.new_pharmacist_id && (
                  <p className="mt-2 text-sm text-red-600">
                    {substituteForm.formState.errors.new_pharmacist_id.message}
                  </p>
                )}
              </div>

              {suggestedPharmacists.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-600">
                    この時間帯に対応可能な薬剤師が見つかりませんでした。
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  代替理由（任意）
                </label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                  rows={3}
                  placeholder="代替の理由を入力してください"
                  {...substituteForm.register('reason')}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  loading={loading}
                  disabled={suggestedPharmacists.length === 0}
                >
                  代替薬剤師を設定
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};