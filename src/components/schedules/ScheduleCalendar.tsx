import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Schedule, scheduleService } from '../../lib/schedules';
import { useAuthStore } from '../../stores/auth';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ScheduleCalendarProps {
  view?: 'month' | 'week' | 'day';
  onScheduleClick?: (schedule: Schedule) => void;
  onCreateSchedule?: (date: string) => void;
  refreshTrigger?: number;
  onScheduleUpdate?: (schedule: Schedule) => void;
}

export interface ScheduleCalendarRef {
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (schedule: Schedule) => void;
  removeSchedule: (scheduleId: string) => void;
  refreshSchedules: () => void;
}

// 日付をYYYY-MM-DD形式でローカルタイムゾーンで取得する関数
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ScheduleCalendar = forwardRef<ScheduleCalendarRef, ScheduleCalendarProps>(({
  view = 'month',
  onScheduleClick,
  onCreateSchedule,
  refreshTrigger,
  onScheduleUpdate
}, ref) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuthStore();

  // カレンダー表示用の日付配列を生成
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // 日曜日から開始
    
    const days = [];
    const current = new Date(startDate);
    
    // 6週分の日付を生成
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }
    
    return days;
  };

  // 週表示用の日付配列を生成
  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // スケジュールデータを取得
  const loadSchedules = async () => {
    if (!user || !profile) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let schedulesData: Schedule[] = [];
      
      // 薬剤師の場合、自分のスケジュールのみ取得
      const pharmacistId = profile.role === 'pharmacist' && profile.pharmacist 
        ? profile.pharmacist.id 
        : undefined;
      
      if (view === 'month') {
        schedulesData = await scheduleService.getMonthlySchedules(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          pharmacistId
        );
      } else if (view === 'week') {
        schedulesData = await scheduleService.getWeeklySchedules(
          currentDate,
          pharmacistId
        );
      } else if (view === 'day') {
        schedulesData = await scheduleService.getDailySchedules(
          formatDateToLocal(currentDate),
          pharmacistId
        );
      }
      
      setSchedules(schedulesData);
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setError(err instanceof Error ? err.message : 'スケジュールの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [currentDate, view, user, profile, refreshTrigger]);

  // 楽観的更新：新しいスケジュールを即座にUIに追加
  const addScheduleOptimistically = (newSchedule: Schedule) => {
    setSchedules(prevSchedules => {
      // 既存のスケジュールと重複しないかチェック
      const exists = prevSchedules.some(schedule => schedule.id === newSchedule.id);
      if (exists) {
        // 更新の場合
        return prevSchedules.map(schedule => 
          schedule.id === newSchedule.id ? newSchedule : schedule
        );
      } else {
        // 新規追加の場合
        return [...prevSchedules, newSchedule];
      }
    });
  };

  // 楽観的更新：スケジュールを削除
  const removeScheduleOptimistically = (scheduleId: string) => {
    setSchedules(prevSchedules => 
      prevSchedules.filter(schedule => schedule.id !== scheduleId)
    );
  };

  // スケジュール更新時のコールバック
  useEffect(() => {
    if (onScheduleUpdate) {
      // 外部からスケジュール更新を受け取る仕組み（今回は使用しないが将来の拡張用）
    }
  }, [onScheduleUpdate]);

  // 外部から呼び出し可能な関数を公開
  useImperativeHandle(ref, () => ({
    addSchedule: addScheduleOptimistically,
    updateSchedule: addScheduleOptimistically,
    removeSchedule: removeScheduleOptimistically,
    refreshSchedules: loadSchedules
  }));

  // 特定の日付のスケジュールを取得
  const getSchedulesForDate = (date: Date): Schedule[] => {
    const dateStr = formatDateToLocal(date);
    return schedules.filter(schedule => schedule.schedule_date === dateStr);
  };

  // ステータスアイコンを取得
  const getStatusIcon = (status: Schedule['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-3 h-3 text-blue-500" />;
      case 'confirmed':
        return <CheckCircle className="w-3 h-3 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  // ナビゲーション関数
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // フォーマット関数
  const formatDateHeader = () => {
    if (view === 'month') {
      return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()} - ${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`;
    } else {
      return `${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
    }
  };

  const renderMonthView = () => {
    const days = generateCalendarDays();
    const today = new Date();
    const currentMonth = currentDate.getMonth();

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* 曜日ヘッダー */}
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div key={day} className={`p-2 text-center text-sm font-medium ${
            index === 0 || index === 6 ? 'text-red-600' : 'text-gray-700'
          }`}>
            {day}
          </div>
        ))}
        
        {/* 日付セル */}
        {days.map((date, index) => {
          const daySchedules = getSchedulesForDate(date);
          const isToday = date.toDateString() === today.toDateString();
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div
              key={index}
              className={`min-h-24 border border-gray-200 p-1 ${
                !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              } ${isToday ? 'bg-blue-50 border-blue-300' : ''} 
              hover:bg-gray-50 cursor-pointer relative`}
              onClick={() => onCreateSchedule?.(formatDateToLocal(date))}
            >
              <div className={`text-sm ${
                !isCurrentMonth ? 'text-gray-400' : isWeekend ? 'text-red-600' : 'text-gray-900'
              } ${isToday ? 'font-bold' : ''}`}>
                {date.getDate()}
              </div>
              
              <div className="space-y-1 mt-1">
                {daySchedules.slice(0, 2).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="text-xs p-1 rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onScheduleClick?.(schedule);
                    }}
                  >
                    {getStatusIcon(schedule.status)}
                    <span className="ml-1 truncate">
                      {schedule.start_time.slice(0, 5)}-{schedule.end_time.slice(0, 5)}
                    </span>
                  </div>
                ))}
                {daySchedules.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{daySchedules.length - 2}件
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = generateWeekDays();
    const today = new Date();

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const daySchedules = getSchedulesForDate(date);
          const isToday = date.toDateString() === today.toDateString();
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div key={index} className={`border border-gray-200 ${
              isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
            }`}>
              <div className={`p-2 text-center border-b border-gray-200 ${
                isWeekend ? 'text-red-600' : 'text-gray-900'
              } ${isToday ? 'font-bold' : ''}`}>
                <div className="text-sm">{date.getMonth() + 1}/{date.getDate()}</div>
                <div className="text-xs">
                  {['日', '月', '火', '水', '木', '金', '土'][date.getDay()]}
                </div>
              </div>
              
              <div className="p-2 space-y-1 min-h-32">
                {daySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="text-xs p-2 rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200"
                    onClick={() => onScheduleClick?.(schedule)}
                  >
                    <div className="flex items-center">
                      {getStatusIcon(schedule.status)}
                      <span className="ml-1 font-medium">
                        {schedule.start_time.slice(0, 5)}-{schedule.end_time.slice(0, 5)}
                      </span>
                    </div>
                    {schedule.work_type !== 'regular' && (
                      <div className="mt-1 text-xs">
                        {schedule.work_type === 'overtime' ? '残業' : 
                         schedule.work_type === 'holiday' ? '休日' : '緊急'}
                      </div>
                    )}
                  </div>
                ))}
                
                <button
                  className="w-full text-xs p-1 border border-dashed border-gray-300 rounded text-gray-500 hover:bg-gray-50"
                  onClick={() => onCreateSchedule?.(formatDateToLocal(date))}
                >
                  + スケジュール追加
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const daySchedules = getSchedulesForDate(currentDate);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月{currentDate.getDate()}日
            ({['日', '月', '火', '水', '木', '金', '土'][currentDate.getDay()]})
          </h3>
          <Button
            size="sm"
            onClick={() => onCreateSchedule?.(formatDateToLocal(currentDate))}
            icon={Plus}
          >
            スケジュール追加
          </Button>
        </div>
        
        {daySchedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            この日のスケジュールはありません
          </div>
        ) : (
          <div className="space-y-3">
            {daySchedules.map((schedule) => (
              <Card
                key={schedule.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onScheduleClick?.(schedule)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(schedule.status)}
                      <div>
                        <div className="font-medium">
                          {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {schedule.work_type === 'regular' ? '通常勤務' : 
                           schedule.work_type === 'overtime' ? '残業' : 
                           schedule.work_type === 'holiday' ? '休日勤務' : '緊急勤務'}
                          {schedule.break_duration > 0 && ` / 休憩${schedule.break_duration}分`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {profile?.role === 'admin' && schedule.pharmacist && (
                        <div className="text-sm text-gray-600">
                          {schedule.pharmacist.last_name} {schedule.pharmacist.first_name}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 capitalize">
                        {schedule.status === 'scheduled' ? '予定' :
                         schedule.status === 'confirmed' ? '確定' :
                         schedule.status === 'completed' ? '完了' : 'キャンセル'}
                      </div>
                    </div>
                  </div>
                  
                  {schedule.work_description && (
                    <div className="mt-2 text-sm text-gray-600 flex items-start">
                      <FileText className="w-3 h-3 mr-1 mt-0.5" />
                      {schedule.work_description}
                    </div>
                  )}
                  
                  {schedule.work_location && (
                    <div className="mt-1 text-sm text-gray-600 flex items-start">
                      <MapPin className="w-3 h-3 mr-1 mt-0.5" />
                      {schedule.work_location}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!user || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-600">スケジュールカレンダーにアクセスする権限がありません。</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            スケジュールカレンダー
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              今日
            </Button>
            <Button variant="outline" size="sm" onClick={goToNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{formatDateHeader()}</h2>
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
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
          </>
        )}
      </CardContent>
    </Card>
  );
});