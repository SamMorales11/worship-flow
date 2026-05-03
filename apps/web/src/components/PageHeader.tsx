"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back to Dashboard",
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-10 space-y-4", className)}>
      {backHref && (
        <Button
          variant="ghost"
          asChild
          className="-ml-4 p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-primary transition-all duration-200 group"
        >
          <Link href={backHref} className="flex items-center gap-1">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold uppercase tracking-wider">{backLabel}</span>
          </Link>
        </Button>
      )}
      
      <div className="flex flex-col items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-slate-600 text-lg font-medium max-w-3xl">
              {description}
            </p>
          )}
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
}
