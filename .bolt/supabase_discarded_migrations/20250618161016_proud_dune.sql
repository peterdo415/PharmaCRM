/*
  # publicスキーマの全テーブル削除

  1. 目的
    - publicスキーマの全テーブルを削除
    - 外部キー制約を考慮した安全な削除順序
    - 関連する関数・シーケンス・インデックスも削除

  2. 削除対象
    - 全てのテーブル（CASCADE削除）
    - 全ての関数
    - 全てのシーケンス
    - 全てのカスタム型

  3. 安全対策
    - 外部キー制約を一時的に無効化
    - 存在チェック後の削除実行
    - 削除完了の確認
*/

-- =============================================================================
-- 1. 外部キー制約を一時的に無効化
-- =============================================================================

SET session_replication_role = replica;

-- =============================================================================
-- 2. publicスキーマの全テーブルを削除（CASCADE）
-- =============================================================================

-- 依存関係の順序で削除（子テーブルから親テーブルへ）
-- CASCADEオプションで関連するインデックス、制約、トリガーも同時に削除

-- 勤務実績テーブル
DROP TABLE IF EXISTS public.work_records CASCADE;
RAISE NOTICE 'work_recordsテーブルを削除しました';

-- スケジュールテーブル
DROP TABLE IF EXISTS public.schedules CASCADE;
RAISE NOTICE 'schedulesテーブルを削除しました';

-- 勤務希望条件テーブル
DROP TABLE IF EXISTS public.work_preferences CASCADE;
RAISE NOTICE 'work_preferencesテーブルを削除しました';

-- 薬剤師資格情報テーブル
DROP TABLE IF EXISTS public.pharmacist_certifications CASCADE;
RAISE NOTICE 'pharmacist_certificationsテーブルを削除しました';

-- 薬剤師専門分野関連テーブル
DROP TABLE IF EXISTS public.pharmacist_specialties CASCADE;
RAISE NOTICE 'pharmacist_specialtiesテーブルを削除しました';

-- 薬剤師テーブル
DROP TABLE IF EXISTS public.pharmacists CASCADE;
RAISE NOTICE 'pharmacistsテーブルを削除しました';

-- プロフィールテーブル
DROP TABLE IF EXISTS public.profiles CASCADE;
RAISE NOTICE 'profilesテーブルを削除しました';

-- マスターテーブル
DROP TABLE IF EXISTS public.certification_types CASCADE;
RAISE NOTICE 'certification_typesテーブルを削除しました';

DROP TABLE IF EXISTS public.specialties CASCADE;
RAISE NOTICE 'specialtiesテーブルを削除しました';

-- 薬局テーブル
DROP TABLE IF EXISTS public.pharmacies CASCADE;
RAISE NOTICE 'pharmaciesテーブルを削除しました';

-- =============================================================================
-- 3. publicスキーマの全関数を削除
-- =============================================================================

-- SECURITY DEFINER関数を削除
DROP FUNCTION IF EXISTS public.get_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_pharmacy_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_pharmacy_admin_new(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_pharmacy_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_same_pharmacy(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_pharmacist_pharmacy_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_pharmacist_user(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_pharmacy_by_name(text) CASCADE;
DROP FUNCTION IF EXISTS public.constraint_exists_on_column(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.unique_constraint_exists(text, text) CASCADE;

RAISE NOTICE 'publicスキーマの全関数を削除しました';

-- =============================================================================
-- 4. publicスキーマの全シーケンスを削除
-- =============================================================================

DO $$
DECLARE
    seq_record RECORD;
    seq_count INTEGER := 0;
BEGIN
    FOR seq_record IN 
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(seq_record.schemaname) || '.' || quote_ident(seq_record.sequencename) || ' CASCADE';
        seq_count := seq_count + 1;
    END LOOP;
    
    RAISE NOTICE 'publicスキーマの%個のシーケンスを削除しました', seq_count;
END $$;

-- =============================================================================
-- 5. publicスキーマのカスタム型を削除
-- =============================================================================

DO $$
DECLARE
    type_record RECORD;
    type_count INTEGER := 0;
BEGIN
    FOR type_record IN 
        SELECT typname 
        FROM pg_type 
        WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND typtype = 'e'  -- enum types
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(type_record.typname) || ' CASCADE';
        type_count := type_count + 1;
    END LOOP;
    
    RAISE NOTICE 'publicスキーマの%個のカスタム型を削除しました', type_count;
END $$;

-- =============================================================================
-- 6. publicスキーマのビューを削除
-- =============================================================================

DO $$
DECLARE
    view_record RECORD;
    view_count INTEGER := 0;
BEGIN
    FOR view_record IN 
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(view_record.table_name) || ' CASCADE';
        view_count := view_count + 1;
    END LOOP;
    
    RAISE NOTICE 'publicスキーマの%個のビューを削除しました', view_count;
END $$;

-- =============================================================================
-- 7. 外部キー制約を再有効化
-- =============================================================================

SET session_replication_role = DEFAULT;

-- =============================================================================
-- 8. 削除確認用クエリ
-- =============================================================================

-- publicスキーマのテーブル一覧を表示（空になっているはず）
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '削除確認結果:';
    RAISE NOTICE 'publicスキーマのテーブル数: %', table_count;
END $$;

-- publicスキーマの関数数を表示（0になっているはず）
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public';
    
    RAISE NOTICE 'publicスキーマの関数数: %', function_count;
END $$;

-- publicスキーマのシーケンス数を表示（0になっているはず）
DO $$
DECLARE
    sequence_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO sequence_count
    FROM pg_sequences 
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'publicスキーマのシーケンス数: %', sequence_count;
END $$;

-- publicスキーマのビュー数を表示（0になっているはず）
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views 
    WHERE table_schema = 'public';
    
    RAISE NOTICE 'publicスキーマのビュー数: %', view_count;
END $$;

-- =============================================================================
-- 9. 完了メッセージ
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'publicスキーマの全テーブル削除が完了しました';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '削除された内容:';
    RAISE NOTICE '- 全てのテーブル（work_records, schedules, work_preferences, etc.）';
    RAISE NOTICE '- 全ての関数（get_user_profile, is_pharmacy_admin_new, etc.）';
    RAISE NOTICE '- 全てのシーケンス';
    RAISE NOTICE '- 全てのカスタム型（enum等）';
    RAISE NOTICE '- 全てのビュー';
    RAISE NOTICE '- 関連するインデックス、制約、トリガー（CASCADE削除）';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '次のステップ:';
    RAISE NOTICE '1. 新しいスキーマ設計に基づいてマイグレーションファイルを作成';
    RAISE NOTICE '2. テーブル構造を再構築';
    RAISE NOTICE '3. RLSポリシーを設定';
    RAISE NOTICE '4. 初期データを投入';
    RAISE NOTICE '=============================================================================';
END $$;