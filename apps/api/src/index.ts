import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import * as dotenv from 'dotenv'
import path from 'path'
import { getDb, schema } from '@worship-flow/database'

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') })

const app = new Hono()

app.use('*', cors())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/songs', async (c) => {
  try {
    const db = getDb(process.env.DATABASE_URL!);
    const { desc } = await import('drizzle-orm');
    const songs = await db.query.songs.findMany({
      orderBy: [desc(schema.songs.createdAt)]
    });
    return c.json(songs);
  } catch (error) {
    console.error('Failed to fetch songs:', error);
    return c.json({ error: 'Failed to fetch songs' }, 500);
  }
})

app.post('/api/songs', async (c) => {
  try {
    const body = await c.req.json();
    const { title, artist, key, bpm, tempoType, themes } = body;

    if (!title) {
      return c.json({ error: 'Title is required' }, 400);
    }

    const db = getDb(process.env.DATABASE_URL!);
    
    const [newSong] = await db.insert(schema.songs).values({
      title,
      artist: artist || null,
      key: key || null,
      bpm: bpm ? String(bpm) : null,
      tempoType: tempoType || null,
      themes: Array.isArray(themes) ? themes : (themes ? [themes] : []),
    }).returning();

    return c.json(newSong, 201);
  } catch (error) {
    console.error('Failed to create song:', error);
    return c.json({ error: 'Failed to create song' }, 500);
  }
})

// ─── Smart Fetch: GET /api/songs/fetch-metadata ───────────────────────────────
// Registered BEFORE /api/songs/:id to avoid route-param collision.

// Spotify token cache (process-lifetime, auto-refreshed on expiry)
let spotifyToken: string | null = null;
let spotifyTokenExpiry = 0;

async function getSpotifyToken(): Promise<{ token: string | null; error: string | null }> {
  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const placeholders = ['YOUR_SPOTIFY_CLIENT_ID_HERE', 'YOUR_SPOTIFY_CLIENT_SECRET_HERE'];
  if (!clientId || !clientSecret || placeholders.includes(clientId) || placeholders.includes(clientSecret)) {
    return { token: null, error: 'Spotify credentials not configured in .env' };
  }

  // Return cached token if still valid (with 60s buffer)
  if (spotifyToken && Date.now() < spotifyTokenExpiry - 60_000) {
    return { token: spotifyToken, error: null };
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 400) return { token: null, error: 'Spotify: Bad request — check client credentials format' };
    if (res.status === 401) return { token: null, error: 'Spotify API Key Error: Invalid client ID or secret' };
    if (res.status === 429) return { token: null, error: 'Spotify Rate Limit: Too many token requests' };
    if (!res.ok)           return { token: null, error: `Spotify token HTTP ${res.status}` };

    const data = await res.json() as any;
    spotifyToken       = data.access_token;
    spotifyTokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000;
    return { token: spotifyToken!, error: null };
  } catch (e: any) {
    const msg = e?.name === 'TimeoutError' ? 'Spotify token request timed out' : `Spotify token error: ${e?.message}`;
    return { token: null, error: msg };
  }
}

app.get('/api/songs/fetch-metadata', async (c) => {
  const q      = c.req.query('q');
  const title  = c.req.query('title');
  const artist = c.req.query('artist');

  if (!q && !title) {
    return c.json({ error: 'Provide q= or title= query parameter' }, 400);
  }

  const songTitle   = title  || q!;
  const songArtist  = artist || '';
  const searchQuery = `${songTitle} ${songArtist}`.trim();

  console.log(`\n[SmartFetch] ─────────────────────────────────────`);
  console.log(`[SmartFetch] title="${songTitle}" artist="${songArtist}"`);
  console.log(`[SmartFetch] searchQuery="${searchQuery}"`);

  // ── Helper: fetch with timeout ───────────────────────────────────────────
  const fetchWithTimeout = async (url: string, opts: RequestInit = {}, timeoutMs = 8000): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...opts, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  // ── 1. Spotify Search ────────────────────────────────────────────────────
  let spotifyUrl:   string | null = null;
  let previewUrl:   string | null = null;
  let albumArt:     string | null = null;
  let spotifyTrackTitle:  string | null = null;
  let spotifyArtistName:  string | null = null;
  let spotifyError: string | null = null;

  const { token, error: tokenError } = await getSpotifyToken();
  console.log(`[SmartFetch] Spotify token: ${token ? 'OK' : tokenError}`);

  if (token) {
    try {
      // Build query: prefer "track:title artist:name" for precision
      const spQuery = songArtist
        ? `track:${songTitle} artist:${songArtist}`
        : songTitle;
      const spUrl = `https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(spQuery)}`;
      console.log(`[SmartFetch] Spotify search: ${spUrl}`);

      const spRes = await fetchWithTimeout(spUrl, {
        headers: { Authorization: `Bearer ${token}` },
      }, 8000);
      const spData = await spRes.json() as any;
      console.log(`[SmartFetch] Spotify status: ${spRes.status}`);

      if (spRes.status === 401) {
        spotifyToken = null; // invalidate cache
        spotifyError = 'Spotify token expired — retry';
      } else if (spRes.status === 429) {
        spotifyError = 'Spotify Rate Limit Exceeded';
      } else if (spRes.ok) {
        const track = spData?.tracks?.items?.[0];
        if (track) {
          spotifyUrl        = track.external_urls?.spotify ?? null;
          previewUrl        = track.preview_url ?? null;
          albumArt          = track.album?.images?.[0]?.url ?? null;  // largest image
          spotifyTrackTitle = track.name ?? null;
          spotifyArtistName = track.artists?.[0]?.name ?? null;
          console.log(`[SmartFetch] Spotify found: "${spotifyTrackTitle}" by ${spotifyArtistName}`);
          console.log(`[SmartFetch] preview: ${previewUrl ? 'yes' : 'none'}, art: ${albumArt ? 'yes' : 'none'}`);
        } else {
          // Fallback: try a looser query without field filters
          const looseSp = `https://api.spotify.com/v1/search?type=track&limit=1&q=${encodeURIComponent(searchQuery)}`;
          const looseRes = await fetchWithTimeout(looseSp, { headers: { Authorization: `Bearer ${token}` } }, 8000);
          if (looseRes.ok) {
            const ld = await looseRes.json() as any;
            const lt = ld?.tracks?.items?.[0];
            if (lt) {
              spotifyUrl        = lt.external_urls?.spotify ?? null;
              previewUrl        = lt.preview_url ?? null;
              albumArt          = lt.album?.images?.[0]?.url ?? null;
              spotifyTrackTitle = lt.name ?? null;
              spotifyArtistName = lt.artists?.[0]?.name ?? null;
              console.log(`[SmartFetch] Spotify loose match: "${spotifyTrackTitle}"`);
            } else {
              spotifyError = 'No results found on Spotify';
            }
          }
        }
      } else {
        spotifyError = `Spotify HTTP ${spRes.status}`;
      }
    } catch (e: any) {
      spotifyError = e?.name === 'AbortError' ? 'Spotify request timed out (>8s)' : `Spotify error: ${e?.message}`;
      console.error(`[SmartFetch] Spotify exception:`, e);
    }
  } else {
    spotifyError = tokenError;
  }

  // ── 2a. Lyrics — primary: lyrics.ovh ────────────────────────────────────
  // Use Spotify's normalized track/artist names for better match if available
  const lyricsTitle  = spotifyTrackTitle || songTitle;
  const lyricsArtist = spotifyArtistName || songArtist;

  let lyrics: string | null = null;
  let lyricsSource: string | null = null;
  let lyricsError: string | null = null;

  if (lyricsArtist) {
    const attempts = [
      `https://api.lyrics.ovh/v1/${encodeURIComponent(lyricsArtist)}/${encodeURIComponent(lyricsTitle)}`,
      `https://api.lyrics.ovh/v1/${encodeURIComponent(lyricsArtist)}/${encodeURIComponent(lyricsTitle.replace(/\(.*?\)/g, '').trim())}`,
      // also try with original inputs as final attempt
      songArtist ? `https://api.lyrics.ovh/v1/${encodeURIComponent(songArtist)}/${encodeURIComponent(songTitle)}` : '',
    ].filter(Boolean);

    for (const url of attempts) {
      if (lyrics) break;
      try {
        console.log(`[SmartFetch] lyrics.ovh → ${url}`);
        const res = await fetchWithTimeout(url, {}, 8000);
        console.log(`[SmartFetch] lyrics.ovh status: ${res.status}`);
        if (res.ok) {
          const data = await res.json() as any;
          if (data?.lyrics?.trim()) {
            lyrics = data.lyrics.trim();
            lyricsSource = 'lyrics.ovh';
            console.log(`[SmartFetch] lyrics.ovh ✓ (${lyrics.length} chars)`);
          }
        } else {
          lyricsError = `lyrics.ovh HTTP ${res.status}`;
        }
      } catch (e: any) {
        lyricsError = e?.name === 'AbortError' ? 'lyrics.ovh timed out' : `lyrics.ovh error: ${e?.message}`;
        console.error('[SmartFetch] lyrics.ovh exception:', e);
      }
    }
  } else {
    lyricsError = 'No artist — lyrics.ovh needs artist+title';
    console.log('[SmartFetch] lyrics.ovh skipped: no artist');
  }

  // ── 2b. Lyrics — fallback: lrclib.net ───────────────────────────────────
  if (!lyrics) {
    try {
      const lrclibQ    = `${lyricsTitle} ${lyricsArtist}`.trim();
      const lrclibUrl  = `https://lrclib.net/api/search?q=${encodeURIComponent(lrclibQ)}`;
      console.log(`[SmartFetch] lrclib.net → ${lrclibUrl}`);
      const res = await fetchWithTimeout(lrclibUrl, {}, 8000);
      console.log(`[SmartFetch] lrclib.net status: ${res.status}`);
      if (res.ok) {
        const results = await res.json() as any[];
        const best = Array.isArray(results) && results.find(r => r.plainLyrics);
        if (best?.plainLyrics) {
          lyrics = best.plainLyrics.trim();
          lyricsSource = 'lrclib.net';
          console.log(`[SmartFetch] lrclib.net ✓ (${lyrics.length} chars)`);
        } else {
          lyricsError = (lyricsError ?? '') + ' | lrclib: no results';
        }
      } else {
        lyricsError = (lyricsError ?? '') + ` | lrclib HTTP ${res.status}`;
      }
    } catch (e: any) {
      const msg = e?.name === 'AbortError' ? 'lrclib timed out' : `lrclib error: ${e?.message}`;
      lyricsError = (lyricsError ?? '') + ` | ${msg}`;
      console.error('[SmartFetch] lrclib exception:', e);
    }
  }

  console.log(`[SmartFetch] Result: spotify=${!!spotifyUrl} preview=${!!previewUrl} lyrics=${!!lyrics} source=${lyricsSource}`);
  console.log(`[SmartFetch] ─────────────────────────────────────\n`);

  return c.json({
    query:            searchQuery,
    // Spotify fields
    spotifyUrl,
    previewUrl,
    albumArt,
    spotifyTrackTitle,
    spotifyArtistName,
    hasSpotify:       !!spotifyUrl,
    hasPreview:       !!previewUrl,
    // Lyrics
    lyrics,
    lyricsSource,
    hasLyrics:        !!lyrics,
    // Debug
    debug: {
      spotifyError,
      lyricsError,
      spotifyConfigured: !(
        !process.env.SPOTIFY_CLIENT_ID ||
        process.env.SPOTIFY_CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID_HERE'
      ),
    },
  });
});

// GET a single song by ID (full detail, includes Practice Center fields)
app.get('/api/songs/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const db = getDb(process.env.DATABASE_URL!);
    const { eq } = await import('drizzle-orm');

    const song = await db.query.songs.findFirst({
      where: eq(schema.songs.id, id),
    });

    if (!song) return c.json({ error: 'Song not found' }, 404);
    return c.json(song);
  } catch (error) {
    console.error('Failed to fetch song:', error);
    return c.json({ error: 'Failed to fetch song' }, 500);
  }
})

// PATCH /api/songs/:id/practice — update Practice Center fields only
app.patch('/api/songs/:id/practice', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { referenceUrl, chordSheet, wlNotes, spotifyUrl, previewUrl, albumArt } = body;

    const db = getDb(process.env.DATABASE_URL!);
    const { eq } = await import('drizzle-orm');

    const [updated] = await db.update(schema.songs)
      .set({
        referenceUrl: referenceUrl ?? null,
        chordSheet:   chordSheet   ?? null,
        wlNotes:      wlNotes      ?? null,
        spotifyUrl:   spotifyUrl   ?? null,
        previewUrl:   previewUrl   ?? null,
        albumArt:     albumArt     ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schema.songs.id, id))
      .returning();

    if (!updated) return c.json({ error: 'Song not found' }, 404);
    return c.json(updated);
  } catch (error) {
    console.error('Failed to update practice fields:', error);
    return c.json({ error: 'Failed to update practice fields' }, 500);
  }
})

app.post('/api/setlists', async (c) => {
  try {
    const body = await c.req.json();
    const { title, date, songs } = body;

    if (!title || !songs || !Array.isArray(songs)) {
      return c.json({ error: 'Invalid input. Title and an array of songs are required.' }, 400);
    }

    const db = getDb(process.env.DATABASE_URL!);
    
    // Perform a transaction using Drizzle ORM
    const setlistId = await db.transaction(async (tx) => {
      // 1. Create the setlist
      const [newSetlist] = await tx.insert(schema.setlists).values({
        title,
        date: date ? new Date(date) : null,
      }).returning({ id: schema.setlists.id });

      // 2. Batch insert the setlist items
      if (songs.length > 0) {
        const itemsToInsert = songs.map((song: any) => ({
          setlistId: newSetlist.id,
          songId: song.songId,
          position: song.position ? String(song.position) : null,
        }));
        
        await tx.insert(schema.setlistItems).values(itemsToInsert);
      }

      return newSetlist.id;
    });

    return c.json({ id: setlistId, message: 'Setlist created successfully' }, 201);
  } catch (error) {
    console.error('Failed to create setlist:', error);
    return c.json({ error: 'Failed to create setlist' }, 500);
  }
})

app.get('/users', async (c) => {
  try {
    const db = getDb(process.env.DATABASE_URL!);
    const users = await db.query.profiles.findMany();
    return c.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
})

app.get('/api/analytics/top-songs', async (c) => {
  try {
    const db = getDb(process.env.DATABASE_URL!);
    const { sql, desc, eq } = await import('drizzle-orm');
    
    const topSongs = await db
      .select({
        id: schema.songs.id,
        title: schema.songs.title,
        plays: sql<number>`cast(count(${schema.setlistItems.id}) as integer)`,
      })
      .from(schema.songs)
      .leftJoin(schema.setlistItems, eq(schema.songs.id, schema.setlistItems.songId))
      .groupBy(schema.songs.id)
      .orderBy(desc(sql`count(${schema.setlistItems.id})`))
      .limit(5);

    return c.json(topSongs);
  } catch (error) {
    console.error('Failed to fetch top songs:', error);
    return c.json({ error: 'Failed to fetch top songs' }, 500);
  }
})

app.get('/api/setlists/archive', async (c) => {
  try {
    const db = getDb(process.env.DATABASE_URL!);
    const { sql, desc, eq } = await import('drizzle-orm');
    
    const archive = await db
      .select({
        id: schema.setlists.id,
        title: schema.setlists.title,
        date: schema.setlists.date,
        songsCount: sql<number>`cast(count(${schema.setlistItems.id}) as integer)`,
      })
      .from(schema.setlists)
      .leftJoin(schema.setlistItems, eq(schema.setlists.id, schema.setlistItems.setlistId))
      .groupBy(schema.setlists.id)
      .orderBy(desc(schema.setlists.date));

    return c.json(archive);
  } catch (error) {
    console.error('Failed to fetch setlist archive:', error);
    return c.json({ error: 'Failed to fetch setlist archive' }, 500);
  }
})

app.get('/api/setlists/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const db = getDb(process.env.DATABASE_URL!);
    const { eq } = await import('drizzle-orm');

    const setlist = await db.query.setlists.findFirst({
      where: eq(schema.setlists.id, id),
    });

    if (!setlist) {
      return c.json({ error: 'Setlist not found' }, 404);
    }

    const items = await db
      .select({
        id: schema.setlistItems.id,
        position: schema.setlistItems.position,
        songId: schema.songs.id,
        title: schema.songs.title,
        artist: schema.songs.artist,
        key: schema.songs.key,
        bpm: schema.songs.bpm,
      })
      .from(schema.setlistItems)
      .innerJoin(schema.songs, eq(schema.setlistItems.songId, schema.songs.id))
      .where(eq(schema.setlistItems.setlistId, id))
      .orderBy(schema.setlistItems.position);

    return c.json({ ...setlist, songs: items });
  } catch (error) {
    console.error('Failed to fetch setlist:', error);
    return c.json({ error: 'Failed to fetch setlist' }, 500);
  }
})

app.put('/api/setlists/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { title, date, songs } = body;

    if (!title || !songs || !Array.isArray(songs)) {
      return c.json({ error: 'Invalid input.' }, 400);
    }

    const db = getDb(process.env.DATABASE_URL!);
    const { eq } = await import('drizzle-orm');

    await db.transaction(async (tx) => {
      // Update setlist metadata
      await tx.update(schema.setlists)
        .set({ title, date: date ? new Date(date) : null, updatedAt: new Date() })
        .where(eq(schema.setlists.id, id));

      // Replace all setlist items
      await tx.delete(schema.setlistItems).where(eq(schema.setlistItems.setlistId, id));

      if (songs.length > 0) {
        await tx.insert(schema.setlistItems).values(
          songs.map((song: any) => ({
            setlistId: id,
            songId: song.songId,
            position: song.position ? String(song.position) : null,
          }))
        );
      }
    });

    return c.json({ message: 'Setlist updated successfully' });
  } catch (error) {
    console.error('Failed to update setlist:', error);
    return c.json({ error: 'Failed to update setlist' }, 500);
  }
})

app.delete('/api/setlists/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const db = getDb(process.env.DATABASE_URL!);
    const { eq } = await import('drizzle-orm');

    await db.transaction(async (tx) => {
      await tx.delete(schema.setlistItems).where(eq(schema.setlistItems.setlistId, id));
      await tx.delete(schema.setlists).where(eq(schema.setlists.id, id));
    });

    return c.json({ message: 'Setlist deleted successfully' });
  } catch (error) {
    console.error('Failed to delete setlist:', error);
    return c.json({ error: 'Failed to delete setlist' }, 500);
  }
})

// ─── Runsheet Endpoints ────────────────────────────────────────────────────────

app.get('/api/runsheet/:setlistId', async (c) => {
  try {
    const { setlistId } = c.req.param();
    const db = getDb(process.env.DATABASE_URL!);
    const { eq, asc } = await import('drizzle-orm');

    const items = await db
      .select({
        id: schema.runsheetItems.id,
        setlistId: schema.runsheetItems.setlistId,
        position: schema.runsheetItems.position,
        title: schema.runsheetItems.title,
        durationMinutes: schema.runsheetItems.durationMinutes,
        type: schema.runsheetItems.type,
        notes: schema.runsheetItems.notes,
        songId: schema.runsheetItems.songId,
        songTitle: schema.songs.title,
        songArtist: schema.songs.artist,
        songKey: schema.songs.key,
      })
      .from(schema.runsheetItems)
      .leftJoin(schema.songs, eq(schema.runsheetItems.songId, schema.songs.id))
      .where(eq(schema.runsheetItems.setlistId, setlistId))
      .orderBy(asc(schema.runsheetItems.position));

    return c.json(items);
  } catch (error) {
    console.error('Failed to fetch runsheet:', error);
    return c.json({ error: 'Failed to fetch runsheet' }, 500);
  }
});

app.post('/api/runsheet', async (c) => {
  try {
    const body = await c.req.json();
    const { setlistId, title, durationMinutes, type, songId, notes, position } = body;

    if (!setlistId || !title) {
      return c.json({ error: 'setlistId and title are required' }, 400);
    }

    const db = getDb(process.env.DATABASE_URL!);

    const [newItem] = await db.insert(schema.runsheetItems).values({
      setlistId,
      title,
      durationMinutes: durationMinutes ?? 5,
      type: type ?? 'custom',
      songId: songId ?? null,
      notes: notes ?? null,
      position: position ?? 0,
    }).returning();

    return c.json(newItem, 201);
  } catch (error) {
    console.error('Failed to create runsheet item:', error);
    return c.json({ error: 'Failed to create runsheet item' }, 500);
  }
});

app.put('/api/runsheet/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { title, durationMinutes, type, songId, notes, position } = body;

    const db = getDb(process.env.DATABASE_URL!);
    const { eq } = await import('drizzle-orm');

    const [updated] = await db.update(schema.runsheetItems)
      .set({
        title,
        durationMinutes,
        type,
        songId: songId ?? null,
        notes: notes ?? null,
        position,
        updatedAt: new Date(),
      })
      .where(eq(schema.runsheetItems.id, id))
      .returning();

    if (!updated) return c.json({ error: 'Item not found' }, 404);
    return c.json(updated);
  } catch (error) {
    console.error('Failed to update runsheet item:', error);
    return c.json({ error: 'Failed to update runsheet item' }, 500);
  }
});

app.delete('/api/runsheet/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const db = getDb(process.env.DATABASE_URL!);
    const { eq } = await import('drizzle-orm');

    await db.delete(schema.runsheetItems).where(eq(schema.runsheetItems.id, id));
    return c.json({ message: 'Runsheet item deleted' });
  } catch (error) {
    console.error('Failed to delete runsheet item:', error);
    return c.json({ error: 'Failed to delete runsheet item' }, 500);
  }
});

// Bulk reorder runsheet items
app.put('/api/runsheet/:setlistId/reorder', async (c) => {
  try {
    const { setlistId } = c.req.param();
    const body = await c.req.json();
    const { items } = body; // [{ id, position }]

    if (!Array.isArray(items)) return c.json({ error: 'items must be an array' }, 400);

    const db = getDb(process.env.DATABASE_URL!);
    const { eq } = await import('drizzle-orm');

    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx.update(schema.runsheetItems)
          .set({ position: item.position, updatedAt: new Date() })
          .where(eq(schema.runsheetItems.id, item.id));
      }
    });

    return c.json({ message: 'Reordered successfully' });
  } catch (error) {
    console.error('Failed to reorder runsheet:', error);
    return c.json({ error: 'Failed to reorder runsheet' }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────

serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
