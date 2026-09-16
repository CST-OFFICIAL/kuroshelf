-- Allow anyone to read ratings to aggregate them
DROP POLICY IF EXISTS "Users can view their own ratings." ON ratings;
CREATE POLICY "Public ratings are viewable by everyone." ON ratings FOR SELECT USING (true);

-- Fix unique constraints to allow upserting via media_id
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_user_id_anime_id_key;
ALTER TABLE ratings ADD CONSTRAINT ratings_user_id_media_id_media_type_key UNIQUE (user_id, media_id, media_type);
