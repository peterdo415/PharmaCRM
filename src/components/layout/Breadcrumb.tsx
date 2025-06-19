import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  page?: string;
}

interface BreadcrumbProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentPage, onPageChange }) => {
  const getBreadcrumbItems = (page: string): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'ダッシュボード', page: 'dashboard' }
    ];

    switch (page) {
      case 'dashboard':
        return [{ label: 'ダッシュボード' }];
      case 'pharmacists':
        return [
          ...items,
          { label: '薬剤師管理' }
        ];
      case 'schedules':
        return [
          ...items,
          { label: 'シフト管理' }
        ];
      case 'profile':
        return [
          ...items,
          { label: 'プロフィール' }
        ];
      case 'schedule':
        return [
          ...items,
          { label: 'スケジュール' }
        ];
      case 'timesheet':
        return [
          ...items,
          { label: '勤務実績' }
        ];
      case 'reports':
        return [
          ...items,
          { label: 'レポート' }
        ];
      case 'settings':
        return [
          ...items,
          { label: '設定' }
        ];
      default:
        return [
          ...items,
          { label: 'ページが見つかりません' }
        ];
    }
  };

  const breadcrumbItems = getBreadcrumbItems(currentPage);

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Home className="w-4 h-4" />
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
          {item.page && index < breadcrumbItems.length - 1 ? (
            <button
              onClick={() => onPageChange(item.page!)}
              className="hover:text-blue-600 transition-colors duration-200"
            >
              {item.label}
            </button>
          ) : (
            <span className={index === breadcrumbItems.length - 1 ? 'text-gray-900 font-medium' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};