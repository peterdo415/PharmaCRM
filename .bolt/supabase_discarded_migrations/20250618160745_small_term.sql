/*
  # データベース完全リセット

  1. 概要
    - publicスキーマの全テーブルとデータを削除
    - auth関連のデータを削除
    - 関数、ポリシー、制約も全て削除

  2. 注意事項
    - このスクリプトは開発環境でのみ実行してください
    - 本番環境では絶対に実行しないでください
    - 実行前に必要なデータのバックアップを取得してください

  3. 削除対象
    - publicスキーマの全テーブル
    - auth.usersテーブルのレコード
    - 関連する関数とポリシー
*/

-- =============================================================================
-- 1. 外部キー制約を一時的に無効化（削除順序を気にせずに済むため）
-- =============================================================================

SET session_replication_role = replica;

-- =============================================================================
-- 2. publicスキーマの全テーブルのデータを削除
-- =============================================================================

-- 依存関係の順序で削除（子テーブルから親テーブルへ）

-- 勤務実績テーブル
DROP TABLE IF EXISTS public.work_records CASCADE;

-- スケジュールテーブル
DROP TABLE IF EXISTS public.schedules CASCADE;

-- 勤務希望条件テーブル
DROP TABLE IF EXISTS public.work_preferences CASCADE;

-- 薬剤師資格情報テーブル
DROP TABLE IF EXISTS public.pharmacist_certifications CASCADE;

-- 薬剤師専門分野関連テーブル
DROP TABLE IF EXISTS public.pharmacist_specialties CASCADE;

-- 薬剤師テーブル
DROP TABLE IF EXISTS public.pharmacists CASCADE;

-- プロフィールテーブル
DROP TABLE IF EXISTS public.profiles CASCADE;

-- マスターテーブル
DROP TABLE IF EXISTS public.certification_types CASCADE;
DROP TABLE IF EXISTS public.specialties CASCADE;

-- 薬局テーブル
DROP TABLE IF EXISTS public.pharmacies CASCADE;

-- =============================================================================
-- 3. publicスキーマの関数を削除
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

-- =============================================================================
-- 4. auth関連のデータを削除
-- =============================================================================

-- auth.usersテーブルのレコードを削除
-- 注意: これによりauth.identitiesなど関連テーブルのレコードも自動的に削除されます
DELETE FROM auth.users;

-- auth.refresh_tokensテーブルのレコードを削除
DELETE FROM auth.refresh_tokens;

-- auth.sessionsテーブルのレコードを削除（存在する場合）
DELETE FROM auth.sessions WHERE true;

-- auth.audit_log_entriesテーブルのレコードを削除（存在する場合）
DELETE FROM auth.audit_log_entries WHERE true;

-- auth.identitiesテーブルのレコードを削除（CASCADE削除されない場合のため）
DELETE FROM auth.identities WHERE true;

-- =============================================================================
-- 5. storage関連のデータを削除（もし使用している場合）
-- =============================================================================

-- storage.objectsテーブルのレコードを削除（存在する場合）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    DELETE FROM storage.objects;
  END IF;
END $$;

-- storage.bucketsテーブルのレコードを削除（存在する場合）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    DELETE FROM storage.buckets;
  END IF;
END $$;

-- =============================================================================
-- 6. realtime関連のデータを削除（もし使用している場合）
-- =============================================================================

-- realtime.subscriptionテーブルのレコードを削除（存在する場合）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'realtime' AND table_name = 'subscription') THEN
    DELETE FROM realtime.subscription;
  END IF;
END $$;

-- =============================================================================
-- 7. 外部キー制約を再有効化
-- =============================================================================

SET session_replication_role = DEFAULT;

-- =============================================================================
-- 8. シーケンスをリセット（もし使用している場合）
-- =============================================================================

-- publicスキーマの全シーケンスをリセット
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq_record.schemaname) || '.' || quote_ident(seq_record.sequencename) || ' RESTART WITH 1';
    END LOOP;
END $$;

-- =============================================================================
-- 9. 確認用クエリ（削除が正常に完了したかチェック）
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
    
    RAISE NOTICE 'publicスキーマのテーブル数: %', table_count;
END $$;

-- auth.usersテーブルのレコード数を表示（0になっているはず）
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RAISE NOTICE 'auth.usersのレコード数: %', user_count;
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

-- =============================================================================
-- 10. 完了メッセージ
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'データベースリセットが完了しました';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '削除された内容:';
    RAISE NOTICE '- publicスキーマの全テーブルとデータ';
    RAISE NOTICE '- publicスキーマの全関数';
    RAISE NOTICE '- auth関連の全レコード';
    RAISE NOTICE '- storage関連の全レコード（存在した場合）';
    RAISE NOTICE '- realtime関連の全レコード（存在した場合）';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '次のステップ:';
    RAISE NOTICE '1. 新しいスキーマ設計に基づいてマイグレーションファイルを作成';
    RAISE NOTICE '2. マイグレーションを実行してテーブル構造を再構築';
    RAISE NOTICE '3. 必要に応じて初期データを投入';
    RAISE NOTICE '=============================================================================';
END $$;