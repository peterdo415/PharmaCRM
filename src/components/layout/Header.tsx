import React from 'react';
import { useAuthStore } from '../../stores/auth';
import { Button } from '../ui/Button';
import { LogOut, User, Settings } from 'lucide-react';

interface HeaderProps {
  onPageChange?: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onPageChange }) => {
  const { user, session, profile, signOut } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleLogoClick = () => {
    if (onPageChange) {
      onPageChange('dashboard');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ部分 - クリック可能でダッシュボードに戻る */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button
                onClick={handleLogoClick}
                className="group transition-all duration-200 hover:bg-blue-50 rounded-lg p-2 -m-2"
              >
                <h1 className="text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-200">
                  PharmaCRM
                </h1>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && session && (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user.email}</span>
                  {profile && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {profile.role === 'pharmacy_admin' ? '管理者' : '薬剤師'}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    セッション有効
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Settings}
                >
                  設定
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={LogOut}
                  onClick={handleSignOut}
                >
                  ログアウト
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};