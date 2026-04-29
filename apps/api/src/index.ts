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

serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
