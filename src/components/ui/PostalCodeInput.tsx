import React, { useState, useEffect } from 'react';
import { Input } from './Input';
import { MapPin, AlertCircle } from 'lucide-react';

interface AddressOption {
  prefecture: string;
  city: string;
  town: string;
  fullAddress: string;
}

interface PostalCodeInputProps {
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  onPostalCodeChange: (value: string) => void;
  onPrefectureChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  disabled?: boolean;
  errors?: {
    postal_code?: string;
    prefecture?: string;
    city?: string;
    address?: string;
  };
}

export const PostalCodeInput: React.FC<PostalCodeInputProps> = ({
  postalCode,
  prefecture,
  city,
  address,
  onPostalCodeChange,
  onPrefectureChange,
  onCityChange,
  onAddressChange,
  disabled = false,
  errors = {},
}) => {
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  // 郵便番号検索API（zipcloud.ibsnet.co.jp）を使用
  const searchAddress = async (zipCode: string) => {
    if (!zipCode || zipCode.length !== 7) {
      setSearchError('郵便番号は7桁で入力してください');
      return;
    }

    try {
      setLoading(true);
      setSearchError(null);
      setAddressOptions([]);
      setShowOptions(false);

      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipCode}`);
      const data = await response.json();

      if (data.status === 200 && data.results && data.results.length > 0) {
        const options: AddressOption[] = data.results.map((result: any) => ({
          prefecture: result.address1,
          city: result.address2,
          town: result.address3,
          fullAddress: `${result.address1}${result.address2}${result.address3}`,
        }));

        setAddressOptions(options);

        if (options.length === 1) {
          // 選択肢が1つの場合は自動入力
          const option = options[0];
          onPrefectureChange(option.prefecture);
          onCityChange(option.city);
          onAddressChange(option.town);
        } else {
          // 複数の選択肢がある場合は選択画面を表示
          setShowOptions(true);
        }
      } else {
        setSearchError('該当する住所が見つかりませんでした');
      }
    } catch (error) {
      console.error('郵便番号検索エラー:', error);
      setSearchError('住所検索中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePostalCodeChange = (value: string) => {
    // 数字のみを許可
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 7) {
      onPostalCodeChange(numericValue);
      
      // エラーをクリア
      if (searchError) {
        setSearchError(null);
      }
      
      // 選択肢をクリア
      if (showOptions) {
        setShowOptions(false);
        setAddressOptions([]);
      }
    }
  };

  const handleOptionSelect = (option: AddressOption) => {
    onPrefectureChange(option.prefecture);
    onCityChange(option.city);
    onAddressChange(option.town);
    setShowOptions(false);
    setAddressOptions([]);
  };

  // 郵便番号が7桁になったら自動検索
  useEffect(() => {
    if (postalCode.length === 7 && !disabled) {
      searchAddress(postalCode);
    }
  }, [postalCode, disabled]);

  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  return (
    <div className="space-y-4">
      {/* 郵便番号入力 */}
      <div>
        <Input
          label="郵便番号"
          placeholder="1600023"
          value={postalCode}
          onChange={(e) => handlePostalCodeChange(e.target.value)}
          disabled={disabled}
          error={errors.postal_code}
          validationRules={{
            custom: (value) => {
              if (!value) return null;
              // 数字以外が含まれているかチェック
              if (!/^[0-9]*$/.test(value)) {
                return '郵便番号は数字のみで入力してください';
              }
              if (value.length !== 7) {
                return '郵便番号は7桁で入力してください';
              }
              return null;
            },
          }}
        />
        <p className="mt-1 text-xs text-gray-500">※ ハイフン（-）なしで入力してください（例：1600023）</p>
        
        {loading && (
          <div className="mt-2 flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
            住所を検索中...
          </div>
        )}
        
        {searchError && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{searchError}</p>
            </div>
          </div>
        )}
      </div>

      {/* 住所選択肢 */}
      {showOptions && addressOptions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <MapPin className="w-4 h-4 text-blue-600 mr-2" />
            <h4 className="text-sm font-medium text-blue-900">住所を選択してください</h4>
          </div>
          <div className="space-y-2">
            {addressOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleOptionSelect(option)}
                className="w-full text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
              >
                <div className="text-sm font-medium text-gray-900">
                  {option.fullAddress}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {option.prefecture} {option.city} {option.town}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 都道府県 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          都道府県 <span className="text-red-500">*</span>
        </label>
        <select
          value={prefecture}
          onChange={(e) => onPrefectureChange(e.target.value)}
          disabled={disabled}
          className={`block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 ${
            disabled ? 'bg-gray-50 text-gray-500' : ''
          }`}
        >
          <option value="">選択してください</option>
          {prefectures.map((pref) => (
            <option key={pref} value={pref}>{pref}</option>
          ))}
        </select>
        {errors.prefecture && (
          <p className="mt-1 text-sm text-red-600">{errors.prefecture}</p>
        )}
      </div>

      {/* 市区町村 */}
      <Input
        label="市区町村 *"
        placeholder="新宿区"
        value={city}
        onChange={(e) => onCityChange(e.target.value)}
        disabled={disabled}
        error={errors.city}
      />

      {/* 住所 */}
      <Input
        label="住所 *"
        placeholder="西新宿1-1-1"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        disabled={disabled}
        error={errors.address}
      />
    </div>
  );
};