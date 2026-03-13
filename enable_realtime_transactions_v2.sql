-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON transactions;

-- Create policy to allow users to view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow authenticated users to insert transactions (needed for P2P transfers where sender creates a record for receiver)
CREATE POLICY "Authenticated users can insert transactions" ON transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime for transactions table
-- We use a DO block to avoid errors if it's already added, or just run the command and let the user ignore the error if it happens.
-- But since we can't use DO blocks easily for ALTER PUBLICATION in some contexts, we will just run it.
-- If "transactions" is already in the publication, this might error, but the policies will still be applied.

alter publication supabase_realtime add table transactions;
