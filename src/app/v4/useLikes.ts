"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "conexionify:v4:liked";

function readStored(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

// Canciones con "me gusta" de este visitante. Se recuerdan en el navegador para
// no sumar el mismo like varias veces; el conteo real vive en el servidor.
export function useLikes() {
  const [liked, setLiked] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Se lee después de montar para no romper la hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiked(new Set(readStored()));
  }, []);

  const like = (trackId: number) => {
    if (liked.has(trackId)) return;
    const nextLiked = new Set(liked).add(trackId);
    setLiked(nextLiked);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...nextLiked]));
    } catch {
      // sin almacenamiento (modo privado): el like vale solo en esta sesión
    }
    fetch("/api/stream/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId }),
    }).catch(() => {});
  };

  return { isLiked: (trackId: number) => liked.has(trackId), like };
}

export type Likes = ReturnType<typeof useLikes>;
