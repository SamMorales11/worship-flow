"use client";

import { useEffect, useState } from "react";
import { Search, Music, Plus, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";

// Define the song type based on our schema
type Song = {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  bpm: string | null;
  tempoType: string | null;
  themes: string[] | null;
};

type FetchedMeta = {
  spotifyUrl: string | null;
  previewUrl: string | null;
  albumArt: string | null;
  spotifyTrackTitle: string | null;
  spotifyArtistName: string | null;
  lyrics: string | null;
  lyricsSource: string | null;
  hasSpotify: boolean;
  hasPreview: boolean;
  hasLyrics: boolean;
  debug: {
    spotifyError: string | null;
    lyricsError: string | null;
    spotifyConfigured: boolean;
  };
};

const AVAILABLE_THEMES = [
  "Worship", "Praise", "Faith", "Grace", "Victory", 
  "Holy Spirit", "Love", "Hymn", "Hope", "Healing"
];

const songSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().optional(),
  bpm: z.string().optional(),
  key: z.string().optional(),
  tempoType: z.string().optional(),
  themes: z.array(z.string()).max(3, "Max 3 themes allowed").optional(),
});
type SongFormValues = z.infer<typeof songSchema>;

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedMeta, setFetchedMeta] = useState<FetchedMeta | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<SongFormValues>({
    resolver: zodResolver(songSchema),
    defaultValues: {
      title: "",
      artist: "",
      bpm: "",
      key: "",
      tempoType: "",
      themes: [],
    },
  });

  const tempoTypeValue = watch("tempoType");
  const selectedThemes = watch("themes") || [];

  const handleThemeToggle = (theme: string) => {
    if (selectedThemes.includes(theme)) {
      setValue("themes", selectedThemes.filter(t => t !== theme), { shouldValidate: true });
    } else {
      if (selectedThemes.length < 3) {
        setValue("themes", [...selectedThemes, theme], { shouldValidate: true });
      }
    }
  };

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs`);
        if (res.ok) {
          const data = await res.json();
          setSongs(data);
        } else {
          console.error("Failed to fetch songs");
        }
      } catch (error) {
        console.error("Error fetching songs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  const onSubmit = async (data: SongFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        themes: data.themes || [],
        bpm: data.bpm ? data.bpm : null,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newSong = await res.json();

        // If Smart Fetch found results, auto-save them to Practice Center fields
        if (fetchedMeta && (fetchedMeta.hasLyrics || fetchedMeta.hasSpotify)) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs/${newSong.id}/practice`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chordSheet:   fetchedMeta.lyrics      || null,
                spotifyUrl:   fetchedMeta.spotifyUrl  || null,
                previewUrl:   fetchedMeta.previewUrl  || null,
                albumArt:     fetchedMeta.albumArt    || null,
                referenceUrl: fetchedMeta.spotifyUrl  || null,
              }),
            });
          } catch { /* non-critical, ignore */ }
        }

        setSongs([newSong, ...songs]);
        setIsDialogOpen(false);
        setFetchedMeta(null);
        reset();
        toast.success("Song added successfully!");
      } else {
        toast.error("Failed to add song");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while adding the song");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSmartFetch = async () => {
    const title = watch("title");
    const artist = watch("artist");
    if (!title) {
      toast.error("Enter a song title first.");
      return;
    }
    setIsFetching(true);
    setFetchedMeta(null);
    try {
      const params = new URLSearchParams({ title });
      if (artist) params.set("artist", artist);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs/fetch-metadata?${params}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: FetchedMeta = await res.json();
      setFetchedMeta(data);

      if (!data.hasLyrics && !data.hasSpotify) {
        // Show specific error reasons from the debug object
        if (!data.debug?.spotifyConfigured) {
          toast.error("Spotify credentials not set — add SPOTIFY_CLIENT_ID & SECRET to .env", { duration: 6000 });
        } else if (data.debug?.lyricsError) {
          toast.error(`Lyrics: ${data.debug.lyricsError}`, { duration: 5000 });
        } else if (data.debug?.spotifyError) {
          toast.error(`Spotify: ${data.debug.spotifyError}`, { duration: 5000 });
        } else {
          toast.error("Nothing found — try a different title or artist.");
        }
      } else {
        const parts = [];
        if (data.hasLyrics)  parts.push(`lyrics (${data.lyricsSource})`);
        if (data.hasSpotify) parts.push("Spotify link");
        if (data.hasPreview) parts.push("preview audio");
        toast.success(`Found ${parts.join(" & ")}! Review below.`);
      }
    } catch (e: any) {
      toast.error(`Smart Fetch failed: ${e?.message ?? "Check your connection."}`);
    } finally {
      setIsFetching(false);
    }
  };

  const filteredSongs = songs.filter((song) => {
    const query = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(query) ||
      (song.artist && song.artist.toLowerCase().includes(query))
    );
  });

  const getTempoColor = (tempo: string | null) => {
    switch (tempo?.toLowerCase()) {
      case "fast":
        return "bg-green-500 hover:bg-green-600";
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "slow":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
      <PageHeader
        title="Song Library"
        description="Manage and browse your worship songs"
        backHref="/dashboard"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-sm font-semibold tracking-wide">
              <Plus className="w-5 h-5 mr-2" />
              Add New Song
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl text-primary">Add New Song</DialogTitle>
              <DialogDescription>
                Add a new song to your worship library database.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              {/* Smart Fetch Banner */}
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                <Sparkles className="w-4 h-4 text-secondary flex-shrink-0" />
                <p className="text-xs text-muted-foreground flex-1">
                  Enter a title (and artist) then click <strong>Smart Fetch</strong> to auto-fill lyrics &amp; YouTube.
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={isFetching}
                  onClick={handleSmartFetch}
                  className="rounded-full h-8 px-4 text-xs bg-secondary hover:bg-secondary/90 text-white font-semibold flex-shrink-0"
                >
                  {isFetching ? (
                    <><span className="animate-spin mr-1.5 inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />Searching…</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Smart Fetch</>
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="font-heading font-semibold text-primary">Title <span className="text-destructive">*</span></Label>
                <Input id="title" placeholder="e.g. 10000 Reasons" {...register("title")} className="bg-muted/50 focus-visible:ring-secondary" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="artist" className="font-heading font-semibold text-primary">Artist</Label>
                <Input id="artist" placeholder="e.g. Matt Redman" {...register("artist")} className="bg-muted/50 focus-visible:ring-secondary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bpm" className="font-heading font-semibold text-primary">BPM</Label>
                  <Input id="bpm" type="number" placeholder="e.g. 72" {...register("bpm")} className="bg-muted/50 focus-visible:ring-secondary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key" className="font-heading font-semibold text-primary">Key</Label>
                  <Input id="key" placeholder="e.g. G" {...register("key")} className="bg-muted/50 focus-visible:ring-secondary" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempo" className="font-heading font-semibold text-primary">Tempo</Label>
                <Select value={tempoTypeValue} onValueChange={(val) => setValue("tempoType", val)}>
                  <SelectTrigger className="bg-muted/50 focus-visible:ring-secondary">
                    <SelectValue placeholder="Select tempo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fast">Fast</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Slow">Slow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="font-heading font-semibold text-primary">Themes (Max 3)</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_THEMES.map((theme) => {
                    const isSelected = selectedThemes.includes(theme);
                    const isAtLimit = selectedThemes.length >= 3;
                    const isDisabled = !isSelected && isAtLimit;

                    return (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => handleThemeToggle(theme)}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all border ${
                          isSelected
                            ? "bg-secondary text-white border-secondary shadow-sm"
                            : "bg-muted/50 text-muted-foreground border-slate-200 hover:border-secondary/50"
                        } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {theme}
                      </button>
                    );
                  })}
                </div>
                {errors.themes && <p className="text-xs text-destructive">{errors.themes.message}</p>}
              </div>
              {/* Fetched Meta Preview */}
              {fetchedMeta && (fetchedMeta.hasLyrics || fetchedMeta.hasSpotify) && (
                <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-3 space-y-2">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">Smart Fetch Results</p>
                  {fetchedMeta.hasSpotify && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-muted-foreground w-16 flex-shrink-0">Spotify:</span>
                      <a href={fetchedMeta.spotifyUrl!} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-secondary hover:underline truncate">
                        {fetchedMeta.spotifyTrackTitle || fetchedMeta.spotifyUrl}
                      </a>
                    </div>
                  )}
                  {fetchedMeta.hasLyrics && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-muted-foreground w-16 flex-shrink-0">Lyrics:</span>
                      <span className="text-xs text-muted-foreground">
                        {fetchedMeta.lyrics!.slice(0, 80)}…
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 italic">
                    These will be saved to the Practice Center chord sheet &amp; reference URL when you save the song.
                  </p>
                </div>
              )}
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); setFetchedMeta(null); }} className="rounded-full">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-sm">
                  {isSubmitting ? "Saving..." : "Save Song"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>All Songs</CardTitle>
              <CardDescription>A list of all songs in your database.</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by title or artist..."
                className="pl-8 bg-muted/30 focus-visible:ring-secondary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-primary">Title</TableHead>
                    <TableHead className="font-semibold text-primary">Artist</TableHead>
                    <TableHead className="font-semibold text-primary">Key</TableHead>
                    <TableHead className="font-semibold text-primary">BPM</TableHead>
                    <TableHead className="font-semibold text-primary">Tempo</TableHead>
                    <TableHead className="font-semibold text-primary">Themes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSongs.length > 0 ? (
                    filteredSongs.map((song) => (
                      <TableRow key={song.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">{song.title}</TableCell>
                        <TableCell className="text-muted-foreground">{song.artist}</TableCell>
                        <TableCell>{song.key}</TableCell>
                        <TableCell className="text-muted-foreground">{song.bpm}</TableCell>
                        <TableCell>
                          {song.tempoType && (
                            <Badge className={`${getTempoColor(song.tempoType)} text-white`}>
                              {song.tempoType}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {song.themes?.map((theme, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No songs found matching "{searchQuery}"
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
