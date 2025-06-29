-- Complete RLS policies for all tables
-- This migration adds missing DELETE policies and ensures comprehensive CRUD coverage

-- ===== USER_ROLES TABLE =====
-- Add missing DELETE policy for user_roles
CREATE POLICY "Users can delete their own role" ON user_roles
  FOR DELETE USING (auth.uid() = user_id);

-- ===== PHARMACIES TABLE =====
-- Add missing DELETE policy for pharmacies
CREATE POLICY "Pharmacy admins can delete their pharmacy" ON pharmacies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
    )
  );

-- ===== PHARMACISTS TABLE =====
-- Add missing DELETE policies for pharmacists
CREATE POLICY "Pharmacists can delete their own data" ON pharmacists
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Pharmacy admins can delete their pharmacists" ON pharmacists
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pharmacists p ON p.pharmacy_id IN (
        SELECT pharmacy_id FROM pharmacists WHERE user_id = ur.user_id
      )
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.id = pharmacists.id
    )
  );

-- ===== SPECIALTIES TABLE =====
-- Add explicit DELETE policy for specialties (currently handled by FOR ALL policy)
-- This is for clarity and better security granularity
DROP POLICY IF EXISTS "Pharmacy admins can manage specialties" ON specialties;

CREATE POLICY "Anyone can view specialties" ON specialties
  FOR SELECT USING (true);

CREATE POLICY "Pharmacy admins can insert specialties" ON specialties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'pharmacy_admin'
    )
  );

CREATE POLICY "Pharmacy admins can update specialties" ON specialties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'pharmacy_admin'
    )
  );

CREATE POLICY "Pharmacy admins can delete specialties" ON specialties
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'pharmacy_admin'
    )
  );

-- ===== CERTIFICATION_TYPES TABLE =====
-- Note: certification_types table does not exist yet - skipping policies

-- ===== PHARMACIST_SPECIALTIES TABLE =====
-- Split the FOR ALL policy into explicit CRUD policies
DROP POLICY IF EXISTS "Pharmacists can manage their own specialties" ON pharmacist_specialties;

CREATE POLICY "Pharmacists can view their own specialties" ON pharmacist_specialties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pharmacists p 
      WHERE p.id = pharmacist_specialties.pharmacist_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can view pharmacists specialties" ON pharmacist_specialties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pharmacists p ON p.pharmacy_id IN (
        SELECT pharmacy_id FROM pharmacists WHERE user_id = ur.user_id
      )
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.id = pharmacist_specialties.pharmacist_id
    )
  );

CREATE POLICY "Pharmacists can insert their own specialties" ON pharmacist_specialties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacists p 
      WHERE p.id = pharmacist_specialties.pharmacist_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacists can update their own specialties" ON pharmacist_specialties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pharmacists p 
      WHERE p.id = pharmacist_specialties.pharmacist_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacists can delete their own specialties" ON pharmacist_specialties
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pharmacists p 
      WHERE p.id = pharmacist_specialties.pharmacist_id 
      AND p.user_id = auth.uid()
    )
  );

-- ===== PHARMACIST_CERTIFICATIONS TABLE =====
-- Note: pharmacist_certifications table does not exist yet - skipping policies

-- ===== WORK_PREFERENCES TABLE =====
-- Note: work_preferences table does not exist yet - skipping policies

-- ===== SCHEDULES TABLE =====
-- Split the FOR ALL policy into explicit CRUD policies
DROP POLICY IF EXISTS "Pharmacy admins can manage schedules for their pharmacy" ON schedules;

CREATE POLICY "Pharmacists can view their own schedules" ON schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pharmacists p 
      WHERE p.id = schedules.pharmacist_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can view schedules for their pharmacy" ON schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pharmacists p ON p.pharmacy_id IN (
        SELECT pharmacy_id FROM pharmacists WHERE user_id = ur.user_id
      )
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.pharmacy_id = schedules.pharmacy_id
    )
  );

CREATE POLICY "Pharmacy admins can insert schedules for their pharmacy" ON schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pharmacists p ON p.pharmacy_id IN (
        SELECT pharmacy_id FROM pharmacists WHERE user_id = ur.user_id
      )
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.pharmacy_id = schedules.pharmacy_id
    )
  );

CREATE POLICY "Pharmacy admins can update schedules for their pharmacy" ON schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pharmacists p ON p.pharmacy_id IN (
        SELECT pharmacy_id FROM pharmacists WHERE user_id = ur.user_id
      )
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.pharmacy_id = schedules.pharmacy_id
    )
  );

CREATE POLICY "Pharmacy admins can delete schedules for their pharmacy" ON schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pharmacists p ON p.pharmacy_id IN (
        SELECT pharmacy_id FROM pharmacists WHERE user_id = ur.user_id
      )
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.pharmacy_id = schedules.pharmacy_id
    )
  );

-- ===== WORK_RECORDS TABLE =====
-- Split the FOR ALL policy into explicit CRUD policies
DROP POLICY IF EXISTS "Pharmacists can manage their own work records" ON work_records;
DROP POLICY IF EXISTS "Pharmacy admins can manage work records for their pharmacists" ON work_records;

CREATE POLICY "Pharmacists can view their own work records" ON work_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pharmacists p 
      WHERE p.id = work_records.pharmacist_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can view work records for their pharmacists" ON work_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pharmacists p ON p.pharmacy_id IN (
        SELECT pharmacy_id FROM pharmacists WHERE user_id = ur.user_id
      )
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.id = work_records.pharmacist_id
    )
  );

CREATE POLICY "Pharmacists can insert their own work records" ON work_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pharmacists p 
      WHERE p.id = work_records.pharmacist_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can insert work records for their pharmacists" ON work_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pharmacists p ON p.pharmacy_id IN (
        SELECT pharmacy_id FROM pharmacists WHERE user_id = ur.user_id
      )
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.id = work_records.pharmacist_id
    )
  );

CREATE POLICY "Pharmacists can update their own work records" ON work_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pharmacists p 
      WHERE p.id = work_records.pharmacist_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can update work records for their pharmacists" ON work_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pharmacists p ON p.pharmacy_id IN (
        SELECT pharmacy_id FROM pharmacists WHERE user_id = ur.user_id
      )
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.id = work_records.pharmacist_id
    )
  );

CREATE POLICY "Pharmacists can delete their own work records" ON work_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pharmacists p 
      WHERE p.id = work_records.pharmacist_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can delete work records for their pharmacists" ON work_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN pharmacists p ON p.pharmacy_id IN (
        SELECT pharmacy_id FROM pharmacists WHERE user_id = ur.user_id
      )
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.id = work_records.pharmacist_id
    )
  );