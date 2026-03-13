-- Create profiles table if it doesn't exist (for reference)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  
  -- App specific fields
  skin_tone text,
  gender text,
  seed text,
  style text,
  fixed_hair text,
  no_beard boolean,
  
  agent_status text default 'none', -- 'none', 'pending', 'approved'
  id_number text,
  business_name text,
  address text
);

-- Create transactions table
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  
  type text not null,
  amount numeric not null,
  is_credit boolean not null,
  
  category text,
  role text, -- 'client' or 'agent'
  fee numeric default 0,
  commission numeric default 0,
  
  metadata jsonb
);

-- Enable Realtime
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.transactions;

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Policies for Transactions
create policy "Users can view their own transactions."
  on transactions for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own transactions."
  on transactions for insert
  with check ( auth.uid() = user_id );

-- Admin Policies (Replace with your specific admin email logic)
-- Allow admin to view all transactions
create policy "Admins can view all transactions"
    on transactions for select
    using ( (auth.jwt() ->> 'email') = 'vincentlewa6@gmail.com' );

-- Allow admin to view all profiles (already covered by public policy, but good to be explicit if public access is revoked)
create policy "Admins can view all profiles"
    on profiles for select
    using ( (auth.jwt() ->> 'email') = 'vincentlewa6@gmail.com' );
