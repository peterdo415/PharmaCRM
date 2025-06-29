-- Migration: User Roles Table and RLS Policies
-- This migration adds a user_roles table and implements Row Level Security

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('pharmacy_admin', 'pharmacist')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one role per user
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacists ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacist_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacist_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own role" ON user_roles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for pharmacies table
CREATE POLICY "Pharmacy admins can view their pharmacy" ON pharmacies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.pharmacy_id = pharmacies.id
    )
  );

CREATE POLICY "Pharmacy admins can insert pharmacy" ON pharmacies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'pharmacy_admin'
    )
  );

CREATE POLICY "Pharmacy admins can update their pharmacy" ON pharmacies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.pharmacy_id = pharmacies.id
    )
  );

-- RLS Policies for pharmacists table
CREATE POLICY "Pharmacists can view their own data" ON pharmacists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Pharmacy admins can view their pharmacists" ON pharmacists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.pharmacy_id = pharmacists.pharmacy_id
    )
  );

CREATE POLICY "Pharmacists can insert their own data" ON pharmacists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pharmacists can update their own data" ON pharmacists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Pharmacy admins can update their pharmacists" ON pharmacists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.pharmacy_id = pharmacists.pharmacy_id
    )
  );

-- RLS Policies for specialties (public read, admin write)
CREATE POLICY "Anyone can view specialties" ON specialties
  FOR SELECT USING (true);

CREATE POLICY "Pharmacy admins can manage specialties" ON specialties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'pharmacy_admin'
    )
  );

-- RLS Policies for certification_types (public read, admin write)
CREATE POLICY "Anyone can view certification types" ON certification_types
  FOR SELECT USING (true);

CREATE POLICY "Pharmacy admins can manage certification types" ON certification_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'pharmacy_admin'
    )
  );

-- RLS Policies for pharmacist_specialties
CREATE POLICY "Pharmacists can view their own specialties" ON pharmacist_specialties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE pharmacists.id = pharmacist_specialties.pharmacist_id
      AND pharmacists.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can view their pharmacists' specialties" ON pharmacist_specialties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      JOIN pharmacists ph ON ph.pharmacy_id = p.pharmacy_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND ph.id = pharmacist_specialties.pharmacist_id
    )
  );

CREATE POLICY "Pharmacists can manage their own specialties" ON pharmacist_specialties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE pharmacists.id = pharmacist_specialties.pharmacist_id
      AND pharmacists.user_id = auth.uid()
    )
  );

-- RLS Policies for pharmacist_certifications
CREATE POLICY "Pharmacists can view their own certifications" ON pharmacist_certifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE pharmacists.id = pharmacist_certifications.pharmacist_id
      AND pharmacists.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can view their pharmacists' certifications" ON pharmacist_certifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      JOIN pharmacists ph ON ph.pharmacy_id = p.pharmacy_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND ph.id = pharmacist_certifications.pharmacist_id
    )
  );

CREATE POLICY "Pharmacists can manage their own certifications" ON pharmacist_certifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE pharmacists.id = pharmacist_certifications.pharmacist_id
      AND pharmacists.user_id = auth.uid()
    )
  );

-- RLS Policies for work_preferences
CREATE POLICY "Pharmacists can view their own work preferences" ON work_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE pharmacists.id = work_preferences.pharmacist_id
      AND pharmacists.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can view their pharmacists' work preferences" ON work_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      JOIN pharmacists ph ON ph.pharmacy_id = p.pharmacy_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND ph.id = work_preferences.pharmacist_id
    )
  );

CREATE POLICY "Pharmacists can manage their own work preferences" ON work_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE pharmacists.id = work_preferences.pharmacist_id
      AND pharmacists.user_id = auth.uid()
    )
  );

-- RLS Policies for schedules
CREATE POLICY "Pharmacists can view their own schedules" ON schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE pharmacists.id = schedules.pharmacist_id
      AND pharmacists.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can view schedules for their pharmacy" ON schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.pharmacy_id = schedules.pharmacy_id
    )
  );

CREATE POLICY "Pharmacy admins can manage schedules for their pharmacy" ON schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND p.pharmacy_id = schedules.pharmacy_id
    )
  );

-- RLS Policies for work_records
CREATE POLICY "Pharmacists can view their own work records" ON work_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE pharmacists.id = work_records.pharmacist_id
      AND pharmacists.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can view work records for their pharmacists" ON work_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      JOIN pharmacists ph ON ph.pharmacy_id = p.pharmacy_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND ph.id = work_records.pharmacist_id
    )
  );

CREATE POLICY "Pharmacists can manage their own work records" ON work_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pharmacists
      WHERE pharmacists.id = work_records.pharmacist_id
      AND pharmacists.user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacy admins can manage work records for their pharmacists" ON work_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      JOIN pharmacists ph ON ph.pharmacy_id = p.pharmacy_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'pharmacy_admin'
      AND ph.id = work_records.pharmacist_id
    )
  );

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid;
$$;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for user_roles updated_at
CREATE TRIGGER update_user_roles_updated_at 
  BEFORE UPDATE ON user_roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();