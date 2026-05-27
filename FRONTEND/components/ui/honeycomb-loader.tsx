"use client";

import { cn } from "@/lib/utils";

interface HoneycombLoaderProps {
  className?: string;
}

export function HoneycombLoader({ className }: HoneycombLoaderProps) {
  return (
    <div
      className={cn("honeycomb text-accent", className)}
      aria-label="Assistant is thinking"
      role="status"
    >
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
    </div>
  );
}

export const Component = HoneycombLoader;
