CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  media_id INTEGER, -- Legacy compatibility for Jikan ID
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are publicly viewable" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);
