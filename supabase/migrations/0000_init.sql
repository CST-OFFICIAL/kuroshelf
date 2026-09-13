-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. CANONICAL ANIME CATALOG
CREATE TABLE anime (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_english TEXT,
  title_japanese TEXT,
  type TEXT,
  status TEXT,
  episodes INTEGER,
  duration TEXT,
  score NUMERIC,
  rank INTEGER,
  popularity INTEGER,
  season TEXT,
  year INTEGER,
  synopsis TEXT,
  images_json JSONB,
  trailer_url TEXT,
  trailer_images_json JSONB,
  broadcast_day TEXT,
  broadcast_time TEXT,
  broadcast_timezone TEXT,
  broadcast_string TEXT,
  
  -- Compatibility column for existing codebase (MyAnimeList ID)
  mal_id INTEGER UNIQUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anime is publicly viewable" ON anime FOR SELECT USING (true);

-- Indexes for frequent searches
CREATE INDEX idx_anime_mal_id ON anime(mal_id);
CREATE INDEX idx_anime_popularity ON anime(popularity ASC);
CREATE INDEX idx_anime_score ON anime(score DESC);
CREATE INDEX idx_anime_status ON anime(status);
CREATE INDEX idx_anime_title ON anime(title);
CREATE INDEX idx_anime_year ON anime(year);

-- 3. EXTERNAL ANIME SOURCES (Normalization for multi-source)
CREATE TABLE anime_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- e.g., 'jikan', 'anilist', 'kitsu'
  external_id TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, external_id)
);
ALTER TABLE anime_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anime sources are publicly viewable" ON anime_sources FOR SELECT USING (true);
CREATE INDEX idx_anime_sources_anime_id ON anime_sources(anime_id);
CREATE INDEX idx_anime_sources_provider_external_id ON anime_sources(provider, external_id);

-- 4. GENRES
CREATE TABLE genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  -- legacy compatibility
  mal_id INTEGER UNIQUE
);
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Genres are publicly viewable" ON genres FOR SELECT USING (true);

CREATE TABLE anime_genres (
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (anime_id, genre_id)
);
ALTER TABLE anime_genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anime genres are publicly viewable" ON anime_genres FOR SELECT USING (true);
CREATE INDEX idx_anime_genres_genre_id ON anime_genres(genre_id);

-- 5. STUDIOS
CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  -- legacy compatibility
  mal_id INTEGER UNIQUE
);
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Studios are publicly viewable" ON studios FOR SELECT USING (true);

CREATE TABLE anime_studios (
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
  PRIMARY KEY (anime_id, studio_id)
);
ALTER TABLE anime_studios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anime studios are publicly viewable" ON anime_studios FOR SELECT USING (true);
CREATE INDEX idx_anime_studios_studio_id ON anime_studios(studio_id);

-- 6. ANIME RELATIONSHIPS
CREATE TABLE anime_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  target_anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL, -- e.g., 'sequel', 'prequel', 'adaptation', 'side_story', 'spin_off'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_anime_id, target_anime_id, relation_type)
);
ALTER TABLE anime_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anime relations are publicly viewable" ON anime_relations FOR SELECT USING (true);
CREATE INDEX idx_anime_relations_source ON anime_relations(source_anime_id);

-- 7. STREAMING/WATCH PROVIDERS
CREATE TABLE streaming_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT
);
ALTER TABLE streaming_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Streaming providers are publicly viewable" ON streaming_providers FOR SELECT USING (true);

CREATE TABLE anime_streaming (
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES streaming_providers(id) ON DELETE CASCADE,
  region TEXT NOT NULL DEFAULT 'global',
  url TEXT,
  PRIMARY KEY (anime_id, provider_id, region)
);
ALTER TABLE anime_streaming ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anime streaming viewable" ON anime_streaming FOR SELECT USING (true);

-- 8. USER FEATURES (Shelves, Bookmarks, Likes, Ratings)
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  -- Legacy compatibility
  media_id INTEGER,
  media_type TEXT NOT NULL DEFAULT 'anime',
  title TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'plan_to_watch',
  progress INTEGER NOT NULL DEFAULT 0,
  total_episodes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own bookmarks." ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookmarks." ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookmarks." ON bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks." ON bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  -- Legacy compatibility
  media_id INTEGER,
  media_type TEXT NOT NULL DEFAULT 'anime',
  title TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own likes." ON likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own likes." ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes." ON likes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  -- Legacy compatibility
  media_id INTEGER,
  media_type TEXT NOT NULL DEFAULT 'anime',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, anime_id)
);
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own ratings." ON ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ratings." ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings." ON ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ratings." ON ratings FOR DELETE USING (auth.uid() = user_id);

-- 9. PREDICTION POLLS
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Polls are publicly viewable" ON polls FOR SELECT USING (true);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL
);
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Poll options are publicly viewable" ON poll_options FOR SELECT USING (true);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own votes." ON poll_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own votes." ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. SYNCHRONIZATION INFRASTRUCTURE (Internal/Admin)
CREATE TABLE sync_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- e.g., 'full', 'incremental', 'daily'
  status TEXT NOT NULL, -- e.g., 'running', 'success', 'failed'
  records_processed INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_log TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms BIGINT
);
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;
-- No public policies -> accessible only via Service Role

-- Auth Trigger for Profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
