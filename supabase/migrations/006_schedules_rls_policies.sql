BEGIN;

-- RLS 再有効化
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 既存ポリシー削除
DROP POLICY IF EXISTS schedules_select_policy   ON schedules;
DROP POLICY IF EXISTS schedules_insert_policy   ON schedules;
DROP POLICY IF EXISTS schedules_update_policy   ON schedules;
DROP POLICY IF EXISTS schedules_delete_policy   ON schedules;

-- SELECT: 自分が薬剤師／作成者／同じ薬局に所属
CREATE POLICY schedules_select_policy
  ON schedules
  FOR SELECT TO authenticated
  USING (
      created_by = auth.uid()
      OR pharmacist_id IN (SELECT id FROM pharmacists WHERE user_id = auth.uid())
      OR pharmacy_id IN (SELECT pharmacy_id FROM user_roles WHERE user_id = auth.uid())
  );

-- INSERT: ①本人 ②所属薬局の admin/manager ③作成者=自動設定 いずれか
CREATE POLICY schedules_insert_policy
  ON schedules
  FOR INSERT TO authenticated
  WITH CHECK (
      pharmacist_id IN (SELECT id FROM pharmacists WHERE user_id = auth.uid())
      OR (
           pharmacy_id IS NOT NULL
           AND pharmacy_id IN (
                 SELECT pharmacy_id
                 FROM user_roles
                 WHERE user_id = auth.uid()
                   AND role IN ('admin','manager')
           )
      )
  );

-- UPDATE: 本人 or admin/manager
CREATE POLICY schedules_update_policy
  ON schedules
  FOR UPDATE TO authenticated
  USING (
      created_by = auth.uid()
      OR pharmacy_id IN (
            SELECT pharmacy_id
            FROM user_roles
            WHERE user_id = auth.uid()
              AND role IN ('admin','manager')
      )
  )
  WITH CHECK (true);

-- DELETE: admin のみ
CREATE POLICY schedules_delete_policy
  ON schedules
  FOR DELETE TO authenticated
  USING (
      pharmacy_id IN (
          SELECT pharmacy_id
          FROM user_roles
          WHERE user_id = auth.uid()
            AND role = 'admin'
      )
  );

-- service_role はフル権限
CREATE POLICY schedules_all_service
  ON schedules
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMIT;