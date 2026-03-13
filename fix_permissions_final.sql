-- Ensure profiles table has correct permissions for everyone
-- This is a "fix-all" script to ensure no RLS issues block profile updates

-- 1. Enable RLS (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;

-- 3. Re-create robust policies

-- VIEW: Everyone can view profiles (needed for P2P, Admin, etc.)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- INSERT: Authenticated users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ADMIN OVERRIDE: Allow specific admin email to update ANY profile (if needed)
-- For now, we'll stick to self-update, but ensure the policy is broad enough for "upsert"

-- 4. Grant permissions to authenticated role
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- 5. Ensure storage policies are correct (for 'avatars' lowercase)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- 6. Ensure storage policies are correct (for 'Avatars' Capitalized - Backward Compatibility)
INSERT INTO storage.buckets (id, name, public)
VALUES ('Avatars', 'Avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'Avatars');

DROP POLICY IF EXISTS "Authenticated users can upload Avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload Avatars" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'Avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own Avatars" ON storage.objects;
CREATE POLICY "Users can update own Avatars" ON storage.objects FOR UPDATE
USING (bucket_id = 'Avatars' AND auth.uid() = owner);
