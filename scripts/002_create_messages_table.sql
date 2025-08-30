-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_username TEXT NOT NULL REFERENCES public.app_users(username) ON DELETE CASCADE,
  receiver_username TEXT NOT NULL REFERENCES public.app_users(username) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'video', 'document')),
  media_url TEXT,
  media_name TEXT,
  media_size INTEGER,
  is_read BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_username);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_username);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_username, receiver_username, created_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages (users can only see messages they sent or received)
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT 
USING (
  sender_username = current_setting('app.current_user', true) OR 
  receiver_username = current_setting('app.current_user', true)
);

CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT 
WITH CHECK (sender_username = current_setting('app.current_user', true));

CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE 
USING (
  sender_username = current_setting('app.current_user', true) OR 
  receiver_username = current_setting('app.current_user', true)
);
