"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Mic2, Music2, Check, ChevronsUpDown,
  Youtube, FileText, Pencil, Save, X, StickyNote,
  BookOpen, ExternalLink, Headphones, AlertCircle, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";

const API = process.env.NEXT_PUBLIC_API_URL;

type Song = {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  bpm: string | null;
  tempoType: string | null;
  themes: string[] | null;
  referenceUrl: string | null;
  chordSheet: string | null;
  wlNotes: string | null;
  // Spotify Smart Fetch fields
  spotifyUrl:  string | null;
  previewUrl:  string | null;
  albumArt:    string | null;
};

// Detect YouTube URL and extract video ID
function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/watch\?v=([^&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function isAudioUrl(url: string) {
  return /\.(mp3|wav|ogg|aac|flac|m4a)(\?.*)?$/i.test(url);
}

const KEYS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const KEY_TO_INDEX: Record<string, number> = {
  "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
};

function transposeChord(chord: string, diff: number): string {
  if (diff === 0) return chord;
  // Transpose any root notes found in the chord string (handles slash chords like G/B)
  return chord.replace(/[A-G][#b]?/g, (match) => {
    const currentIndex = KEY_TO_INDEX[match];
    if (currentIndex === undefined) return match;
    const newIndex = (currentIndex + diff + 12) % 12;
    return KEYS[newIndex];
  });
}

// ── Chord Sheet Renderer ────────────────────────────────────────────────────
const CHORD_RE = /\[?([A-G][#b]?(?:m|maj|min|sus|add|dim|aug|[0-9])*(?:\/[A-G][#b]?)?)\]?/g;

function ChordSheetRenderer({ text, originalKey, targetKey }: { text: string, originalKey: string | null, targetKey: string | null }) {
  const diff = (originalKey && targetKey && KEY_TO_INDEX[originalKey] !== undefined && KEY_TO_INDEX[targetKey] !== undefined) 
    ? (KEY_TO_INDEX[targetKey] - KEY_TO_INDEX[originalKey] + 12) % 12 
    : 0;

  const lines = text.split("\n");

  return (
    <div className="font-mono text-base bg-[#202020] p-8 rounded-xl shadow-inner min-h-[500px] overflow-x-auto">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        
        // 1. Detect Header (e.g. [Verse 1])
        const headerMatch = trimmed.match(/^\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Tag|Interlude|Instrumental).+\]$/i);
        if (headerMatch) {
          return (
            <div key={i} className="mt-8 mb-4 first:mt-0">
              <span className="bg-[#C62828] text-white font-bold px-4 py-1.5 rounded-md shadow-md text-xs uppercase tracking-widest inline-block border border-red-600/30">
                {trimmed.replace(/[\[\]]/g, "")}
              </span>
            </div>
          );
        }

        // 2. Detect Mixed Line ([G]Lyric)
        if (line.includes("[") && line.includes("]")) {
           const parts = line.split(/(\[[^\]]+\])/);
           const segments: { chord: string, lyric: string }[] = [];
           
           let currentChord = "";
           for (const part of parts) {
             if (part.startsWith("[") && part.endsWith("]")) {
               currentChord = part.slice(1, -1);
             } else {
               if (part || currentChord) {
                 segments.push({ chord: currentChord, lyric: part });
               }
               currentChord = "";
             }
           }

           return (
             <div key={i} className="flex flex-wrap items-end min-h-[3.5rem] mb-2">
               {segments.map((seg, idx) => (
                 <div key={idx} className="inline-flex flex-col">
                   <span className="text-[#E57373] font-bold h-6 leading-none text-sm mb-1">
                     {seg.chord ? transposeChord(seg.chord, diff) : <>&nbsp;</>}
                   </span>
                   <span className="text-white leading-none whitespace-pre">
                     {seg.lyric || <>&nbsp;</>}
                   </span>
                 </div>
               ))}
             </div>
           );
        }

        // 3. Detect Chord-only line (e.g. A E/G# C#m B)
        const words = trimmed.split(/\s+/).filter(w => w !== "");
        const isChordLine = words.length > 0 && words.every(w => /^[A-G][#b]?(?:m|maj|min|sus|add|dim|aug|[0-9])*(?:\/[A-G][#b]?)?$/.test(w));
        
        if (isChordLine) {
          const lineSegments = line.split(/(\s+)/);
          return (
            <div key={i} className="text-[#E57373] font-bold min-h-[1.5rem] mb-2 leading-relaxed">
              {lineSegments.map((seg, idx) => {
                if (seg.trim() === "") return <span key={idx}>{seg}</span>;
                return <span key={idx}>{transposeChord(seg, diff)}</span>;
              })}
            </div>
          );
        }

        // 4. Default Lyric Line
        return (
          <div key={i} className={cn("text-white min-h-[1.5rem] mb-1 leading-relaxed", trimmed === "" && "h-6")}>
            {line || <>&nbsp;</>}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function PracticePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<Song | null>(null);
  const [targetKey, setTargetKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Edit states
  const [editingChords, setEditingChords] = useState(false);
  const [chordDraft, setChordDraft] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [editingRef, setEditingRef] = useState(false);
  const [refDraft, setRefDraft] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/songs`)
      .then(r => r.ok ? r.json() : [])
      .then(setSongs)
      .catch(() => {});
  }, []);

  const loadSong = useCallback(async (songId: string) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/songs/${songId}`);
      if (r.ok) {
        const data: Song = await r.json();
        setSelected(data);
        setTargetKey(data.key);
        setChordDraft(data.chordSheet ?? "");
        setNotesDraft(data.wlNotes ?? "");
        setRefDraft(data.referenceUrl ?? "");
        setEditingChords(false);
        setEditingNotes(false);
        setEditingRef(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectSong = (song: Song) => {
    setPickerOpen(false);
    loadSong(song.id);
  };

  const patchPractice = async (patch: Partial<Pick<Song, "referenceUrl" | "chordSheet" | "wlNotes">>) => {
    if (!selected) return;
    setSaving(Object.keys(patch)[0]);
    try {
      const r = await fetch(`${API}/api/songs/${selected.id}/practice`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (r.ok) {
        const updated: Song = await r.json();
        setSelected(updated);
        toast.success("Saved!");
      } else {
        toast.error("Save failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(null);
    }
  };

  const handleSmartFetch = async () => {
    if (!selected) return;
    setIsFetching(true);
    try {
      const params = new URLSearchParams({ title: selected.title });
      if (selected.artist) params.set("artist", selected.artist);
      const r = await fetch(`${API}/api/songs/fetch-metadata?${params}`);
      if (!r.ok) throw new Error(`API error ${r.status}`);
      const data = await r.json();

      if (!data.hasLyrics && !data.hasSpotify) {
        // Show specific error from debug object
        if (!data.debug?.spotifyConfigured) {
          toast.error("Spotify credentials not set — add SPOTIFY_CLIENT_ID & SECRET to .env", { duration: 6000 });
        } else if (data.debug?.lyricsError) {
          toast.error(`Lyrics: ${data.debug.lyricsError}`, { duration: 5000 });
        } else if (data.debug?.spotifyError) {
          toast.error(`Spotify: ${data.debug.spotifyError}`, { duration: 5000 });
        } else {
          toast.error("Nothing found — try updating the song title/artist.");
        }
        return;
      }

      // Auto-save to Practice Center fields
      const patch: Record<string, string | null> = {};
      if (data.hasLyrics)   patch.chordSheet   = data.lyrics;
      if (data.hasSpotify)  patch.spotifyUrl   = data.spotifyUrl;
      if (data.hasPreview)  patch.previewUrl   = data.previewUrl;
      if (data.albumArt)    patch.albumArt     = data.albumArt;
      // also set referenceUrl to spotifyUrl as fallback for the manual URL field
      if (data.hasSpotify)  patch.referenceUrl = data.spotifyUrl;

      const patchRes = await fetch(`${API}/api/songs/${selected.id}/practice`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (patchRes.ok) {
        const updated: Song = await patchRes.json();
        setSelected(updated);
        setChordDraft(updated.chordSheet ?? "");
        setRefDraft(updated.referenceUrl ?? "");
        const parts = [];
        if (data.hasLyrics)   parts.push(`lyrics (${data.lyricsSource})`);
        if (data.hasSpotify)  parts.push("Spotify link");
        if (data.hasPreview)  parts.push("preview audio");
        toast.success(`Smart Fetch found ${parts.join(" & ")} and saved!`);
      } else {
        toast.error("Fetched data but failed to save.");
      }
    } catch (e: any) {
      toast.error(`Smart Fetch failed: ${e?.message ?? "Check your connection."}`);
    } finally {
      setIsFetching(false);
    }
  };


  const tempoColor: Record<string, string> = {
    fast: "bg-emerald-500/10 text-emerald-600",
    medium: "bg-yellow-500/10 text-yellow-700",
    slow: "bg-blue-500/10 text-blue-600",
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="container mx-auto py-10 px-4 md:px-8 max-w-7xl pb-24">

        <PageHeader
          title="Practice Center"
          description="Rehearsal hub — chord sheets, reference tracks, and Worship Leader notes."
          backHref="/dashboard"
        />

        {/* ── Song Picker ─────────────────────────────────────────────── */}
        <Card className="mb-8 border-none shadow-sm rounded-2xl bg-white">
          <CardContent className="p-5">
            <Label className="text-sm font-semibold text-[#1A237E] mb-3 block">
              Select a Song to Practice
            </Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-muted/40 border-border hover:bg-muted/60 rounded-xl h-11 font-medium"
                >
                  {selected ? (
                    <span className="flex items-center gap-2">
                      <Music2 className="w-4 h-4 text-[#26A69A]" />
                      {selected.title}
                      {selected.artist && <span className="text-muted-foreground text-xs">— {selected.artist}</span>}
                    </span>
                  ) : "Choose a song to practice…"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-40" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[480px] p-0 rounded-2xl shadow-lg" align="start">
                <Command>
                  <CommandInput placeholder="Search by title or artist…" className="border-none" />
                  <CommandList>
                    <CommandEmpty>No songs found.</CommandEmpty>
                    <CommandGroup>
                      {songs.map(s => (
                        <CommandItem
                          key={s.id}
                          value={`${s.title} ${s.artist ?? ""}`}
                          onSelect={() => handleSelectSong(s)}
                          className="cursor-pointer py-2.5"
                        >
                          <Check className={cn("mr-2 h-4 w-4 text-[#26A69A]", selected?.id === s.id ? "opacity-100" : "opacity-0")} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{s.title}</p>
                            <p className="text-xs text-muted-foreground">{s.artist}{s.key ? ` • Key: ${s.key}` : ""}{s.bpm ? ` • ${s.bpm} BPM` : ""}</p>
                          </div>
                          {s.tempoType && (
                            <Badge className={cn("text-[10px] ml-2", tempoColor[s.tempoType.toLowerCase()] ?? "bg-muted text-muted-foreground")}>
                              {s.tempoType}
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* ── Empty State ─────────────────────────────────────────────── */}
        {!selected && !loading && (
          <div className="flex flex-col items-center justify-center py-28 text-muted-foreground gap-4">
            <div className="p-5 bg-[#1A237E]/8 rounded-3xl">
              <Mic2 className="w-12 h-12 text-[#1A237E]/30" />
            </div>
            <p className="font-medium text-lg text-[#1A237E]/50">Select a song to start practicing</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A237E]" />
          </div>
        )}

        {/* ── Split View ──────────────────────────────────────────────── */}
        {selected && !loading && (
          <>
            {/* Song Meta Bar */}
            <div className="mb-6 flex flex-wrap items-center gap-3 px-5 py-4 bg-[#1A237E] text-white rounded-2xl shadow-md">
              <div className="p-2 bg-white/10 rounded-xl">
                <Music2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-lg leading-tight">{selected.title}</p>
                {selected.artist && <p className="text-xs text-white/60 font-medium">{selected.artist}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selected.key && (
                  <Badge className="bg-white/15 text-white border-none font-bold px-3">
                    Key: {selected.key}
                  </Badge>
                )}
                {selected.bpm && (
                  <Badge className="bg-white/15 text-white border-none font-bold px-3">
                    {selected.bpm} BPM
                  </Badge>
                )}
                {selected.tempoType && (
                  <Badge className="bg-[#26A69A]/80 text-white border-none font-bold px-3">
                    {selected.tempoType}
                  </Badge>
                )}
                {selected.themes?.map(t => (
                  <Badge key={t} className="bg-white/10 text-white/80 border-none text-xs px-2">
                    {t}
                  </Badge>
                ))}
              </div>
              {/* Smart Fetch button in meta bar */}
              <Button
                size="sm"
                disabled={isFetching}
                onClick={handleSmartFetch}
                className="ml-auto rounded-full h-8 px-4 text-xs bg-white/15 hover:bg-white/25 text-white border border-white/20 font-semibold flex-shrink-0"
              >
                {isFetching ? (
                  <><span className="animate-spin mr-1.5 inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />Searching…</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Smart Fetch</>
                )}
              </Button>
            </div>

            {/* Single Column Layout (Chord Sheet with Transposer) */}
            <div className="max-w-4xl mx-auto w-full">
              <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardHeader className="p-0 border-b border-border/60 flex flex-col">
                  {/* Title Row */}
                  <div className="flex items-center justify-between w-full px-6 py-4">
                    <CardTitle className="font-heading text-[#1A237E] flex items-center gap-2 text-xl">
                      <BookOpen className="w-6 h-6 text-[#26A69A]" />
                      Chord Sheet
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {editingChords ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full h-9 px-4 text-xs font-semibold"
                            onClick={() => { setEditingChords(false); setChordDraft(selected.chordSheet ?? ""); }}
                          >
                            <X className="w-4 h-4 mr-1.5" /> Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-full h-9 px-5 text-xs bg-[#1A237E] hover:bg-[#1A237E]/90 text-white font-semibold shadow-sm"
                            disabled={saving === "chordSheet"}
                            onClick={async () => {
                              await patchPractice({ chordSheet: chordDraft });
                              setEditingChords(false);
                            }}
                          >
                            <Save className="w-4 h-4 mr-1.5" />
                            {saving === "chordSheet" ? "Saving…" : "Save"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full h-9 px-4 text-xs border-[#1A237E]/20 text-[#1A237E] hover:bg-[#1A237E]/5 font-semibold"
                          onClick={() => { setChordDraft(selected.chordSheet ?? ""); setEditingChords(true); }}
                        >
                          <Pencil className="w-4 h-4 mr-1.5" /> Edit Chord Sheet
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Musical Key Transposer */}
                  <div className="px-6 pb-6 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-[#B71C1C]" />
                      Musical Key Transposer
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"].map((key) => {
                        const isActive = targetKey === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setTargetKey(key)}
                            className={cn(
                              "min-w-[42px] h-10 rounded-md text-sm font-bold transition-all duration-200 shadow-sm",
                              isActive 
                                ? "bg-[#B71C1C] text-white ring-2 ring-[#B71C1C]/20 scale-105" 
                                : "bg-black text-white hover:bg-black/80"
                            )}
                          >
                            {key}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-8 md:p-10">
                  {editingChords ? (
                    <textarea
                      value={chordDraft}
                      onChange={e => setChordDraft(e.target.value)}
                      className="w-full min-h-[500px] font-mono text-base bg-muted/30 border border-border/60 rounded-2xl p-6 resize-y focus:outline-none focus:ring-2 focus:ring-[#26A69A]/30 leading-relaxed"
                      placeholder={`[Verse 1]\nG    Em   C    D\nBless the Lord oh my soul...\n\n[Chorus]\nG         D/F#\nHow great is our God...`}
                    />
                  ) : selected.chordSheet ? (
                    <div className="min-h-[500px]">
                      {/* No Chords Hint */}
                      {(!selected.chordSheet.includes("[") && !selected.chordSheet.includes("]")) && (
                        <div className="mb-6 flex items-center gap-3 p-4 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold shadow-sm">
                          <AlertCircle className="w-4 h-4 text-slate-500" />
                          No chords detected in this sheet. Click "Edit Chord Sheet" to add [Chord] markers.
                        </div>
                      )}
                      <ChordSheetRenderer 
                        text={selected.chordSheet} 
                        originalKey={selected.key}
                        targetKey={targetKey}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground gap-4">
                      <div className="bg-muted/50 p-6 rounded-full">
                        <FileText className="w-12 h-12 opacity-20" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-[#1A237E]/60">No chord sheet available</p>
                        <p className="text-sm opacity-60 mt-1">Start by adding a sheet or using Smart Fetch.</p>
                      </div>
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full mt-2 border-[#1A237E]/20 text-[#1A237E] hover:bg-[#1A237E]/5 font-bold"
                        onClick={() => { setChordDraft(""); setEditingChords(true); }}
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Add Chord Sheet
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
