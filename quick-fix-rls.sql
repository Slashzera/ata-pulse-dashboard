-- Fix RLS Policies for User Approval System
-- Run this in your Supabase SQL Editor

-- 1. Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Felipe full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON profiles;

-- 2. Create comprehensive policies for profiles table
CREATE POLICY "Admin full access to profiles" ON profiles
  FOR ALL USING (
    auth.email() = 'drfeliperodrigues@outlook.com'
  );

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR auth.email() = 'drfeliperodrigues@outlook.com'
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR auth.email() = 'drfeliperodrigues@outlook.com'
  );

-- 3. Fix pending_users policies
DROP POLICY IF EXISTS "Admin can manage pending users" ON pending_users;
DROP POLICY IF EXISTS "Users can view own pending status" ON pending_users;

CREATE POLICY "Admin full access to pending users" ON pending_users
  FOR ALL USING (
    auth.email() = 'drfeliperodrigues@outlook.com'
  );

CREATE POLICY "Users can view own pending status" ON pending_users
  FOR SELECT USING (
    email = auth.email()
  );

-- 4. Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON pending_users TO authenticated;

-- 5. Create function to safely create profiles (if not exists)
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    -- Update existing profile
    UPDATE profiles 
    SET email = user_email, nome = user_name, updated_at = NOW()
    WHERE id = user_id;
  ELSE
    -- Insert new profile
    INSERT INTO profiles (id, email, nome, created_at, updated_at)
    VALUES (user_id, user_email, user_name, NOW(), NOW());
  END IF;
END;
$$;

-- 6. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;

-- 7. Verify admin user exists in profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'drfeliperodrigues@outlook.com') THEN
    INSERT INTO profiles (id, email, nome, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'drfeliperodrigues@outlook.com',
      'Felipe Rodrigues',
      NOW(),
      NOW()
    );
  END IF;
END
$$;

-- 8. Test the setup
SELECT 'Setup completed successfully!' as status; 