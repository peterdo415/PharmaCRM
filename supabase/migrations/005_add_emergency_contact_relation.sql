-- Add emergency_contact_relation column to pharmacists table
-- This column stores the relationship between the pharmacist and their emergency contact

ALTER TABLE pharmacists 
ADD COLUMN emergency_contact_relation TEXT;

-- Add a check constraint to ensure only valid relationship values are allowed
ALTER TABLE pharmacists 
ADD CONSTRAINT valid_emergency_contact_relation 
CHECK (emergency_contact_relation IN (
  '父', '母', '夫', '妻', '息子', '娘', 
  '兄', '弟', '姉', '妹', '祖父', '祖母',
  '叔父', '伯父', '叔母', '伯母', 'いとこ',
  '友人', 'その他'
));

-- Add comment to explain the column
COMMENT ON COLUMN pharmacists.emergency_contact_relation IS '緊急連絡先との続柄 (Relationship to emergency contact)';

-- 1. チェック制約を外す
ALTER TABLE public.pharmacists
  DROP CONSTRAINT IF EXISTS valid_emergency_contact_relation;

-- 2. NOT NULL 制約を外して任意入力にする
ALTER TABLE public.pharmacists
  ALTER COLUMN emergency_contact_relation DROP NOT NULL,
  ALTER COLUMN emergency_contact_name     DROP NOT NULL,
  ALTER COLUMN emergency_contact_phone    DROP NOT NULL;
