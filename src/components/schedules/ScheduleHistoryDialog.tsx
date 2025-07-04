import React, { useState, useEffect } from 'react';
import { ScheduleChangeHistory, scheduleService } from '../../lib/schedules';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  X, 
  History, 
  Clock, 
  Calendar, 
  Users, 
  XCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ScheduleHistoryDialogProps {
  scheduleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleHistoryDialog: React.FC<ScheduleHistoryDialogProps> = ({
  scheduleId,
  isOpen,
  onClose
}) => {
  const [history, setHistory] = useState<ScheduleChangeHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && scheduleId) {
      loadHistory();
    }
  }, [isOpen, scheduleId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const historyData = await scheduleService.getScheduleChangeHistory(scheduleId);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'cancel':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'reschedule':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'substitute':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'update':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'cancel':
        return 'キャンセル';
      case 'reschedule':
        return '日時変更';
      case 'substitute':
        return '代替薬剤師';
      case 'update':
        return '内容更新';
      default:
        return '変更';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderChangeDetails = (change: ScheduleChangeHistory) => {
    const details = [];

    if (change.old_schedule_date !== change.new_schedule_date) {
      details.push(
        <div key="date" className="text-sm">
          <span className="font-medium">日付:</span> {change.old_schedule_date} → {change.new_schedule_date}
        </div>
      );
    }

    if (change.old_start_time !== change.new_start_time || change.old_end_time !== change.new_end_time) {
      details.push(
        <div key="time" className="text-sm">
          <span className="font-medium">時間:</span> {change.old_start_time}-{change.old_end_time} → {change.new_start_time}-{change.new_end_time}
        </div>
      );
    }

    if (change.old_work_location !== change.new_work_location) {
      details.push(
        <div key="location" className="text-sm">
          <span className="font-medium">場所:</span> {change.old_work_location || '未設定'} → {change.new_work_location || '未設定'}
        </div>
      );
    }

    if (change.old_work_description !== change.new_work_description) {
      details.push(
        <div key="description" className="text-sm">
          <span className="font-medium">業務内容:</span> {change.old_work_description || '未設定'} → {change.new_work_description || '未設定'}
        </div>
      );
    }

    if (change.old_status !== change.new_status) {
      details.push(
        <div key="status" className="text-sm">
          <span className="font-medium">ステータス:</span> {change.old_status} → {change.new_status}
        </div>
      );
    }

    if (change.old_pharmacist_id !== change.new_pharmacist_id) {
      details.push(
        <div key="pharmacist" className="text-sm">
          <span className="font-medium">薬剤師:</span> {(change as any).old_pharmacist?.last_name} {(change as any).old_pharmacist?.first_name} → {(change as any).new_pharmacist?.last_name} {(change as any).new_pharmacist?.first_name}
        </div>
      );
    }

    return details.length > 0 ? details : (
      <div className="text-sm text-gray-500">変更の詳細はありません</div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <History className="w-5 h-5 mr-2" />
              スケジュール変更履歴
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
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
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              変更履歴はありません
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((change) => (
                <div
                  key={change.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getChangeTypeIcon(change.change_type)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {getChangeTypeLabel(change.change_type)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDateTime(change.created_at)} • {(change as any).changed_user?.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {change.change_reason && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="text-sm">
                        <span className="font-medium text-yellow-800">理由:</span>
                        <span className="text-yellow-700 ml-2">{change.change_reason}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 space-y-1 text-gray-600">
                    {renderChangeDetails(change)}
                  </div>

                  {change.suggested_pharmacist_id && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-sm">
                        <span className="font-medium text-blue-800">提案された代替薬剤師:</span>
                        <span className="text-blue-700 ml-2">
                          {(change as any).suggested_pharmacist?.last_name} {(change as any).suggested_pharmacist?.first_name}
                        </span>
                        {change.substitute_accepted !== null && (
                          <span className={`ml-2 ${change.substitute_accepted ? 'text-green-600' : 'text-red-600'}`}>
                            ({change.substitute_accepted ? '承認済み' : '却下'})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};