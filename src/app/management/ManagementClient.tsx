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
  ChevronUp,
  ChevronDown,
  ImagePlus,
  Trash2,
  FileText,
  Disc3,
  ArrowRight,
  Plus,
  Settings,
  Store,
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
  const [localAlbums, setLocalAlbums] = useState<AlbumWithStats[]>(albums);
  const [selectedId, setSelectedId] = useState<string>(albums[0]?.id ?? "");
  const [movingTrack, setMovingTrack] = useState(false);
  const [reorderingAlbums, setReorderingAlbums] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [draggedAlbumIndex, setDraggedAlbumIndex] = useState<number | null>(null);
  const [overAlbumIndex, setOverAlbumIndex] = useState<number | null>(null);

  const dragItemIndex = useRef<number | null>(null);
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  // Pestañas (Catálogo vs Marketplace)
  const [activeTab, setActiveTab] = useState<"catalog" | "marketplace">("catalog");
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [loadingMarketplace, setLoadingMarketplace] = useState(false);

  const loadMarketplace = useCallback(async () => {
    setLoadingMarketplace(true);
    try {
      const res = await fetch("/api/management/marketplace", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMarketplaceProducts(data.products || []);
      }
    } catch (err) {
      console.error("Error al cargar productos de la tienda:", err);
    } finally {
      setLoadingMarketplace(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "marketplace") {
      loadMarketplace();
    }
  }, [activeTab, loadMarketplace]);

  useEffect(() => {
    setLocalAlbums(albums);
  }, [albums]);

  const selected = localAlbums.find((a) => a.id === selectedId) ?? localAlbums[0];

  const logout = async () => {
    await fetch("/api/management/logout", { method: "POST" });
    location.reload();
  };

  const totalPlays = localAlbums
    .flatMap((a) => a.tracks)
    .reduce((sum, t) => sum + t.plays, 0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createIntro, setCreateIntro] = useState("");
  const [createDetails, setCreateDetails] = useState("");

  const handleCreateAlbumSubmit = async () => {
    if (!createTitle.trim() || creatingAlbum) return;
    setCreatingAlbum(true);
    try {
      const res = await fetch("/api/management/create-album", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle.trim(),
          aboutIntro: createIntro.trim() || undefined,
          aboutDetails: createDetails.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await onReload();
        if (data.albumId) {
          setSelectedId(data.albumId);
        }
        setShowCreateDrawer(false);
        setCreateTitle("");
        setCreateIntro("");
        setCreateDetails("");
        showToast("Disco creado correctamente");
      }
    } catch (err) {
      console.error("Error al crear disco:", err);
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handleAlbumDeleted = async (albumId: string) => {
    const remaining = albums.filter((a) => a.id !== albumId);
    setSelectedId(remaining[0]?.id ?? "");
    await onReload();
    showToast("Disco eliminado correctamente");
  };

  const moveAlbum = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localAlbums.length) return;

    const updated = [...localAlbums];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setLocalAlbums(updated);

    setReorderingAlbums(true);
    try {
      const res = await fetch("/api/management/order-albums", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumIds: updated.map((a) => a.id) }),
      });
      if (res.ok) {
        onReload();
        showToast("Orden de discos actualizado correctamente");
      }
    } catch (err) {
      console.error("Error al reordenar discos:", err);
    } finally {
      setReorderingAlbums(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number, albumId: string) => {
    dragItemIndex.current = index;
    setDraggedAlbumIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", albumId);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "album", albumId, index })
    );
  };

  const handleDragOver = (e: React.DragEvent, index: number, albumId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (dragItemIndex.current !== null) {
      if (dragItemIndex.current !== index) {
        setOverAlbumIndex(index);
      }
    } else {
      setDropTargetId(albumId);
    }
  };

  const handleDragEnd = () => {
    dragItemIndex.current = null;
    setDraggedAlbumIndex(null);
    setOverAlbumIndex(null);
    setDropTargetId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number, targetAlbum: AlbumWithStats) => {
    e.preventDefault();
    const srcIndex = dragItemIndex.current;
    handleDragEnd();

    let data: any = null;
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw) data = JSON.parse(raw);
    } catch {}

    const isAlbumDrag = (data && data.type === "album") || srcIndex !== null;

    if (isAlbumDrag) {
      const fromIndex = srcIndex ?? (data?.index ?? localAlbums.findIndex((a) => a.id === data?.albumId));
      if (fromIndex !== null && fromIndex !== -1 && fromIndex !== targetIndex) {
        const updated = [...localAlbums];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(targetIndex, 0, moved);

        // Actualización optimista inmediata en UI
        setLocalAlbums(updated);

        setReorderingAlbums(true);
        try {
          const res = await fetch("/api/management/order-albums", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ albumIds: updated.map((a) => a.id) }),
          });
          if (res.ok) {
            onReload();
            showToast("Orden de discos actualizado correctamente");
          }
        } catch (err) {
          console.error("Error al reordenar discos:", err);
        } finally {
          setReorderingAlbums(false);
        }
      }
      return;
    }

    if (data && data.trackId && data.sourceAlbumId && data.sourceAlbumId !== targetAlbum.id) {
      setMovingTrack(true);
      setDropTargetId(targetAlbum.id);
      try {
        const res = await fetch("/api/management/move", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackId: data.trackId, targetAlbumId: targetAlbum.id }),
        });
        if (res.ok) {
          onReload();
        }
      } finally {
        setMovingTrack(false);
        setDropTargetId(null);
      }
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex">
      {/* Sidebar de álbumes: alto fijo de la pantalla, con scroll interno */}
      <aside className="w-64 lg:w-72 shrink-0 h-full border-r border-zinc-900 bg-zinc-950 flex flex-col">
        <div className="p-4 md:p-5 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/conexionlogo.svg" alt="Conexión" className="h-6 w-auto" />
            <span className="text-[10px] text-zinc-500 font-semibold ml-auto uppercase tracking-widest">
              Manager
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {/* Selector de Pestañas Globales */}
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "catalog" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-900/40 hover:text-white"
              }`}
            >
              <Music className="w-4 h-4 text-emerald-400" />
              Catálogo de Música
            </button>
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "marketplace" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:bg-zinc-900/40 hover:text-white"
              }`}
            >
              <Store className="w-4 h-4 text-[#FFC400]" />
              Marketplace
            </button>
          </div>

          {activeTab === "catalog" ? (
            <div className="space-y-1 pt-3 border-t border-zinc-900/80">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                  Discos
                </p>
                <span className="text-[10px] text-zinc-500 font-medium hidden lg:inline">
                  Reordenar
                </span>
              </div>

              {localAlbums.map((album, index) => {
                const active = album.id === selectedId;
                const isDropTarget = dropTargetId === album.id;
                const isAlbumDragging = draggedAlbumIndex === index;
                const isAlbumOver = overAlbumIndex === index && draggedAlbumIndex !== null && draggedAlbumIndex !== index;

                return (
                  <div
                    key={album.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index, album.id)}
                    onDragOver={(e) => handleDragOver(e, index, album.id)}
                    onDragLeave={() => {
                      if (dragItemIndex.current === null) {
                        setDropTargetId(null);
                      }
                    }}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index, album)}
                    className={`group relative flex items-center gap-1.5 w-full px-2 py-2 rounded-lg transition-all border ${
                      isAlbumDragging
                        ? "opacity-30 border-dashed border-emerald-500/60 bg-zinc-900"
                        : isAlbumOver
                        ? "border-emerald-500 bg-emerald-950/60 text-white scale-[1.02] shadow-lg shadow-emerald-950/50"
                        : isDropTarget
                        ? "bg-emerald-900/40 border-emerald-500/50 text-white"
                        : active
                        ? "bg-zinc-900 border-zinc-800 text-white"
                        : "border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                    }`}
                  >
                    {/* Grab handle icon */}
                    <div
                      className="cursor-grab active:cursor-grabbing text-zinc-600 group-hover:text-zinc-300 p-0.5 shrink-0 transition-colors select-none"
                      title="Arrastra para reordenar disco"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div
                      onClick={() => setSelectedId(album.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer select-none"
                    >
                      {(movingTrack && isDropTarget) || (reorderingAlbums && isAlbumOver) ? (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
                          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        </div>
                      ) : null}

                      {album.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={album.coverImage.replace('/brand/', '/cd/')}
                          alt=""
                          className="w-9 h-9 rounded object-cover shrink-0 pointer-events-none"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-zinc-800 shrink-0 pointer-events-none" />
                      )}
                      <div className="min-w-0 flex-1 pointer-events-none">
                        <span className="block text-sm font-semibold truncate">{album.title}</span>
                        <span className="block text-xs text-zinc-500 truncate">
                          {album.tracks.length} canciones
                        </span>
                      </div>
                      {album.disabled && (
                        <span className="text-[9px] font-bold uppercase text-emerald-400/80 pointer-events-none shrink-0">
                          Pronto
                        </span>
                      )}
                    </div>

                    {/* Controles rápidos arriba / abajo */}
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveAlbum(index, "up");
                        }}
                        disabled={index === 0}
                        className="p-0.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Mover arriba"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveAlbum(index, "down");
                        }}
                        disabled={index === localAlbums.length - 1}
                        className="p-0.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Mover abajo"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Botón Crear Disco */}
              <button
                type="button"
                onClick={() => {
                  setCreateTitle("");
                  setCreateIntro("");
                  setCreateDetails("");
                  setShowCreateDrawer(true);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 mt-2 rounded-lg border border-dashed border-zinc-700 text-zinc-400 hover:border-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-950/30 transition-all cursor-pointer group/create"
              >
                <div className="w-9 h-9 rounded bg-zinc-800 border border-dashed border-zinc-600 group-hover/create:border-emerald-500/50 flex items-center justify-center shrink-0 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold">Crear disco</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1 pt-3 border-t border-zinc-900/80">
              <div className="px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                  Artículos
                </p>
                <span className="block text-xs text-zinc-500 mt-2 font-medium">
                  {marketplaceProducts.length} productos en tienda
                </span>
              </div>
            </div>
          )}
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
      <main className="flex-1 overflow-y-auto bg-zinc-950 custom-scrollbar">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
          {activeTab === "catalog" ? (
            <>
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
                  allAlbums={albums}
                  onSaved={onReload}
                  onDeleted={handleAlbumDeleted}
                />
              )}
            </>
          ) : (
            <MarketplaceEditor
              products={marketplaceProducts}
              onReload={loadMarketplace}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      {/* Toast de notificación */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900/95 border border-emerald-500/50 text-white px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-500 hover:text-white ml-2 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drawer para Crear Disco con Intro y Descripción */}
      {showCreateDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setShowCreateDrawer(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">

              <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Crear Nuevo Disco</h3>
                    <p className="text-xs text-zinc-400">Agrega un nuevo álbum a la discografía de Conexión</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateDrawer(false)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Título del Disco *
                  </label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="Ej. Blackout"
                    autoFocus
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Intro del Disco
                  </label>
                  <p className="text-xs text-zinc-500">
                    Texto corto introductorio para la sección &quot;Sobre Conexión&quot;.
                  </p>
                  <textarea
                    rows={4}
                    value={createIntro}
                    onChange={(e) => setCreateIntro(e.target.value)}
                    placeholder="El origen de todas las heridas..."
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Descripción Detallada
                  </label>
                  <p className="text-xs text-zinc-500">
                    Texto explicativo extenso desplegable en &quot;Sobre Conexión&quot;.
                  </p>
                  <textarea
                    rows={8}
                    value={createDetails}
                    onChange={(e) => setCreateDetails(e.target.value)}
                    placeholder="Cero representa el origen del universo de Conexión..."
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-zinc-900 bg-zinc-950 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateDrawer(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateAlbumSubmit}
                  disabled={creatingAlbum || !createTitle.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-full transition-all cursor-pointer shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  {creatingAlbum ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Crear disco</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* EDITOR DE MARKETPLACE                                                     */
/* ========================================================================= */
interface MarketplaceEditorProps {
  products: any[];
  onReload: () => void;
  showToast: (msg: string) => void;
}

function MarketplaceEditor({ products, onReload, showToast }: MarketplaceEditorProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Música");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageStorageId, setImageStorageId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = ["Música", "Ropa", "Pósteres", "Accesorios"];

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const urlRes = await fetch("/api/management/image-upload-url", { method: "POST" });
      if (!urlRes.ok) return;
      const { uploadUrl } = await urlRes.json();

      const upRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!upRes.ok) return;
      const { storageId } = await upRes.json();

      setImageStorageId(storageId);
      // Create local URL for preview
      setImagePreview(URL.createObjectURL(file));
    } catch (err) {
      console.error("Error al subir imagen:", err);
      showToast("Error al subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category || !price || saving) return;
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      showToast("Precio inválido");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/management/create-marketplace-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          price: parsedPrice,
          description: description.trim() || undefined,
          imageStorageId: imageStorageId || undefined,
        }),
      });

      if (res.ok) {
        showToast("Producto agregado correctamente");
        setName("");
        setPrice("");
        setDescription("");
        setImageStorageId(null);
        setImagePreview(null);
        setShowDrawer(false);
        onReload();
      } else {
        const data = await res.json();
        showToast(data.error || "Error al agregar producto");
      }
    } catch (err) {
      console.error("Error al guardar producto:", err);
      showToast("Error al conectar con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/management/delete-marketplace-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        showToast("Producto eliminado");
        onReload();
      } else {
        showToast("Error al eliminar producto");
      }
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      showToast("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header local */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Gestión de Marketplace</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Administra los productos de merchandising oficial y copias físicas de conexión.
          </p>
        </div>
        
        <button
          onClick={() => {
            setName("");
            setCategory("Música");
            setPrice("");
            setDescription("");
            setImageStorageId(null);
            setImagePreview(null);
            setShowDrawer(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FFC400] hover:bg-[#FFD54F] text-black font-bold text-xs rounded-full transition-all cursor-pointer shadow-lg shadow-[#FFC400]/15"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Artículo</span>
        </button>
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col group relative"
          >
            {/* Botón Eliminar en Hover */}
            <button
              onClick={() => handleDeleteProduct(product.id)}
              disabled={deletingId === product.id}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-red-500/25 border border-zinc-800 text-zinc-400 hover:text-red-400 rounded-full transition-colors z-20 cursor-pointer disabled:opacity-50"
              title="Eliminar producto"
            >
              {deletingId === product.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>

            {/* Img de preview */}
            <div className="w-full aspect-square bg-zinc-950 flex items-center justify-center relative border-b border-zinc-900">
              {product.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={product.image.startsWith("bg-") || product.image === "cero" || product.image === "doble-cero" || product.image === "geminis" || product.image === "vertical" ? "/cd/cover_cover_conexion.png" : product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-12 h-12 text-zinc-800" />
              )}
            </div>

            {/* Detalles */}
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{product.category}</span>
                <h4 className="font-bold text-sm text-white truncate">{product.name}</h4>
                {product.description && (
                  <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{product.description}</p>
                )}
              </div>

              <div className="pt-1 mt-auto flex items-center justify-between border-t border-zinc-900/60">
                <span className="text-sm font-black text-white font-mono">
                  ${product.price.toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="col-span-full py-16 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
            No hay productos en el catálogo del Marketplace. ¡Crea el primero!
          </div>
        )}
      </div>

      {/* Drawer Formulario de Creación */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => !saving && !uploadingImage && setShowDrawer(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              
              <form onSubmit={handleCreateProductSubmit} className="flex flex-col h-full justify-between">
                
                {/* Header Drawer */}
                <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Agregar Producto</h3>
                      <p className="text-xs text-zinc-400">Añade un nuevo artículo al Marketplace</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDrawer(false)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                  
                  {/* Name field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Vinilo 'Vertical' Edición Colección"
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#FFC400] rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Category select */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Categoría *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#FFC400] rounded-xl p-3.5 text-sm text-white focus:outline-none transition-colors cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Precio (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        required
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#FFC400] rounded-xl pl-8 pr-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  {/* Image field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Imagen del Producto
                    </label>
                    
                    <div className="flex gap-4 items-center">
                      <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                        {imagePreview ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6 text-zinc-700" />
                        )}
                      </div>

                      <label className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer">
                        {uploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>{uploadingImage ? "Subiendo..." : "Subir Foto"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Description field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Descripción (Opcional)
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Breve descripción del producto para la tienda pública..."
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#FFC400] rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors leading-relaxed"
                    />
                  </div>

                </div>

                {/* Footer buttons */}
                <div className="p-6 border-t border-zinc-900 bg-zinc-950 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={saving || uploadingImage}
                    onClick={() => setShowDrawer(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingImage || !name.trim() || !price}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FFC400] hover:bg-[#FFD54F] text-black font-bold text-xs rounded-full transition-all cursor-pointer shadow-lg shadow-[#FFC400]/25 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Guardar Producto</span>
                  </button>
                </div>

              </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* EDITOR DE ÁLBUM (drag & drop)                                             */
/* ========================================================================= */
function AlbumEditor({
  album,
  allAlbums,
  onSaved,
  onDeleted,
}: {
  album: AlbumWithStats;
  allAlbums: AlbumWithStats[];
  onSaved: () => void;
  onDeleted?: (albumId: string) => void;
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

  // Drawer de Sobre Conexión (intro y descripción del álbum)
  const [aboutDrawerOpen, setAboutDrawerOpen] = useState(false);
  const [aboutIntroInput, setAboutIntroInput] = useState(album.aboutIntro ?? "");
  const [aboutDetailsInput, setAboutDetailsInput] = useState(album.aboutDetails ?? "");
  const [savingAbout, setSavingAbout] = useState(false);

  useEffect(() => {
    setAboutIntroInput(album.aboutIntro ?? "");
    setAboutDetailsInput(album.aboutDetails ?? "");
  }, [album.aboutIntro, album.aboutDetails]);

  const handleSaveAbout = async () => {
    setSavingAbout(true);
    try {
      const res = await fetch("/api/management/album-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId: album.id,
          aboutIntro: aboutIntroInput.trim(),
          aboutDetails: aboutDetailsInput.trim(),
        }),
      });
      if (res.ok) {
        setAboutDrawerOpen(false);
        onSaved();
      } else {
        const errBody = await res.text();
        console.error("Error guardando about:", res.status, errBody);
      }
    } catch (err) {
      console.error("Error al guardar intro y descripción del álbum:", err);
    } finally {
      setSavingAbout(false);
    }
  };

  // Deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAlbum, setDeletingAlbum] = useState(false);

  const handleDeleteAlbum = async () => {
    if (deletingAlbum) return;
    setDeletingAlbum(true);
    try {
      const res = await fetch("/api/management/delete-album", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: album.id }),
      });
      if (res.ok) {
        setShowDeleteConfirm(false);
        if (onDeleted) onDeleted(album.id);
      } else {
        console.error("Error al eliminar disco");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingAlbum(false);
    }
  };

  // Habilitar/deshabilitar canción (switch por fila)
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const toggleTrack = async (track: TrackWithStats) => {
    if (togglingId !== null) return;
    setTogglingId(track.id);
    const res = await fetch("/api/management/track-status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId: track.id, disabled: !track.disabled }),
    });
    if (res.ok) {
      // Actualizar el estado local (la key del editor no cambia con este toggle)
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, disabled: !track.disabled } : t))
      );
      onSaved();
    }
    setTogglingId(null);
  };

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

  // Album cover upload & rename state
  const albumCoverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAlbumCover, setUploadingAlbumCover] = useState(false);
  const [editingAlbumTitle, setEditingAlbumTitle] = useState(false);
  const [albumTitleInput, setAlbumTitleInput] = useState(album.title);
  const [savingAlbumTitle, setSavingAlbumTitle] = useState(false);
  const [editingAlbumYear, setEditingAlbumYear] = useState(false);
  const [albumYearInput, setAlbumYearInput] = useState(album.year);
  const [savingAlbumYear, setSavingAlbumYear] = useState(false);

  const handleSaveAlbumTitle = async () => {
    const cleanTitle = albumTitleInput.trim();
    if (!cleanTitle || savingAlbumTitle) return;
    if (cleanTitle === album.title) {
      setEditingAlbumTitle(false);
      return;
    }
    setSavingAlbumTitle(true);
    try {
      const res = await fetch("/api/management/album-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: album.id, title: cleanTitle }),
      });
      if (res.ok) {
        setEditingAlbumTitle(false);
        onSaved();
      }
    } catch (err) {
      console.error("Error updating album title:", err);
    } finally {
      setSavingAlbumTitle(false);
    }
  };

  const handleSaveAlbumYear = async () => {
    const cleanYear = Number(albumYearInput);
    if (isNaN(cleanYear) || cleanYear < 1900 || cleanYear > 2100 || savingAlbumYear) return;
    if (cleanYear === album.year) {
      setEditingAlbumYear(false);
      return;
    }
    setSavingAlbumYear(true);
    try {
      const res = await fetch("/api/management/album-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: album.id, year: cleanYear }),
      });
      if (res.ok) {
        setEditingAlbumYear(false);
        onSaved();
      }
    } catch (err) {
      console.error("Error updating album year:", err);
    } finally {
      setSavingAlbumYear(false);
    }
  };

  const handleAlbumCoverChange = async (file: File) => {
    if (!file || uploadingAlbumCover) return;
    setUploadingAlbumCover(true);
    try {
      const urlRes = await fetch("/api/management/image-upload-url", { method: "POST" });
      if (!urlRes.ok) return;
      const { uploadUrl } = await urlRes.json();

      const upRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!upRes.ok) return;
      const { storageId } = await upRes.json();

      const res = await fetch("/api/management/album-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId: album.id, coverStorageId: storageId }),
      });
      if (res.ok) {
        onSaved();
      }
    } catch (err) {
      console.error("Error uploading album cover:", err);
    } finally {
      setUploadingAlbumCover(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
      {/* Cabecera del álbum */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-end gap-5 min-w-0 flex-1">
          {/* Carátula del álbum con hover para reemplazar */}
          <div className="relative group/cover shrink-0">
            <input
              ref={albumCoverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleAlbumCoverChange(e.target.files[0]);
                  e.target.value = "";
                }
              }}
            />
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
            <button
              onClick={() => albumCoverInputRef.current?.click()}
              disabled={uploadingAlbumCover}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1 text-white text-xs font-semibold cursor-pointer"
              title="Cambiar carátula del disco"
            >
              {uploadingAlbumCover ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              ) : (
                <>
                  <ImagePlus className="w-6 h-6" />
                  <span>Cambiar carátula</span>
                </>
              )}
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-xs uppercase tracking-widest font-bold text-zinc-500">Álbum</span>
            {editingAlbumTitle ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveAlbumTitle();
                }}
                className="flex items-center gap-2 mt-1"
              >
                <input
                  type="text"
                  value={albumTitleInput}
                  onChange={(e) => setAlbumTitleInput(e.target.value)}
                  autoFocus
                  className="bg-zinc-900 border border-emerald-500 text-white font-black text-xl md:text-3xl rounded-lg px-3 py-1 focus:outline-none w-full max-w-md"
                />
                <button
                  type="submit"
                  disabled={savingAlbumTitle || !albumTitleInput.trim()}
                  className="p-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg font-bold transition-colors cursor-pointer disabled:opacity-50"
                  title="Guardar título"
                >
                  {savingAlbumTitle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAlbumTitle(false);
                    setAlbumTitleInput(album.title);
                  }}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 group/title">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight truncate">
                  {album.title}
                </h2>
                <button
                  onClick={() => {
                    setAlbumTitleInput(album.title);
                    setEditingAlbumTitle(true);
                  }}
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Editar nombre del disco"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-zinc-400 text-sm mt-1 flex items-center gap-1.5 flex-wrap">
              <span>{album.artist}</span>
              <span>•</span>
              {editingAlbumYear ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveAlbumYear();
                  }}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={albumYearInput}
                    onChange={(e) => setAlbumYearInput(Number(e.target.value))}
                    autoFocus
                    className="bg-zinc-900 border border-emerald-500 text-white text-xs font-semibold rounded px-1.5 py-0.5 focus:outline-none w-16"
                  />
                  <button
                    type="submit"
                    disabled={savingAlbumYear || isNaN(Number(albumYearInput))}
                    className="p-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {savingAlbumYear ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAlbumYear(false);
                      setAlbumYearInput(album.year);
                    }}
                    className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <span className="inline-flex items-center gap-1 group/year">
                  <span>{album.year}</span>
                  <button
                    onClick={() => {
                      setAlbumYearInput(album.year);
                      setEditingAlbumYear(true);
                    }}
                    className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                    title="Editar año"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </span>
              )}
              <span>•</span>
              <span>{tracks.length} canciones</span>
            </p>
          </div>
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
            onClick={() => setAboutDrawerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:scale-[1.02]"
            title="Configurar disco"
          >
            <Settings className="w-4 h-4" />
            Configurar disco
          </button>
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
      <div className="grid grid-cols-[auto_2rem_1fr_auto_auto_auto_auto] items-center gap-2 md:gap-4 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-900">
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
        <span className="w-9 text-center">Estado</span>
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
              className={`group grid grid-cols-[auto_2rem_1fr_auto_auto_auto_auto] items-center gap-2 md:gap-4 px-3 py-2.5 rounded-lg border transition-all ${isDragging
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
              <div className={`flex items-center gap-2 md:gap-3 min-w-0 ${track.disabled ? "opacity-50" : ""}`}>
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
                        {track.disabled && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800 rounded px-1.5 py-0.5 shrink-0">
                            Oculta
                          </span>
                        )}
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

              {/* Switch habilitar/deshabilitar en el playlist público */}
              <div className="w-9 flex items-center justify-center">
                {togglingId === track.id ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : (
                  <button
                    onClick={() => toggleTrack(track)}
                    disabled={togglingId !== null}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 disabled:opacity-50 ${track.disabled ? "bg-zinc-700" : "bg-emerald-500"}`}
                    title={track.disabled ? "Oculta en el playlist — clic para habilitar" : "Visible en el playlist — clic para deshabilitar"}
                    aria-label={`${track.disabled ? "Habilitar" : "Deshabilitar"} ${track.title}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${track.disabled ? "translate-x-[3px]" : "translate-x-[19px]"}`} />
                  </button>
                )}
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
          albums={allAlbums}
          currentAlbumId={album.id}
          onClose={() => setDetailsTrack(null)}
          onUpdated={(trackId, patch) => {
            setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, ...patch } : t)));
            onSaved();
          }}
          onMoved={() => {
            setDetailsTrack(null);
            onSaved();
          }}
          onDeleted={(trackId) => {
            setTracks((prev) => prev.filter((t) => t.id !== trackId));
            setDetailsTrack(null);
            onSaved();
          }}
        />
      )}


      {/* Modal de confirmación para eliminar disco */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            onClick={() => !deletingAlbum && setShowDeleteConfirm(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          />
          <div className="relative w-full max-w-md bg-zinc-900/90 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-md transition-all animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle className="w-8 h-8 shrink-0" />
              <h3 className="text-xl font-black text-white">¿Eliminar este disco?</h3>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Esta acción es irreversible. Se eliminará el disco <strong className="text-white">"{album.title}"</strong> junto con todas sus <strong className="text-white">{tracks.length} canciones</strong> y sus respectivas reproducciones e interacciones.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingAlbum}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 rounded-full font-bold text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingAlbum}
                onClick={handleDeleteAlbum}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
              >
                {deletingAlbum ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar disco</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer de Sobre Conexión (desliza de derecha a izquierda) */}
      {aboutDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className="absolute inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setAboutDrawerOpen(false)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-lg bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">

                <div className="p-6 border-b border-zinc-900 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl text-zinc-400">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Configuración</h3>
                      <p className="text-xs text-zinc-400">Ajustes del disco <span className="text-emerald-400 font-semibold">{album.title}</span></p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAboutDrawerOpen(false)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                  
                  {/* Estado */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Estado del Disco</h4>
                      <p className="text-xs text-zinc-500">Los discos bloqueados no están disponibles al público.</p>
                    </div>
                    <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                      <span className="text-sm font-semibold text-zinc-300">
                        {album.disabled ? 'Bloqueado (Pronto)' : 'Público (Visible)'}
                      </span>
                      <button
                        onClick={async () => {
                          const res = await fetch("/api/management/status", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ albumId: album.id, disabled: !album.disabled }),
                          });
                          if (res.ok) onSaved();
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${album.disabled ? 'bg-zinc-700' : 'bg-emerald-500'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${album.disabled ? 'translate-x-1' : 'translate-x-6'}`} />
                      </button>
                    </div>
                  </div>

                  <hr className="border-zinc-900" />

                  {/* Carátula */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Carátula del Disco</h4>
                      <p className="text-xs text-zinc-500">Sube una nueva imagen para la portada del álbum.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {album.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={album.coverImage.replace('/brand/', '/cd/')} alt="" className="w-20 h-20 rounded-lg object-cover bg-zinc-900 shadow-md" />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-zinc-900 flex items-center justify-center">
                          <Disc3 className="w-8 h-8 text-zinc-700" />
                        </div>
                      )}
                      <button
                        onClick={() => albumCoverInputRef.current?.click()}
                        disabled={uploadingAlbumCover}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                      >
                        {uploadingAlbumCover ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Upload className="w-4 h-4" />}
                        {uploadingAlbumCover ? "Subiendo..." : "Cambiar carátula"}
                      </button>
                    </div>
                  </div>

                  <hr className="border-zinc-900" />

                  {/* Textos de About */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Textos &quot;Sobre Conexión&quot;</h4>
                      <p className="text-xs text-zinc-500">Configura la historia y detalles del álbum.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Intro del Disco</label>
                      <textarea
                        rows={3}
                        value={aboutIntroInput}
                        onChange={(e) => setAboutIntroInput(e.target.value)}
                        placeholder="El origen de todas las heridas..."
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors leading-relaxed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">Descripción Detallada</label>
                      <textarea
                        rows={6}
                        value={aboutDetailsInput}
                        onChange={(e) => setAboutDetailsInput(e.target.value)}
                        placeholder="Cero representa el origen del universo de Conexión..."
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors leading-relaxed"
                      />
                    </div>
                  </div>
                  
                  <hr className="border-zinc-900" />
                  
                  {/* Danger Zone */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-red-500 mb-1">Zona de Peligro</h4>
                      <p className="text-xs text-zinc-500">Esta acción no se puede deshacer.</p>
                    </div>
                    <button
                      onClick={() => {
                        setAboutDrawerOpen(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-red-950/20 border border-red-900/50 text-red-400 hover:bg-red-900/40 hover:text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar Disco
                    </button>
                  </div>
                  
                </div>

                <div className="p-6 border-t border-zinc-900 bg-zinc-950 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAboutDrawerOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAbout}
                    disabled={savingAbout}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-full transition-all cursor-pointer shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                  >
                    {savingAbout ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Guardar Textos</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ========================================================================= */
/* DRAWER DE DETALLES (imagen de fondo + letra)                              */
/* ========================================================================= */
function TrackDetailsDrawer({
  track,
  albums,
  currentAlbumId,
  onClose,
  onUpdated,
  onMoved,
  onDeleted,
}: {
  track: TrackWithStats;
  albums: AlbumWithStats[];
  currentAlbumId: string;
  onClose: () => void;
  onUpdated: (trackId: number, patch: { bgImage?: string; lyrics?: string }) => void;
  onMoved: () => void;
  onDeleted: (trackId: number) => void;
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

  // Mover a otro disco
  const [targetAlbumId, setTargetAlbumId] = useState("");
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const otherAlbums = albums.filter((a) => a.id !== currentAlbumId);

  const moveTrack = async () => {
    if (!targetAlbumId || moving) return;
    setMoving(true);
    setMoveError(null);
    try {
      const res = await fetch("/api/management/move", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id, targetAlbumId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMoveError(data.error || "No se pudo mover la canción");
        return;
      }
      onMoved();
    } catch {
      setMoveError("Error de red");
    } finally {
      setMoving(false);
    }
  };

  // Eliminar canción (Zona de Peligro)
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteTrack = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/management/delete-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "No se pudo eliminar la canción");
        return;
      }
      onDeleted(track.id);
    } catch {
      setDeleteError("Error de red");
    } finally {
      setDeleting(false);
    }
  };

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
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("La imagen supera los 8 MB.");
      return;
    }
    setError(null);
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
    try {
      // Si hay imagen nueva, subirla directo al storage de Convex (así no
      // pasa por el disco efímero de Vercel ni por su límite de body).
      let storageId: string | undefined;
      if (!removeImage && imageFile) {
        const urlRes = await fetch("/api/management/image-upload-url", { method: "POST" });
        if (!urlRes.ok) {
          setError("No se pudo iniciar la subida de la imagen");
          return;
        }
        const { uploadUrl } = await urlRes.json();
        const upRes = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        if (!upRes.ok) {
          setError("Error al subir la imagen");
          return;
        }
        const upData = await upRes.json();
        storageId = upData.storageId;
      }

      const res = await fetch("/api/management/track-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id, lyrics, storageId, removeImage }),
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

          {/* Mover a otro disco */}
          <div className="space-y-3 pt-5 border-t border-zinc-900">
            <div className="flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Mover a otro disco</span>
            </div>
            <p className="text-xs text-zinc-500">
              Envía esta canción a otro disco. El cambio se aplica de inmediato y la
              canción queda al final del disco destino.
            </p>
            <div className="flex items-center gap-2">
              <select
                value={targetAlbumId}
                disabled={moving || otherAlbums.length === 0}
                onChange={(e) => {
                  setTargetAlbumId(e.target.value);
                  setMoveError(null);
                }}
                className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecciona un disco…</option>
                {otherAlbums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                    {a.disabled ? " (Pronto)" : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={moveTrack}
                disabled={!targetAlbumId || moving}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm transition-all shrink-0 ${targetAlbumId && !moving
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  }`}
              >
                {moving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Mover
              </button>
            </div>
            {moveError && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {moveError}
              </div>
            )}
          </div>

          {/* Zona de Peligro */}
          <div className="space-y-3 pt-5 border-t border-zinc-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-red-500">Zona de Peligro</span>
            </div>
            <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-4 space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Eliminar permanentemente esta canción del disco. Esta acción es definitiva y eliminará los archivos de audio y las estadísticas.
              </p>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 hover:border-red-500 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar canción
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-red-400">
                    ¿Confirmas que deseas eliminar esta canción?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteTrack}
                      disabled={deleting}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      {deleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDelete(false);
                        setDeleteError(null);
                      }}
                      disabled={deleting}
                      className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {deleteError && (
                <div className="flex items-center gap-2 text-red-400 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {deleteError}
                </div>
              )}
            </div>
          </div>
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
