-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow public read access to profiles (needed for P2P and Admin)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Allow authenticated users to update profiles (for admin/agent approval)
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;
CREATE POLICY "Authenticated users can update profiles" ON profiles
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Enable Realtime for profiles table
alter publication supabase_realtime add table profiles;

-- Ensure agent_status column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_status text DEFAULT 'none';

-- STORAGE POLICIES for 'Avatars' bucket (Capitalized)

-- Create Avatars bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('Avatars', 'Avatars', true)
on conflict (id) do update set public = true;

-- Allow public access to Avatars
drop policy if exists "Public Access Avatars" on storage.objects;
create policy "Public Access Avatars"
on storage.objects for select
using ( bucket_id = 'Avatars' );

-- Allow authenticated users to upload Avatars
drop policy if exists "Authenticated users can upload Avatars" on storage.objects;
create policy "Authenticated users can upload Avatars"
on storage.objects for insert
with check ( bucket_id = 'Avatars' and auth.role() = 'authenticated' );

-- Allow users to update their own Avatars
drop policy if exists "Users can update own Avatars" on storage.objects;
create policy "Users can update own Avatars"
on storage.objects for update
using ( bucket_id = 'Avatars' and auth.uid() = owner )
with check ( bucket_id = 'Avatars' and auth.uid() = owner );

-- Allow users to delete their own Avatars
drop policy if exists "Users can delete own Avatars" on storage.objects;
create policy "Users can delete own Avatars"
on storage.objects for delete
using ( bucket_id = 'Avatars' and auth.uid() = owner );
