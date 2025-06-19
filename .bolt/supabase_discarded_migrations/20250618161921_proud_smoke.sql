/*
  # 薬局CRMアプリ - 新しいデータベース設計

  1. テーブル定義
    - pharmacies: 薬局情報
    - user_roles: ユーザー権限管理
    - pharmacists: 薬剤師プロフィール
    - specialties: 専門分野マスタ
    - pharmacist_specialties: 薬剤師専門分野関連
    - certifications: 資格・認定情報
    - pharmacist_availability: 勤務可能時間
    - schedules: スケジュール管理
    - work_records: 勤務実績
    - shift_requests: シフト希望

  2. インデックス作成
    - パフォーマンス向上のための適切なインデックス

  3. RLS (Row Level Security) 設定
    - 全テーブルでRLS有効化
    - 適切な権限管理ポリシー

  4. ヘルパー関数
    - ユーザー権限取得関数
    - 薬局一覧取得関数
*/

-- =============================================================================
-- 1. テーブル定義
-- =============================================================================

-- 薬局情報テーブル
CREATE TABLE pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    license_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー権限テーブル
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'pharmacist')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, pharmacy_id)
);

-- 薬剤師プロフィールテーブル
CREATE TABLE pharmacists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    -- 基本情報
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    phone_mobile VARCHAR(20),
    phone_home VARCHAR(20),
    email VARCHAR(255),
    postal_code VARCHAR(10),
    prefecture VARCHAR(50),
    city VARCHAR(100),
    address TEXT,
    -- 薬剤師情報
    license_number VARCHAR(100) NOT NULL,
    license_date DATE,
    experience_years INTEGER DEFAULT 0,
    photo_url TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    nearest_station VARCHAR(100),
    transportation VARCHAR(50),
    -- 勤務条件
    employment_type VARCHAR(50) CHECK (employment_type IN ('full_time', 'part_time', 'temporary', 'dispatch')),
    hourly_rate INTEGER,
    daily_rate INTEGER,
    transport_allowance BOOLEAN DEFAULT FALSE,
    min_work_hours INTEGER,
    max_consecutive_days INTEGER,
    night_shift_available BOOLEAN DEFAULT FALSE,
    weekend_available BOOLEAN DEFAULT FALSE,
    holiday_available BOOLEAN DEFAULT FALSE,
    emergency_available BOOLEAN DEFAULT FALSE,
    -- メタデータ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, pharmacy_id)
);

-- 専門分野マスタテーブル
CREATE TABLE specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 薬剤師専門分野関連テーブル
CREATE TABLE pharmacist_specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacist_id UUID REFERENCES pharmacists(id) ON DELETE CASCADE,
    specialty_id UUID REFERENCES specialties(id) ON DELETE CASCADE,
    experience_level VARCHAR(20) CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'instructor')),
    years_of_experience INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pharmacist_id, specialty_id)
);

-- 資格・認定情報テーブル
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacist_id UUID REFERENCES pharmacists(id) ON DELETE CASCADE,
    certification_name VARCHAR(200) NOT NULL,
    certification_type VARCHAR(50) CHECK (certification_type IN ('certified', 'specialist', 'other')),
    issuing_organization VARCHAR(200),
    certification_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 勤務可能時間テーブル
CREATE TABLE pharmacist_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacist_id UUID REFERENCES pharmacists(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0:日曜, 1:月曜, ...
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- スケジュール管理テーブル
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacist_id UUID REFERENCES pharmacists(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 0, -- 分単位
    work_type VARCHAR(50) CHECK (work_type IN ('regular', 'overtime', 'holiday', 'emergency')),
    work_location VARCHAR(100),
    work_description TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 勤務実績テーブル
CREATE TABLE work_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacist_id UUID REFERENCES pharmacists(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    work_date DATE NOT NULL,
    actual_start_time TIME,
    actual_end_time TIME,
    actual_break_duration INTEGER DEFAULT 0,
    actual_work_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    -- 業務実績
    prescription_count INTEGER DEFAULT 0,
    counseling_count INTEGER DEFAULT 0,
    home_visit_count INTEGER DEFAULT 0,
    notes TEXT,
    -- 承認状況
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- シフト希望テーブル
CREATE TABLE shift_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacist_id UUID REFERENCES pharmacists(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    request_month DATE NOT NULL, -- 希望月の1日
    request_date DATE NOT NULL,
    request_type VARCHAR(20) CHECK (request_type IN ('work_request', 'leave_request', 'preferred_time')),
    start_time TIME,
    end_time TIME,
    priority VARCHAR(20) DEFAULT 'preferred' CHECK (priority IN ('required', 'preferred', 'available')),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. インデックス作成
-- =============================================================================

-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_pharmacy_id ON user_roles(pharmacy_id);
CREATE INDEX idx_pharmacists_user_id ON pharmacists(user_id);
CREATE INDEX idx_pharmacists_pharmacy_id ON pharmacists(pharmacy_id);
CREATE INDEX idx_pharmacist_specialties_pharmacist_id ON pharmacist_specialties(pharmacist_id);
CREATE INDEX idx_certifications_pharmacist_id ON certifications(pharmacist_id);
CREATE INDEX idx_pharmacist_availability_pharmacist_id ON pharmacist_availability(pharmacist_id);
CREATE INDEX idx_schedules_pharmacist_id ON schedules(pharmacist_id);
CREATE INDEX idx_schedules_pharmacy_id ON schedules(pharmacy_id);
CREATE INDEX idx_schedules_date ON schedules(schedule_date);
CREATE INDEX idx_work_records_pharmacist_id ON work_records(pharmacist_id);
CREATE INDEX idx_work_records_pharmacy_id ON work_records(pharmacy_id);
CREATE INDEX idx_work_records_date ON work_records(work_date);
CREATE INDEX idx_shift_requests_pharmacist_id ON shift_requests(pharmacist_id);
CREATE INDEX idx_shift_requests_pharmacy_id ON shift_requests(pharmacy_id);

-- =============================================================================
-- 3. RLS (Row Level Security) 有効化
-- =============================================================================

ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacists ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacist_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_requests ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. ヘルパー関数定義
-- =============================================================================

-- ユーザーの権限取得関数
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID, pharmacy_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM user_roles 
        WHERE user_id = user_uuid AND pharmacy_id = pharmacy_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーが所属する薬局一覧取得関数
CREATE OR REPLACE FUNCTION get_user_pharmacies(user_uuid UUID)
RETURNS TABLE(pharmacy_id UUID, role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT ur.pharmacy_id, ur.role
    FROM user_roles ur
    WHERE ur.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. RLSポリシー定義
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 薬局情報テーブル (pharmacies) のRLSポリシー
-- -----------------------------------------------------------------------------

-- SELECT: 自分が所属する薬局のみ閲覧可能
CREATE POLICY "pharmacies_select_policy" ON pharmacies
    FOR SELECT
    USING (
        id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

-- INSERT: 管理者のみ可能
CREATE POLICY "pharmacies_insert_policy" ON pharmacies
    FOR INSERT
    WITH CHECK (false); -- 薬局作成は管理画面で別途実装

-- UPDATE: 管理者・マネージャーのみ可能
CREATE POLICY "pharmacies_update_policy" ON pharmacies
    FOR UPDATE
    USING (
        id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- DELETE: 管理者のみ可能
CREATE POLICY "pharmacies_delete_policy" ON pharmacies
    FOR DELETE
    USING (
        id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- ユーザー権限テーブル (user_roles) のRLSポリシー
-- -----------------------------------------------------------------------------

-- SELECT: 同じ薬局に所属するユーザーの権限情報を閲覧可能
CREATE POLICY "user_roles_select_policy" ON user_roles
    FOR SELECT
    USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

-- INSERT: 管理者・マネージャーのみ可能
CREATE POLICY "user_roles_insert_policy" ON user_roles
    FOR INSERT
    WITH CHECK (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- UPDATE: 管理者・マネージャーのみ可能（自分の権限は変更不可）
CREATE POLICY "user_roles_update_policy" ON user_roles
    FOR UPDATE
    USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
        AND user_id != auth.uid()
    );

-- DELETE: 管理者のみ可能（自分の権限は削除不可）
CREATE POLICY "user_roles_delete_policy" ON user_roles
    FOR DELETE
    USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
        AND user_id != auth.uid()
    );

-- -----------------------------------------------------------------------------
-- 薬剤師プロフィールテーブル (pharmacists) のRLSポリシー
-- -----------------------------------------------------------------------------

-- SELECT: 自分の情報または同じ薬局の薬剤師情報を閲覧可能
CREATE POLICY "pharmacists_select_policy" ON pharmacists
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

-- INSERT: 自分の情報のみ作成可能、または管理者・マネージャーが作成可能
CREATE POLICY "pharmacists_insert_policy" ON pharmacists
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- UPDATE: 自分の情報のみ更新可能、または管理者・マネージャーが更新可能
CREATE POLICY "pharmacists_update_policy" ON pharmacists
    FOR UPDATE
    USING (
        user_id = auth.uid() OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- DELETE: 管理者のみ可能
CREATE POLICY "pharmacists_delete_policy" ON pharmacists
    FOR DELETE
    USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- 専門分野マスタテーブル (specialties) のRLSポリシー
-- -----------------------------------------------------------------------------

-- SELECT: 全ユーザーが閲覧可能（マスタデータ）
CREATE POLICY "specialties_select_policy" ON specialties
    FOR SELECT
    USING (true);

-- INSERT/UPDATE/DELETE: 管理者のみ可能
CREATE POLICY "specialties_insert_policy" ON specialties
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "specialties_update_policy" ON specialties
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "specialties_delete_policy" ON specialties
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- -----------------------------------------------------------------------------
-- 薬剤師専門分野関連テーブル (pharmacist_specialties) のRLSポリシー
-- -----------------------------------------------------------------------------

-- SELECT: 自分の専門分野または同じ薬局の薬剤師の専門分野を閲覧可能
CREATE POLICY "pharmacist_specialties_select_policy" ON pharmacist_specialties
    FOR SELECT
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid()
        )
    );

-- INSERT: 自分の専門分野のみ追加可能、または管理者・マネージャーが追加可能
CREATE POLICY "pharmacist_specialties_insert_policy" ON pharmacist_specialties
    FOR INSERT
    WITH CHECK (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'manager')
        )
    );

-- UPDATE: 自分の専門分野のみ更新可能、または管理者・マネージャーが更新可能
CREATE POLICY "pharmacist_specialties_update_policy" ON pharmacist_specialties
    FOR UPDATE
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'manager')
        )
    );

-- DELETE: 自分の専門分野のみ削除可能、または管理者・マネージャーが削除可能
CREATE POLICY "pharmacist_specialties_delete_policy" ON pharmacist_specialties
    FOR DELETE
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'manager')
        )
    );

-- -----------------------------------------------------------------------------
-- 資格・認定情報テーブル (certifications) のRLSポリシー
-- -----------------------------------------------------------------------------

-- SELECT: 自分の資格または同じ薬局の薬剤師の資格を閲覧可能
CREATE POLICY "certifications_select_policy" ON certifications
    FOR SELECT
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid()
        )
    );

-- INSERT: 自分の資格のみ追加可能、または管理者・マネージャーが追加可能
CREATE POLICY "certifications_insert_policy" ON certifications
    FOR INSERT
    WITH CHECK (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'manager')
        )
    );

-- UPDATE: 自分の資格のみ更新可能、または管理者・マネージャーが更新可能
CREATE POLICY "certifications_update_policy" ON certifications
    FOR UPDATE
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'manager')
        )
    );

-- DELETE: 自分の資格のみ削除可能、または管理者・マネージャーが削除可能
CREATE POLICY "certifications_delete_policy" ON certifications
    FOR DELETE
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'manager')
        )
    );

-- -----------------------------------------------------------------------------
-- 勤務可能時間テーブル (pharmacist_availability) のRLSポリシー
-- -----------------------------------------------------------------------------

-- SELECT: 自分の勤務可能時間または同じ薬局の薬剤師の勤務可能時間を閲覧可能
CREATE POLICY "pharmacist_availability_select_policy" ON pharmacist_availability
    FOR SELECT
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid()
        )
    );

-- INSERT: 自分の勤務可能時間のみ追加可能、または管理者・マネージャーが追加可能
CREATE POLICY "pharmacist_availability_insert_policy" ON pharmacist_availability
    FOR INSERT
    WITH CHECK (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'manager')
        )
    );

-- UPDATE: 自分の勤務可能時間のみ更新可能、または管理者・マネージャーが更新可能
CREATE POLICY "pharmacist_availability_update_policy" ON pharmacist_availability
    FOR UPDATE
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'manager')
        )
    );

-- DELETE: 自分の勤務可能時間のみ削除可能、または管理者・マネージャーが削除可能
CREATE POLICY "pharmacist_availability_delete_policy" ON pharmacist_availability
    FOR DELETE
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacist_id IN (
            SELECT p.id FROM pharmacists p
            INNER JOIN user_roles ur ON p.pharmacy_id = ur.pharmacy_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'manager')
        )
    );

-- -----------------------------------------------------------------------------
-- スケジュール管理テーブル (schedules) のRLSポリシー
-- -----------------------------------------------------------------------------

-- SELECT: 自分のスケジュールまたは同じ薬局のスケジュールを閲覧可能
CREATE POLICY "schedules_select_policy" ON schedules
    FOR SELECT
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

-- INSERT: 自分のスケジュールまたは管理者・マネージャーがスケジュール作成可能
CREATE POLICY "schedules_insert_policy" ON schedules
    FOR INSERT
    WITH CHECK (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- UPDATE: 自分のスケジュールまたは管理者・マネージャーがスケジュール更新可能
CREATE POLICY "schedules_update_policy" ON schedules
    FOR UPDATE
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- DELETE: 管理者・マネージャーのみスケジュール削除可能
CREATE POLICY "schedules_delete_policy" ON schedules
    FOR DELETE
    USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- -----------------------------------------------------------------------------
-- 勤務実績テーブル (work_records) のRLSポリシー
-- -----------------------------------------------------------------------------

-- SELECT: 自分の勤務実績または同じ薬局の勤務実績を閲覧可能
CREATE POLICY "work_records_select_policy" ON work_records
    FOR SELECT
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

-- INSERT: 自分の勤務実績のみ追加可能、または管理者・マネージャーが追加可能
CREATE POLICY "work_records_insert_policy" ON work_records
    FOR INSERT
    WITH CHECK (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- UPDATE: 自分の勤務実績のみ更新可能、または管理者・マネージャーが更新可能
CREATE POLICY "work_records_update_policy" ON work_records
    FOR UPDATE
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- DELETE: 管理者・マネージャーのみ削除可能
CREATE POLICY "work_records_delete_policy" ON work_records
    FOR DELETE
    USING (
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- -----------------------------------------------------------------------------
-- シフト希望テーブル (shift_requests) のRLSポリシー
-- -----------------------------------------------------------------------------

-- SELECT: 自分のシフト希望または同じ薬局のシフト希望を閲覧可能
CREATE POLICY "shift_requests_select_policy" ON shift_requests
    FOR SELECT
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

-- INSERT: 自分のシフト希望のみ追加可能
CREATE POLICY "shift_requests_insert_policy" ON shift_requests
    FOR INSERT
    WITH CHECK (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        )
    );

-- UPDATE: 自分のシフト希望のみ更新可能、または管理者・マネージャーが承認状況を更新可能
CREATE POLICY "shift_requests_update_policy" ON shift_requests
    FOR UPDATE
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- DELETE: 自分のシフト希望のみ削除可能、または管理者・マネージャーが削除可能
CREATE POLICY "shift_requests_delete_policy" ON shift_requests
    FOR DELETE
    USING (
        pharmacist_id IN (
            SELECT id FROM pharmacists 
            WHERE user_id = auth.uid()
        ) OR
        pharmacy_id IN (
            SELECT pharmacy_id 
            FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- =============================================================================
-- 6. 初期データ投入
-- =============================================================================

-- 専門分野マスタデータ
INSERT INTO specialties (name, description, category) VALUES
('調剤', '処方箋に基づく調剤業務', '基本業務'),
('服薬指導', '患者への服薬指導・相談業務', '基本業務'),
('在宅医療', '在宅患者への薬剤管理指導', '専門分野'),
('がん薬物療法', 'がん患者への薬物療法支援', '専門分野'),
('糖尿病療養指導', '糖尿病患者への療養指導', '専門分野'),
('感染制御', '感染症対策・抗菌薬適正使用', '専門分野'),
('精神科薬物療法', '精神科領域の薬物療法', '専門分野'),
('小児薬物療法', '小児患者への薬物療法', '専門分野'),
('妊婦・授乳婦薬物療法', '妊娠・授乳期の薬物療法', '専門分野'),
('漢方薬', '漢方薬の調剤・服薬指導', '専門分野'),
('栄養サポート', '栄養療法・サプリメント指導', '専門分野'),
('緩和医療', '緩和ケア・疼痛管理', '専門分野');

-- サンプル薬局データ
INSERT INTO pharmacies (name, address, phone, email, license_number) VALUES
('サンプル薬局', '東京都渋谷区渋谷1-1-1', '03-1234-5678', 'info@sample-pharmacy.com', 'PHARM-001'),
('テスト調剤薬局', '東京都新宿区新宿2-2-2', '03-2345-6789', 'contact@test-pharmacy.com', 'PHARM-002');

-- =============================================================================
-- 7. 関数の実行権限付与
-- =============================================================================

GRANT EXECUTE ON FUNCTION get_user_role(UUID, UUID) TO public;
GRANT EXECUTE ON FUNCTION get_user_pharmacies(UUID) TO public;

-- =============================================================================
-- 8. 完了メッセージ
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '薬局CRMアプリ - 新しいデータベース設計の適用が完了しました';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '作成されたテーブル:';
    RAISE NOTICE '- pharmacies: 薬局情報';
    RAISE NOTICE '- user_roles: ユーザー権限管理';
    RAISE NOTICE '- pharmacists: 薬剤師プロフィール';
    RAISE NOTICE '- specialties: 専門分野マスタ';
    RAISE NOTICE '- pharmacist_specialties: 薬剤師専門分野関連';
    RAISE NOTICE '- certifications: 資格・認定情報';
    RAISE NOTICE '- pharmacist_availability: 勤務可能時間';
    RAISE NOTICE '- schedules: スケジュール管理';
    RAISE NOTICE '- work_records: 勤務実績';
    RAISE NOTICE '- shift_requests: シフト希望';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '設定されたセキュリティ機能:';
    RAISE NOTICE '- 全テーブルでRLS (Row Level Security) 有効化';
    RAISE NOTICE '- 役割ベースのアクセス制御ポリシー';
    RAISE NOTICE '- SECURITY DEFINER関数による安全なデータアクセス';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '初期データ:';
    RAISE NOTICE '- 専門分野マスタデータ (12件)';
    RAISE NOTICE '- サンプル薬局データ (2件)';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '次のステップ:';
    RAISE NOTICE '1. フロントエンドアプリケーションの更新';
    RAISE NOTICE '2. 新しいスキーマに対応したTypeScript型定義の更新';
    RAISE NOTICE '3. 認証・認可フローの実装';
    RAISE NOTICE '4. テストデータの投入';
    RAISE NOTICE '=============================================================================';
END $$;