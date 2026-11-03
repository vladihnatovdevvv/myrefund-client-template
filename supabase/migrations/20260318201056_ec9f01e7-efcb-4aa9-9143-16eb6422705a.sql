
-- Allow authenticated users to insert their own transactions (for deposit/withdrawal requests)
CREATE POLICY "Users can insert own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
