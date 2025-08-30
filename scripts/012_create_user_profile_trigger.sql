-- Create a trigger to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_users (
    id,
    username,
    display_name,
    bio,
    profile_picture_url,
    is_online,
    last_seen,
    following_count,
    followers_count,
    reels_count,
    posts_count
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data ->> 'display_name', 'New User'),
    null,
    null,
    true,
    now(),
    0,
    0,
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on app_users table
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Allow users to view all profiles (public profiles)
CREATE POLICY "Allow users to view all profiles" ON app_users 
FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON app_users 
FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (fallback)
CREATE POLICY "Allow users to insert their own profile" ON app_users 
FOR INSERT WITH CHECK (auth.uid() = id);
