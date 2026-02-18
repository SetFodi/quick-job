-- ============================================================
-- Quick-Job: Supabase Auth → User + Wallet Trigger
-- ============================================================
-- Run this in the Supabase SQL Editor AFTER running
-- `prisma migrate dev` (tables and enums must exist first).
-- ============================================================

-- Function: creates a row in public.users + public.wallets
-- whenever a new user signs up via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into our users table using the auth user's id
  INSERT INTO public.users (id, email, full_name, role, language, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(new.raw_user_meta_data->>'role', 'CLIENT')::public."UserRole",
    COALESCE(new.raw_user_meta_data->>'language', 'en'),
    now(),
    now()
  );

  -- Immediately create an empty wallet for the new user
  INSERT INTO public.wallets (id, user_id, available_balance, frozen_balance, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    new.id,
    0,
    0,
    now(),
    now()
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires after each new auth user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
