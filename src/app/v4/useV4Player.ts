"use client";

import { useEffect, useRef, useState } from "react";
import { useSecureAudio } from "@/hooks/useSecureAudio";
import type { Album } from "@/lib/catalog-types";

type Current = { album: Album; index: number };

// Estado de reproducción de la v4: una canción actual dentro de un disco, y al
// terminar sigue con la siguiente del mismo disco que tenga audio.
export function useV4Player() {
  const [available, setAvailable] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState<Current | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Busca la siguiente (o anterior) canción del disco que tenga audio.
  const findPlayable = (step: 1 | -1) => {
    if (!current) return -1;
    const { album, index } = current;
    for (let i = index + step; i >= 0 && i < album.tracks.length; i += step) {
      if (available.has(album.tracks[i].id)) return i;
    }
    return -1;
  };

  const next = () => {
    const nextIndex = findPlayable(1);
    if (!current || nextIndex === -1) {
      setIsPlaying(false);
      return;
    }
    setCurrent({ album: current.album, index: nextIndex });
  };

  const { load, play, pause, seek, readyTrackId, time, duration } = useSecureAudio({
    onEnded: next,
  });

  const track = current ? current.album.tracks[current.index] : null;
  const trackId = track?.id;

  // Solo las pistas publicadas en el servidor tienen audio real.
  useEffect(() => {
    fetch("/api/stream/catalog")
      .then((res) => res.json())
      .then((data: { tracks: string[] }) =>
        setAvailable(new Set(data.tracks.map(Number)))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (trackId != null) load(String(trackId));
  }, [trackId, load]);

  useEffect(() => {
    if (isPlaying && trackId != null && readyTrackId === String(trackId)) {
      play();
    } else {
      pause();
    }
  }, [isPlaying, readyTrackId, trackId, play, pause]);

  // Cuenta UNA reproducción cuando la pista empieza a sonar.
  const countedRef = useRef<number | null>(null);
  useEffect(() => {
    if (isPlaying && trackId != null && countedRef.current !== trackId) {
      countedRef.current = trackId;
      fetch(`/api/stream/${trackId}/play`, { method: "POST" }).catch(() => {});
    }
  }, [isPlaying, trackId]);

  // Empieza la canción; si ya es la actual, la deja como está.
  const playTrack = (album: Album, index: number) => {
    if (current?.album.id === album.id && current.index === index) return;
    setCurrent({ album, index });
    setIsPlaying(true);
  };

  // Como en cualquier reproductor: pasados unos segundos, "anterior" reinicia.
  const prev = () => {
    const prevIndex = findPlayable(-1);
    if (!current || time > 3 || prevIndex === -1) {
      seek(0);
      return;
    }
    setCurrent({ album: current.album, index: prevIndex });
  };

  return {
    track,
    album: current?.album ?? null,
    index: current?.index ?? -1,
    isPlaying,
    time,
    duration: duration || track?.duration || 0,
    isAvailable: (id: number) => available.has(id),
    hasNext: findPlayable(1) !== -1,
    playTrack,
    togglePlay: () => setIsPlaying((playing) => !playing),
    next,
    prev,
    seek,
  };
}

export type V4Player = ReturnType<typeof useV4Player>;
