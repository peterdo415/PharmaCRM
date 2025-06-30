import React, { useEffect, useState } from 'react';
import { useAuthStore } from './stores/auth';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Breadcrumb } from './components/layout/Breadcrumb';
import { LoginForm } from './components/auth/LoginForm';
import { SignUpForm } from './components/auth/SignUpForm';
import { PharmacistList } from './components/pharmacist/PharmacistList';
import { PharmacistForm } from './components/pharmacist/PharmacistForm';
import { ProfileContainer } from './components/profile/ProfileContainer';
import { Shifts } from './pages/Shifts';

function App() {
  const { user, session, loading, initialized, initialize, profile } = useAuthStore();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showPharmacistForm, setShowPharmacistForm] = useState(false);

  useEffect(() => {
    // アプリ起動時に認証状態を初期化
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setShowPharmacistForm(false);
  };

  const handleCreatePharmacist = () => {
    setShowPharmacistForm(true);
  };

  const handlePharmacistFormBack = () => {
    setShowPharmacistForm(false);
  };

  const handlePharmacistFormSuccess = () => {
    setShowPharmacistForm(false);
    setCurrentPage('pharmacists');
  };

  const handleViewPharmacist = (id: string) => {
    console.log('View pharmacist:', id);
    // TODO: Implement pharmacist detail view
  };

  // 初期化中またはローディング中の表示
  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ユーザーがログインしていない場合
  if (!user || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">PharmaCRM</h1>
            <p className="text-gray-600">薬局管理システム</p>
          </div>
          
          {authMode === 'login' ? (
            <LoginForm onToggleMode={toggleAuthMode} />
          ) : (
            <SignUpForm onToggleMode={toggleAuthMode} />
          )}
        </div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'pharmacy_admin';

  const renderContent = () => {
    if (showPharmacistForm) {
      return (
        <PharmacistForm
          onBack={handlePharmacistFormBack}
          onSuccess={handlePharmacistFormSuccess}
        />
      );
    }

    switch (currentPage) {
      case 'pharmacists':
        return (
          <PharmacistList
            onCreatePharmacist={handleCreatePharmacist}
            onViewPharmacist={handleViewPharmacist}
          />
        );
      case 'profile':
        return <ProfileContainer />;
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
              <p className="text-gray-600">
                {isAdmin ? '薬局CRMシステムの管理画面' : '薬剤師ポータル'}
              </p>
            </div>

            {/* 統計カード - 役割別表示 */}
            {isAdmin ? (
              // 管理者用統計
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">薬剤師数</h3>
                  <p className="text-3xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-gray-500 mt-2">登録済み薬剤師</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">今日の勤務</h3>
                  <p className="text-3xl font-bold text-teal-600">8</p>
                  <p className="text-sm text-gray-500 mt-2">本日勤務予定</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">月間勤務時間</h3>
                  <p className="text-3xl font-bold text-orange-600">1,240h</p>
                  <p className="text-sm text-gray-500 mt-2">今月の総勤務時間</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">未承認申請</h3>
                  <p className="text-3xl font-bold text-red-600">3</p>
                  <p className="text-sm text-gray-500 mt-2">承認待ち</p>
                </div>
              </div>
            ) : (
              // 薬剤師用統計
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">今月の勤務日数</h3>
                  <p className="text-3xl font-bold text-blue-600">18</p>
                  <p className="text-sm text-gray-500 mt-2">今月の勤務実績</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">今月の勤務時間</h3>
                  <p className="text-3xl font-bold text-teal-600">144h</p>
                  <p className="text-sm text-gray-500 mt-2">総勤務時間</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">次回勤務</h3>
                  <p className="text-3xl font-bold text-orange-600">明日</p>
                  <p className="text-sm text-gray-500 mt-2">9:00-18:00</p>
                </div>
              </div>
            )}
            
            {/* クイックアクション - 管理者のみ表示 */}
            {isAdmin && (
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => handlePageChange('pharmacists')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                        <span className="text-blue-600 font-semibold text-sm">👥</span>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900">薬剤師管理</h4>
                    <p className="text-sm text-gray-600 mt-1">薬剤師の登録・管理</p>
                  </button>
                  
                  <button
                    onClick={() => handlePageChange('schedules')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors duration-200">
                        <span className="text-teal-600 font-semibold text-sm">📅</span>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900">シフト管理</h4>
                    <p className="text-sm text-gray-600 mt-1">勤務スケジュール管理</p>
                  </button>
                  
                  <button
                    onClick={() => handlePageChange('reports')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-200">
                        <span className="text-orange-600 font-semibold text-sm">📊</span>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900">レポート</h4>
                    <p className="text-sm text-gray-600 mt-1">勤務実績・分析</p>
                  </button>
                  
                  <button
                    onClick={() => handlePageChange('settings')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-200">
                        <span className="text-gray-600 font-semibold text-sm">⚙️</span>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900">設定</h4>
                    <p className="text-sm text-gray-600 mt-1">システム設定</p>
                  </button>
                </div>
              </div>
            )}

            {/* 最近の活動 / お知らせ */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isAdmin ? '最近の活動' : 'お知らせ'}
              </h3>
              <div className="space-y-3">
                {isAdmin ? (
                  <>
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">新しい薬剤師が登録されました</p>
                        <p className="text-xs text-gray-500">2時間前</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-teal-50 rounded-lg">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">シフト申請が承認待ちです</p>
                        <p className="text-xs text-gray-500">4時間前</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">月次レポートが生成されました</p>
                        <p className="text-xs text-gray-500">6時間前</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">来週のシフトが確定しました</p>
                        <p className="text-xs text-gray-500">1時間前</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">勤務実績の入力をお忘れなく</p>
                        <p className="text-xs text-gray-500">3時間前</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-teal-50 rounded-lg">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">資格更新のお知らせ</p>
                        <p className="text-xs text-gray-500">1日前</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      case 'schedules':
        return <Shifts />;
      case 'schedule':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">スケジュール</h2>
              <p className="text-gray-600">個人スケジュール管理機能（開発予定）</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200 text-center">
              <p className="text-gray-500">この機能は開発中です</p>
            </div>
          </div>
        );
      case 'timesheet':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">勤務実績</h2>
              <p className="text-gray-600">勤務実績管理機能（開発予定）</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200 text-center">
              <p className="text-gray-500">この機能は開発中です</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">レポート</h2>
              <p className="text-gray-600">勤務実績・分析レポート機能（開発予定）</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200 text-center">
              <p className="text-gray-500">この機能は開発中です</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">設定</h2>
              <p className="text-gray-600">システム設定機能（開発予定）</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200 text-center">
              <p className="text-gray-500">この機能は開発中です</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">ページが見つかりません</h2>
              <p className="text-gray-600">指定されたページは存在しません</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200 text-center">
              <button
                onClick={() => handlePageChange('dashboard')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                ダッシュボードに戻る
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onPageChange={handlePageChange} />
      <div className="flex">
        <Navigation currentPage={currentPage} onPageChange={handlePageChange} />
        <main className="flex-1 p-6 overflow-auto">
          <Breadcrumb currentPage={currentPage} onPageChange={handlePageChange} />
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;