-- Enable RLS on posts table and create proper policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow users to view all posts (public feed)
CREATE POLICY "Allow users to view all posts" ON posts 
FOR SELECT USING (true);

-- Allow users to insert their own posts
CREATE POLICY "Allow users to insert their own posts" ON posts 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE username = author_username 
    AND id = auth.uid()
  )
);

-- Allow users to update their own posts
CREATE POLICY "Allow users to update their own posts" ON posts 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE username = author_username 
    AND id = auth.uid()
  )
);

-- Allow users to delete their own posts
CREATE POLICY "Allow users to delete their own posts" ON posts 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE username = author_username 
    AND id = auth.uid()
  )
);

-- Enable RLS on likes table
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Allow users to view all likes
CREATE POLICY "Allow users to view all likes" ON likes 
FOR SELECT USING (true);

-- Allow users to insert their own likes
CREATE POLICY "Allow users to insert their own likes" ON likes 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE username = user_username 
    AND id = auth.uid()
  )
);

-- Allow users to delete their own likes
CREATE POLICY "Allow users to delete their own likes" ON likes 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE username = user_username 
    AND id = auth.uid()
  )
);

-- Enable RLS on comments table
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow users to view all comments
CREATE POLICY "Allow users to view all comments" ON comments 
FOR SELECT USING (true);

-- Allow users to insert their own comments
CREATE POLICY "Allow users to insert their own comments" ON comments 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE username = author_username 
    AND id = auth.uid()
  )
);

-- Allow users to update their own comments
CREATE POLICY "Allow users to update their own comments" ON comments 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE username = author_username 
    AND id = auth.uid()
  )
);

-- Allow users to delete their own comments
CREATE POLICY "Allow users to delete their own comments" ON comments 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE username = author_username 
    AND id = auth.uid()
  )
);
