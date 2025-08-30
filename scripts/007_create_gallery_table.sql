-- Create gallery_items table
CREATE TABLE IF NOT EXISTS gallery_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    caption TEXT,
    media_url TEXT NOT NULL,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
    special_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_gallery_items_user_date ON gallery_items(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_gallery_items_media_type ON gallery_items(media_type);
CREATE INDEX IF NOT EXISTS idx_gallery_items_special_date ON gallery_items(special_date) WHERE special_date IS NOT NULL;

-- Enable RLS
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - both partners can see all gallery items
CREATE POLICY "Partners can view all gallery items" ON gallery_items
    FOR SELECT USING (
        user_id = auth.uid() OR 
        user_id IN (
            SELECT id FROM users WHERE id != auth.uid()
        )
    );

CREATE POLICY "Users can insert their own gallery items" ON gallery_items
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own gallery items" ON gallery_items
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own gallery items" ON gallery_items
    FOR DELETE USING (user_id = auth.uid());

-- Create storage bucket for gallery
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Partners can upload gallery items" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'gallery' AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Partners can view gallery items" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'gallery' AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete their own gallery items" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'gallery' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
