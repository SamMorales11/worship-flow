import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { getDb, schema } from '@worship-flow/database';
// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
const app = new Hono();
app.use('*', cors());
app.get('/', (c) => {
    return c.text('Hello Hono!');
});
app.get('/api/songs', async (c) => {
    try {
        const db = getDb(process.env.DATABASE_URL);
        const { desc } = await import('drizzle-orm');
        const songs = await db.query.songs.findMany({
            orderBy: [desc(schema.songs.createdAt)]
        });
        return c.json(songs);
    }
    catch (error) {
        console.error('Failed to fetch songs:', error);
        return c.json({ error: 'Failed to fetch songs' }, 500);
    }
});
app.post('/api/setlists', async (c) => {
    try {
        const body = await c.req.json();
        const { title, date, songs } = body;
        if (!title || !songs || !Array.isArray(songs)) {
            return c.json({ error: 'Invalid input. Title and an array of songs are required.' }, 400);
        }
        const db = getDb(process.env.DATABASE_URL);
        // Perform a transaction using Drizzle ORM
        const setlistId = await db.transaction(async (tx) => {
            // 1. Create the setlist
            const [newSetlist] = await tx.insert(schema.setlists).values({
                title,
                date: date ? new Date(date) : null,
            }).returning({ id: schema.setlists.id });
            // 2. Batch insert the setlist items
            if (songs.length > 0) {
                const itemsToInsert = songs.map((song) => ({
                    setlistId: newSetlist.id,
                    songId: song.songId,
                    position: song.position ? String(song.position) : null,
                }));
                await tx.insert(schema.setlistItems).values(itemsToInsert);
            }
            return newSetlist.id;
        });
        return c.json({ id: setlistId, message: 'Setlist created successfully' }, 201);
    }
    catch (error) {
        console.error('Failed to create setlist:', error);
        return c.json({ error: 'Failed to create setlist' }, 500);
    }
});
app.get('/users', async (c) => {
    try {
        const db = getDb(process.env.DATABASE_URL);
        const users = await db.query.profiles.findMany();
        return c.json(users);
    }
    catch (error) {
        console.error('Failed to fetch users:', error);
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
});
app.get('/api/analytics/top-songs', async (c) => {
    try {
        const db = getDb(process.env.DATABASE_URL);
        const { sql, desc, eq } = await import('drizzle-orm');
        const topSongs = await db
            .select({
            id: schema.songs.id,
            title: schema.songs.title,
            plays: sql `cast(count(${schema.setlistItems.id}) as integer)`,
        })
            .from(schema.songs)
            .leftJoin(schema.setlistItems, eq(schema.songs.id, schema.setlistItems.songId))
            .groupBy(schema.songs.id)
            .orderBy(desc(sql `count(${schema.setlistItems.id})`))
            .limit(5);
        return c.json(topSongs);
    }
    catch (error) {
        console.error('Failed to fetch top songs:', error);
        return c.json({ error: 'Failed to fetch top songs' }, 500);
    }
});
app.get('/api/setlists/archive', async (c) => {
    try {
        const db = getDb(process.env.DATABASE_URL);
        const { sql, desc, eq } = await import('drizzle-orm');
        const archive = await db
            .select({
            id: schema.setlists.id,
            title: schema.setlists.title,
            date: schema.setlists.date,
            songsCount: sql `cast(count(${schema.setlistItems.id}) as integer)`,
        })
            .from(schema.setlists)
            .leftJoin(schema.setlistItems, eq(schema.setlists.id, schema.setlistItems.setlistId))
            .groupBy(schema.setlists.id)
            .orderBy(desc(schema.setlists.date));
        return c.json(archive);
    }
    catch (error) {
        console.error('Failed to fetch setlist archive:', error);
        return c.json({ error: 'Failed to fetch setlist archive' }, 500);
    }
});
serve({
    fetch: app.fetch,
    port: 3001
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
