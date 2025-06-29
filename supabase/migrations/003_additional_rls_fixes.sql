-- Additional RLS policy fixes for better user experience
-- This migration adds policies to support automatic user migration and better error handling

-- Add a policy to allow users to insert role records for themselves during migration
-- This is needed when existing users don't have user_roles records yet
CREATE POLICY "Users can migrate their own role" ON user_roles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Create a function to safely get user role
CREATE OR REPLACE FUNCTION get_user_role_safe(user_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT role FROM user_roles WHERE user_id = user_uuid;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role_safe(UUID) TO authenticated;

-- Create a function to ensure user_roles record exists
CREATE OR REPLACE FUNCTION ensure_user_role(user_uuid UUID, user_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_exists BOOLEAN;
BEGIN
  -- Check if user_roles record exists
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = user_uuid) INTO user_role_exists;
  
  -- If not exists, create it with provided role
  IF NOT user_role_exists THEN
    INSERT INTO user_roles (user_id, role) 
    VALUES (user_uuid, user_role);
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_user_role(UUID, TEXT) TO authenticated;