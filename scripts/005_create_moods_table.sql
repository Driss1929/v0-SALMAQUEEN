-- Create moods table for mood tracking
CREATE TABLE IF NOT EXISTS moods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood VARCHAR(50) NOT NULL,
    mood_emoji VARCHAR(10) NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_moods_user_date ON moods(user_id, created_at);

-- Enable RLS
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own moods and their partner's moods" ON moods
    FOR SELECT USING (
        user_id = auth.uid() OR 
        user_id IN (
            SELECT id FROM users WHERE id != auth.uid() LIMIT 1
        )
    );

CREATE POLICY "Users can insert their own moods" ON moods
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own moods" ON moods
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own moods" ON moods
    FOR DELETE USING (user_id = auth.uid());
