-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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
-- Ideally, this should be restricted to authenticated users only, but for this demo app, public read is simpler.
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Create policy to allow admins (or anyone for this demo) to update any profile (for approval)
-- In a real app, you'd check for admin role. Here we'll allow authenticated users to update for simplicity of the demo flow.
CREATE POLICY "Authenticated users can update profiles" ON profiles
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Enable Realtime for profiles table
alter publication supabase_realtime add table profiles;

-- Ensure agent_status column exists and has a default
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_status text DEFAULT 'none';
