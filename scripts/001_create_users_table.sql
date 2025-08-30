-- Create users table for the app (separate from auth.users)
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_picture_url TEXT,
  posts_count INTEGER DEFAULT 0,
  reels_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the two users (Idriss and Salma)
INSERT INTO public.app_users (username, display_name, bio, profile_picture_url) 
VALUES 
  ('idriss', 'Idriss', 'Challenge accepted! 💪', '/idriss-profile.jpg.jpg'),
  ('salma', 'Salma', 'Ready to conquer! 🚀', '/salma-profile.jpg.jpg')
ON CONFLICT (username) DO NOTHING;

-- Enable RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Create policies for app_users (allow all users to read, but only update their own)
CREATE POLICY "app_users_select_all" ON public.app_users FOR SELECT USING (true);
CREATE POLICY "app_users_update_own" ON public.app_users FOR UPDATE USING (username = current_setting('app.current_user', true));
