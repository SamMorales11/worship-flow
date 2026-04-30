import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const songs = pgTable('songs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  artist: text('artist'),
  key: text('key'),
  bpm: text('bpm'),
  tempoType: text('tempo_type'), // e.g., 'Fast', 'Medium', 'Slow'
  themes: text('themes').array(), // e.g., ['Victory', 'Hope', 'Faithfulness']
  organizationId: uuid('organization_id').references(() => organizations.id),
  // Practice Center fields
  referenceUrl: text('reference_url'),   // Spotify URL, YouTube URL, or audio file URL
  chordSheet: text('chord_sheet'),        // Markdown/plain-text chord sheet / lyrics
  wlNotes: text('wl_notes'),             // Worship Leader notes
  // Spotify Smart Fetch fields
  spotifyUrl:  text('spotify_url'),       // Full Spotify track URL
  previewUrl:  text('preview_url'),       // 30-second Spotify preview MP3
  albumArt:    text('album_art'),         // High-res album cover image URL
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const setlists = pgTable('setlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  date: timestamp('date'),
  organizationId: uuid('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const setlistItems = pgTable('setlist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  setlistId: uuid('setlist_id').references(() => setlists.id).notNull(),
  songId: uuid('song_id').references(() => songs.id).notNull(),
  position: text('position'), // e.g., '1', '2', 'Opener'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const runsheetItems = pgTable('runsheet_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  setlistId: uuid('setlist_id').references(() => setlists.id).notNull(),
  // Position/order in the runsheet
  position: integer('position').notNull().default(0),
  // Segment title (e.g., 'Opening Prayer', 'Praise Set 1', 'Sermon')
  title: text('title').notNull(),
  // Duration in minutes
  durationMinutes: integer('duration_minutes').notNull().default(5),
  // Type: 'song' | 'custom'
  type: text('type').notNull().default('custom'),
  // Optional link to a song in the library (for type='song')
  songId: uuid('song_id').references(() => songs.id),
  // Optional notes
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
