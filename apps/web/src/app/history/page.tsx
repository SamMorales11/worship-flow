"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Calendar as CalendarIcon, Music, RotateCcw, Clock, Activity, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/PageHeader";

export default function HistoryPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Mock Data for Top Songs
  const topSongs = [
    { title: "How Great Is Our God", plays: 24, maxPlays: 30 },
    { title: "Praise Him", plays: 18, maxPlays: 30 },
    { title: "What A Beautiful Name", plays: 15, maxPlays: 30 },
    { title: "Holy Spirit", plays: 12, maxPlays: 30 },
    { title: "Agnus Dei", plays: 8, maxPlays: 30 },
  ];

  // Mock Data for Liturgical Flow Mix (Donut Chart)
  const flowMixData = [
    { name: "Contemporary Worship", value: 60, color: "#1A237E" }, // Deep Blue
    { name: "Hymns", value: 25, color: "#26A69A" }, // Teal
    { name: "Liturgy / Choral", value: 15, color: "#FFD700" }, // Gold
  ];

  // Mock Data for Setlist Archive
  const archive = [
    { id: 1, title: "Sunday Service (Morning)", date: "Oct 28", songs: 6, duration: "45m", isLive: true },
    { id: 2, title: "Youth Revival Night", date: "Oct 25", songs: 8, duration: "60m", isLive: false },
    { id: 3, title: "Midweek Prayer", date: "Oct 22", songs: 4, duration: "30m", isLive: false },
    { id: 4, title: "Sunday Service (Evening)", date: "Oct 21", songs: 5, duration: "40m", isLive: false },
  ];

  // Calendar modifiers for service days
  const modifiers = {
    sundayService: [new Date(2026, 9, 28), new Date(2026, 9, 21), new Date(2026, 9, 14)],
    midweekService: [new Date(2026, 9, 25), new Date(2026, 9, 22), new Date(2026, 9, 18)],
  };

  const modifiersStyles = {
    sundayService: { backgroundColor: 'rgba(26, 35, 126, 0.1)', color: '#1A237E', fontWeight: 'bold' },
    midweekService: { backgroundColor: 'rgba(38, 166, 154, 0.1)', color: '#26A69A', fontWeight: 'bold' },
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-7xl min-h-screen bg-background pb-24">
      <PageHeader
        title="History & Analytics"
        description="Track your worship team's trends, song rotation health, and past service archives."
        backHref="/dashboard"
      >
        <Button className="bg-primary text-white hover:bg-primary/90 shadow-sm rounded-xl">
          <Activity className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Liturgical Calendar Card */}
            <Card className="bg-white border-none shadow-md rounded-3xl overflow-hidden flex flex-col h-full">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                <CardTitle className="font-heading text-primary flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-secondary" />
                  Liturgical Calendar
                </CardTitle>
                <CardDescription>View past and upcoming worship services.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 flex justify-center flex-1">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-xl border shadow-sm p-4 w-full flex justify-center"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  classNames={{
                    head_cell: "text-muted-foreground font-medium w-10 uppercase text-[10px]",
                    cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-muted",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  }}
                />
              </CardContent>
              <CardFooter className="bg-muted/10 border-t border-border/50 py-3 flex gap-4 justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1A237E]"></div>
                  Sunday Service
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#26A69A]"></div>
                  Midweek
                </div>
              </CardFooter>
            </Card>

            {/* Liturgical Flow Mix (Donut Chart) */}
            <Card className="bg-white border-none shadow-md rounded-3xl overflow-hidden h-full flex flex-col">
              <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                <CardTitle className="font-heading text-primary flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#FFD700]" />
                  Liturgical Flow Mix
                </CardTitle>
                <CardDescription>Distribution of song styles this quarter.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-2 flex-1 flex flex-col items-center justify-center">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={flowMixData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {flowMixData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-4 w-full px-4">
                  {flowMixData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-bold text-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Setlist Archive */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-2xl text-primary">Setlist Archive</h3>
              <Button variant="link" className="text-secondary font-medium">View All History</Button>
            </div>
            
            <div className="space-y-4">
              {archive.map((item) => (
                <Card key={item.id} className="bg-white border-border shadow-sm rounded-2xl hover:shadow-md transition-shadow group overflow-hidden">
                  <CardContent className="p-0 flex flex-col sm:flex-row items-stretch">
                    <div className="bg-muted/30 px-6 py-5 flex flex-col justify-center items-center sm:border-r border-border/50 min-w-[100px]">
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{item.date.split(' ')[0]}</span>
                      <span className="text-2xl font-heading font-bold text-primary">{item.date.split(' ')[1]}</span>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-lg font-heading text-foreground">{item.title}</h4>
                          {item.isLive && (
                            <Badge className="bg-red-500/10 text-red-600 border-none px-2 py-0 animate-pulse">LIVE</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Music className="w-3.5 h-3.5" /> {item.songs} Songs</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.duration}</span>
                        </div>
                      </div>
                      
                      <Button className="bg-[#FFD700] text-[#1A237E] hover:bg-[#FFD700]/90 font-bold rounded-xl shadow-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-full sm:w-auto">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Re-use Flow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          
          {/* Top Song Rotation */}
          <Card className="bg-white border-none shadow-md rounded-3xl overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="font-heading text-primary flex items-center gap-2">
                <Music className="w-5 h-5 text-secondary" />
                Top Song Rotation
              </CardTitle>
              <CardDescription>Most frequently played songs over the last 90 days.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5 flex-1">
              {topSongs.map((song, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-sm text-foreground truncate max-w-[180px]">{song.title}</span>
                    <span className="text-xs font-medium text-muted-foreground">{song.plays} plays</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(song.plays / song.maxPlays) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="bg-[#1A237E] p-5 text-white">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold font-heading text-sm text-[#FFD700] mb-1">Pro Tip</h4>
                  <p className="text-xs text-white/80 leading-relaxed">
                    "How Great Is Our God" is dominating your rotation. Consider swapping it with a newer hymn to prevent congregation fatigue.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
