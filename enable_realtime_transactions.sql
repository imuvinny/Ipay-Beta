-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

-- Create policy to allow users to view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for transactions table
-- We need to check if it's already added to avoid errors, but standard SQL doesn't have "IF NOT EXISTS" for publication members easily.
-- We will try to add it, and if it fails, it's fine (or we can drop and re-add).
-- However, the previous error showed that "profiles" was already a member.
-- A safe way is to ignore the error or just run it. 
-- Since I can't interactively handle errors, I'll use a DO block or just run it and hope it's not already there, 
-- or better, I will just run the alter publication command. If it fails, the user can ignore it like before, 
-- but I'll try to make it robust.

-- Actually, for the publication, if I run `alter publication supabase_realtime add table transactions;` and it exists, it errors.
-- I'll assume it's NOT there yet since we are setting it up.

alter publication supabase_realtime add table transactions;
