-- Fix User Approval Function and Policies
-- This migration fixes the foreign key constraint error when approving users

-- 1. Create or replace the create_user_profile function (simplified without auth.users dependency)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the attempt
  RAISE NOTICE 'Attempting to create profile for user_id: %, email: %, name: %', user_id, user_email, user_name;
  
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Update existing profile
    UPDATE public.profiles 
    SET email = user_email, nome = user_name, updated_at = NOW()
    WHERE id = user_id;
    RAISE NOTICE 'Profile updated for user_id: %', user_id;
  ELSE
    -- Insert new profile
    INSERT INTO public.profiles (id, email, nome, created_at, updated_at)
    VALUES (user_id, user_email, user_name, NOW(), NOW());
    RAISE NOTICE 'Profile created for user_id: %', user_id;
  END IF;
END;
$$;

-- 1b. Create a safer function that doesn't require auth.users dependency
CREATE OR REPLACE FUNCTION public.approve_user_safe(
  user_email TEXT,
  user_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Log the attempt
  RAISE NOTICE 'Attempting to approve user: email: %, name: %', user_email, user_name;
  
  -- Check if the user is admin
  IF auth.email() != 'drfeliperodrigues@outlook.com' THEN
    RAISE EXCEPTION 'Access denied. Only admin can approve users.';
  END IF;
  
  -- Generate new UUID for the profile (independent of auth.users)
  new_user_id := gen_random_uuid();
  RAISE NOTICE 'Generated new user ID: %', new_user_id;
  
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = user_email) THEN
    -- Update existing profile
    UPDATE public.profiles 
    SET nome = user_name, updated_at = NOW()
    WHERE email = user_email;
    RAISE NOTICE 'Profile updated for email: %', user_email;
  ELSE
    -- Insert new profile
    INSERT INTO public.profiles (id, email, nome, created_at, updated_at)
    VALUES (new_user_id, user_email, user_name, NOW(), NOW());
    RAISE NOTICE 'Profile created for email: %', user_email;
  END IF;
  
  RETURN new_user_id;
END;
$$;

-- 2. Grant execute permission on the functions
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user_safe TO authenticated;

-- 3. Update RLS policies for better admin access
DROP POLICY IF EXISTS "Admin full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create comprehensive policies for profiles table
CREATE POLICY "Admin full access to profiles" ON public.profiles
  FOR ALL USING (
    auth.email() = 'drfeliperodrigues@outlook.com'
  );

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR auth.email() = 'drfeliperodrigues@outlook.com'
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR auth.email() = 'drfeliperodrigues@outlook.com'
  );

-- 4. Fix pending_users policies
DROP POLICY IF EXISTS "Admin full access to pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Users can view own pending status" ON public.pending_users;

CREATE POLICY "Admin full access to pending users" ON public.pending_users
  FOR ALL USING (
    auth.email() = 'drfeliperodrigues@outlook.com'
  );

CREATE POLICY "Users can view own pending status" ON public.pending_users
  FOR SELECT USING (
    email = auth.email()
  );

-- 5. Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.pending_users TO authenticated; 