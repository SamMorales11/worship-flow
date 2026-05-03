"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { DashboardFooter } from "@/components/layout/DashboardFooter";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === "/";
  const isLive = pathname?.startsWith("/live");

  if (isRoot) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <main className="flex-1 w-full min-w-0">{children}</main>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      {!isLive && <Sidebar />}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto w-full min-w-0">
        <main className="flex-1">
          {children}
        </main>
        {!isLive && <DashboardFooter />}
      </div>
    </div>
  );
}
