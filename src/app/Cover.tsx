"use client";

import { useState } from "react";
import { Disc3 } from "lucide-react";
import type { AlbumWithStats } from "@/lib/catalog-types";

export function Cover({ album, className = "" }: { album: AlbumWithStats; className?: string }) {
  const source = album.coverImage?.replace(/^\/brand\//, "/cd/");
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return <div className={`overflow-hidden shrink-0 bg-gradient-to-br ${album.coverGradient} ${className}`}>
    {source && failedSource !== source ? <img src={source} alt="" className="h-full w-full object-cover" loading="lazy" onError={() => setFailedSource(source)} /> : <div className="flex h-full w-full items-center justify-center bg-white/5"><Disc3 className="h-1/2 w-1/2 text-white/70" /></div>}
  </div>;
}
