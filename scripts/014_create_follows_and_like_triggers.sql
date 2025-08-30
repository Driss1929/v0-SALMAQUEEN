-- Create follows table for user relationships
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_username TEXT NOT NULL REFERENCES app_users(username) ON DELETE CASCADE,
  following_username TEXT NOT NULL REFERENCES app_users(username) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_username, following_username),
  CHECK (follower_username != following_username)
);

-- Enable RLS on follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Allow users to view all follows (public relationships)
CREATE POLICY "Allow users to view all follows" ON follows 
FOR SELECT USING (true);

-- Allow users to follow others
CREATE POLICY "Allow users to follow others" ON follows 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE username = follower_username 
    AND id = auth.uid()
  )
);

-- Allow users to unfollow others
CREATE POLICY "Allow users to unfollow others" ON follows 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE username = follower_username 
    AND id = auth.uid()
  )
);

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE app_users 
    SET following_count = following_count + 1 
    WHERE username = NEW.follower_username;
    
    -- Increment followers count for followed user
    UPDATE app_users 
    SET followers_count = followers_count + 1 
    WHERE username = NEW.following_username;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE app_users 
    SET following_count = GREATEST(following_count - 1, 0) 
    WHERE username = OLD.follower_username;
    
    -- Decrement followers count for followed user
    UPDATE app_users 
    SET followers_count = GREATEST(followers_count - 1, 0) 
    WHERE username = OLD.following_username;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for follow count updates
DROP TRIGGER IF EXISTS trigger_update_follow_counts_insert ON follows;
DROP TRIGGER IF EXISTS trigger_update_follow_counts_delete ON follows;

CREATE TRIGGER trigger_update_follow_counts_insert
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

CREATE TRIGGER trigger_update_follow_counts_delete
  AFTER DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- Function to update like counts on posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for post like count updates
DROP TRIGGER IF EXISTS trigger_update_post_likes_count_insert ON likes;
DROP TRIGGER IF EXISTS trigger_update_post_likes_count_delete ON likes;

CREATE TRIGGER trigger_update_post_likes_count_insert
  AFTER INSERT ON likes
  FOR EACH ROW
  WHEN (NEW.post_id IS NOT NULL)
  EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_post_likes_count_delete
  AFTER DELETE ON likes
  FOR EACH ROW
  WHEN (OLD.post_id IS NOT NULL)
  EXECUTE FUNCTION update_post_likes_count();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_username);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_username);
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON likes(post_id, user_username);
CREATE INDEX IF NOT EXISTS idx_likes_comment_user ON likes(comment_id, user_username);
