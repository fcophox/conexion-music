"use client";

import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reproductor de audio protegido: consume las playlists HLS cifradas con
 * AES-128 que sirve /api/stream. La clave de descifrado se pide con la cookie
 * de sesión + token firmado; el elemento <audio> nunca expone una URL de
 * archivo descargable.
 */
export function useSecureAudio(options: { onEnded: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const activeTrackRef = useRef<string | null>(null);
  const onEndedRef = useRef(options.onEnded);
  useEffect(() => {
    onEndedRef.current = options.onEnded;
  });

  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [readyTrackId, setReadyTrackId] = useState<string | null>(null);

  // Un único <audio> oculto para toda la app, creado fuera del DOM visible.
  useEffect(() => {
    const audio = document.createElement("audio");
    audio.preload = "auto";
    audioRef.current = audio;

    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => onEndedRef.current();
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      audio.pause();
      audio.removeAttribute("src");
      audioRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
    activeTrackRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setTime(0);
    setDuration(0);
    setReadyTrackId(null);
  }, []);

  const load = useCallback(function loadTrack(trackId: string, startAt = 0) {
    const audio = audioRef.current;
    if (!audio) return;
    if (activeTrackRef.current === trackId) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;
    activeTrackRef.current = trackId;
    setTime(0);
    setDuration(0);
    setReadyTrackId(null);

    const src = `/api/stream/${trackId}/playlist`;

    if (audio.canPlayType("application/vnd.apple.mpegurl")) {
      // Prefer native HLS on Safari, including devices that also support MSE.
      audio.src = src;
      if (startAt > 0) audio.currentTime = startAt;
      setReadyTrackId(trackId);
    } else if (Hls.isSupported()) {
      const hls = new Hls({ startPosition: startAt });
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hlsRef.current === hls) setReadyTrackId(trackId);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          // Token caducado u otro fallo de red: recarga la playlist para
          // obtener un token fresco y retoma donde iba.
          const resumeAt = audio.currentTime;
          hls.destroy();
          activeTrackRef.current = null;
          loadTrack(trackId, resumeAt);
        } else {
          console.warn("Error de reproducción HLS:", data.details);
          hls.destroy();
          hlsRef.current = null;
        }
      });
      hls.loadSource(src);
      hls.attachMedia(audio);
    }
  }, []);

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {
      // el navegador puede bloquear autoplay hasta que haya interacción
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(seconds)) {
      audio.currentTime = Math.max(0, seconds);
      setTime(audio.currentTime);
    }
  }, []);

  const setVolume = useCallback((volume: number, muted: boolean) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = Math.min(1, Math.max(0, volume));
      audio.muted = muted;
    }
  }, []);

  return { load, stop, play, pause, seek, setVolume, time, duration, readyTrackId };
}
