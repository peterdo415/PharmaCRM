import React, { useState, useRef } from 'react';
import { Schedule, scheduleService } from '../lib/schedules';
import { useAuthStore } from '../stores/auth';
import { ScheduleCalendar, ScheduleCalendarRef } from '../components/schedules/ScheduleCalendar';
import { ScheduleForm } from '../components/schedules/ScheduleForm';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  Calendar, 
  List, 
  Grid3X3, 
  Plus,
  X,
  AlertCircle
} from 'lucide-react';

type ViewMode = 'month' | 'week' | 'day';

// 日付をYYYY-MM-DD形式でローカルタイムゾーンで取得する関数
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Shifts: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [defaultDate, setDefaultDate] = useState<string>('');
  const [defaultPharmacistId, setDefaultPharmacistId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<ScheduleCalendarRef>(null);

  const { user, profile } = useAuthStore();

  const handleScheduleClick = async (schedule: Schedule) => {
    try {
      setLoading(true);
      // スケジュールIDから最新の詳細情報を取得
      const detailedSchedule = await scheduleService.getScheduleById(schedule.id);
      setSelectedSchedule(detailedSchedule);
      setShowForm(true);
    } catch (error) {
      console.error('Failed to fetch schedule details:', error);
      // エラーの場合は、カレンダーから渡されたデータを使用
      setSelectedSchedule(schedule);
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = (date: string) => {
    setSelectedSchedule(null);
    setDefaultDate(date);
    setDefaultPharmacistId(profile?.role === 'pharmacist' ? profile.pharmacist?.id || '' : '');
    setShowForm(true);
  };

  const handleFormSubmit = (schedule: Schedule) => {
    // 即座にUIに反映（楽観的更新）
    if (calendarRef.current) {
      if (selectedSchedule) {
        // 更新の場合
        calendarRef.current.updateSchedule(schedule);
      } else {
        // 新規作成の場合
        calendarRef.current.addSchedule(schedule);
      }
    }
    
    setShowForm(false);
    setSelectedSchedule(null);
    setDefaultDate('');
    setDefaultPharmacistId('');
    
    // バックアップとして、少し遅れてカレンダーをリフレッシュ
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedSchedule(null);
    setDefaultDate('');
    setDefaultPharmacistId('');
  };

  const handleScheduleDelete = (scheduleId: string) => {
    // 即座にUIから削除（楽観的更新）
    if (calendarRef.current) {
      calendarRef.current.removeSchedule(scheduleId);
    }
    
    setShowForm(false);
    setSelectedSchedule(null);
    setDefaultDate('');
    setDefaultPharmacistId('');
    
    // バックアップとして、少し遅れてカレンダーをリフレッシュ
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  if (!user || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-600">スケジュール管理にアクセスする権限がありません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">スケジュール管理</h1>
          <p className="text-gray-600">勤務予定の確認・登録・編集</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 表示切り替えボタン */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              icon={Calendar}
            >
              月
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              icon={Grid3X3}
            >
              週
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              icon={List}
            >
              日
            </Button>
          </div>
          
          {/* 新規作成ボタン */}
          <Button
            onClick={() => handleCreateSchedule(formatDateToLocal(new Date()))}
            icon={Plus}
          >
            新規作成
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* カレンダー表示 */}
        <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {loading && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <p className="text-sm text-blue-600">スケジュール詳細を読み込み中...</p>
              </div>
            </div>
          )}
          <ScheduleCalendar
            ref={calendarRef}
            key={refreshKey}
            view={viewMode}
            onScheduleClick={handleScheduleClick}
            onCreateSchedule={handleCreateSchedule}
            refreshTrigger={refreshKey}
          />
        </div>

        {/* フォーム表示 */}
        {showForm && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ScheduleForm
                schedule={selectedSchedule || undefined}
                defaultDate={defaultDate}
                defaultPharmacistId={defaultPharmacistId}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                onDelete={handleScheduleDelete}
              />
            </div>
          </div>
        )}
      </div>

      {/* 使用方法の説明 */}
      {!showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">使用方法</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">表示切り替え</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 月：月間カレンダー表示</li>
                  <li>• 週：週間カレンダー表示</li>
                  <li>• 日：日別詳細表示</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">スケジュール作成</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• カレンダーの日付をクリック</li>
                  <li>• 「新規作成」ボタンを使用</li>
                  <li>• 勤務時間と休憩時間を設定</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">スケジュール編集</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 既存のスケジュールをクリック</li>
                  <li>• 詳細情報の確認・編集</li>
                  <li>• ステータスの変更</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};