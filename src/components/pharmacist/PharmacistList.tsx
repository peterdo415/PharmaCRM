import React, { useEffect } from 'react';
import { usePharmacistStore } from '../../stores/pharmacist';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Plus, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  Award,
  Mail
} from 'lucide-react';

interface PharmacistListProps {
  onCreatePharmacist: () => void;
  onViewPharmacist: (id: string) => void;
}

export const PharmacistList: React.FC<PharmacistListProps> = ({
  onCreatePharmacist,
  onViewPharmacist,
}) => {
  const { pharmacists, loading, error, fetchPharmacists } = usePharmacistStore();

  useEffect(() => {
    fetchPharmacists();
  }, [fetchPharmacists]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">エラーが発生しました: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">薬剤師管理</h2>
          <p className="text-gray-600">登録済み薬剤師の一覧と管理</p>
        </div>
        <Button
          onClick={onCreatePharmacist}
          icon={Plus}
        >
          新規薬剤師登録
        </Button>
      </div>

      {pharmacists.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              薬剤師が登録されていません
            </h3>
            <p className="text-gray-600 mb-6">
              最初の薬剤師を登録してください
            </p>
            <Button onClick={onCreatePharmacist} icon={Plus}>
              薬剤師を登録
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pharmacists.map((pharmacist) => (
            <Card key={pharmacist.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pharmacist.last_name} {pharmacist.first_name}
                    </h3>
                    {pharmacist.last_name_kana && pharmacist.first_name_kana && (
                      <p className="text-sm text-gray-500">
                        {pharmacist.last_name_kana} {pharmacist.first_name_kana}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      薬剤師免許: {pharmacist.license_number}
                    </p>
                  </div>
                  {pharmacist.profile_image_url && (
                    <img
                      src={pharmacist.profile_image_url}
                      alt={`${pharmacist.last_name} ${pharmacist.first_name}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {pharmacist.phone_mobile && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{pharmacist.phone_mobile}</span>
                    </div>
                  )}
                  {pharmacist.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{pharmacist.email}</span>
                    </div>
                  )}
                  {pharmacist.prefecture && pharmacist.city && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{pharmacist.prefecture} {pharmacist.city}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>経験年数: {pharmacist.total_experience_years}年</span>
                  </div>
                  <div className="flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    <span>
                      免許取得: {new Date(pharmacist.license_date).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => onViewPharmacist(pharmacist.id)}
                  >
                    詳細表示
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};