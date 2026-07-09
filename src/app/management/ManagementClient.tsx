"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Compass,
  GripVertical,
  Play,
  Lock,
  LogOut,
  Save,
  Check,
  Loader2,
  BarChart3,
  Heart,
} from "lucide-react";
import type { AlbumWithStats, TrackWithStats } from "@/lib/catalog-types";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function HandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M2.45867 13.5C0.57567 12.75 0.38767 11.065 0.54267 9.66701C0.64967 8.69701 1.45367 8.08301 2.40767 8.08301C3.30267 8.08301 5.11567 8.08701 5.11567 8.08701C5.79967 8.14001 6.29567 8.76301 6.23067 9.43601C6.13067 10.472 4.90667 10.584 4.08367 10.792C4.71467 11.082 5.95367 11.887 5.85967 12.772" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.959 13.5L9.412 13.047C9.78358 12.6755 10.0783 12.2345 10.2794 11.7491C10.4805 11.2637 10.584 10.7434 10.584 10.218V4.021C10.584 3.273 9.978 2.667 9.23 2.667C8.482 2.667 7.875 3.273 7.875 4.021V7C6.259 6.274 5.861 6.202 4.084 6.458V1.854C4.084 1.106 3.478 0.5 2.73 0.5C1.982 0.5 1.375 1.106 1.375 1.854V8.332" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ManagementClient() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = comprobando
  const [albums, setAlbums] = useState<AlbumWithStats[]>([]);

  const loadCatalog = useCallback(async () => {
    const res = await fetch("/api/management/catalog", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setAlbums(data.albums);
    setAuthed(true);
  }, []);

  useEffect(() => {
    // Carga inicial del catálogo. El setState ocurre tras el await (asíncrono),
    // no de forma síncrona en el efecto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCatalog();
  }, [loadCatalog]);

  if (authed === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return <LoginScreen onSuccess={loadCatalog} />;
  }

  return <Dashboard albums={albums} onReload={loadCatalog} />;
}

/* ========================================================================= */
/* LOGIN                                                                     */
/* ========================================================================= */
function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch("/api/management/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      onSuccess();
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans">
      <form
        onSubmit={submit}
        className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500 text-black">
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-wider">conexión</span>
          <span className="text-xs text-zinc-500 font-semibold ml-auto">Manager</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black">Panel de administración</h1>
          <p className="text-zinc-400 text-sm">Ingresa tu clave para gestionar los discos.</p>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Clave de acceso"
              className={`w-full bg-zinc-950 border ${error ? "border-red-500/70" : "border-zinc-700"
                } text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-emerald-500 transition-colors`}
            />
          </div>
          {error && (
            <p className="text-red-400 text-xs font-medium">Clave incorrecta. Intenta de nuevo.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-full transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/25 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

/* ========================================================================= */
/* DASHBOARD                                                                 */
/* ========================================================================= */
function Dashboard({
  albums,
  onReload,
}: {
  albums: AlbumWithStats[];
  onReload: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(albums[0]?.id ?? "");
  const selected = albums.find((a) => a.id === selectedId) ?? albums[0];

  const logout = async () => {
    await fetch("/api/management/logout", { method: "POST" });
    location.reload();
  };

  const totalPlays = albums
    .flatMap((a) => a.tracks)
    .reduce((sum, t) => sum + t.plays, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex">
      {/* Sidebar de álbumes */}
      <aside className="w-64 lg:w-72 shrink-0 border-r border-zinc-900 bg-zinc-950 flex flex-col">
        <div className="p-6 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500 text-black">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-wider">conexión</span>
            <span className="text-[10px] text-zinc-500 font-semibold ml-auto uppercase tracking-widest">
              Manager
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold px-3 py-2">
            Discos
          </p>
          {albums.map((album) => {
            const active = album.id === selectedId;
            return (
              <button
                key={album.id}
                onClick={() => setSelectedId(album.id)}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${active ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                  }`}
              >
                {album.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.coverImage.replace('/brand/', '/cd/')}
                    alt=""
                    className="w-9 h-9 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded bg-zinc-800 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold truncate">{album.title}</span>
                  <span className="block text-xs text-zinc-500 truncate">
                    {album.tracks.length} canciones
                  </span>
                </div>
                {album.disabled && (
                  <span className="text-[9px] font-bold uppercase text-emerald-400/80">Pronto</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-900">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-900/50 hover:text-white transition-colors cursor-pointer text-sm font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
          {/* Encabezado global */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">Gestión de discos</h1>
              <p className="text-zinc-400 text-sm mt-1">
                Arrastra las canciones para reordenarlas y guarda para actualizar el home.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <div className="text-right">
                <span className="block text-lg font-black text-white leading-none">
                  {totalPlays.toLocaleString("es")}
                </span>
                <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">
                  reproducciones totales
                </span>
              </div>
            </div>
          </div>

          {selected && <AlbumEditor key={selected.id} album={selected} onSaved={onReload} />}
        </div>
      </main>
    </div>
  );
}

/* ========================================================================= */
/* EDITOR DE ÁLBUM (drag & drop)                                             */
/* ========================================================================= */
function AlbumEditor({
  album,
  onSaved,
}: {
  album: AlbumWithStats;
  onSaved: () => void;
}) {
  const [tracks, setTracks] = useState<TrackWithStats[]>(album.tracks);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty =
    tracks.length !== album.tracks.length ||
    tracks.some((t, i) => t.id !== album.tracks[i].id);

  const maxPlays = Math.max(1, ...tracks.map((t) => t.plays));

  const handleDrop = (target: number) => {
    if (dragIndex === null || dragIndex === target) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...tracks];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    setTracks(next);
    setDragIndex(null);
    setOverIndex(null);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/management/order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId: album.id, trackIds: tracks.map((t) => t.id) }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="space-y-5">
      {/* Cabecera del álbum */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-end gap-5">
          {album.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={album.coverImage.replace('/brand/', '/cd/')}
              alt=""
              className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover shadow-xl shrink-0"
            />
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-zinc-800 shrink-0" />
          )}
          <div className="min-w-0">
            <span className="text-xs uppercase tracking-widest font-bold text-zinc-500">Álbum</span>
            <h2 className="text-2xl md:text-4xl font-black text-white leading-tight truncate">
              {album.title}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              {album.artist} • {album.year} • {tracks.length} canciones
            </p>
          </div>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
          <span className="text-sm font-semibold text-zinc-300">Estado: {album.disabled ? 'Bloqueado (Pronto)' : 'Público'}</span>
          <button
            onClick={async () => {
              const res = await fetch("/api/management/status", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ albumId: album.id, disabled: !album.disabled }),
              });
              if (res.ok) {
                onSaved();
              }
            }}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${album.disabled ? 'bg-zinc-700' : 'bg-emerald-500'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${album.disabled ? 'translate-x-1' : 'translate-x-6'}`} />
          </button>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {dirty ? "Tienes cambios sin guardar" : "Orden actual"}
        </p>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer ${dirty && !saving
            ? "bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.02] shadow-lg shadow-emerald-500/25"
            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Guardado" : "Guardar orden"}
        </button>
      </div>

      {/* Encabezado de tabla */}
      <div className="grid grid-cols-[auto_2rem_1fr_auto_auto] items-center gap-4 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-900">
        <span className="w-5" />
        <span className="text-center">#</span>
        <span>Título</span>
        <span className="text-right min-w-[120px]">Reproducciones</span>
        <span className="text-right w-16">Me gusta</span>
      </div>

      {/* Lista arrastrable */}
      <div className="space-y-1">
        {tracks.map((track, index) => {
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
          return (
            <div
              key={track.id}
              draggable
              onDragStart={() => {
                setDragIndex(index);
                setSaved(false);
              }}
              onDragEnter={() => setOverIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`grid grid-cols-[auto_2rem_1fr_auto_auto] items-center gap-4 px-3 py-2.5 rounded-lg border transition-all ${isDragging
                ? "opacity-40 border-emerald-500/50 bg-zinc-900"
                : isOver
                  ? "border-emerald-500 bg-zinc-900/80"
                  : "border-transparent hover:bg-zinc-900/40"
                }`}
            >
              {/* Manija de arrastre */}
              <button
                className="text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing touch-none"
                title="Arrastra para reordenar"
                aria-label="Reordenar"
              >
                <GripVertical className="w-5 h-5" />
              </button>

              {/* Índice */}
              <span className="text-center text-sm font-semibold text-zinc-500">{index + 1}</span>

              {/* Título + carátula */}
              <div className="flex items-center gap-3 min-w-0">
                {track.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.coverImage.replace('/brand/', '/cd/')} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded bg-zinc-800 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-white truncate">{track.title}</span>
                  <span className="block text-xs text-zinc-500 truncate">
                    {track.artist} • {formatTime(track.duration)}
                  </span>
                </div>
              </div>

              {/* Reproducciones con barra proporcional */}
              <div className="flex items-center gap-3 justify-end min-w-[120px]">
                <div className="hidden sm:block flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500/80 rounded-full"
                    style={{ width: `${(track.plays / maxPlays) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-sm font-mono text-zinc-300 tabular-nums shrink-0">
                  <Play className="w-3 h-3 text-emerald-400 fill-current" />
                  {track.plays.toLocaleString("es")}
                </div>
              </div>

              {/* Likes */}
              <div className="flex items-center justify-end gap-1.5 text-sm font-mono text-zinc-300 tabular-nums w-16">
                <HandIcon className="w-3.5 h-3.5 text-yellow-500" />
                {track.likes.toLocaleString("es")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
