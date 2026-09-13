
import { supabase, isSupabaseConfigured } from './supabase';
import { fetchFromJikan } from './jikanService';
import { BaseJikanAnime } from '../src/types';

const SLEEP_MS = 1000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface SyncJobResult {
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  failures: number;
}

export async function ingestAnimeList(
  animeList: BaseJikanAnime[],
  jobId?: number
): Promise<SyncJobResult> {
  const result: SyncJobResult = { recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, failures: 0 };
  if (!isSupabaseConfigured) return result;

  for (const item of animeList) {
    result.recordsProcessed++;
    try {
      const animeData = {
        mal_id: item.mal_id,
        title: item.title,
        title_english: item.title_english || null,
        title_japanese: item.title_japanese || null,
        type: item.type || null,
        status: item.status || null,
        episodes: item.episodes || null,
        duration: item.duration || null,
        score: item.score || null,
        rank: item.rank || null,
        popularity: item.popularity || null,
        season: item.season || null,
        year: item.year || null,
        synopsis: item.synopsis || null,
        images_json: item.images ? item.images : null,
        trailer_url: item.trailer?.url || null,
        trailer_images_json: item.trailer?.images ? item.trailer.images : null,
        broadcast_day: item.broadcast?.day || null,
        broadcast_time: item.broadcast?.time || null,
        broadcast_timezone: item.broadcast?.timezone || null,
        broadcast_string: item.broadcast?.string || null,
        source: 'jikan',
        updated_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
      };

      const { error } = await supabase.from('anime').upsert(animeData, { onConflict: 'mal_id' });
      if (error) throw error;
      result.recordsUpdated++; // Simplifying: we just treat upsert as update for counts here if we don't know

      if (item.genres && Array.isArray(item.genres)) {
        for (const g of item.genres) {
          if (g.mal_id && g.name) {
             await supabase.from('genres').upsert({ mal_id: g.mal_id, name: g.name, type: g.type || 'anime' }, { onConflict: 'mal_id' });
             await supabase.from('anime_genres').upsert({ anime_id: item.mal_id, genre_id: g.mal_id }, { onConflict: 'anime_id,genre_id' });
          }
        }
      }
    } catch (err) {
      console.error(`Failed to ingest anime ${item.mal_id}:`, err);
      result.failures++;
    }

    if (jobId && result.recordsProcessed % 10 === 0) {
      await supabase.from('sync_jobs').update({
        records_processed: result.recordsProcessed,
        records_updated: result.recordsUpdated,
        failures: result.failures
      }).eq('id', jobId);
    }
  }

  if (jobId) {
    await supabase.from('sync_jobs').update({
      records_processed: result.recordsProcessed,
      records_updated: result.recordsUpdated,
      failures: result.failures
    }).eq('id', jobId);
  }

  return result;
}

export async function runIngestionJob(jobType: string, startUrl: string, maxPages: number = 1): Promise<void> {
  console.log(`[Ingestion] Starting job: ${jobType}`);
  if (!isSupabaseConfigured) {
    console.log('[Ingestion] Supabase not configured. Cannot run job.');
    return;
  }
  
  const { data: job, error: jobErr } = await supabase.from('sync_jobs').insert({
    job_type: jobType,
    status: 'running',
    started_at: new Date().toISOString()
  }).select().single();

  if (jobErr || !job) {
    console.error('Failed to create sync job', jobErr);
    return;
  }

  const jobId = job.id;

  try {
    let currentPage = 1;
    let hasNextPage = true;
    
    while (currentPage <= maxPages && hasNextPage) {
      const separator = startUrl.includes('?') ? '&' : '?';
      const endpoint = `${startUrl}${separator}page=${currentPage}`;
      
      console.log(`[Ingestion] Fetching page ${currentPage}... (${endpoint})`);
      const res = await fetchFromJikan<BaseJikanAnime[]>(endpoint, 0);
      
      if (!res.data || !Array.isArray(res.data)) {
        throw new Error('Invalid response from Jikan');
      }

      console.log(`[Ingestion] Ingesting ${res.data.length} records...`);
      await ingestAnimeList(res.data, jobId);
      
      if (res.pagination) {
        hasNextPage = res.pagination.has_next_page;
      } else {
        hasNextPage = false;
      }

      currentPage++;
      
      if (hasNextPage && currentPage <= maxPages) {
        await sleep(SLEEP_MS);
      }
    }

    await supabase.from('sync_jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', jobId);
    console.log(`[Ingestion] Job completed: ${jobType}`);
  } catch (err) {
    console.error(`[Ingestion] Job failed: ${jobType}`, err);
    await supabase.from('sync_jobs').update({ 
      status: 'failed', 
      last_error: err instanceof Error ? err.message : String(err), 
      completed_at: new Date().toISOString() 
    }).eq('id', jobId);
  }
}
