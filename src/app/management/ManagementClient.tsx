"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  GripVertical,
  Play,
  Lock,
  LogOut,
  Save,
  Check,
  Loader2,
  BarChart3,
  Heart,
  Upload,
  Music,
  X,
  CheckCircle2,
  AlertCircle,
  Pencil,
  ChevronRight,
  ImagePlus,
  Trash2,
  FileText,
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
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans overflow-hidden">
      {/* Fondo a pantalla completa: se escala centrado y sin deformarse */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/management/management.png"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
      />
      <div className="absolute inset-0 bg-black/60" />

      <form
        onSubmit={submit}
        className="relative w-full max-w-sm bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6"
      >
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/conexionlogo.svg" alt="Conexión" className="h-10 w-auto" />
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">
            Manager
          </span>
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
  const [movingTrack, setMovingTrack] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const selected = albums.find((a) => a.id === selectedId) ?? albums[0];

  const logout = async () => {
    await fetch("/api/management/logout", { method: "POST" });
    location.reload();
  };

  const totalPlays = albums
    .flatMap((a) => a.tracks)
    .reduce((sum, t) => sum + t.plays, 0);

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex">
      {/* Sidebar de álbumes: alto fijo de la pantalla, con scroll interno */}
      <aside className="w-64 lg:w-72 shrink-0 h-full border-r border-zinc-900 bg-zinc-950 flex flex-col">
        <div className="p-6 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/conexionlogo.svg" alt="Conexión" className="h-6 w-auto" />
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
            const isDropTarget = dropTargetId === album.id;
            return (
              <button
                key={album.id}
                onClick={() => setSelectedId(album.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTargetId(album.id);
                }}
                onDragLeave={() => setDropTargetId(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  try {
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                    if (data && data.trackId && data.sourceAlbumId && data.sourceAlbumId !== album.id) {
                      // Mantener dropTargetId durante el fetch para que el loader
                      // sea visible sobre el álbum destino.
                      setMovingTrack(true);
                      const res = await fetch("/api/management/move", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ trackId: data.trackId, targetAlbumId: album.id }),
                      });
                      if (res.ok) {
                        onReload();
                      }
                      setMovingTrack(false);
                    }
                  } catch {
                    // Ignorar datos de arrastre que no son JSON (p.ej. archivos)
                  } finally {
                    setDropTargetId(null);
                  }
                }}
                className={`relative flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  active ? "bg-zinc-900 text-white" : isDropTarget ? "bg-emerald-900/40 border border-emerald-500/50 text-white" : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                  }`}
              >
                {movingTrack && isDropTarget && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  </div>
                )}
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

          {/* La key incluye la membresía de pistas: al subir o mover una canción
              el editor se remonta con la lista fresca (el orden no remonta). */}
          {selected && (
            <AlbumEditor
              key={`${selected.id}:${selected.tracks.map((t) => t.id).sort((a, b) => a - b).join("-")}`}
              album={selected}
              onSaved={onReload}
            />
          )}
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

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<{ name: string; status: "pending" | "uploading" | "converting" | "done" | "error"; error?: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Rename state (edición inline del título)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Drawer de detalles (imagen de fondo + letra)
  const [detailsTrack, setDetailsTrack] = useState<TrackWithStats | null>(null);

  const startRename = (track: TrackWithStats) => {
    setEditingId(track.id);
    setEditValue(track.title);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveRename = async () => {
    const id = editingId;
    const title = editValue.trim();
    if (!id || !title || renaming) return;
    const original = tracks.find((t) => t.id === id)?.title;
    if (title === original) {
      cancelRename();
      return;
    }
    setRenaming(true);
    const res = await fetch("/api/management/rename", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId: id, title }),
    });
    setRenaming(false);
    if (res.ok) {
      // Actualizar el estado local (la key del editor no cambia con un rename)
      setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
      cancelRename();
      onSaved();
    }
  };

  const handleUpload = async (files: FileList) => {
    const queue = Array.from(files).map((f) => ({ name: f.name, status: "pending" as const }));
    setUploadQueue(queue);
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Mark as uploading
      setUploadQueue((prev) => prev.map((item, j) => j === i ? { ...item, status: "uploading" } : item));

      try {
        // Mark as converting (upload + conversion happen server-side)
        setUploadQueue((prev) => prev.map((item, j) => j === i ? { ...item, status: "converting" } : item));

        const formData = new FormData();
        formData.append("file", file);
        formData.append("albumId", album.id);

        const res = await fetch("/api/management/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          setUploadQueue((prev) => prev.map((item, j) => j === i ? { ...item, status: "done" } : item));
        } else {
          const data = await res.json().catch(() => ({ error: "Error desconocido" }));
          setUploadQueue((prev) => prev.map((item, j) => j === i ? { ...item, status: "error", error: data.error || "Error" } : item));
        }
      } catch (err) {
        setUploadQueue((prev) => prev.map((item, j) => j === i ? { ...item, status: "error", error: "Error de red" } : item));
      }
    }

    setIsUploading(false);
    onSaved(); // Reload catalog
  };

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
        <div className="flex items-center gap-2">
          {/* Botón subir canciones */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUpload(e.target.files);
                e.target.value = "";
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            Subir canciones
          </button>
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
      </div>

      {/* Panel de progreso de subida */}
      {uploadQueue.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              {isUploading ? (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-sm font-semibold text-white">
                {isUploading
                  ? `Subiendo ${uploadQueue.filter((q) => q.status === "done").length + 1} de ${uploadQueue.length}...`
                  : `${uploadQueue.filter((q) => q.status === "done").length} de ${uploadQueue.length} subidas completadas`}
              </span>
            </div>
            {!isUploading && (
              <button
                onClick={() => setUploadQueue([])}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="divide-y divide-zinc-800/50 max-h-48 overflow-y-auto">
            {uploadQueue.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="shrink-0">
                  {item.status === "pending" && <Music className="w-4 h-4 text-zinc-600" />}
                  {item.status === "uploading" && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                  {item.status === "converting" && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                  {item.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {item.status === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
                </div>
                <span className="text-sm text-zinc-300 truncate flex-1">{item.name}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  item.status === "pending" ? "text-zinc-600" :
                  item.status === "uploading" ? "text-blue-400" :
                  item.status === "converting" ? "text-amber-400" :
                  item.status === "done" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {item.status === "pending" && "En cola"}
                  {item.status === "uploading" && "Subiendo..."}
                  {item.status === "converting" && "Convirtiendo..."}
                  {item.status === "done" && "Lista"}
                  {item.status === "error" && (item.error || "Error")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encabezado de tabla */}
      <div className="grid grid-cols-[auto_2rem_1fr_auto_auto_auto] items-center gap-2 md:gap-4 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-900">
        <span className="w-5" />
        <span className="text-center">#</span>
        <span>Título</span>
        <span className="text-right">
          <span className="hidden md:inline">Reproducciones</span>
          <span className="md:hidden">Rep.</span>
        </span>
        <span className="text-right w-12 md:w-16">
          <span className="hidden md:inline">Me gusta</span>
          <HandIcon className="w-3.5 h-3.5 inline md:hidden" />
        </span>
        <span className="w-7" />
      </div>

      {/* Lista arrastrable */}
      <div className="space-y-1">
        {tracks.map((track, index) => {
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
          return (
            <div
              key={track.id}
              draggable={editingId === null}
              onDragStart={(e) => {
                setDragIndex(index);
                setSaved(false);
                e.dataTransfer.setData('application/json', JSON.stringify({ trackId: track.id, sourceAlbumId: album.id }));
              }}
              onDragEnter={() => setOverIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`group grid grid-cols-[auto_2rem_1fr_auto_auto_auto] items-center gap-2 md:gap-4 px-3 py-2.5 rounded-lg border transition-all ${isDragging
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
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                {track.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.coverImage.replace('/brand/', '/cd/')} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded bg-zinc-800 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  {editingId === track.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveRename();
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        autoFocus
                        value={editValue}
                        maxLength={120}
                        disabled={renaming}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelRename();
                        }}
                        className="flex-1 min-w-0 bg-zinc-950 border border-emerald-500/60 text-white text-sm font-semibold rounded px-2 py-1 focus:outline-none focus:border-emerald-400"
                      />
                      <button
                        type="submit"
                        disabled={renaming || !editValue.trim()}
                        className="p-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 cursor-pointer shrink-0"
                        title="Guardar nombre"
                      >
                        {renaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={cancelRename}
                        disabled={renaming}
                        className="p-1 text-zinc-500 hover:text-white cursor-pointer shrink-0"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-white truncate">{track.title}</span>
                        <button
                          onClick={() => startRename(track)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-emerald-400 transition-all cursor-pointer shrink-0"
                          title="Renombrar canción"
                          aria-label={`Renombrar ${track.title}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </span>
                      <span className="block text-xs text-zinc-500 truncate">
                        {track.artist} • {formatTime(track.duration)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Reproducciones con barra proporcional (la barra solo en md+) */}
              <div className="flex items-center gap-3 justify-end">
                <div className="hidden md:block w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
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
              <div className="flex items-center justify-end gap-1.5 text-sm font-mono text-zinc-300 tabular-nums w-12 md:w-16">
                <HandIcon className="w-3.5 h-3.5 text-yellow-500" />
                {track.likes.toLocaleString("es")}
              </div>

              {/* Abrir detalles (imagen de fondo + letra) */}
              <button
                onClick={() => setDetailsTrack(track)}
                className="p-1 rounded text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800/80 transition-colors cursor-pointer w-7 flex items-center justify-center"
                title="Imagen y letra de la canción"
                aria-label={`Detalles de ${track.title}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Drawer de detalles */}
      {detailsTrack && (
        <TrackDetailsDrawer
          track={detailsTrack}
          onClose={() => setDetailsTrack(null)}
          onUpdated={(trackId, patch) => {
            setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, ...patch } : t)));
            onSaved();
          }}
        />
      )}
    </div>
  );
}

/* ========================================================================= */
/* DRAWER DE DETALLES (imagen de fondo + letra)                              */
/* ========================================================================= */
function TrackDetailsDrawer({
  track,
  onClose,
  onUpdated,
}: {
  track: TrackWithStats;
  onClose: () => void;
  onUpdated: (trackId: number, patch: { bgImage?: string; lyrics?: string }) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [lyrics, setLyrics] = useState(track.lyrics ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Animación de entrada (de izquierda a derecha) tras el montaje.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Cerrar con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // Liberar la URL de la vista previa al cambiarla o desmontar.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const pickImage = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
    setSaved(false);
  };

  const currentImage = removeImage ? null : imagePreview ?? track.bgImage ?? null;
  const dirty = imageFile !== null || removeImage || lyrics !== (track.lyrics ?? "");

  const save = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    setError(null);
    const formData = new FormData();
    formData.append("trackId", String(track.id));
    formData.append("lyrics", lyrics);
    if (removeImage) {
      formData.append("removeImage", "1");
    } else if (imageFile) {
      formData.append("image", imageFile);
    }
    try {
      const res = await fetch("/api/management/track-details", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }
      const patch: { bgImage?: string; lyrics?: string } = { lyrics: lyrics.trim() };
      if (removeImage) patch.bgImage = undefined;
      else if (data.bgImage) patch.bgImage = data.bgImage;
      onUpdated(track.id, patch);
      setImageFile(null);
      setRemoveImage(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Error de red");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      />

      {/* Panel (entra desde la izquierda hacia la derecha) */}
      <div
        className={`absolute left-0 top-0 h-full w-full max-w-md bg-zinc-950 border-r border-zinc-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${visible ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              Detalles de la canción
            </p>
            <h3 className="text-lg font-black text-white truncate">{track.title}</h3>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Imagen de fondo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImagePlus className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Imagen de fondo</span>
            </div>
            <p className="text-xs text-zinc-500">
              Se muestra como fondo al abrir la canción. Si no hay imagen, se usa la
              carátula del disco.
            </p>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) pickImage(file);
                e.target.value = "";
              }}
            />

            {currentImage ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 group/img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentImage} alt="" className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 text-black text-xs font-bold hover:bg-white transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Cambiar
                  </button>
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setRemoveImage(track.bgImage != null);
                      setSaved(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs font-bold hover:bg-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full h-44 rounded-xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/40 transition-colors flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs font-semibold">Subir imagen (JPG, PNG o WebP)</span>
              </button>
            )}
          </div>

          {/* Letra */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Letra de la canción</span>
            </div>
            <textarea
              value={lyrics}
              onChange={(e) => {
                setLyrics(e.target.value);
                setSaved(false);
              }}
              placeholder={"Escribe o pega la letra aquí...\n\n[Coro]\n..."}
              rows={12}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-emerald-500 transition-colors resize-y font-sans"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-900 shrink-0">
          <button
            onClick={save}
            disabled={!dirty || saving}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all cursor-pointer ${dirty && !saving
              ? "bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-[1.01] shadow-lg shadow-emerald-500/25"
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
            {saved ? "Guardado" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
