// @ts-nocheck
import { supabase, isSupabaseConfigured } from './supabase';
import { fetchFromJikan, isNsfwOrAdult, GENRE_NAME_TO_MAL_ID } from './jikanService';
import { cleanOfficialText } from './officialSynopsisService';
import { BaseJikanAnime } from '../src/types';

const SLEEP_MS = 1000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface SyncJobResult {
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  failures: number;
}


async function getAnilistScoresBatch(malIds: number[]): Promise<Record<number, number>> {
  if (malIds.length === 0) return {};
  try {
     const query = `
       query ($idMals: [Int]) {
         Page(page: 1, perPage: 50) {
           media(idMal_in: $idMals, type: ANIME) {
             idMal
             averageScore
           }
         }
       }
     `;
     const res = await fetch('https://graphql.anilist.co', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
       body: JSON.stringify({ query, variables: { idMals: malIds } })
     });
     if (res.ok) {
       const data = await res.json();
       const map = {};
       const mediaList = data?.data?.Page?.media || [];
       for (const media of mediaList) {
         if (media.idMal && media.averageScore) {
           map[media.idMal] = media.averageScore / 10;
         }
       }
       return map;
     }
  } catch (e) {}
  return {};
}

export async function ingestAnimeList(
  animeList: BaseJikanAnime[],
  jobId?: string
): Promise<SyncJobResult> {
  const result: SyncJobResult = { recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, failures: 0 };
  if (!isSupabaseConfigured) return result;

  // Pre-fetch true global ratings from Anilist to average with MAL
  const malIds = animeList.map(a => a.mal_id).filter(Boolean);
  const anilistScores = await getAnilistScoresBatch(malIds);

  for (const item of animeList) {
    if (!item || isNsfwOrAdult(item)) continue;
    result.recordsProcessed++;
    try {
      // 1. Identify if anime already exists via anime_sources or legacy mal_id
      let animeId: string | null = null;
      const provider = 'jikan';
      const externalId = String(item.mal_id);
      
      const { data: existingSource, error: sourceErr } = await supabase
        .from('anime_sources')
        .select('anime_id')
        .eq('provider', provider)
        .eq('external_id', externalId)
        .maybeSingle();

      if (existingSource) {
        animeId = existingSource.anime_id;
      } else {
        // Fallback check legacy mal_id in anime table
        const { data: existingAnime } = await supabase
          .from('anime')
          .select('id')
          .eq('mal_id', item.mal_id)
          .maybeSingle();
        
        if (existingAnime) {
          animeId = existingAnime.id;
        }
      }

      // 2. Prepare canonical data
      const animeData = {
        title: item.title || 'Unknown Title',
        title_english: item.title_english || null,
        title_japanese: item.title_japanese || null,
        type: item.type || null,
        status: item.status || null,
        episodes: item.episodes || null,
        duration: item.duration || null,
        synopsis: cleanOfficialText(item.synopsis) || null,
        score: (() => {
           const malScore = item.score;
           const aniScore = anilistScores[item.mal_id];
           if (malScore && aniScore) {
             return Number(((malScore + aniScore) / 2).toFixed(2));
           } else if (malScore) {
             return malScore;
           } else if (aniScore) {
             return aniScore;
           }
           return null;
        })(),
        rank: item.rank || null,
        popularity: item.popularity || null,
        season: item.season || null,
        year: item.year || null,
                images_json: item.images ? item.images : null,
        trailer_url: item.trailer?.url || null,
        trailer_images_json: item.trailer?.images ? item.trailer.images : null,
        broadcast_day: item.broadcast?.day || null,
        broadcast_time: item.broadcast?.time || null,
        broadcast_timezone: item.broadcast?.timezone || null,
        broadcast_string: item.broadcast?.string || null,
        mal_id: item.mal_id, // Maintain legacy compatibility
        updated_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString()
      };

      if (animeId) {
        // Update existing canonical anime
        const { error: updateErr } = await supabase
          .from('anime')
          .update(animeData)
          .eq('id', animeId);
        
        if (updateErr) throw updateErr;
        result.recordsUpdated++;
      } else {
        // Insert new canonical anime
        const { data: newAnime, error: insertErr } = await supabase
          .from('anime')
          .insert(animeData)
          .select('id')
          .single();
        
        if (insertErr || !newAnime) throw insertErr || new Error("Failed to insert anime");
        animeId = newAnime.id;
        result.recordsInserted++;
      }

      // 3. Ensure anime_sources mapping exists
      const { error: upsertSourceErr } = await supabase
        .from('anime_sources')
        .upsert({
          anime_id: animeId,
          provider: provider,
          external_id: externalId,
          source_url: item.url || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'provider,external_id' });
        
      if (upsertSourceErr) console.log('[Error suppressed]', `Source mapping error for ${item.mal_id}:`, upsertSourceErr);

      // 4. Ingest Genres
      if (item.genres && Array.isArray(item.genres)) {
        // Combine genres, explicit_genres, themes, demographics if they exist in Jikan response
        const allTags = [...item.genres, ...(item.themes || []), ...(item.demographics || []), ...(item.explicit_genres || [])];
        for (const g of allTags) {
          const gName = g?.name?.trim();
          if (gName) {
             const derivedMalId = Number(g.mal_id) || Number(GENRE_NAME_TO_MAL_ID[gName.toLowerCase()]) || null;
             const { data: genreData } = await supabase
              .from('genres')
              .select('id, mal_id')
              .eq('name', gName)
              .maybeSingle();

             let genreId = genreData?.id;
             if (!genreId) {
                const { data: newGenre } = await supabase
                  .from('genres')
                  .insert({ name: gName, type: g.type || 'anime', mal_id: derivedMalId })
                  .select('id')
                  .single();
                if (newGenre) genreId = newGenre.id;
             } else if (!genreData.mal_id && derivedMalId) {
                await supabase.from('genres').update({ mal_id: derivedMalId }).eq('id', genreId);
             }

             if (genreId) {
               await supabase
                .from('anime_genres')
                .upsert({ anime_id: animeId, genre_id: genreId }, { onConflict: 'anime_id,genre_id' });
             }
          }
        }
      }

      // 5. Ingest Studios
      if (item.studios && Array.isArray(item.studios)) {
        for (const s of item.studios) {
          if (s.mal_id && s.name) {
             const { data: studioData } = await supabase
              .from('studios')
              .select('id')
              .eq('name', s.name)
              .maybeSingle();

             let studioId = studioData?.id;
             if (!studioId) {
                const { data: newStudio } = await supabase
                  .from('studios')
                  .insert({ name: s.name, mal_id: s.mal_id })
                  .select('id')
                  .single();
                if (newStudio) studioId = newStudio.id;
             }

             if (studioId) {
               await supabase
                .from('anime_studios')
                .upsert({ anime_id: animeId, studio_id: studioId }, { onConflict: 'anime_id,studio_id' });
             }
          }
        }
      }

      // 6. Ingest Streaming Providers (if available)
      if (item.streaming && Array.isArray(item.streaming)) {
         for (const st of item.streaming) {
            if (st.name && st.url) {
               const { data: providerData } = await supabase
                 .from('streaming_providers')
                 .select('id')
                 .eq('name', st.name)
                 .maybeSingle();
               
               let providerId = providerData?.id;
               if (!providerId) {
                  const { data: newProvider } = await supabase
                    .from('streaming_providers')
                    .insert({ name: st.name })
                    .select('id')
                    .single();
                  if (newProvider) providerId = newProvider.id;
               }

               if (providerId) {
                  await supabase
                    .from('anime_streaming')
                    .upsert({ anime_id: animeId, provider_id: providerId, url: st.url, region: 'global' }, { onConflict: 'anime_id,provider_id,region' });
               }
            }
         }
      }

      // 7. Ingest Relations (if available)
      if (item.relations && Array.isArray(item.relations)) {
         for (const rel of item.relations) {
            if (rel.relation && Array.isArray(rel.entry)) {
               for (const entry of rel.entry) {
                 if (entry.type === 'anime' && entry.mal_id) {
                    // Try to find the target anime ID
                    const { data: targetAnime } = await supabase
                      .from('anime')
                      .select('id')
                      .eq('mal_id', entry.mal_id)
                      .maybeSingle();
                      
                    if (targetAnime) {
                       await supabase
                         .from('anime_relations')
                         .upsert({
                           source_anime_id: animeId,
                           target_anime_id: targetAnime.id,
                           relation_type: rel.relation
                         }, { onConflict: 'source_anime_id,target_anime_id,relation_type' });
                    }
                 }
               }
            }
         }
      }

    } catch (err: any) {
      if (err?.code === '42501') {
        // Suppress RLS errors in environments without the service role key
      } else {
        console.log(`[Ingestion] Failed to ingest anime ${item.mal_id}:`, err.message || err.code || err);
      }
      result.failures++;
    }
    // Rate limit buffer for AI generation
    await sleep(250);

    if (jobId && result.recordsProcessed % 10 === 0) {
      await supabase.from('sync_history').update({
        records_processed: result.recordsProcessed,
        records_inserted: result.recordsInserted,
        records_updated: result.recordsUpdated
      }).eq('id', jobId);
    }
  }

  if (jobId) {
    await supabase.from('sync_history').update({
      records_processed: result.recordsProcessed,
      records_inserted: result.recordsInserted,
      records_updated: result.recordsUpdated
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
  
  const { data: job, error: jobErr } = await supabase.from('sync_history').insert({
    provider: 'jikan',
    sync_type: jobType,
    status: 'running',
    started_at: new Date().toISOString()
  }).select().single();

  if (jobErr || !job) {
    console.log('[Error suppressed]', 'Failed to create sync job', jobErr);
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

    await supabase.from('sync_history').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', jobId);
    console.log(`[Ingestion] Job completed: ${jobType}`);
  } catch (err) {
    console.log('[Error suppressed]', `[Ingestion] Job failed: ${jobType}`, err);
    await supabase.from('sync_history').update({ 
       status: 'failed', 
       error_log: err instanceof Error ? err.message : String(err), 
       completed_at: new Date().toISOString() 
     }).eq('id', jobId);
  }
}
