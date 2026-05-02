"use client";

import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Trash2, Check, ChevronsUpDown, Calendar, Music, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SongItem = {
  id: string;
  songId: string;
  title: string;
  artist: string | null;
  key: string | null;
  bpm: string | null;
  position: string | null;
};

type SetlistDetail = {
  id: string;
  title: string;
  date: string | null;
  songs: SongItem[];
};

type SongOption = {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  bpm: string | null;
};

type Props = {
  setlistId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onMutated: () => void;
};

export function SetlistDetailSheet({ setlistId, isOpen, onClose, onMutated }: Props) {
  const [detail, setDetail] = useState<SetlistDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSongs, setEditSongs] = useState<SongOption[]>([]);
  const [allSongs, setAllSongs] = useState<SongOption[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen || !setlistId) return;
    setIsEditing(false);
    setDetail(null);
    setLoading(true);

    const fetchDetail = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/setlists/${setlistId}`);
        if (res.ok) {
          const data = await res.json();
          setDetail(data);
          setEditTitle(data.title);
          setEditDate(data.date ? new Date(data.date).toISOString().split("T")[0] : "");
          setEditSongs(data.songs.map((s: SongItem) => ({
            id: s.songId, title: s.title, artist: s.artist, key: s.key, bpm: s.bpm,
          })));
        } else {
          toast.error("Failed to load setlist details.");
        }
      } catch {
        toast.error("Network error loading setlist.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [setlistId, isOpen]);

  useEffect(() => {
    if (!isEditing) return;
    const fetchSongs = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs`);
      if (res.ok) setAllSongs(await res.json());
    };
    fetchSongs();
  }, [isEditing]);

  const moveSongUp = (index: number) => {
    if (index === 0) return;
    const arr = [...editSongs];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    setEditSongs(arr);
  };

  const moveSongDown = (index: number) => {
    if (index === editSongs.length - 1) return;
    const arr = [...editSongs];
    [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
    setEditSongs(arr);
  };

  const handleAddSong = (song: SongOption) => {
    if (!editSongs.find(s => s.id === song.id)) setEditSongs([...editSongs, song]);
    setOpenCombobox(false);
  };

  const handleRemoveSong = (id: string) => setEditSongs(editSongs.filter(s => s.id !== id));

  const handleSaveEdit = async () => {
    if (!editTitle || editSongs.length === 0) {
      toast.error("Title and at least one song are required.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/setlists/${setlistId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          date: editDate ? new Date(editDate).toISOString() : null,
          songs: editSongs.map((s, i) => ({ songId: s.id, position: i + 1 })),
        }),
      });
      if (res.ok) {
        toast.success("Setlist updated successfully!");
        setIsEditing(false);
        onMutated();
        // Refresh detail
        const updated = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/setlists/${setlistId}`);
        if (updated.ok) setDetail(await updated.json());
      } else {
        toast.error("Failed to update setlist.");
      }
    } catch {
      toast.error("Network error saving setlist.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/setlists/${setlistId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Setlist deleted.");
        setIsDeleteDialogOpen(false);
        onClose();
        onMutated();
      } else {
        toast.error("Failed to delete setlist.");
      }
    } catch {
      toast.error("Network error deleting setlist.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = detail?.date
    ? new Date(detail.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "No date set";

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setIsEditing(false); } }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border bg-primary/5">
            {loading ? (
              <>
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <SheetTitle className="font-heading text-2xl text-primary">
                  {isEditing ? "Edit Setlist" : detail?.title}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {isEditing ? "Modify the setlist details below." : formattedDate}
                </SheetDescription>
              </>
            )}
          </SheetHeader>

          <div className="flex-1 px-6 py-5 space-y-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isEditing ? (
              /* ---- EDIT MODE ---- */
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary">Event Title</label>
                  <Input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="bg-muted/50 border-transparent focus-visible:ring-secondary"
                    placeholder="e.g. Sunday Service"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary">Event Date</label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="bg-muted/50 border-transparent focus-visible:ring-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-primary">Songs</label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="justify-between w-full bg-white border-border hover:bg-muted/50">
                        Add a song...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 rounded-2xl overflow-hidden shadow-md" align="start">
                      <Command>
                        <CommandInput placeholder="Search song title or artist..." className="border-none" />
                        <CommandList>
                          <CommandEmpty>No song found.</CommandEmpty>
                          <CommandGroup>
                            {allSongs.map(song => (
                              <CommandItem key={song.id} value={`${song.title} ${song.artist}`} onSelect={() => handleAddSong(song)} className="cursor-pointer">
                                <Check className={cn("mr-2 h-4 w-4 text-secondary", editSongs.find(s => s.id === song.id) ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col">
                                  <span className="font-medium">{song.title}</span>
                                  <span className="text-xs text-muted-foreground">{song.artist}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  {editSongs.map((song, i) => (
                    <div key={song.id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-white shadow-sm">
                      <div className="flex items-center gap-3">
                        <Badge className="w-6 h-6 flex items-center justify-center rounded-full p-0 bg-primary text-white text-xs">{i + 1}</Badge>
                        <div>
                          <p className="font-semibold text-sm">{song.title}</p>
                          <p className="text-xs text-muted-foreground">{song.artist} {song.key ? `• ${song.key}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => moveSongUp(i)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => moveSongDown(i)} disabled={i === editSongs.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSong(song.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ---- VIEW MODE ---- */
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Music className="w-3.5 h-3.5" /> {detail?.songs.length ?? 0} Songs
                </p>
                {detail?.songs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                    <Music className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No songs in this setlist.</p>
                  </div>
                ) : (
                  detail?.songs.map((song, i) => (
                    <div key={song.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:border-secondary/40 transition-colors">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{song.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {song.artist}
                          {song.key ? ` • Key: ${song.key}` : ""}
                          {song.bpm ? ` • ${song.bpm} BPM` : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs border-secondary/40 text-secondary hidden sm:flex">{song.key ?? "—"}</Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          {!loading && (
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3 mt-auto">
              {isEditing ? (
                <>
                  <Button variant="outline" className="rounded-full" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="rounded-full px-6 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-sm"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="rounded-full border-destructive/50 text-destructive hover:bg-destructive/5"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white shadow-sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Setlist
                  </Button>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <DialogTitle className="font-heading text-xl text-primary">Delete Setlist?</DialogTitle>
            </div>
            <DialogDescription>
              This will permanently delete <strong>"{detail?.title}"</strong> and all its songs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" className="rounded-full" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-full bg-destructive/90 hover:bg-destructive text-white"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
