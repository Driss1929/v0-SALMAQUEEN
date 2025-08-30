-- Create voice_memories table
CREATE TABLE IF NOT EXISTS voice_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    audio_url TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    is_time_capsule BOOLEAN DEFAULT FALSE,
    unlock_date TIMESTAMP WITH TIME ZONE,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_voice_memories_user_date ON voice_memories(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_voice_memories_unlock_date ON voice_memories(unlock_date) WHERE is_time_capsule = TRUE;

-- Enable RLS
ALTER TABLE voice_memories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - both partners can see all voice memories
CREATE POLICY "Partners can view all voice memories" ON voice_memories
    FOR SELECT USING (
        user_id = auth.uid() OR 
        user_id IN (
            SELECT id FROM users WHERE id != auth.uid()
        )
    );

CREATE POLICY "Users can insert their own voice memories" ON voice_memories
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own voice memories" ON voice_memories
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own voice memories" ON voice_memories
    FOR DELETE USING (user_id = auth.uid());

-- Create storage bucket for voice memories
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-memories', 'voice-memories', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Partners can upload voice memories" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'voice-memories' AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Partners can view voice memories" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'voice-memories' AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete their own voice memories" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'voice-memories' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
