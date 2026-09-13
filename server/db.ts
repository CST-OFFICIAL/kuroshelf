import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// Ensure data directory exists
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'kuroshelf.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS anime (
      mal_id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      title_english TEXT,
      title_japanese TEXT,
      image_url TEXT,
      score REAL,
      status TEXT,
      episodes INTEGER,
      synopsis TEXT,
      genres TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS manga (
      mal_id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      title_english TEXT,
      image_url TEXT,
      score REAL,
      status TEXT,
      chapters INTEGER,
      volumes INTEGER,
      synopsis TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_id INTEGER NOT NULL,
      media_type TEXT NOT NULL CHECK(media_type IN ('anime', 'manga')),
      title TEXT NOT NULL,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'plan_to_watch' CHECK(status IN ('watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch')),
      progress INTEGER NOT NULL DEFAULT 0,
      total_episodes INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, media_id, media_type)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_id INTEGER NOT NULL,
      media_type TEXT NOT NULL CHECK(media_type IN ('anime', 'manga')),
      title TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, media_id, media_type)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_id INTEGER NOT NULL,
      media_type TEXT NOT NULL CHECK(media_type IN ('anime', 'manga')),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 10),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, media_id, media_type)
    );

    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      anime_id INTEGER,
      question TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('upcoming', 'active', 'closed')),
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS poll_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      option_text TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS poll_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
      option_id INTEGER NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      voter_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(poll_id, voter_hash)
    );

    CREATE TABLE IF NOT EXISTS anime_cache (
      cache_key TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
    CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);
    CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
    CREATE INDEX IF NOT EXISTS idx_anime_cache_expires ON anime_cache(expires_at);
  `);

  // Seed default polls if none exist (with 0 votes, genuinely truthful)
  const pollCount = db.prepare('SELECT COUNT(*) as count FROM polls').get() as { count: number };
  if (pollCount.count === 0) {
    const insertPoll = db.prepare(`
      INSERT INTO polls (title, anime_id, question, status, starts_at, ends_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now', '+90 days'))
    `);
    const insertOption = db.prepare(`
      INSERT INTO poll_options (poll_id, option_text, sort_order)
      VALUES (?, ?, ?)
    `);

    // Poll 1
    const p1 = insertPoll.run(
      'Demon Slayer: Kimetsu no Yaiba - Infinity Castle',
      58514,
      'Will the Infinity Castle Arc movie trilogy break global anime box office records?',
      'active'
    );
    const p1Id = Number(p1.lastInsertRowid);
    insertOption.run(p1Id, 'Yes, surpassing Mugen Train easily', 1);
    insertOption.run(p1Id, 'Top 3 globally, but Mugen Train retains #1', 2);
    insertOption.run(p1Id, 'Domestic Japan records only', 3);

    // Poll 2
    const p2 = insertPoll.run(
      'Jujutsu Kaisen Season 3 (Culling Game)',
      57984,
      'Who will have the most impactful battle sequence in the Culling Game adaptation?',
      'active'
    );
    const p2Id = Number(p2.lastInsertRowid);
    insertOption.run(p2Id, 'Yuta Okkotsu in Sendai Colony', 1);
    insertOption.run(p2Id, 'Kinji Hakari vs. Hajime Kashimo', 2);
    insertOption.run(p2Id, 'Megumi Fushiguro vs. Reggie Star', 3);

    // Poll 3
    const p3 = insertPoll.run(
      'Chainsaw Man – The Movie: Reze Arc',
      57134,
      'Which element of the Reze Arc movie are you most anticipating from MAPPA?',
      'active'
    );
    const p3Id = Number(p3.lastInsertRowid);
    insertOption.run(p3Id, 'Bomb Girl action choreography & cinematic scale', 1);
    insertOption.run(p3Id, 'Denji & Reze relationship dynamic & pacing', 2);
    insertOption.run(p3Id, 'Original soundtrack compositions by Kensuke Ushio', 3);
  }
}

// ---------------- Authentication & Security Helpers ----------------

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculated = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculated, 'hex'));
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface UserRow {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  salt: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export function createUser(email: string, username: string, password: string): UserRow {
  const { hash, salt } = hashPassword(password);
  const stmt = db.prepare(`
    INSERT INTO users (email, username, password_hash, salt)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(email.toLowerCase().trim(), username.trim(), hash, salt);
  const userId = Number(result.lastInsertRowid);
  return db.prepare('SELECT id, email, username, avatar_url, created_at, updated_at FROM users WHERE id = ?').get(userId) as UserRow;
}

export function getUserByEmail(email: string): UserRow | null {
  return (db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as UserRow) || null;
}

export function getUserByUsername(username: string): UserRow | null {
  return (db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username.trim()) as UserRow) || null;
}

export function getUserById(id: number): Omit<UserRow, 'password_hash' | 'salt'> | null {
  return (db.prepare('SELECT id, email, username, avatar_url, created_at, updated_at FROM users WHERE id = ?').get(id) as Omit<UserRow, 'password_hash' | 'salt'>) || null;
}

export function createSession(userId: number, daysValid: number = 30): string {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(userId, token, expiresAt);
  return token;
}

export function getSessionUser(token: string): Omit<UserRow, 'password_hash' | 'salt'> | null {
  if (!token) return null;
  const session = db.prepare(`
    SELECT s.id as session_id, s.expires_at, u.id, u.email, u.username, u.avatar_url, u.created_at, u.updated_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token) as { session_id: number; expires_at: string; id: number; email: string; username: string; avatar_url: string | null; created_at: string; updated_at: string } | undefined;

  if (!session) return null;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(session.session_id);
    return null;
  }

  return {
    id: session.id,
    email: session.email,
    username: session.username,
    avatar_url: session.avatar_url,
    created_at: session.created_at,
    updated_at: session.updated_at,
  };
}

export function deleteSession(token: string) {
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
}

// ---------------- Shelf & Bookmarks ----------------

export interface BookmarkRecord {
  id: number;
  user_id: number;
  media_id: number;
  media_type: 'anime' | 'manga';
  title: string;
  image_url: string | null;
  status: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  progress: number;
  total_episodes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function getUserBookmarks(userId: number): BookmarkRecord[] {
  return db.prepare(`
    SELECT * FROM bookmarks WHERE user_id = ? ORDER BY updated_at DESC
  `).all(userId) as BookmarkRecord[];
}

export function upsertBookmark(data: {
  userId: number;
  mediaId: number;
  mediaType: 'anime' | 'manga';
  title: string;
  imageUrl?: string;
  status?: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  progress?: number;
  totalEpisodes?: number;
  notes?: string;
}) {
  const existing = db.prepare(`
    SELECT id FROM bookmarks WHERE user_id = ? AND media_id = ? AND media_type = ?
  `).get(data.userId, data.mediaId, data.mediaType) as { id: number } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE bookmarks
      SET status = COALESCE(?, status),
          progress = COALESCE(?, progress),
          total_episodes = COALESCE(?, total_episodes),
          notes = COALESCE(?, notes),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      data.status || null,
      data.progress !== undefined ? data.progress : null,
      data.totalEpisodes !== undefined ? data.totalEpisodes : null,
      data.notes || null,
      existing.id
    );
    return db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(existing.id) as BookmarkRecord;
  } else {
    const result = db.prepare(`
      INSERT INTO bookmarks (user_id, media_id, media_type, title, image_url, status, progress, total_episodes, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.userId,
      data.mediaId,
      data.mediaType,
      data.title,
      data.imageUrl || null,
      data.status || 'plan_to_watch',
      data.progress || 0,
      data.totalEpisodes || 0,
      data.notes || null
    );
    return db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(result.lastInsertRowid) as BookmarkRecord;
  }
}

export function deleteBookmark(userId: number, mediaId: number, mediaType: 'anime' | 'manga') {
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND media_id = ? AND media_type = ?').run(userId, mediaId, mediaType);
}

// ---------------- Likes ----------------

export function getUserLikes(userId: number): { media_id: number; media_type: string; title: string; image_url: string }[] {
  return db.prepare('SELECT media_id, media_type, title, image_url FROM likes WHERE user_id = ?').all(userId) as { media_id: number; media_type: string; title: string; image_url: string }[];
}

export function toggleLike(userId: number, mediaId: number, mediaType: 'anime' | 'manga', title: string, imageUrl?: string): { liked: boolean } {
  const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND media_id = ? AND media_type = ?').get(userId, mediaId, mediaType);
  if (existing) {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND media_id = ? AND media_type = ?').run(userId, mediaId, mediaType);
    return { liked: false };
  } else {
    db.prepare('INSERT INTO likes (user_id, media_id, media_type, title, image_url) VALUES (?, ?, ?, ?, ?)').run(userId, mediaId, mediaType, title, imageUrl || null);
    return { liked: true };
  }
}

// ---------------- Ratings ----------------

export function getUserRatings(userId: number): { media_id: number; media_type: string; rating: number }[] {
  return db.prepare('SELECT media_id, media_type, rating FROM ratings WHERE user_id = ?').all(userId) as { media_id: number; media_type: string; rating: number }[];
}

export function setRating(userId: number, mediaId: number, mediaType: 'anime' | 'manga', rating: number) {
  if (rating < 1 || rating > 10) throw new Error('Rating must be between 1 and 10');
  const existing = db.prepare('SELECT id FROM ratings WHERE user_id = ? AND media_id = ? AND media_type = ?').get(userId, mediaId, mediaType) as { id: number } | undefined;
  if (existing) {
    db.prepare('UPDATE ratings SET rating = ?, updated_at = datetime("now") WHERE id = ?').run(rating, existing.id);
  } else {
    db.prepare('INSERT INTO ratings (user_id, media_id, media_type, rating) VALUES (?, ?, ?, ?)').run(userId, mediaId, mediaType, rating);
  }
}

export function removeRating(userId: number, mediaId: number, mediaType: 'anime' | 'manga') {
  db.prepare('DELETE FROM ratings WHERE user_id = ? AND media_id = ? AND media_type = ?').run(userId, mediaId, mediaType);
}

// ---------------- Polls ----------------

export interface PollOptionWithCount {
  id: number;
  option_text: string;
  votes: number;
  percentage: number;
}

export interface PollWithResults {
  id: number;
  title: string;
  anime_id: number | null;
  question: string;
  status: 'upcoming' | 'active' | 'closed';
  starts_at: string;
  ends_at: string;
  total_votes: number;
  user_voted_option_id: number | null;
  options: PollOptionWithCount[];
}

export function getPolls(userId?: number | null, voterHash?: string): PollWithResults[] {
  const polls = db.prepare(`
    SELECT * FROM polls ORDER BY id ASC
  `).all() as { id: number; title: string; anime_id: number | null; question: string; status: string; starts_at: string; ends_at: string }[];

  return polls.map((poll) => {
    // Total votes for this poll
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM poll_votes WHERE poll_id = ?').get(poll.id) as { count: number };
    const totalVotes = totalRow.count;

    // Options with counts
    const options = db.prepare(`
      SELECT o.id, o.option_text, COUNT(v.id) as votes
      FROM poll_options o
      LEFT JOIN poll_votes v ON o.id = v.option_id
      WHERE o.poll_id = ?
      GROUP BY o.id
      ORDER BY o.sort_order ASC, o.id ASC
    `).all(poll.id) as { id: number; option_text: string; votes: number }[];

    // Check if current user or voterHash voted
    let userVotedOptionId: number | null = null;
    if (userId) {
      const vote = db.prepare('SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_id = ?').get(poll.id, userId) as { option_id: number } | undefined;
      if (vote) userVotedOptionId = vote.option_id;
    } else if (voterHash) {
      const vote = db.prepare('SELECT option_id FROM poll_votes WHERE poll_id = ? AND voter_hash = ?').get(poll.id, voterHash) as { option_id: number } | undefined;
      if (vote) userVotedOptionId = vote.option_id;
    }

    const optionsWithPct: PollOptionWithCount[] = options.map((opt) => ({
      id: opt.id,
      option_text: opt.option_text,
      votes: opt.votes,
      percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
    }));

    return {
      id: poll.id,
      title: poll.title,
      anime_id: poll.anime_id,
      question: poll.question,
      status: poll.status as 'upcoming' | 'active' | 'closed',
      starts_at: poll.starts_at,
      ends_at: poll.ends_at,
      total_votes: totalVotes,
      user_voted_option_id: userVotedOptionId,
      options: optionsWithPct,
    };
  });
}

export function votePoll(pollId: number, optionId: number, userId: number | null, voterHash: string): { success: boolean; message?: string } {
  // Check poll exists and is active
  const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId) as { id: number; status: string; ends_at: string } | undefined;
  if (!poll) return { success: false, message: 'Poll not found' };
  if (poll.status !== 'active') return { success: false, message: 'This poll is no longer active' };
  if (new Date(poll.ends_at).getTime() < Date.now()) return { success: false, message: 'This poll has ended' };

  // Check option belongs to poll
  const option = db.prepare('SELECT id FROM poll_options WHERE id = ? AND poll_id = ?').get(optionId, pollId);
  if (!option) return { success: false, message: 'Invalid option selected for this poll' };

  // Check if already voted
  if (userId) {
    const existingUserVote = db.prepare('SELECT id FROM poll_votes WHERE poll_id = ? AND user_id = ?').get(pollId, userId);
    if (existingUserVote) return { success: false, message: 'You have already voted in this poll' };
  }
  const existingHashVote = db.prepare('SELECT id FROM poll_votes WHERE poll_id = ? AND voter_hash = ?').get(pollId, voterHash);
  if (existingHashVote) return { success: false, message: 'A vote has already been recorded from this device' };

  try {
    db.prepare(`
      INSERT INTO poll_votes (poll_id, option_id, user_id, voter_hash)
      VALUES (?, ?, ?, ?)
    `).run(pollId, optionId, userId || null, voterHash);
    return { success: true };
  } catch (err) {
    return { success: false, message: 'Failed to record vote due to duplicate constraint' };
  }
}
