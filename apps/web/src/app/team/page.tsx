"use client";

import { Plus, Settings, Activity, Mail, UserPlus, CheckCircle2, ShieldAlert, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/PageHeader";

export default function TeamPage() {
  const members = [
    { id: 1, name: "David Chen", role: "Worship Leader", status: "Active", initials: "DC", image: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
    { id: 2, name: "Sarah Jenkins", role: "Music Director", status: "Active", initials: "SJ", image: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
    { id: 3, name: "Michael Kim", role: "Bassist", status: "Away", initials: "MK", image: "https://i.pravatar.cc/150?u=a04258114e29026702d" },
    { id: 4, name: "Jessica Lee", role: "Vocalist", status: "Active", initials: "JL", image: "https://i.pravatar.cc/150?u=a048581f4e29026701d" },
    { id: 5, name: "Andre Smith", role: "Drummer", status: "Active", initials: "AS", image: "https://i.pravatar.cc/150?u=a04258a2462d826712d" },
    { id: 6, name: "Emma Wilson", role: "Keys", status: "Pending", initials: "EW" },
  ];

  const activities = [
    { id: 1, user: "Sarah Jenkins", action: "updated the setlist", target: "Sunday Morning", time: "2 hours ago" },
    { id: 2, user: "David Chen", action: "added a new song", target: "Agnus Dei", time: "4 hours ago" },
    { id: 3, user: "Michael Kim", action: "commented on", target: "Youth Revival Flow", time: "Yesterday" },
    { id: 4, user: "Emma Wilson", action: "joined the workspace", target: "", time: "2 days ago" },
    { id: 5, user: "Andre Smith", action: "changed key for", type: "Key Change", target: "Praise Him (G → A)", time: "3 days ago" },
  ];

  const permissions = [
    { level: "Admin", description: "Full access to organization, billing, and all setlists.", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
    { level: "Editor", description: "Can create and edit setlists, and add new songs to the library.", icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10" },
    { level: "Viewer", description: "Can only view setlists and access Live Mode.", icon: Shield, color: "text-secondary", bg: "bg-secondary/10" },
  ];

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-7xl min-h-screen bg-background pb-24">
      <PageHeader
        title="Team & Collaboration"
        description="Manage your team and collaboration across Worship Flow."
        backHref="/dashboard"
      >
        <Button className="bg-primary text-white hover:bg-primary/90 shadow-md rounded-2xl h-12 px-6 font-semibold">
          <UserPlus className="w-5 h-5 mr-2" />
          Invite Member
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Members & Roles */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Member Grid */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-heading font-bold text-2xl text-primary">Team Members</h2>
              <span className="text-sm font-semibold text-muted-foreground">{members.length} Total</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {members.map((member) => (
                <Card key={member.id} className="bg-white border-border shadow-sm rounded-2xl hover:shadow-md transition-all group overflow-hidden">
                  <CardContent className="p-5 flex items-start gap-4">
                    <Avatar className="w-12 h-12 rounded-2xl shadow-sm border border-border">
                      {member.image && <AvatarImage src={member.image} alt={member.name} />}
                      <AvatarFallback className="font-bold font-heading bg-muted text-primary">{member.initials}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-foreground font-heading truncate">{member.name}</h3>
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground mb-3">{member.role}</p>
                      
                      <div className="flex items-center justify-between">
                        {member.status === "Active" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none px-2 py-0">
                            Active
                          </Badge>
                        ) : member.status === "Pending" ? (
                          <Badge className="bg-accent/20 text-[#8B7500] hover:bg-accent/30 border-none px-2 py-0">
                            Pending
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground hover:bg-muted/80 border-none px-2 py-0">
                            Away
                          </Badge>
                        )}
                        
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Role Management */}
          <section>
            <h2 className="font-heading font-bold text-2xl text-primary mb-4 px-1 mt-4">Permission Levels</h2>
            <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-0 divide-y divide-border/50">
                {permissions.map((perm, idx) => (
                  <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl ${perm.bg} ${perm.color}`}>
                        <perm.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold font-heading text-lg text-foreground mb-1">{perm.level}</h3>
                        <p className="text-sm text-muted-foreground">{perm.description}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="border-border rounded-xl whitespace-nowrap">
                      Manage {perm.level}s
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

        </div>

        {/* RIGHT COLUMN: Collaboration Activity */}
        <div className="space-y-8">
          <Card className="bg-white border-none shadow-md rounded-3xl overflow-hidden h-full">
            <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
              <CardTitle className="font-heading text-primary flex items-center gap-2">
                <Activity className="w-5 h-5 text-secondary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Real-time updates from your team.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6">
              <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {activities.map((item, index) => (
                  <div key={item.id} className="relative flex items-start justify-between mb-8 last:mb-0">
                    <div className="flex items-start gap-4 w-full">
                      <div className="w-10 h-10 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                        <span className="text-primary font-bold text-xs">
                          {item.user.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div className="flex-1 bg-white border border-border p-4 rounded-2xl shadow-sm hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-sm font-heading">{item.user}</span>
                          <span className="text-[10px] font-semibold text-muted-foreground">{item.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.action} <span className="font-bold text-foreground">{item.target}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="p-4 border-t border-border/50 bg-muted/10">
              <Button variant="ghost" className="w-full text-primary font-semibold">
                View All Activity
              </Button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
