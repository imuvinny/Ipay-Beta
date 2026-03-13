-- Comprehensive fix for profiles table permissions and structure

-- 1. Ensure the profiles table exists with all necessary columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Add other columns that might be missing
  agent_status TEXT DEFAULT 'none',
  skin_tone TEXT,
  gender TEXT,
  seed TEXT,
  style TEXT,
  fixed_hair BOOLEAN,
  no_beard BOOLEAN,
  id_number TEXT,
  business_name TEXT,
  address TEXT
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON public.profiles;

-- 4. Create robust policies

-- VIEW: Everyone can view profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- INSERT: Authenticated users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 5. Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 6. Fix storage permissions for 'Avatars' (Capitalized)
INSERT INTO storage.buckets (id, name, public)
VALUES ('Avatars', 'Avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to Avatars
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'Avatars');

-- Allow authenticated users to upload Avatars
DROP POLICY IF EXISTS "Authenticated users can upload Avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload Avatars" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'Avatars' AND auth.role() = 'authenticated');

-- Allow users to update their own Avatars
DROP POLICY IF EXISTS "Users can update own Avatars" ON storage.objects;
CREATE POLICY "Users can update own Avatars" ON storage.objects FOR UPDATE
USING (bucket_id = 'Avatars' AND auth.uid() = owner);

-- Allow users to delete their own Avatars
DROP POLICY IF EXISTS "Users can delete own Avatars" ON storage.objects;
CREATE POLICY "Users can delete own Avatars" ON storage.objects FOR DELETE
USING (bucket_id = 'Avatars' AND auth.uid() = owner);

-- 7. Fix storage permissions for 'avatars' (lowercase) - just in case
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
