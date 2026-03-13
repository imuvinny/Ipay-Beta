-- Add columns to profiles table if they don't exist
-- This is safe to run even if columns already exist
alter table public.profiles add column if not exists skin_tone text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists seed text;
alter table public.profiles add column if not exists style text;
alter table public.profiles add column if not exists fixed_hair text;
alter table public.profiles add column if not exists no_beard boolean;
alter table public.profiles add column if not exists agent_status text default 'none';
alter table public.profiles add column if not exists id_number text;
alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists username text;

-- Ensure RLS is enabled
alter table public.profiles enable row level security;

-- Re-apply policies (drop first to avoid errors if they exist)
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Verify the table exists and show count
select count(*) as profile_count from profiles;
