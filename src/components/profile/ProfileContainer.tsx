import React from 'react';
import { useAuthStore } from '../../stores/auth';
import { PharmacistProfile } from './PharmacistProfile';
import { AdminProfile } from './AdminProfile';
import { AlertCircle } from 'lucide-react';

export const ProfileContainer: React.FC = () => {
  const { user, profile, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-600">ユーザー情報が見つかりません。再度ログインしてください。</p>
        </div>
      </div>
    );
  }

  // 役割に応じて適切なプロフィールコンポーネントを表示
  switch (profile.role) {
    case 'pharmacist':
      return <PharmacistProfile />;
    case 'pharmacy_admin':
      return <AdminProfile />;
    default:
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-600">
              不明な役割です: {profile.role}
            </p>
          </div>
        </div>
      );
  }
};