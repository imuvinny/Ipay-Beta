-- Ensure all necessary columns exist in the transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS role text DEFAULT 'client';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fee numeric DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS commission numeric DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category text DEFAULT 'activity';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_credit boolean DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount numeric;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON transactions;

-- Create policy to allow users to view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow authenticated users to insert transactions
-- This is required for P2P transfers so User A can insert a credit record for User B
CREATE POLICY "Authenticated users can insert transactions" ON transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- NOTE: We are intentionally SKIPPING the "alter publication" command
-- because the error confirmed it is already enabled.
