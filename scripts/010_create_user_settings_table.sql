-- Create user_settings table for storing customization preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  color_scheme VARCHAR(20) DEFAULT 'romantic',
  dark_mode BOOLEAN DEFAULT false,
  font_size INTEGER DEFAULT 16,
  animations BOOLEAN DEFAULT true,
  sound_effects BOOLEAN DEFAULT true,
  mood_reminders BOOLEAN DEFAULT true,
  special_days_alerts BOOLEAN DEFAULT true,
  voice_memory_prompts BOOLEAN DEFAULT false,
  bucket_list_updates BOOLEAN DEFAULT true,
  share_location BOOLEAN DEFAULT false,
  public_profile BOOLEAN DEFAULT false,
  allow_ai_analysis BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();
