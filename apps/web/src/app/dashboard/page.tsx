"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, ArrowUp, ArrowDown, Trash2, Check, ChevronsUpDown, Calendar, Music, Sparkles, X, Clock, Users, Headphones, Copy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { SetlistDetailSheet } from "@/components/SetlistDetailSheet";

type Song = {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  bpm: string | null;
};

type Setlist = {
  id: string;
  title: string;
  date: string | null;
  status: string;
  songsCount: number;
};

export default function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recentSetlists, setRecentSetlists] = useState<Setlist[]>([]);
  const [setlistsLoading, setSetlistsLoading] = useState(true);
  const [selectedSetlistId, setSelectedSetlistId] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    const getNextSunday8AM = () => {
      const now = new Date();
      const next = new Date(now);
      
      const day = now.getDay();
      const hours = now.getHours();
    
      let daysUntilSunday = (7 - day) % 7;
      
      if (day === 0 && hours >= 12) {
        daysUntilSunday = 7;
      } else if (day === 1) {
        daysUntilSunday = 6;
      }
    
      next.setDate(now.getDate() + daysUntilSunday);
      next.setHours(8, 0, 0, 0);
      
      return next;
    };

    const target = getNextSunday8AM();
    setTargetDate(target);
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target.getTime() - now;
      
      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSongs = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/songs`);
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
    }
  }, []);

  const fetchRecentSetlists = useCallback(async () => {
    try {
      setSetlistsLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/setlists/archive`);
      if (res.ok) {
        const data = await res.json();
        setRecentSetlists(data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching setlists:", error);
    } finally {
      setSetlistsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
    fetchRecentSetlists();
  }, [fetchSongs, fetchRecentSetlists]);

  const handleDuplicateSetlist = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/setlists/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Setlist duplicated as draft!");
        await fetchRecentSetlists();
      } else {
        const err = await res.json();
        toast.error(`Duplicate failed: ${err.error}`);
      }
    } catch (error) {
      console.error("Error duplicating setlist:", error);
      toast.error("An error occurred while duplicating.");
    }
  };

  const handleAddSong = (song: Song) => {
    if (!selectedSongs.find((s) => s.id === song.id)) {
      setSelectedSongs([...selectedSongs, song]);
    }
    setOpenCombobox(false);
  };

  const handleRemoveSong = (songId: string) => {
    setSelectedSongs(selectedSongs.filter((s) => s.id !== songId));
  };

  const moveSongUp = (index: number) => {
    if (index === 0) return;
    const newSongs = [...selectedSongs];
    const temp = newSongs[index - 1];
    newSongs[index - 1] = newSongs[index];
    newSongs[index] = temp;
    setSelectedSongs(newSongs);
  };

  const moveSongDown = (index: number) => {
    if (index === selectedSongs.length - 1) return;
    const newSongs = [...selectedSongs];
    const temp = newSongs[index + 1];
    newSongs[index + 1] = newSongs[index];
    newSongs[index] = temp;
    setSelectedSongs(newSongs);
  };

  const handleSaveSetlist = async () => {
    if (!title || !date || selectedSongs.length === 0) {
      toast.error("Please fill in all fields and select at least one song.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        date: new Date(date).toISOString(),
        songs: selectedSongs.map((song, index) => ({
          songId: song.id,
          position: index + 1,
        })),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/setlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTitle("");
        setDate("");
        setSelectedSongs([]);
        setIsDialogOpen(false);
        toast.success("Setlist saved successfully!");
        await fetchRecentSetlists();
      } else {
        const err = await res.json();
        toast.error(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Error saving setlist:", error);
      toast.error("An error occurred while saving the setlist.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 max-w-6xl min-h-[calc(100vh-4rem)] bg-background relative pb-24">
      
      {/* Setlist Detail Sheet */}
      <SetlistDetailSheet
        setlistId={selectedSetlistId}
        isOpen={!!selectedSetlistId}
        onClose={() => setSelectedSetlistId(null)}
        onMutated={fetchRecentSetlists}
      />
      
      {/* Create Setlist Dialog (Hidden by default, triggered by "Buat Setlist Baru") */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-primary">Create New Setlist</DialogTitle>
            <DialogDescription>Plan your next worship event by assembling a setlist.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-semibold text-primary">Event Title</label>
              <Input
                id="title"
                placeholder="e.g. Ibadah Raya Minggu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-muted/50 border-transparent focus-visible:ring-secondary"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="date" className="text-sm font-semibold text-primary">Event Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  className="pl-9 bg-muted/50 border-transparent focus-visible:ring-secondary"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-primary">Add Songs</label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="justify-between w-full bg-white border-border hover:bg-muted/50 hover:text-primary"
                  >
                    Search and select songs...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[550px] p-0 rounded-2xl overflow-hidden shadow-md" align="start">
                  <Command>
                    <CommandInput placeholder="Search song title or artist..." className="border-none focus:ring-0" />
                    <CommandList>
                      <CommandEmpty>No song found.</CommandEmpty>
                      <CommandGroup>
                        {songs.map((song) => (
                          <CommandItem
                            key={song.id}
                            value={`${song.title} ${song.artist}`}
                            onSelect={() => handleAddSong(song)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-secondary",
                                selectedSongs.find((s) => s.id === song.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{song.title}</span>
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

            {selectedSongs.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-semibold text-primary mb-2 flex items-center">
                  <Music className="w-4 h-4 mr-2 text-secondary" />
                  Selected Songs ({selectedSongs.length})
                </h4>
                {selectedSongs.map((song, index) => (
                  <div key={song.id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-white shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <Badge className="w-6 h-6 flex items-center justify-center rounded-full p-0 bg-primary text-white">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{song.title}</p>
                        <p className="text-xs text-muted-foreground">{song.artist} • Key: {song.key}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => moveSongUp(index)} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => moveSongDown(index)} disabled={index === selectedSongs.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveSong(song.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border hover:bg-muted">Cancel</Button>
            <Button onClick={handleSaveSetlist} disabled={isSaving || !title || !date || selectedSongs.length === 0} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
              {isSaving ? "Saving..." : "Save Setlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Hero Card */}
          <Card className="relative overflow-hidden bg-primary text-white border-0 shadow-md rounded-2xl p-6 md:p-8">
            {/* Subtle Geometric Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
              <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="20" strokeDasharray="20 10"/>
              </svg>
            </div>

            {/* Extra ambient glow */}
            <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              {/* Left: Title + Buttons */}
              <div className="flex flex-col flex-1">
                <Badge className="bg-white/20 hover:bg-white/30 text-white mb-4 border-none text-xs tracking-wider w-fit">UPCOMING SERVICE</Badge>
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2">Ibadah Raya Minggu</h2>
                <p className="text-primary-foreground/80 font-medium">
                  {isMounted && targetDate 
                    ? `${targetDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • 08:00 AM`
                    : "Loading..."}
                </p>

                {/* CTA Buttons */}
                <div className="mt-6 flex items-center gap-3 flex-wrap">
                  <Button className="bg-white text-primary hover:bg-white/90 font-semibold shadow-sm">
                    Review Setlist
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm font-medium gap-2 transition-all duration-200"
                  >
                    <Clock className="w-4 h-4" />
                    View Run Sheet
                  </Button>
                </div>

                {/* Team Status */}
                <div className="mt-8 flex items-center gap-3">
                  {/* Overlapping Avatars */}
                  <div className="flex -space-x-2">
                    {[
                      { initials: "AS", bg: "bg-teal-400" },
                      { initials: "BK", bg: "bg-violet-400" },
                      { initials: "JL", bg: "bg-sky-400" },
                      { initials: "MR", bg: "bg-rose-400" },
                    ].map((member) => (
                      <div
                        key={member.initials}
                        className={`w-8 h-8 rounded-full ring-2 ring-primary flex items-center justify-center text-[10px] font-bold text-white ${member.bg} shadow-sm`}
                      >
                        {member.initials}
                      </div>
                    ))}
                    {/* +2 more pill */}
                    <div className="w-8 h-8 rounded-full ring-2 ring-primary bg-white/20 backdrop-blur-sm flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                      +2
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white leading-tight">Team Status</p>
                    <p className="text-[11px] text-white/70 mt-0.5 flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      4/6 Team Confirmed
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Countdown + Run Sheet Preview */}
              <div className="flex flex-col gap-3 min-w-[240px]">
                {/* Countdown */}
                <div className="bg-black/20 p-5 rounded-2xl backdrop-blur-sm text-center border border-white/10">
                  <p className="text-xs font-semibold mb-3 opacity-80 tracking-widest uppercase">Starts In</p>
                  {isMounted ? (
                    <div className="flex justify-between items-end gap-1">
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-3xl font-bold font-heading">{String(timeLeft.days).padStart(2, '0')}</span>
                        <span className="text-[10px] opacity-70 font-mono mt-1 tracking-wider">DAY</span>
                      </div>
                      <span className="text-2xl font-bold font-heading opacity-50 mb-[18px]">:</span>
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-3xl font-bold font-heading">{String(timeLeft.hours).padStart(2, '0')}</span>
                        <span className="text-[10px] opacity-70 font-mono mt-1 tracking-wider">HRS</span>
                      </div>
                      <span className="text-2xl font-bold font-heading opacity-50 mb-[18px]">:</span>
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-3xl font-bold font-heading">{String(timeLeft.minutes).padStart(2, '0')}</span>
                        <span className="text-[10px] opacity-70 font-mono mt-1 tracking-wider">MIN</span>
                      </div>
                      <span className="text-2xl font-bold font-heading opacity-50 mb-[18px]">:</span>
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-3xl font-bold font-heading">{String(timeLeft.seconds).padStart(2, '0')}</span>
                        <span className="text-[10px] opacity-70 font-mono mt-1 tracking-wider">SEC</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[60px] flex items-center justify-center opacity-50">
                      <span className="animate-pulse">Calculating...</span>
                    </div>
                  )}
                </div>

                {/* Run Sheet Preview */}
                <div className="bg-black/20 px-4 py-3 rounded-2xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] font-semibold opacity-70 tracking-widest uppercase mb-2.5">Run Sheet</p>
                  <ul className="space-y-1.5">
                    {[
                      { time: "08:00", label: "Opening Prayer" },
                      { time: "08:05", label: "Praise & Worship" },
                      { time: "08:25", label: "Announcements" },
                    ].map((segment) => (
                      <li key={segment.time} className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono text-white/50 w-10 shrink-0">{segment.time}</span>
                        <span className="w-px h-3 bg-white/20 shrink-0" />
                        <span className="text-[11px] text-white/80 truncate">{segment.label}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-white/40 mt-2.5 text-right">+5 more segments →</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Card 1 — Buat Setlist Baru (Gold) */}
            <Card
              className="bg-accent text-accent-foreground border-0 shadow-sm rounded-3xl cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200 h-full"
              onClick={() => setIsDialogOpen(true)}
            >
              <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
                <div className="bg-white/30 p-3.5 rounded-2xl w-fit">
                  <Plus className="w-6 h-6 text-[#8B7500]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base leading-tight">Buat Setlist Baru</h3>
                  <p className="text-xs opacity-70 mt-1">Mulai rencanakan ibadah</p>
                </div>
              </CardContent>
            </Card>

            {/* Card 2 — Cari Lagu (White) */}
            <Link href="/songs" className="block h-full">
              <Card className="bg-white text-foreground border border-border shadow-sm rounded-3xl cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200 h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
                  <div className="bg-primary/10 text-primary p-3.5 rounded-2xl w-fit">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base leading-tight text-primary">Cari Lagu</h3>
                    <p className="text-xs text-muted-foreground mt-1">Eksplorasi database lagu</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Card 3 — Practice Center (White) */}
            <Link href="/practice" className="block h-full">
              <Card className="bg-white text-foreground border border-border shadow-sm rounded-3xl cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200 h-full">
                <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
                  <div className="bg-secondary/10 text-secondary p-3.5 rounded-2xl w-fit">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base leading-tight text-primary">Practice Center</h3>
                    <p className="text-xs text-muted-foreground mt-1">Access rehearsal materials &amp; notes</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

          </div>

          {/* Recent Setlists */}
          <div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <h3 className="text-xl font-heading font-bold text-primary">Recent Setlists</h3>
              <Button variant="link" className="text-muted-foreground p-0 h-auto">View All</Button>
            </div>
            
            <div className="space-y-3">
              {setlistsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : recentSetlists.length === 0 ? (
                <Card className="bg-white border border-border shadow-sm rounded-2xl">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-2">
                    <Calendar className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No setlists yet. Create your first one!</p>
                  </CardContent>
                </Card>
              ) : (
                recentSetlists.map((setlist) => (
                  <Card
                    key={setlist.id}
                    className="bg-white border border-border shadow-sm rounded-2xl hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => setSelectedSetlistId(setlist.id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn(
                          "p-3 rounded-xl shadow-sm",
                          setlist.status === 'completed' ? "bg-primary/10 text-primary" : 
                          setlist.status === 'ready' ? "bg-secondary/10 text-secondary" : 
                          "bg-muted text-muted-foreground"
                        )}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold font-heading text-foreground truncate">{setlist.title}</h4>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-4 font-bold uppercase tracking-wider border-none",
                                setlist.status === 'completed' ? "bg-primary text-white" : 
                                setlist.status === 'ready' ? "bg-secondary text-white" : 
                                "bg-muted text-muted-foreground"
                              )}
                            >
                              {setlist.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1">
                              <Music className="w-3 h-3" />
                              {setlist.songsCount} Song{setlist.songsCount !== 1 ? 's' : ''}
                            </span>
                            {setlist.date && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(setlist.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted text-muted-foreground"
                          onClick={(e) => handleDuplicateSetlist(e, setlist.id)}
                          title="Duplicate Setlist"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground/40 font-bold group-hover:text-primary transition-colors pr-2">View →</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Genre Affinity Card */}
          <Card className="bg-white border border-border shadow-sm rounded-2xl p-6">
            <h3 className="font-heading font-bold text-primary text-xl mb-8">Genre Affinity</h3>
            <div className="flex flex-col items-center justify-center">
              {/* Circular Chart using CSS */}
              <div 
                className="w-48 h-48 rounded-full flex items-center justify-center relative shadow-inner" 
                style={{ background: 'conic-gradient(#26A69A 0% 60%, #1A237E 60% 100%)' }}
              >
                <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center flex-col absolute shadow-sm">
                  <span className="text-4xl font-heading font-bold text-primary">60%</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-semibold">Praise</span>
                </div>
              </div>
              
              <div className="flex flex-col w-full gap-4 mt-10">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-secondary shadow-sm"></div>
                    <span className="text-sm font-semibold text-foreground">Praise</span>
                  </div>
                  <span className="font-bold text-primary">60%</span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-primary shadow-sm"></div>
                    <span className="text-sm font-semibold text-foreground">Worship</span>
                  </div>
                  <span className="font-bold text-primary">40%</span>
                </div>
              </div>
              
              {/* Song Fatigue Widget */}
              <div className="w-full mt-10 pt-8 border-t border-border">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-accent" />
                  <h4 className="font-heading font-bold text-sm text-primary">Song Overlap Warning</h4>
                </div>
                <p className="text-[10px] text-muted-foreground mb-4 uppercase tracking-widest font-semibold">Overused in last 4 weeks</p>
                
                <div className="space-y-3">
                  {[
                    { title: "Goodness of God", artist: "Bethel Music", count: 5 },
                    { title: "Way Maker", artist: "Leeland", count: 4 }
                  ].map((song) => (
                    <div key={song.title} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-transparent hover:border-accent/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(255,215,0,0.5)] animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-foreground leading-tight">{song.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{song.artist}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-accent/30 text-accent font-bold px-1.5 h-5 bg-accent/5">
                        {song.count}x
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <p className="text-[10px] text-muted-foreground mt-4 italic">
                  * Refresh your setlist to maintain engagement.
                </p>
              </div>
            </div>
          </Card>

          {/* Smart Insights Card */}
          <Card className="bg-accent/5 border border-accent/20 shadow-sm rounded-2xl p-6 overflow-hidden relative group">
            {/* Background Decoration */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-all duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-accent/20 p-2 rounded-lg">
                  <Sparkles className="w-5 h-5 text-[#8B7500]" />
                </div>
                <h3 className="font-heading font-bold text-primary text-xl">Smart Insights</h3>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-white/50 rounded-xl border border-white backdrop-blur-sm">
                  <p className="text-xs font-bold text-[#8B7500] uppercase tracking-widest mb-2">Theme Alert</p>
                  <p className="text-sm text-primary leading-relaxed">
                    Next Sunday is <strong>Pentecost</strong>—consider adding Holy Spirit-themed songs to align with the liturgical calendar.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recommended Song</p>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-border">
                    <div className="flex items-center gap-3">
                      <div className="bg-secondary/10 p-2 rounded-lg">
                        <Music className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">How Great Is Our God</p>
                        <p className="text-[10px] text-muted-foreground">Chris Tomlin</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-primary text-white hover:bg-primary/90 font-bold text-xs h-9 rounded-xl shadow-sm">
                    Apply Suggestion
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
