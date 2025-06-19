import React from 'react';
import { useAuthStore } from '../../stores/auth';
import { 
  Users, 
  Calendar, 
  User, 
  Clock, 
  BarChart3, 
  Settings,
  Home
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'pharmacy_admin';

  const adminNavItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: BarChart3 },
    { id: 'pharmacists', label: '薬剤師管理', icon: Users },
    { id: 'schedules', label: 'シフト管理', icon: Calendar },
    { id: 'reports', label: 'レポート', icon: BarChart3 },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  const pharmacistNavItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: Home },
    { id: 'profile', label: 'プロフィール', icon: User },
    { id: 'schedule', label: 'スケジュール', icon: Calendar },
    { id: 'timesheet', label: '勤務実績', icon: Clock },
  ];

  const navItems = isAdmin ? adminNavItems : pharmacistNavItems;

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen">
      <div className="p-4">
        {/* ナビゲーションメニュー */}
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ユーザー情報表示 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              ログイン中
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {profile?.role === 'pharmacy_admin' ? '管理者' : '薬剤師'}
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
};