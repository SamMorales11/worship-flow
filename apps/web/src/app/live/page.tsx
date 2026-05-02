"use client";

import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, CheckCircle2, Circle, Settings2, Minimize, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LiveModePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(120);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [showNotes, setShowNotes] = useState(true);

  // Mock Setlist Data
  const setlistOrder = [
    { id: 1, title: "Praise Him", active: false, done: true },
    { id: 2, title: "Holy Spirit", active: false, done: true },
    { id: 3, title: "How Great Is Our God", active: true, done: false },
    { id: 4, title: "What A Beautiful Name", active: false, done: false },
    { id: 5, title: "Agnus Dei", active: false, done: false },
  ];

  // Mock Lyrics with Chords
  const currentSong = [
    { type: 'verse', label: 'VERSE 1' },
    { chord: "G", lyric: "The splendor of the King" },
    { chord: "Em", lyric: "Clothed in majesty" },
    { chord: "C", lyric: "Let all the earth rejoice" },
    { chord: "D", lyric: "All the earth rejoice" },
    { type: 'gap' },
    { chord: "G", lyric: "He wraps Himself in light" },
    { chord: "Em", lyric: "And darkness tries to hide" },
    { chord: "C", lyric: "And trembles at His voice" },
    { chord: "D", lyric: "And trembles at His voice" },
    { type: 'gap' },
    { type: 'chorus', label: 'CHORUS' },
    { chord: "G", lyric: "How great is our God" },
    { chord: "C", lyric: "Sing with me" },
    { chord: "Em", lyric: "How great is our God" },
    { chord: "C", lyric: "And all will see how great" },
    { chord: "D", lyric: "How great is our God" },
  ];

  return (
    <div className="flex h-screen w-full bg-white text-foreground overflow-hidden font-sans">
      
      {/* MAIN CONTENT AREA */}
      <div 
        className={`flex-1 relative flex flex-col transition-all duration-300 ${isDistractionFree ? 'w-full' : 'mr-80'}`}
      >
        {/* Header (Hidden in Distraction Free) */}
        {!isDistractionFree && (
          <header className="px-8 pt-8 pb-4 flex justify-between items-end border-b border-border/40">
            <div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none mb-3 font-semibold">Live Worship Flow</Badge>
              <h1 className="text-4xl font-heading font-bold text-primary tracking-tight">How Great Is Our God</h1>
              <p className="text-muted-foreground mt-2 font-medium">Key: G • Tempo: 76 BPM</p>
            </div>
          </header>
        )}

        {/* Lyrics Area */}
        <div className="flex-1 overflow-y-auto px-12 py-12 pb-48">
          <div 
            className="max-w-4xl mx-auto transition-all duration-200" 
            style={{ fontSize: `${zoomLevel}%` }}
          >
            {currentSong.map((line, idx) => {
              if (line.type === 'gap') return <div key={idx} className="h-10"></div>;
              
              if (line.type === 'verse' || line.type === 'chorus') {
                return (
                  <div key={idx} className="mt-8 mb-4">
                    <span className="bg-muted text-muted-foreground px-3 py-1 rounded-md text-sm font-bold tracking-widest">
                      {line.label}
                    </span>
                  </div>
                );
              }

              return (
                <div key={idx} className="mb-6 leading-tight relative group">
                  <div className="text-secondary font-bold text-[0.8em] min-h-[1.5em] tracking-wider mb-1">
                    {line.chord}
                  </div>
                  <div className="text-primary font-bold text-[1.4em] tracking-tight">
                    {line.lyric}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Controls Bar (Centered) */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-white border border-border shadow-2xl rounded-full p-2 flex items-center gap-2 backdrop-blur-md bg-opacity-95">
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full text-muted-foreground hover:text-primary">
              <SkipBack className="w-6 h-6" />
            </Button>
            <Button 
              className="w-16 h-16 rounded-full bg-primary text-white hover:bg-primary/90 shadow-lg"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </Button>
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full text-muted-foreground hover:text-primary">
              <SkipForward className="w-6 h-6" />
            </Button>
            
            <div className="w-px h-10 bg-border mx-2"></div>
            
            <div className="flex items-center gap-1 px-3">
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setZoomLevel(Math.max(80, zoomLevel - 10))}>
                <ZoomOut className="w-5 h-5" />
              </Button>
              <span className="font-bold text-primary w-14 text-center">{zoomLevel}%</span>
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full" onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}>
                <ZoomIn className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Team Note */}
        {showNotes && (
          <div className="absolute bottom-8 right-8 z-30 max-w-sm animate-in slide-in-from-bottom-5">
            <Card className="bg-[#1A237E] text-white border-none shadow-2xl rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl"></div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-md">
                      <MessageSquareText className="w-4 h-4 text-accent" />
                    </div>
                    <span className="font-semibold text-sm tracking-wide">WL Note</span>
                  </div>
                  <button onClick={() => setShowNotes(false)} className="text-white/50 hover:text-white">
                    <span className="sr-only">Close</span>
                    &times;
                  </button>
                </div>
                <p className="text-sm text-white/90 leading-relaxed font-medium">
                  <span className="text-accent font-bold">Transition Idea:</span> Keep the pad swelling on the D chord as we move into the chorus. Let the congregation sing a cappella for the first half.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR (Fixed Width) */}
      <div 
        className={`w-80 bg-background border-l border-border h-full flex flex-col absolute right-0 top-0 bottom-0 transition-transform duration-300 z-50 ${isDistractionFree ? 'translate-x-full' : 'translate-x-0'}`}
      >
        <div className="p-6 border-b border-border">
          <h2 className="font-heading font-bold text-xl text-primary">Live Controls</h2>
        </div>

        <div className="p-6 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Autoscroll</p>
              <p className="text-xs text-muted-foreground">Sync with tempo</p>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer shadow-inner">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Distraction Free</p>
              <p className="text-xs text-muted-foreground">Hide panels</p>
            </div>
            <div 
              className="w-12 h-6 bg-muted rounded-full relative cursor-pointer shadow-inner"
              onClick={() => setIsDistractionFree(true)}
            >
              <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm border border-border"></div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-4">Setlist Order</h3>
          
          <div className="space-y-2">
            {setlistOrder.map((song) => (
              <div 
                key={song.id} 
                className={`p-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                  song.active ? 'bg-primary text-white shadow-md' : 'hover:bg-muted text-foreground'
                }`}
              >
                {song.done ? (
                  <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                ) : song.active ? (
                  <Settings2 className="w-5 h-5 text-accent animate-pulse flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                )}
                <span className={`font-semibold text-sm truncate ${song.active ? 'text-white' : ''}`}>
                  {song.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Exit Distraction Free Button */}
      {isDistractionFree && (
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed top-6 right-6 z-50 rounded-full shadow-lg border-border bg-white text-primary hover:bg-muted"
          onClick={() => setIsDistractionFree(false)}
        >
          <Minimize className="w-5 h-5" />
        </Button>
      )}

    </div>
  );
}
