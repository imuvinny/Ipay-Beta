-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;

-- Create policy to allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policy to allow public read access to profiles (needed for P2P and Admin)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to update profiles (for Admin actions)
CREATE POLICY "Authenticated users can update profiles" ON profiles
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Ensure agent_status column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_status text DEFAULT 'none';

-- NOTE: The line below is removed because you received an error saying it's already done.
-- alter publication supabase_realtime add table profiles;
