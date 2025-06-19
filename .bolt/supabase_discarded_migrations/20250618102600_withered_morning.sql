-- 薬局CRMアプリ データベーススキーマ
-- 
-- 概要: 薬剤師管理システムのためのPostgreSQLスキーマ
-- 
-- 1. 新しいテーブル
--    - profiles: ユーザープロフィール（認証情報と基本ロール）
--    - pharmacists: 薬剤師の詳細情報
--    - schedules: 勤務スケジュール管理
--    - specialties: 専門分野マスタ（将来の拡張用）
--    - pharmacist_specialties: 薬剤師と専門分野の関連（将来の拡張用）
-- 
-- 2. セキュリティ設定
--    - 全テーブルでRow Level Security (RLS) を有効化
--    - 薬剤師は自分の情報のみアクセス可能
--    - 管理者は全ての情報にアクセス可能
-- 
-- 3. インデックス
--    - パフォーマンス最適化のための適切なインデックス設定

-- プロフィールテーブル（認証情報と基本ロール）
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'pharmacist')) DEFAULT 'pharmacist',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 薬剤師詳細情報テーブル
CREATE TABLE IF NOT EXISTS pharmacists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birth_date date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  phone text NOT NULL,
  mobile_phone text,
  address text NOT NULL,
  postal_code text NOT NULL,
  prefecture text NOT NULL,
  city text NOT NULL,
  license_number text UNIQUE NOT NULL,
  license_date date NOT NULL,
  experience_years integer NOT NULL DEFAULT 0,
  photo_url text,
  emergency_contact text,
  nearest_station text,
  transportation text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- スケジュール管理テーブル
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacist_id uuid REFERENCES pharmacists(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_time integer DEFAULT 0, -- 休憩時間（分）
  status text NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  work_type text NOT NULL CHECK (work_type IN ('regular', 'overtime', 'holiday')) DEFAULT 'regular',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 専門分野マスタテーブル（将来の拡張用）
CREATE TABLE IF NOT EXISTS specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 薬剤師と専門分野の関連テーブル（将来の拡張用）
CREATE TABLE IF NOT EXISTS pharmacist_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacist_id uuid REFERENCES pharmacists(id) ON DELETE CASCADE NOT NULL,
  specialty_id uuid REFERENCES specialties(id) ON DELETE CASCADE NOT NULL,
  skill_level text NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner',
  created_at timestamptz DEFAULT now(),
  UNIQUE(pharmacist_id, specialty_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_pharmacists_user_id ON pharmacists(user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacists_license_number ON pharmacists(license_number);
CREATE INDEX IF NOT EXISTS idx_schedules_pharmacist_id ON schedules(pharmacist_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_pharmacist_specialties_pharmacist_id ON pharmacist_specialties(pharmacist_id);

-- Row Level Security (RLS) の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacists ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacist_specialties ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー設定

-- profiles テーブル
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- pharmacists テーブル
CREATE POLICY "Pharmacists can read own data"
  ON pharmacists
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Pharmacists can update own data"
  ON pharmacists
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Pharmacists can insert own data"
  ON pharmacists
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all pharmacist data"
  ON pharmacists
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- schedules テーブル
CREATE POLICY "Users can read relevant schedules"
  ON schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE id = schedules.pharmacist_id
      AND (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

CREATE POLICY "Users can manage relevant schedules"
  ON schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE id = schedules.pharmacist_id
      AND (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

-- specialties テーブル（全員読み取り可能）
CREATE POLICY "Anyone can read specialties"
  ON specialties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage specialties"
  ON specialties
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- pharmacist_specialties テーブル
CREATE POLICY "Users can read relevant pharmacist specialties"
  ON pharmacist_specialties
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE id = pharmacist_specialties.pharmacist_id
      AND (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

CREATE POLICY "Users can manage relevant pharmacist specialties"
  ON pharmacist_specialties
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE id = pharmacist_specialties.pharmacist_id
      AND (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      ))
    )
  );

-- 更新日時の自動更新用関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacists_updated_at
    BEFORE UPDATE ON pharmacists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 基本的な専門分野データの挿入
INSERT INTO specialties (name, description) VALUES
  ('在宅医療', '在宅での薬物療法管理'),
  ('小児薬物療法', '小児に対する薬物療法'),
  ('がん薬物療法', 'がん治療における薬物療法'),
  ('精神科薬物療法', '精神科領域の薬物療法'),
  ('糖尿病療養指導', '糖尿病患者への療養指導'),
  ('感染制御', '感染症の予防と制御'),
  ('緩和医療', '終末期医療における薬物療法'),
  ('漢方薬', '漢方薬による治療')
ON CONFLICT (name) DO NOTHING;