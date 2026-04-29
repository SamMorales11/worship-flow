import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import path from 'path';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seed = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in the environment variables.');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  console.log('Ensuring schema is up to date...');
  try {
    await db.execute(sql`ALTER TABLE songs ADD COLUMN IF NOT EXISTS tempo_type text;`);
    await db.execute(sql`ALTER TABLE songs ADD COLUMN IF NOT EXISTS themes text[];`);
  } catch (err) {
    console.log('Columns might already exist or error adding them:', err);
  }

  const worshipSongs = [
    // 5 Fast Tempo (Praise/Sukacita)
    {
      title: 'Praise',
      artist: 'Elevation Worship',
      key: 'A',
      bpm: '126',
      tempoType: 'Fast',
      themes: ['Praise', 'Victory', 'Joy'],
    },
    {
      title: 'Every Praise',
      artist: 'Hezekiah Walker',
      key: 'Db',
      bpm: '103',
      tempoType: 'Fast',
      themes: ['Praise', 'Celebration'],
    },
    {
      title: 'Alive',
      artist: 'Hillsong Young & Free',
      key: 'E',
      bpm: '132',
      tempoType: 'Fast',
      themes: ['Joy', 'Freedom'],
    },
    {
      title: 'Lion and the Lamb',
      artist: 'Bethel Music',
      key: 'B',
      bpm: '90',
      tempoType: 'Fast',
      themes: ['Power', 'Victory'],
    },
    {
      title: 'Joy',
      artist: 'Planetshakers',
      key: 'D',
      bpm: '128',
      tempoType: 'Fast',
      themes: ['Joy', 'Celebration', 'Praise'],
    },

    // 5 Medium Tempo
    {
      title: 'Great Are You Lord',
      artist: 'All Sons & Daughters',
      key: 'A',
      bpm: '72',
      tempoType: 'Medium',
      themes: ['Worship', 'Greatness'],
    },
    {
      title: 'Build My Life',
      artist: 'Housefires',
      key: 'G',
      bpm: '70',
      tempoType: 'Medium',
      themes: ['Surrender', 'Dedication'],
    },
    {
      title: 'Way Maker',
      artist: 'Sinach',
      key: 'B',
      bpm: '68',
      tempoType: 'Medium',
      themes: ['Faithfulness', 'Miracles'],
    },
    {
      title: '10,000 Reasons (Bless the Lord)',
      artist: 'Matt Redman',
      key: 'G',
      bpm: '73',
      tempoType: 'Medium',
      themes: ['Praise', 'Gratitude'],
    },
    {
      title: 'Goodness of God',
      artist: 'Bethel Music',
      key: 'Ab',
      bpm: '63',
      tempoType: 'Medium',
      themes: ['Faithfulness', 'Goodness'],
    },

    // 5 Slow Tempo (Worship/Penyembahan)
    {
      title: 'What A Beautiful Name',
      artist: 'Hillsong Worship',
      key: 'D',
      bpm: '68',
      tempoType: 'Slow',
      themes: ['Jesus', 'Majesty', 'Worship'],
    },
    {
      title: 'Oceans (Where Feet May Fail)',
      artist: 'Hillsong UNITED',
      key: 'D',
      bpm: '64',
      tempoType: 'Slow',
      themes: ['Trust', 'Faith', 'Surrender'],
    },
    {
      title: 'How Great Is Our God',
      artist: 'Chris Tomlin',
      key: 'Db',
      bpm: '76',
      tempoType: 'Slow',
      themes: ['Greatness', 'Majesty'],
    },
    {
      title: 'Reckless Love',
      artist: 'Cory Asbury',
      key: 'Gb',
      bpm: '81',
      tempoType: 'Slow',
      themes: ['Love', 'Grace'],
    },
    {
      title: 'O Come to the Altar',
      artist: 'Elevation Worship',
      key: 'B',
      bpm: '70',
      tempoType: 'Slow',
      themes: ['Salvation', 'Forgiveness', 'Grace'],
    },
  ];

  console.log('Seeding the database with worship songs...');

  try {
    await db.insert(schema.songs).values(worshipSongs);
    console.log('Successfully seeded 15 songs!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
};

seed().catch((err) => {
  console.error('Unexpected error during seeding:', err);
  process.exit(1);
});
