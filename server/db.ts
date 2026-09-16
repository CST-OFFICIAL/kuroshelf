
import { supabase, isSupabaseConfigured } from './supabase';
import crypto from 'node:crypto';

export interface BookmarkRecord {
  id: number;
  user_id: string;
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

export async function getUserBookmarks(userId: string): Promise<BookmarkRecord[]> {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase.from('bookmarks').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  return (data as BookmarkRecord[]) || [];
}

export async function upsertBookmark(data: {
  userId: string;
  mediaId: number;
  mediaType: 'anime' | 'manga';
  title: string;
  imageUrl?: string;
  status?: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';
  progress?: number;
  totalEpisodes?: number;
  notes?: string;
}) {
  if (!isSupabaseConfigured) return null;
  
  const payload = {
    user_id: data.userId,
    media_id: data.mediaId,
    media_type: data.mediaType,
    title: data.title,
    ...(data.imageUrl && { image_url: data.imageUrl }),
    ...(data.status && { status: data.status }),
    ...(data.progress !== undefined && { progress: data.progress }),
    ...(data.totalEpisodes !== undefined && { total_episodes: data.totalEpisodes }),
    ...(data.notes !== undefined && { notes: data.notes }),
    updated_at: new Date().toISOString()
  };

  const { data: result, error } = await supabase
    .from('bookmarks')
    .upsert(payload, { onConflict: 'user_id,media_id,media_type' })
    .select()
    .single();

  if (error) console.error('upsertBookmark error:', error);
  return result;
}

export async function deleteBookmark(userId: string, mediaId: number, mediaType: 'anime' | 'manga') {
  if (!isSupabaseConfigured) return;
  await supabase.from('bookmarks').delete().eq('user_id', userId).eq('media_id', mediaId).eq('media_type', mediaType);
}

export async function getUserLikes(userId: string) {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase.from('likes').select('media_id, media_type, title, image_url').eq('user_id', userId);
  return data || [];
}

export async function toggleLike(userId: string, mediaId: number, mediaType: 'anime' | 'manga', title: string, imageUrl?: string) {
  if (!isSupabaseConfigured) return { liked: false };
  const { data: existing } = await supabase.from('likes').select('id').eq('user_id', userId).eq('media_id', mediaId).eq('media_type', mediaType).single();
  
  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id);
    return { liked: false };
  } else {
    await supabase.from('likes').insert({ user_id: userId, media_id: mediaId, media_type: mediaType, title, image_url: imageUrl || null });
    return { liked: true };
  }
}

export async function getUserRatings(userId: string) {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase.from('ratings').select('media_id, media_type, rating').eq('user_id', userId);
  return data || [];
}

export async function setRating(userId: string, mediaId: number, mediaType: 'anime' | 'manga', rating: number) {
  if (!isSupabaseConfigured) return;
  await supabase.from('ratings').upsert({ user_id: userId, media_id: mediaId, media_type: mediaType, rating, updated_at: new Date().toISOString() }, { onConflict: 'user_id,media_id,media_type' });
}

export async function removeRating(userId: string, mediaId: number, mediaType: 'anime' | 'manga') {
  if (!isSupabaseConfigured) return;
  await supabase.from('ratings').delete().eq('user_id', userId).eq('media_id', mediaId).eq('media_type', mediaType);
}

export async function getPolls(userId?: string | null, voterHash?: string) {
  return []; // Simplified for this migration step
}

export async function votePoll(pollId: number, optionId: number, userId: string | null, voterHash: string) {
  return { success: false, message: 'Polls not migrated yet' };
}

export async function getCommunityScore(mediaId: number, mediaType: 'anime' | 'manga' = 'anime'): Promise<{ score: number | null, users: number }> {
  if (!isSupabaseConfigured) return { score: null, users: 0 };
  const { data, error } = await supabase
    .from('ratings')
    .select('rating')
    .eq('media_id', mediaId)
    .eq('media_type', mediaType);

  if (error || !data || data.length === 0) return { score: null, users: 0 };

  const total = data.reduce((acc, curr) => acc + curr.rating, 0);
  return {
    score: Number((total / data.length).toFixed(2)),
    users: data.length
  };
}

export async function getTopCommunityAnime(limit: number = 24): Promise<any[]> {
  if (!isSupabaseConfigured) return [];
  // Get aggregate ratings
  const { data, error } = await supabase
    .from('ratings')
    .select('media_id, rating')
    .eq('media_type', 'anime');

  if (error || !data) return [];

  const aggregates: Record<number, { total: number, count: number }> = {};
  data.forEach(r => {
    if (!aggregates[r.media_id]) aggregates[r.media_id] = { total: 0, count: 0 };
    aggregates[r.media_id].total += r.rating;
    aggregates[r.media_id].count += 1;
  });

  const sorted = Object.entries(aggregates)
    .map(([id, agg]) => ({ id: Number(id), score: agg.total / agg.count, count: agg.count }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return sorted;
}
