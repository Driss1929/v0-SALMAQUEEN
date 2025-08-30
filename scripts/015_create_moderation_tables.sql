-- Create reports table for content moderation
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_username TEXT REFERENCES app_users(username) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment')),
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'violence', 'inappropriate', 'misinformation', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  moderator_notes TEXT
);

-- Create user_actions table for rate limiting
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('post', 'comment', 'like', 'message')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moderation_log table for tracking moderation actions
CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('warn', 'mute', 'ban', 'content_removal')),
  reason TEXT NOT NULL,
  duration_hours INTEGER, -- NULL for permanent actions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;

-- Reports policies
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- User actions policies (for rate limiting)
CREATE POLICY "Users can insert their own actions" ON user_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own actions" ON user_actions
  FOR SELECT USING (auth.uid() = user_id);

-- Moderation log policies (admin only)
CREATE POLICY "Only admins can view moderation log" ON moderation_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_content ON reports(content_id, content_type);
CREATE INDEX idx_user_actions_user_time ON user_actions(user_id, created_at DESC);
CREATE INDEX idx_moderation_log_target ON moderation_log(target_user_id);

-- Function to clean up old user actions (for rate limiting)
CREATE OR REPLACE FUNCTION cleanup_old_user_actions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_actions 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is rate limited
CREATE OR REPLACE FUNCTION is_user_rate_limited(
  user_uuid UUID,
  action_name TEXT,
  max_actions INTEGER DEFAULT 10,
  time_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  action_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO action_count
  FROM user_actions
  WHERE user_id = user_uuid
    AND action_type = action_name
    AND created_at > NOW() - (time_window_minutes || ' minutes')::INTERVAL;
  
  RETURN action_count >= max_actions;
END;
$$ LANGUAGE plpgsql;
