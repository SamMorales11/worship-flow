"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Clock, Plus, Trash2, GripVertical, Music2, AlignLeft,
  ChevronDown, Timer, ListTodo, Pencil, X, Check, ChevronsUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

type Setlist = { id: string; title: string; date: string | null };
type Song = { id: string; title: string; artist: string | null; key: string | null };
type RunsheetItem = {
  id: string;
  setlistId: string;
  position: number;
  title: string;
  durationMinutes: number;
  type: string;
  notes: string | null;
  songId: string | null;
  songTitle: string | null;
  songArtist: string | null;
  songKey: string | null;
};

const SEGMENT_TYPES = [
  { value: "custom", label: "Custom Segment", icon: AlignLeft },
  { value: "song",   label: "Song from Library", icon: Music2 },
];

const TYPE_COLORS: Record<string, string> = {
  song:   "bg-[#26A69A]/15 text-[#26A69A] border-[#26A69A]/30",
  custom: "bg-[#1A237E]/10 text-[#1A237E] border-[#1A237E]/20",
};

function formatTime(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function buildCumulativeTimes(items: RunsheetItem[]) {
  let running = 0;
  return items.map((item) => {
    const start = running;
    running += item.durationMinutes;
    return { ...item, startMin: start, endMin: running };
  });
}

function formatClock(min: number) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function RunSheetPage() {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);
  const [items, setItems] = useState<RunsheetItem[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [setlistOpen, setSetlistOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<RunsheetItem | null>(null);
  const [form, setForm] = useState({
    title: "", durationMinutes: 5, type: "custom", songId: "", notes: "",
  });
  const [songPickerOpen, setSongPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch setlists
  useEffect(() => {
    fetch(`${API}/api/setlists/archive`)
      .then(r => r.ok ? r.json() : [])
      .then(setSetlists)
      .catch(() => {});
  }, []);

  // Fetch songs for picker
  useEffect(() => {
    fetch(`${API}/api/songs`)
      .then(r => r.ok ? r.json() : [])
      .then(setSongs)
      .catch(() => {});
  }, []);

  const fetchItems = useCallback(async (setlistId: string) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/runsheet/${setlistId}`);
      if (r.ok) setItems(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectSetlist = (sl: Setlist) => {
    setSelectedSetlist(sl);
    setSetlistOpen(false);
    fetchItems(sl.id);
  };

  const openAddModal = () => {
    setEditItem(null);
    setForm({ title: "", durationMinutes: 5, type: "custom", songId: "", notes: "" });
    setModalOpen(true);
  };

  const openEditModal = (item: RunsheetItem) => {
    setEditItem(item);
    setForm({
      title: item.title,
      durationMinutes: item.durationMinutes,
      type: item.type,
      songId: item.songId ?? "",
      notes: item.notes ?? "",
    });
    setModalOpen(true);
  };

  // When type=song and a song is selected, auto-fill title
  const handleSongSelect = (song: Song) => {
    setForm(f => ({ ...f, songId: song.id, title: song.title }));
    setSongPickerOpen(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!selectedSetlist) return;
    setSaving(true);
    try {
      const payload = {
        setlistId: selectedSetlist.id,
        title: form.title,
        durationMinutes: Number(form.durationMinutes),
        type: form.type,
        songId: form.type === "song" ? form.songId || null : null,
        notes: form.notes || null,
        position: editItem ? editItem.position : items.length,
      };

      let r: Response;
      if (editItem) {
        r = await fetch(`${API}/api/runsheet/${editItem.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        r = await fetch(`${API}/api/runsheet`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (r.ok) {
        toast.success(editItem ? "Segment updated!" : "Segment added!");
        setModalOpen(false);
        fetchItems(selectedSetlist.id);
      } else {
        toast.error("Failed to save segment");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !selectedSetlist) return;
    try {
      const r = await fetch(`${API}/api/runsheet/${deleteId}`, { method: "DELETE" });
      if (r.ok) {
        toast.success("Segment removed");
        setDeleteId(null);
        fetchItems(selectedSetlist.id);
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const moveItem = async (index: number, dir: -1 | 1) => {
    const swapped = [...items];
    const target = index + dir;
    if (target < 0 || target >= swapped.length) return;
    [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
    const reordered = swapped.map((it, i) => ({ ...it, position: i }));
    setItems(reordered);
    await fetch(`${API}/api/runsheet/${selectedSetlist!.id}/reorder`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map(it => ({ id: it.id, position: it.position })) }),
    });
  };

  const totalMinutes = items.reduce((s, it) => s + it.durationMinutes, 0);
  const timedItems = buildCumulativeTimes(items);
  const selectedSong = songs.find(s => s.id === form.songId);

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-4xl min-h-screen pb-24">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Run Sheet"
        description="Manage the minute-by-minute flow of your service."
        backHref="/dashboard"
      >
        {selectedSetlist && (
          <Button
            onClick={openAddModal}
            className="bg-[#1A237E] text-white hover:bg-[#1A237E]/90 shadow-md rounded-2xl h-11 px-6 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Segment
          </Button>
        )}
      </PageHeader>

      {/* ── Setlist Picker ─────────────────────────────────────────── */}
      <Card className="mb-8 border-none shadow-sm rounded-2xl bg-white">
        <CardContent className="p-5">
          <Label className="text-sm font-semibold text-[#1A237E] mb-3 block">
            Select a Setlist
          </Label>
          <Popover open={setlistOpen} onOpenChange={setSetlistOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between bg-muted/40 border-border hover:bg-muted/60 rounded-xl h-11 font-medium"
              >
                {selectedSetlist ? selectedSetlist.title : "Choose a setlist…"}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-40" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 rounded-2xl shadow-lg" align="start">
              <Command>
                <CommandInput placeholder="Search setlists…" className="border-none" />
                <CommandList>
                  <CommandEmpty>No setlists found.</CommandEmpty>
                  <CommandGroup>
                    {setlists.map(sl => (
                      <CommandItem
                        key={sl.id}
                        value={sl.title}
                        onSelect={() => handleSelectSetlist(sl)}
                        className="cursor-pointer"
                      >
                        <Check className={cn("mr-2 h-4 w-4 text-[#26A69A]", selectedSetlist?.id === sl.id ? "opacity-100" : "opacity-0")} />
                        <div>
                          <p className="font-medium">{sl.title}</p>
                          {sl.date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(sl.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* ── Total Duration Bar ─────────────────────────────────────── */}
      {selectedSetlist && items.length > 0 && (
        <div className="mb-6 flex items-center gap-3 px-5 py-3.5 bg-[#1A237E] text-white rounded-2xl shadow-md">
          <Timer className="w-5 h-5 opacity-80" />
          <span className="font-heading font-semibold text-sm">Total Service Duration</span>
          <span className="ml-auto font-heading font-bold text-xl tracking-wide">
            {formatTime(totalMinutes)}
          </span>
          <span className="text-xs opacity-60 font-medium">{items.length} segments</span>
        </div>
      )}

      {/* ── Timeline ───────────────────────────────────────────────── */}
      {!selectedSetlist ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Clock className="w-12 h-12 opacity-20" />
          <p className="text-base font-medium">Select a setlist to view its Run Sheet</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A237E]" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <div className="p-4 bg-[#1A237E]/8 rounded-3xl">
            <ListTodo className="w-10 h-10 text-[#1A237E]/40" />
          </div>
          <p className="font-medium text-base">No segments yet.</p>
          <Button
            onClick={openAddModal}
            className="bg-[#1A237E] text-white hover:bg-[#1A237E]/90 rounded-2xl px-6"
          >
            <Plus className="w-4 h-4 mr-2" /> Add First Segment
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[60px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#1A237E]/40 via-[#26A69A]/30 to-transparent rounded-full" />

          <div className="space-y-3">
            {timedItems.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-4 group">
                {/* Time column */}
                <div className="w-[52px] flex-shrink-0 text-right pt-3.5">
                  <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                    {formatClock(item.startMin)}
                  </span>
                </div>

                {/* Node */}
                <div className="relative z-10 flex-shrink-0 mt-3">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 border-white shadow",
                    item.type === "song" ? "bg-[#26A69A]" : "bg-[#1A237E]"
                  )} />
                </div>

                {/* Card */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white border border-border rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md hover:border-[#1A237E]/20 transition-all flex items-start gap-3">
                    
                    {/* Drag handle (visual only) */}
                    <GripVertical className="w-4 h-4 text-muted-foreground/30 mt-0.5 flex-shrink-0 cursor-grab" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-heading font-bold text-[#1A237E] text-sm leading-snug truncate">
                          {item.title}
                        </h3>
                        <Badge className={cn("text-[10px] px-2 py-0 border rounded-full font-semibold", TYPE_COLORS[item.type] ?? TYPE_COLORS.custom)}>
                          {item.type === "song" ? "Song" : "Segment"}
                        </Badge>
                      </div>
                      {item.type === "song" && item.songArtist && (
                        <p className="text-xs text-muted-foreground mb-1">{item.songArtist}{item.songKey ? ` • Key: ${item.songKey}` : ""}</p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-muted-foreground italic">{item.notes}</p>
                      )}
                    </div>

                    {/* Duration badge */}
                    <Badge className="bg-[#26A69A]/15 text-[#26A69A] border border-[#26A69A]/30 font-bold text-xs px-2.5 py-1 rounded-xl flex-shrink-0 whitespace-nowrap">
                      <Clock className="w-3 h-3 mr-1 inline" />
                      {item.durationMinutes}m
                    </Badge>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={() => moveItem(idx, -1)} disabled={idx === 0}>
                        <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={() => openEditModal(item)}>
                        <Pencil className="w-3.5 h-3.5 text-[#1A237E]" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* End marker */}
            <div className="flex items-center gap-4">
              <div className="w-[52px] flex-shrink-0 text-right">
                <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                  {formatClock(totalMinutes)}
                </span>
              </div>
              <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30 border-2 border-white shadow" />
              </div>
              <span className="text-xs text-muted-foreground font-medium italic">Service ends</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ───────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-[#1A237E]">
              {editItem ? "Edit Segment" : "Add Segment"}
            </DialogTitle>
            <DialogDescription>
              {editItem ? "Update this segment's details." : "Add a new segment to the run sheet."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type */}
            <div className="space-y-2">
              <Label className="font-semibold text-[#1A237E] text-sm">Segment Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {SEGMENT_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t.value, songId: "", title: t.value === "custom" ? "" : f.title }))}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all",
                      form.type === t.value
                        ? "border-[#1A237E] bg-[#1A237E]/8 text-[#1A237E]"
                        : "border-border text-muted-foreground hover:border-[#1A237E]/30"
                    )}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Song picker (only for song type) */}
            {form.type === "song" && (
              <div className="space-y-2">
                <Label className="font-semibold text-[#1A237E] text-sm">Song from Library</Label>
                <Popover open={songPickerOpen} onOpenChange={setSongPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-muted/40 hover:bg-muted/60 rounded-xl">
                      {selectedSong ? (
                        <span className="flex items-center gap-2">
                          <Music2 className="w-4 h-4 text-[#26A69A]" />
                          {selectedSong.title}
                        </span>
                      ) : "Pick a song…"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-40" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[380px] p-0 rounded-2xl shadow-lg" align="start">
                    <Command>
                      <CommandInput placeholder="Search songs…" />
                      <CommandList>
                        <CommandEmpty>No songs found.</CommandEmpty>
                        <CommandGroup>
                          {songs.map(s => (
                            <CommandItem key={s.id} value={`${s.title} ${s.artist}`} onSelect={() => handleSongSelect(s)} className="cursor-pointer">
                              <Check className={cn("mr-2 h-4 w-4 text-[#26A69A]", form.songId === s.id ? "opacity-100" : "opacity-0")} />
                              <div>
                                <p className="font-medium text-sm">{s.title}</p>
                                <p className="text-xs text-muted-foreground">{s.artist}{s.key ? ` • ${s.key}` : ""}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label className="font-semibold text-[#1A237E] text-sm">
                Segment Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Opening Prayer, Sermon, Offering"
                className="bg-muted/50 border-transparent focus-visible:ring-[#26A69A] rounded-xl"
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="font-semibold text-[#1A237E] text-sm">Duration (minutes)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={180}
                  value={form.durationMinutes}
                  onChange={e => setForm(f => ({ ...f, durationMinutes: parseInt(e.target.value) || 1 }))}
                  className="bg-muted/50 border-transparent focus-visible:ring-[#26A69A] rounded-xl w-28"
                />
                <div className="flex gap-1">
                  {[2, 5, 10, 15, 20, 30].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, durationMinutes: m }))}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-lg border font-medium transition-all",
                        form.durationMinutes === m
                          ? "bg-[#26A69A] text-white border-[#26A69A]"
                          : "border-border text-muted-foreground hover:border-[#26A69A]/40"
                      )}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="font-semibold text-[#1A237E] text-sm">Notes (optional)</Label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Pastor John speaking, mic on stage left…"
                className="bg-muted/50 border-transparent focus-visible:ring-[#26A69A] rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" className="rounded-full" onClick={() => setModalOpen(false)}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full px-6 bg-[#1A237E] hover:bg-[#1A237E]/90 text-white font-semibold shadow-sm"
            >
              {saving ? "Saving…" : editItem ? "Save Changes" : "Add Segment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ─────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-[#1A237E]">Remove Segment?</DialogTitle>
            <DialogDescription>This segment will be permanently removed from the run sheet.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" className="rounded-full" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button onClick={handleDelete} className="rounded-full bg-destructive/90 hover:bg-destructive text-white">
              Yes, Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
