"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, Music, Activity, ArrowDown, Wand2, ArrowRight, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Custom hook for debouncing state changes
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function AIGeneratorPage() {
  const [isThinking, setIsThinking] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);

  // Form State
  const [theme, setTheme] = useState("praise-worship");
  const [duration, setDuration] = useState("30");
  const [songCount, setSongCount] = useState("5");
  const [languageRatio, setLanguageRatio] = useState([50]); // 0=ID, 100=EN
  const [energyIntensity, setEnergyIntensity] = useState([70]);

  // Debounced values to trigger "generation"
  const debouncedTheme = useDebounce(theme, 300);
  const debouncedDuration = useDebounce(duration, 300);
  const debouncedSongCount = useDebounce(songCount, 300);
  const debouncedLanguageRatio = useDebounce(languageRatio, 300);
  const debouncedEnergyIntensity = useDebounce(energyIntensity, 300);

  const [generationId, setGenerationId] = useState(0);

  // Simulation logic for reactive generation
  useEffect(() => {
    const generateNewFlow = async () => {
      setIsThinking(true);
      
      try {
        const params = new URLSearchParams({
          theme: debouncedTheme,
          duration: debouncedDuration,
          songCount: debouncedSongCount,
          languageRatio: debouncedLanguageRatio?.[0]?.toString() || "50",
          energyIntensity: debouncedEnergyIntensity?.[0]?.toString() || "70",
        });

        const res = await fetch(`${API}/api/generator?${params}`);
        if (!res.ok) throw new Error("Failed to generate");
        const data = await res.json();
        
        console.log("Fetched Data:", data);
        setTimeline(data.timeline || []);
        setGenerationId(prev => prev + 1);
      } catch (error) {
        console.error("Generation error:", error);
      } finally {
        setIsThinking(false);
      }
    };

    if (debouncedTheme && debouncedDuration && debouncedSongCount) {
      generateNewFlow();
    }
  }, [debouncedTheme, debouncedDuration, debouncedSongCount, debouncedLanguageRatio, debouncedEnergyIntensity]);

  const handleSave = () => {
    // Save logic
  };

  const mockTimeline = [
    {
      id: "1",
      title: "Praise Him",
      artist: "Worship Flow Original",
      bpm: "120",
      key: "G",
      type: "Upbeat Praise",
    },
    {
      transition: "Seamless Tempo Drop (120 → 72) • Keep Key of G",
    },
    {
      id: "2",
      title: "Holy Spirit",
      artist: "Bryan & Katie Torwalt",
      bpm: "72",
      key: "G",
      type: "Transition Worship",
    },
    {
      transition: "Smooth Key Change (G → A) • Swell Pad",
    },
    {
      id: "3",
      title: "How Great Is Our God",
      artist: "Chris Tomlin",
      bpm: "76",
      key: "A",
      type: "Deep Worship",
    },
  ];

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-5xl min-h-screen bg-background">
      <PageHeader
        title="AI Setlist Generator"
        backHref="/dashboard"
        className="max-w-3xl mx-auto text-center"
      >
        <div className="flex flex-col items-center max-w-2xl mx-auto">
          <p className="text-muted-foreground text-lg text-center leading-relaxed mb-6">
            Let our AI craft the perfect worship flow based on your parameters. 
            We analyze tempo curves, key compatibility, and thematic resonance in real-time.
          </p>
          <Badge className="bg-[#26A69A]/10 text-[#26A69A] border-[#26A69A]/20 px-4 py-1.5 rounded-full font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Reactive Intelligence Active
          </Badge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <div className="space-y-8">
          
          {/* Step 1: Foundation */}
          <Card className="border-0 shadow-xl rounded-[2rem] bg-white overflow-hidden relative p-2">
            <div className="absolute top-0 left-0 w-2 h-full bg-secondary"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold font-heading">1</div>
                <div>
                  <CardTitle className="font-heading text-xl text-primary">Foundation</CardTitle>
                  <CardDescription>Core service parameters.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-primary flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  Service Theme
                </label>
                <Select value={theme} onValueChange={(val) => setTheme(val || "")}>
                  <SelectTrigger className="w-full bg-muted/30 border-transparent rounded-2xl h-12 focus:ring-secondary/50">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border shadow-lg">
                    <SelectItem value="praise-worship">Praise & Worship (Standard)</SelectItem>
                    <SelectItem value="holy-communion">Holy Communion</SelectItem>
                    <SelectItem value="youth-revival">Youth Revival</SelectItem>
                    <SelectItem value="acoustic">Acoustic / Intimate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-primary">Duration (Mins)</label>
                  <Input 
                    type="number" 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-muted/30 border-transparent rounded-2xl h-12 focus-visible:ring-secondary/50"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-primary">Song Count</label>
                  <Input 
                    type="number" 
                    value={songCount} 
                    onChange={(e) => setSongCount(e.target.value)}
                    className="bg-muted/30 border-transparent rounded-2xl h-12 focus-visible:ring-secondary/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Atmosphere */}
          <Card className="border-0 shadow-xl rounded-[2rem] bg-white overflow-hidden relative p-2">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold font-heading">2</div>
                <div>
                  <CardTitle className="font-heading text-xl text-primary">Atmosphere</CardTitle>
                  <CardDescription>Fine-tune stylistic elements.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-primary">Language Ratio</label>
                  <Badge variant="outline" className="font-mono bg-muted/30 border-none text-muted-foreground rounded-lg">
                    {Math.round(100 - (languageRatio[0] || 0))}% ID / {Math.round(languageRatio[0] || 0)}% EN
                  </Badge>
                </div>
                <div className="px-1">
                  <Slider 
                    value={languageRatio} 
                    onValueChange={(val) => setLanguageRatio(val)} 
                    max={100} 
                    step={10}
                    className="[&_[data-slot=slider-range]]:bg-secondary"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  <span>Indonesian</span>
                  <span>English</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-primary">Energy Intensity</label>
                  <Badge variant="outline" className="font-mono bg-muted/30 border-none text-muted-foreground rounded-lg">
                    {Math.round(energyIntensity[0] || 0)}%
                  </Badge>
                </div>
                <div className="px-1">
                  <Slider 
                    value={energyIntensity} 
                    onValueChange={(val) => setEnergyIntensity(val)} 
                    max={100} 
                    step={5}
                    className="[&_[data-slot=slider-range]]:bg-primary"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  <span>Intimate</span>
                  <span>Explosive</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-[#26A69A]/5 border border-[#26A69A]/10 rounded-3xl p-6 flex items-start gap-4">
            <div className="p-2 bg-[#26A69A]/10 rounded-xl">
              <Activity className="w-5 h-5 text-[#26A69A]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A237E] mb-1">Real-time Reactive Logic</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your setlist updates automatically as you adjust parameters. No refresh needed.
              </p>
            </div>
          </div>

        </div>

        <div className="h-full">
          <Card className={cn(
            "border-0 rounded-[2.5rem] overflow-hidden relative h-full transition-all duration-700 bg-white shadow-2xl ring-1 ring-black/5",
            isThinking && "opacity-80"
          )}>
            <div className="flex flex-col h-full">
              <div className="bg-[#1A237E] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="font-heading font-bold text-2xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-secondary" /> 
                    AI Generated Flow
                  </h3>
                  <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                    {duration} Mins
                  </Badge>
                </div>
                <p className="text-blue-100/70 text-sm font-medium relative z-10">
                  Optimized for {theme.replace('-', ' ')} with a focus on {energyIntensity[0] > 50 ? 'high energy praise' : 'intimate worship'}.
                </p>
              </div>

              <div className="p-8 relative flex-1">
                {/* Timeline Background Line */}
                <div className="absolute left-[3.15rem] top-12 bottom-12 w-0.5 bg-gradient-to-b from-secondary/40 via-primary/20 to-transparent"></div>

                <div key={generationId} className="space-y-4 relative z-10">
                  {isThinking ? (
                    // Skeleton Loaders
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={`skeleton-${i}`} className="flex items-start gap-6 mb-8">
                        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-6 w-3/4 rounded-lg" />
                          <Skeleton className="h-4 w-1/2 rounded-md" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16 rounded-md" />
                            <Skeleton className="h-5 w-16 rounded-md" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-top-4">
                      <div className="p-4 bg-muted/50 rounded-full mb-4">
                        <Activity className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                      <h4 className="font-heading font-bold text-lg text-primary mb-1">No songs match these exact criteria</h4>
                      <p className="text-sm text-muted-foreground max-w-[250px]">
                        Try adjusting the sliders or changing the theme to get a better flow.
                      </p>
                    </div>
                  ) : (
                    timeline.map((item, index) => {
                      // Node Item (Song)
                      if (item.id) {
                        return (
                          <div 
                            key={`song-${item.id}`} 
                            className="flex items-start gap-6 group animate-in fade-in slide-in-from-bottom-4 duration-500"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1 shadow-lg ring-4 ring-white z-10 transition-transform group-hover:scale-110">
                              {item.id}
                            </div>
                            <div className="flex-1 bg-white border border-border/60 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all hover:border-secondary/30">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-[#1A237E] font-heading text-lg leading-tight">{item.title}</h4>
                                <Badge variant="secondary" className="text-[10px] bg-secondary/10 text-secondary border-none px-2 rounded-md">
                                  {item.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium mb-4">{item.artist}</p>
                              
                              <div className="flex gap-2">
                                <div className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-lg text-[10px] font-bold text-primary">
                                  <Music className="w-3 h-3" />
                                  Key: {item.key}
                                </div>
                                <div className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-lg text-[10px] font-bold text-secondary">
                                  <Clock className="w-3 h-3" />
                                  {item.bpm} BPM
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Transition Item
                      return (
                        <div 
                          key={`transition-${index}`} 
                          className="flex items-center gap-6 py-2 opacity-90 pl-1 animate-in fade-in duration-700"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 z-10 ring-4 ring-white shadow-sm">
                            <ArrowDown className="w-4 h-4" />
                          </div>
                          <div className="bg-secondary/5 border border-secondary/10 px-4 py-2 rounded-xl text-xs font-bold text-secondary flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" />
                            {item.transition}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-border/50 bg-muted/10">
                <Button className="w-full h-14 bg-primary text-white hover:bg-primary/90 rounded-2xl font-bold shadow-lg shadow-primary/10 group">
                  Confirm & Export to Run Sheet
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
