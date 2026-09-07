"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSecureAudio } from "@/hooks/useSecureAudio";
import AppleCoverFlow from "./AppleCoverFlow";
import AltHomeView from "./AltHomeView";
import LibrarySidebar from "./LibrarySidebar";
import type { Album, Track, AlbumWithStats, TrackWithStats, CarouselSlide } from "@/lib/catalog-types";
import {
  Home as HomeIcon,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ArrowLeft,
  Heart,
  Shuffle,
  ChevronRight,
  MoreVertical,
  Music,
  Disc3,
  Info,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Store,
  Globe,
  Hourglass
} from "lucide-react";

// Legacy home stays in the project; only a code change can enable it.
const USE_CLASSIC_HOME = false;

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Carrusel del fondo por defecto del home: rota estas imágenes cada
// SLIDE_INTERVAL_MS y se pausa mientras un disco está en hover o abierto.
const SLIDES = [
  '/brand/slides/bg-conexion-slider-1.png',
  '/brand/slides/bg-conexion-slider-2.png',
  '/brand/slides/bg-conexion-slider-3.png',
];
const SLIDE_INTERVAL_MS = 6000;

interface MarketplaceProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
}

const MARKETPLACE_CATEGORIES = ["Todos", "Música", "Ropa", "Pósteres", "Accesorios"];

const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: "prod-vinyl-cero",
    name: "Vinilo 'Cero' (Edición Especial)",
    category: "Música",
    price: 34.99,
    image: "cero",
    description: "Vinilo de 180 gramos color negro translúcido. Incluye libreto con letras ilustradas."
  },
  {
    id: "prod-cd-doblecero",
    name: "CD 'Doble Cero' (Digipack)",
    category: "Música",
    price: 14.99,
    image: "doble-cero",
    description: "Formato CD de tres paneles con libreto exclusivo de 16 páginas."
  },
  {
    id: "prod-vinyl-geminis",
    name: "Vinilo 'Géminis' (Doble Color)",
    category: "Música",
    price: 38.99,
    image: "geminis",
    description: "Edición coleccionista en doble vinilo color verde y negro marmoleado."
  },
  {
    id: "prod-tshirt-cero",
    name: "Camiseta 'Cero' Grunge",
    category: "Ropa",
    price: 24.99,
    image: "bg-gradient-to-br from-zinc-900 via-zinc-800 to-emerald-950",
    description: "Camiseta 100% algodón lavado tipo vintage con el logotipo del disco Cero en el pecho."
  },
  {
    id: "prod-hoodie-logo",
    name: "Sudadera Oversize Logo",
    category: "Ropa",
    price: 49.99,
    image: "bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-850",
    description: "Sudadera con capucha ultra cómoda de alto gramaje con bordado de la banda."
  },
  {
    id: "prod-poster-cero",
    name: "Póster Serigrafiado 'Cero'",
    category: "Pósteres",
    price: 19.99,
    image: "bg-gradient-to-br from-zinc-950 to-emerald-900/60",
    description: "Póster de 50x70 cm impreso a mano en papel de alta calidad. Numerado y firmado."
  },
  {
    id: "prod-tote-bag",
    name: "Tote Bag Conexión",
    category: "Accesorios",
    price: 12.99,
    image: "bg-gradient-to-br from-zinc-900 to-zinc-950",
    description: "Bolsa de tela de algodón orgánico negro con asas reforzadas."
  },
  {
    id: "prod-vinyl-vertical",
    name: "Vinilo 'Vertical'",
    category: "Música",
    price: 32.99,
    image: "vertical",
    description: "Edición estándar en vinilo negro de 140g del último lanzamiento."
  }
];

const BACKGROUNDS = [
  ...SLIDES,
  '/cd/bg-conexion-cover.png',
  '/cd/bg-conexio-cero.png',
  '/cd/bg-conexion-doblecero.png',
  '/cd/bg-conexion-geminis.png',
  '/cd/bg-conexion-vertical.png'
]; const ALBUM_ABOUT_TEXTS: Record<string, { title: string; intro: string; details: string }> = {
  "cero": {
    title: "Cero — conexión",
    intro: "El origen de todas las heridas. Un viaje hacia la infancia, la frustración y los recuerdos que marcaron el comienzo de una historia imposible de olvidar.",
    details: "Cero representa el origen del universo de Conexión. Es el álbum donde nacen las fracturas emocionales que acompañarán al personaje durante toda la discografía. Sus canciones exploran la infancia, la frustración, la pérdida de la inocencia, la rabia contenida y la memoria emocional como elementos que moldean la identidad. Musicalmente se mueve entre guitarras densas, voces desgastadas y una estética grunge cruda, donde la imperfección es parte del mensaje. No busca ofrecer respuestas ni sanar el pasado; busca mirarlo de frente, comprender que existió y aceptar que algunas heridas nunca desaparecen, solo aprenden a convivir con nosotros."
  },
  "doble-cero": {
    title: "Doble Cero — conexión",
    intro: "Las heridas crecieron con el tiempo. El peso de la adultez transforma el dolor en una presencia permanente.",
    details: "Doble Cero continúa la historia iniciada en Cero, trasladando el conflicto hacia una etapa más adulta y consciente. El dolor deja de ser un descubrimiento para convertirse en compañía permanente. Las canciones hablan del desgaste emocional, de la repetición de los mismos ciclos, de las responsabilidades, del cansancio psicológico y de la sensación de cargar con un pasado que nunca terminó de irse. Musicalmente el álbum mantiene la esencia grunge de la banda, pero incorpora composiciones más complejas, letras más introspectivas y una producción que refleja una oscuridad más profunda y madura. Es la misma caída, observada desde una perspectiva completamente distinta."
  },
  "geminis": {
    title: "Géminis — conexión",
    intro: "El despertar de la conciencia y del músico. Un universo donde la dualidad, los sueños y la rebeldía revelan una nueva identidad.",
    details: "Géminis representa el despertar creativo y espiritual de Conexión. Es un disco donde la realidad y lo intangible conviven permanentemente, explorando conceptos como la dualidad, los sueños, la conciencia, los símbolos y las revelaciones personales. Sin embargo, detrás de su atmósfera onírica también existe un acto de rebeldía: es el momento en que el protagonista decide dejar de esconder su dolor para transformarlo en expresión artística. Las composiciones adquieren una dimensión más experimental y atmosférica, reflejando el conflicto entre dos versiones de una misma persona que luchan por definir quién tomará el control."
  },
  "vertical": {
    title: "Vertical — conexión",
    intro: "Mantenerse de pie también es una batalla. Un disco donde la ansiedad, el cuerpo y la mente luchan por encontrar equilibrio.",
    details: "Vertical representa el renacimiento más humano dentro del universo de Conexión. Después de los recuerdos, la dualidad y el desgaste emocional, el conflicto se traslada al presente, donde la ansiedad, la salud mental y la lucha contra uno mismo ocupan el centro del relato. El disco explora la vulnerabilidad desde una perspectiva física y psicológica, mostrando cómo la mente transforma la realidad cotidiana en un espacio de incertidumbre permanente. Conceptualmente simboliza la convivencia entre la altura y el abismo, entre la caída y la posibilidad de volver a levantarse. Es un álbum sobre resistencia, aceptación y la difícil tarea de reconstruirse sin dejar de reconocer las propias cicatrices."
  },
  "blackout": {
    title: "Blackout — conexión",
    intro: "Cuando el ruido desaparece, solo queda la verdad. Un viaje acústico hacia la introspección, la nostalgia y el silencio.",
    details: "Blackout es el álbum acústico y más íntimo de Conexión. Reinterpreta la esencia grunge desde el silencio, reduciendo cada composición a sus elementos más puros: voz, instrumentos de madera y percusiones tradicionales que aportan una textura orgánica y atemporal. Es un disco construido sobre la introspección, la soledad, la incertidumbre y la contemplación. Aquí no existen artificios ni grandes producciones; cada interpretación busca transmitir cercanía, vulnerabilidad y honestidad absoluta. Blackout representa una desconexión del ruido exterior para volver a escuchar aquello que siempre estuvo dentro: los recuerdos, las dudas y la necesidad de seguir creando incluso cuando todo alrededor parece haberse apagado."
  }
};

function HandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M2.45867 13.5C0.57567 12.75 0.38767 11.065 0.54267 9.66701C0.64967 8.69701 1.45367 8.08301 2.40767 8.08301C3.30267 8.08301 5.11567 8.08701 5.11567 8.08701C5.79967 8.14001 6.29567 8.76301 6.23067 9.43601C6.13067 10.472 4.90667 10.584 4.08367 10.792C4.71467 11.082 5.95367 11.887 5.85967 12.772" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.959 13.5L9.412 13.047C9.78358 12.6755 10.0783 12.2345 10.2794 11.7491C10.4805 11.2637 10.584 10.7434 10.584 10.218V4.021C10.584 3.273 9.978 2.667 9.23 2.667C8.482 2.667 7.875 3.273 7.875 4.021V7C6.259 6.274 5.861 6.202 4.084 6.458V1.854C4.084 1.106 3.478 0.5 2.73 0.5C1.982 0.5 1.375 1.106 1.375 1.854V8.332" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackgroundCrossfade({ currentBg, albums = [], slides = BACKGROUNDS }: { currentBg: string; albums?: any[]; slides?: string[] }) {
  const dbBgs = albums.map((a) => a.bgImage).filter(Boolean) as string[];
  const list = Array.from(new Set([...slides, ...dbBgs, currentBg].filter(Boolean)));
  return (
    <>
      {list.map((bg) => (
        <img
          key={bg}
          src={bg}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover object-[right_top] transition-opacity duration-700 ease-in-out pointer-events-none ${bg === currentBg ? 'opacity-100' : 'opacity-0'
            }`}
        />
      ))}
    </>
  );
}

// Algunas carátulas quedaron guardadas apuntando a /brand/, pero los archivos
// viven en /cd/. Única fuente de verdad para las dos vistas que las consumen:
// el <img> de la interfaz y la ficha del sistema (Media Session).
function resolveCoverUrl(coverImage?: string) {
  return coverImage ? coverImage.replace("/brand/", "/cd/") : undefined;
}

// El tipo MIME ayuda al SO a elegir la carátula; si la URL no trae extensión
// conocida (por ejemplo una subida a Convex) se omite en vez de inventarlo.
function coverMimeType(url: string) {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return undefined;
}

export default function HomeClient({
  albums,
  initialProducts,
  carouselSlides = [],
}: {
  albums: AlbumWithStats[];
  initialProducts?: any[];
  carouselSlides?: CarouselSlide[];
}) {
  const slides = carouselSlides.length > 0
    ? carouselSlides.map((s) => s.url)
    : SLIDES;

  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Simulate initial loading, then trigger the split animation
    const timer = setTimeout(() => {
      setIsLoaded(true);
      // Wait for the animation to finish before removing the loader from DOM (800ms)
      setTimeout(() => setShowLoader(false), 800);
    }, 2000); // Wait 2s while pulsing logo
    return () => clearTimeout(timer);
  }, []);

  const [greeting, setGreeting] = useState("Buenas noches");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 3 && hour < 7) {
      setGreeting("Buenas conexiones");
    } else if (hour >= 7 && hour < 12) {
      setGreeting("Buenos días");
    } else if (hour >= 12 && hour < 20) {
      setGreeting("Buenas tardes");
    } else {
      setGreeting("Buenas noches");
    }
  }, []);

  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithStats | null>(null);

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isUniversoOpen, setIsUniversoOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>(initialProducts && initialProducts.length > 0 ? initialProducts : MARKETPLACE_PRODUCTS);
  const [hoveredProximamente, setHoveredProximamente] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const toggleDetails = (id: string) => setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  const mainRef = useRef<HTMLDivElement>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [selectedTrackForLyrics, setSelectedTrackForLyrics] = useState<TrackWithStats | null>(null);
  const [hoveredAlbumId, setHoveredAlbumId] = useState<string | null>(null);

  // Carrusel del fondo por defecto: avanza solo mientras ningún disco está en
  // hover ni abierto; al pausarse conserva la slide actual y retoma desde ahí.
  const [slideIndex, setSlideIndex] = useState(0);
  const isCarouselActive = !hoveredAlbumId && !selectedAlbum;

  useEffect(() => {
    if (!isCarouselActive) return;
    const id = setInterval(
      () => setSlideIndex((i) => (i + 1) % slides.length),
      SLIDE_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [isCarouselActive, slides.length]);

  const currentBg = (() => {
    const targetId = hoveredAlbumId || (selectedAlbum ? selectedAlbum.id : null);

    if (targetId) {
      const album = albums.find(a => a.id === targetId);
      if (album?.disabled) {
        return '/cd/bg-conexion-cover.png';
      }
      if (album?.bgImage) {
        return album.bgImage;
      }
    }

    switch (targetId) {
      case 'cero': return '/cd/bg-conexio-cero.png';
      case 'doble-cero': return '/cd/bg-conexion-doblecero.png';
      case 'geminis': return '/cd/bg-conexion-geminis.png';
      case 'vertical': return '/cd/bg-conexion-vertical.png';
      default: return slides[slideIndex % slides.length];
    }
  })();

  // Sync state from URL search params
  useEffect(() => {
    const albumId = searchParams.get("album");
    const trackSlug = searchParams.get("track");
    const view = searchParams.get("view");

    if (view === "about") {
      setIsAboutOpen(true);
      setIsMarketplaceOpen(false);
      setIsUniversoOpen(false);
      setSelectedAlbum(null);
      setSelectedTrackForLyrics(null);
      return;
    } else if (view === "marketplace") {
      setIsAboutOpen(false);
      setIsMarketplaceOpen(true);
      setIsUniversoOpen(false);
      setSelectedCategory("Todos");
      setSelectedAlbum(null);
      setSelectedTrackForLyrics(null);
      return;
    } else if (view === "universo") {
      setIsAboutOpen(false);
      setIsMarketplaceOpen(false);
      setIsUniversoOpen(true);
      setSelectedAlbum(null);
      setSelectedTrackForLyrics(null);
      return;
    } else {
      setIsAboutOpen(false);
      setIsMarketplaceOpen(false);
      setIsUniversoOpen(false);
    }

    if (albumId) {
      const album = albums.find((a) => a.id === albumId);
      if (album) {
        setSelectedAlbum(album);
        if (trackSlug) {
          const track = album.tracks.find((t) => slugify(t.title) === trackSlug);
          if (track) {
            setSelectedTrackForLyrics(track);
          } else {
            setSelectedTrackForLyrics(null);
          }
        } else {
          setSelectedTrackForLyrics(null);
        }
      } else {
        setSelectedAlbum(null);
        setSelectedTrackForLyrics(null);
      }
    } else {
      setSelectedAlbum(null);
      setSelectedTrackForLyrics(null);
    }
  }, [searchParams, albums]);

  // Update URL helper
  const updateUrl = useCallback(
    (albumId: string | null, trackTitle: string | null) => {
      const params = new URLSearchParams();
      if (albumId) params.set("album", albumId);
      if (trackTitle) params.set("track", slugify(trackTitle));
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );



  // State for optimistic like updates
  const [localLikes, setLocalLikes] = useState<Record<number, number>>({});

  const handleLike = async (e: React.MouseEvent, trackId: number, initialLikes: number) => {
    e.stopPropagation();
    const currentLikes = localLikes[trackId] ?? initialLikes;
    setLocalLikes(prev => ({ ...prev, [trackId]: currentLikes + 1 }));
    try {
      const res = await fetch("/api/stream/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId })
      });
      if (res.ok) {
        const data = await res.json();
        setLocalLikes(prev => ({ ...prev, [trackId]: data.likes }));
      }
    } catch {
      setLocalLikes(prev => ({ ...prev, [trackId]: currentLikes }));
    }
  };

  // Reset scroll to top when changing view (album, lyrics, about)
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowStickyHeader(false);
  }, [selectedAlbum, selectedTrackForLyrics, isAboutOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 380) {
      setShowStickyHeader(true);
    } else {
      setShowStickyHeader(false);
    }
  };

  // Track playback state (tied to whichever track is currently playing globally)
  const [currentPlaylist, setCurrentPlaylist] = useState<TrackWithStats[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isShuffle, setIsShuffle] = useState(false);

  const currentTrack = currentPlaylist[currentTrackIndex] || currentPlaylist[0];

  // Actualiza el título del navegador para mejorar la experiencia e integrarlo al SEO
  useEffect(() => {
    if (currentTrack) {
      document.title = `${isPlaying ? "▶ " : ""}${currentTrack.title} - Conexión`;
    } else {
      document.title = "Conexión";
    }
  }, [currentTrack, isPlaying]);

  // Audio real protegido (HLS cifrado). Solo las pistas presentes en el
  // catálogo del servidor suenan de verdad; el resto mantiene la simulación.
  const [availableTracks, setAvailableTracks] = useState<Set<string>>(new Set());
  const audio = useSecureAudio({ onEnded: () => handleNext() });
  const hasRealAudio = currentTrack ? availableTracks.has(String(currentTrack.id)) : false;

  useEffect(() => {
    fetch("/api/stream/catalog")
      .then((res) => res.json())
      .then((data) => setAvailableTracks(new Set(data.tracks)))
      .catch(() => { });
  }, []);

  // Timer effect for playback simulation (solo para pistas sin audio real)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTrack && !hasRealAudio) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentTrack.duration) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrackIndex, currentPlaylist, hasRealAudio]);

  // Carga la pista protegida al cambiar de canción
  useEffect(() => {
    if (currentTrack && hasRealAudio) {
      audio.load(String(currentTrack.id));
    } else {
      audio.stop();
    }
  }, [currentTrack?.id, hasRealAudio]);

  // Registra UNA reproducción cuando una pista real empieza a sonar (no al solo
  // cargarla). El ref evita recontar si se pausa y reanuda la misma canción.
  const countedTrackRef = useRef<number | null>(null);
  useEffect(() => {
    if (
      currentTrack &&
      hasRealAudio &&
      isPlaying &&
      countedTrackRef.current !== currentTrack.id
    ) {
      countedTrackRef.current = currentTrack.id;
      fetch(`/api/stream/${currentTrack.id}/play`, { method: "POST" }).catch(() => { });
    }
  }, [currentTrack?.id, isPlaying, hasRealAudio]);

  // Sincroniza play/pause con el elemento de audio real
  useEffect(() => {
    if (!hasRealAudio) return;
    if (isPlaying && audio.readyTrackId === String(currentTrack?.id)) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying, audio.readyTrackId, hasRealAudio, currentTrack?.id]);

  // Volumen y silencio
  useEffect(() => {
    audio.setVolume(volume / 100, isMuted);
  }, [volume, isMuted]);

  // Tiempo/duración a mostrar: reales si la pista suena de verdad
  const displayTime = hasRealAudio ? audio.time : currentTime;
  const displayDuration =
    hasRealAudio && audio.duration > 0
      ? audio.duration
      : currentTrack?.duration ?? 0;

  const seekTo = (seconds: number) => {
    const clamped = Math.min(Math.max(seconds, 0), displayDuration || 0);
    if (hasRealAudio) {
      audio.seek(clamped);
    } else {
      setCurrentTime(Math.floor(clamped));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekTo(fraction * displayDuration);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const count = currentPlaylist.length;
    if (count === 0) return;
    if (count === 1) {
      // The track ID does not change, so restart the existing audio explicitly.
      audio.seek(0);
      if (isPlaying && hasRealAudio) audio.play();
    } else if (isShuffle) {
      // Choose another track; selecting the ended track would not reload it.
      const offset = 1 + Math.floor(Math.random() * (count - 1));
      setCurrentTrackIndex((currentTrackIndex + offset) % count);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % count);
    }
    setCurrentTime(0);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + currentPlaylist.length) % currentPlaylist.length);
    setCurrentTime(0);
  };

  // ---------------------------------------------------------------------------
  // Ficha "Reproduciendo ahora" del sistema operativo: pantalla de bloqueo,
  // centro de control, widget de Android, pantalla del coche por Bluetooth.
  // Sin metadata el SO cae al favicon y al título de la pestaña, que es lo que
  // se veía antes de esto.
  // ---------------------------------------------------------------------------

  // handleNext/handlePrev se recrean en cada render; el ref evita reinstalar los
  // handlers del SO constantemente sin quedarse con closures viejas.
  const mediaNavRef = useRef({ next: handleNext, prev: handlePrev, seek: seekTo });
  useEffect(() => {
    mediaNavRef.current = { next: handleNext, prev: handlePrev, seek: seekTo };
  });

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;

    if (!currentTrack) {
      session.metadata = null;
      return;
    }

    const albumOfTrack = albums.find((a) => a.tracks.some((t) => t.id === currentTrack.id));
    const cover =
      resolveCoverUrl(currentTrack.coverImage) ??
      resolveCoverUrl(albumOfTrack?.coverImage) ??
      "/brand/icon-512.png";
    // Absoluta a propósito: iOS y varios receptores Bluetooth ignoran las rutas
    // relativas y se quedan sin carátula.
    const src = new URL(cover, window.location.origin).href;
    const type = coverMimeType(src);

    session.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
      // Un solo archivo declarado en varios tamaños: cada plataforma pide el
      // que más se acerca al suyo y descarta la lista si no encuentra ninguno.
      artwork: [96, 192, 256, 384, 512].map((size) => ({
        src,
        sizes: `${size}x${size}`,
        ...(type ? { type } : {}),
      })),
    });
  }, [currentTrack, albums]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = !currentTrack
      ? "none"
      : isPlaying
        ? "playing"
        : "paused";
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) return;
    // Duración desconocida todavía: limpiar deja la barra del SO en indefinido
    // en vez de congelada en el valor de la pista anterior.
    if (!currentTrack || !Number.isFinite(displayDuration) || displayDuration <= 0) {
      navigator.mediaSession.setPositionState();
      return;
    }
    try {
      navigator.mediaSession.setPositionState({
        duration: displayDuration,
        // Al cambiar de pista el tiempo viejo puede llegar antes que la duración
        // nueva; sin recortar, Chrome lanza TypeError y pierde la posición.
        position: Math.min(Math.max(displayTime, 0), displayDuration),
        playbackRate: 1,
      });
    } catch {
      // duración aún inestable en mitad de la carga
    }
  }, [currentTrack, displayTime, displayDuration]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    // Sin handlers, los botones del SO actúan sobre el <audio> directamente y la
    // interfaz se desincroniza (icono de play con el audio parado).
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => setIsPlaying(true)],
      ["pause", () => setIsPlaying(false)],
      ["previoustrack", () => mediaNavRef.current.prev()],
      ["nexttrack", () => mediaNavRef.current.next()],
      ["seekto", (details) => {
        if (typeof details.seekTime === "number") mediaNavRef.current.seek(details.seekTime);
      }],
    ];
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // el navegador no soporta esta acción
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {
          // idem
        }
      }
    };
  }, []);

  const handleTrackSelectInAlbum = (albumTracks: TrackWithStats[], index: number) => {
    const selectedTrack = albumTracks[index];
    const isThisTrackActive = currentTrack && currentTrack.id === selectedTrack.id;

    if (isThisTrackActive) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentPlaylist(albumTracks);
      setCurrentTrackIndex(index);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const playEntireAlbum = (album: AlbumWithStats) => {
    setCurrentPlaylist(album.tracks);
    setCurrentTrackIndex(0);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // Navegación principal (barra inferior)
  const goHome = () => {
    updateUrl(null, null);
  };

  const openAbout = () => {
    router.push("?view=about", { scroll: false });
  };

  const isHomeActive = !isAboutOpen && !isMarketplaceOpen && !isUniversoOpen && selectedAlbum === null && selectedTrackForLyrics === null;

  // Estadísticas del catálogo (solo discos habilitados suenan, pero se cuentan todos)
  const enabledAlbums = albums.filter((a) => !a.disabled);
  const totalAlbums = albums.length;
  const totalTracks = albums.reduce((n, a) => n + a.tracks.length, 0);
  const totalMinutes = Math.round(
    albums.reduce((sum, a) => sum + a.tracks.reduce((s, t) => s + t.duration, 0), 0) / 60
  );

  const playRandomSong = () => {
    const pool = enabledAlbums.flatMap((a) => a.tracks.map((t) => ({ album: a, track: t })));
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const trackIndex = pick.album.tracks.findIndex((t) => t.id === pick.track.id);
    updateUrl(pick.album.id, null);
    setCurrentPlaylist(pick.album.tracks);
    setCurrentTrackIndex(trackIndex);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Helper to draw geometric/gradient album art using CSS or load image
  // Menú principal en desktop: vive arriba a la derecha, a la altura del buscador.
  // Por debajo de lg sigue funcionando la barra inferior fija.
  // Todos los botones comparten alto y ancho para que la card se lea pareja.
  const navButtonClass = (active: boolean) =>
    `flex h-10 w-[150px] shrink-0 items-center justify-center gap-2 rounded-full text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer ${active ? "bg-white text-black" : "text-zinc-300 hover:bg-white/10 hover:text-white"}`;

  const topNav = (
    <nav
      aria-label="Navegación principal"
      className="pointer-events-auto flex shrink-0 items-center gap-1 rounded-full bg-[#121212] p-1 shadow-xl shadow-black/50"
    >
      <button onClick={goHome} className={navButtonClass(isHomeActive)}>
        <HomeIcon className="h-5 w-5" />
        <span>Inicio</span>
      </button>
      <button onClick={openAbout} className={navButtonClass(isAboutOpen)}>
        <Info className="h-5 w-5" />
        <span>Sobre conexión</span>
      </button>
      <button onClick={() => router.push("?view=universo", { scroll: false })} className={navButtonClass(isUniversoOpen)}>
        <Globe className="h-5 w-5" />
        <span>Universo</span>
      </button>
    </nav>
  );

  // El menú vive fijo al viewport (no dentro del header de cada vista) para que
  // caiga siempre en el mismo pixel: 12px del borde de la card + 28px/20px del header.
  // El wrapper repite el max-w de la home para alinearse con la card en pantallas anchas.
  const floatingTopNav = (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] hidden justify-center px-3 pt-3 xl:flex">
      <div className="flex w-full max-w-[1800px] justify-end pr-7 pt-5">{topNav}</div>
    </div>
  );

  // Reemplaza al buscador en las páginas internas: mismo alto y tratamiento visual.
  const backButton = (onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-black/65 pl-4 pr-5 text-sm font-medium text-zinc-300 shadow-xl shadow-black/50 backdrop-blur-xl transition-[background-color,color,transform] duration-150 ease-out hover:bg-black/80 hover:text-white active:scale-[0.97] cursor-pointer"
    >
      <ArrowLeft className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );

  const renderCoverArt = (coverArtDesign: string, coverGradient: string, sizeClass: string = "w-full h-full", coverImage?: string) => {
    if (coverImage) {
      const finalImage = resolveCoverUrl(coverImage)!;
      return (
        <img
          src={finalImage}
          alt="Cover Art"
          className={`object-cover ${sizeClass} select-none`}
        />
      );
    }

    return (
      <div className={`relative flex items-center justify-center overflow-hidden rounded bg-gradient-to-br ${coverGradient} ${sizeClass} shadow-lg select-none`}>
        {coverArtDesign === "discover" && (
          <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-tr from-cyan-600 via-indigo-900 to-fuchsia-600">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white opacity-85">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.67-.138-.746-.473-.075-.335.138-.67.473-.746 3.854-.88 7.15-.506 9.82 1.13.295.178.387.563.206.86zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.077-1.182-.412.125-.845-.106-.97-.518-.125-.412.106-.845.518-.97 3.666-1.113 8.233-.568 11.343 1.344.368.226.488.707.26 1.074zm.106-2.833C14.383 8.8 8.48 8.61 5.036 9.656c-.528.16-1.094-.142-1.255-.67-.16-.527.142-1.093.67-1.254 3.96-1.202 10.484-.98 14.545 1.43.476.282.63.9.347 1.375-.282.476-.9.63-1.375.347z" />
            </svg>
            <h4 className="text-sm font-extrabold text-white leading-tight">Discover<br />Weekly</h4>
          </div>
        )}
        {coverArtDesign === "circle" && (
          <div className="relative w-4/5 h-4/5 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400/80 flex items-center justify-center">
              <div className="w-[85%] h-[85%] rounded-full border-4 border-cyan-500 flex items-center justify-center">
                <div className="w-[80%] h-[80%] rounded-full bg-red-600 flex items-center justify-center" />
              </div>
            </div>
          </div>
        )}
        {coverArtDesign === "retro" && (
          <span className="text-zinc-200 font-serif font-black text-[9px] opacity-40">JEAN</span>
        )}
        {coverArtDesign === "wave" && (
          <div className="w-full h-full flex flex-col justify-around py-2 opacity-50">
            <div className="h-0.5 bg-white rounded" style={{ width: '40%', margin: '0 auto' }} />
            <div className="h-0.5 bg-white rounded" style={{ width: '60%', margin: '0 auto' }} />
          </div>
        )}
        {coverArtDesign === "sunset" && (
          <div className="absolute bottom-1 text-[8px] font-mono text-zinc-100 opacity-60">SUNSET</div>
        )}
        {coverArtDesign === "neon" && (
          <div className="w-5 h-5 rounded-full border border-indigo-400 animate-ping opacity-60" />
        )}
      </div>
    );
  };

  return (
    <>
      {/* LOADER OVERLAY */}
      {showLoader && (
        <div className="fixed inset-0 z-[200] flex flex-col pointer-events-none overflow-hidden">
          {/* Top Half */}
          <div className={`w-full h-1/2 bg-zinc-950 transition-transform duration-[800ms] ease-[cubic-bezier(0.87,0,0.13,1)] ${isLoaded ? '-translate-y-full' : 'translate-y-0'}`} />
          {/* Bottom Half */}
          <div className={`w-full h-1/2 bg-zinc-950 transition-transform duration-[800ms] ease-[cubic-bezier(0.87,0,0.13,1)] ${isLoaded ? 'translate-y-full' : 'translate-y-0'}`} />

          {/* Pulsing Logo centered */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${isLoaded ? 'opacity-0 scale-90 blur-md' : 'opacity-100 scale-100 blur-0'}`}>
            <img src="/brand/conexionlogo.svg" alt="Cargando..." className="h-10 w-auto animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">

        {/* BIBLIOTECA LATERAL: acompaña al home y a las páginas internas */}
        <LibrarySidebar
          albums={enabledAlbums}
          totalTracks={totalTracks}
          totalMinutes={totalMinutes}
          isHomeActive={isHomeActive}
          activeAlbumId={selectedAlbum?.id}
          onHome={goHome}
          onOpenAlbum={(albumId) => updateUrl(albumId, null)}
        />

        {/* MAIN CONTENT AREA (full width, Netflix-style) */}
        <main
          className="flex-1 flex flex-col bg-zinc-950 overflow-hidden relative"
        >
          {selectedTrackForLyrics !== null ? (
            /* ========================================================================= */
            /* SONG LYRICS VIEW                                                          */
            /* ========================================================================= */
            <div className="relative z-10 flex-1 min-h-0 w-full bg-[#080808] p-2 text-white md:p-3 flex flex-col">
              <div className="relative flex flex-1 min-h-0 w-full flex-col overflow-y-auto overflow-x-hidden rounded-xl bg-[#121212] animate-fade-in">
                {/* Blurred Atmospheric Background (Mobile). Prioriza la imagen
                    propia de la canción; si no tiene, usa la carátula del disco. */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 md:hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c1c] via-[#121212] to-[#121212] z-10" />
                  {(selectedTrackForLyrics.bgImage || selectedTrackForLyrics.coverImage) && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-15 blur-3xl scale-125"
                      style={{ backgroundImage: `url(${selectedTrackForLyrics.bgImage || selectedTrackForLyrics.coverImage})` }}
                    />
                  )}
                </div>

                {/* BACKGROUND IMAGE (Top Right - Desktop). Si la canción tiene
                    imagen propia se muestra esa; si no, el fondo del disco. */}
                <div className="absolute top-0 right-0 w-full md:w-3/5 lg:w-[750px] xl:w-[850px] max-w-full h-[320px] md:h-[420px] lg:h-[460px] overflow-hidden pointer-events-none z-0 hidden md:block">
                  {selectedTrackForLyrics.bgImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedTrackForLyrics.bgImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover object-[right_top] opacity-100"
                    />
                  ) : (
                    <BackgroundCrossfade currentBg={currentBg} albums={albums} slides={slides} />
                  )}
                  {/* Degradados suaves restringidos solo a los bordes (izquierdo e inferior) */}
                  <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-to-r from-[#121212] to-transparent z-10" />
                  <div className="absolute left-0 right-0 bottom-0 h-1/4 bg-gradient-to-t from-[#121212] to-transparent z-10" />
                </div>

                {/* Header — matches Home header position */}
                <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 rounded-t-xl p-4 md:px-7 md:py-5 lg:flex-nowrap">
                  {backButton(() => updateUrl(selectedAlbum?.id || null, null), "Volver al disco")}
                </header>

              {/* Main Content Layout */}
              <div className="flex-1 w-full px-4 md:px-7 py-4 md:py-6 relative z-20 flex flex-col lg:flex-row gap-6 lg:gap-12 pb-44 md:pb-52">

                {/* Left Column: Cover and Info (Sticky on scroll) */}
                <div className="w-full lg:w-[280px] xl:w-[360px] shrink-0 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 md:space-y-5 lg:sticky lg:top-20 lg:self-start">
                  <div className="w-56 h-56 sm:w-72 sm:h-72 lg:w-[clamp(220px,28vh,300px)] lg:h-[clamp(220px,28vh,300px)] xl:w-[clamp(260px,34vh,360px)] xl:h-[clamp(260px,34vh,360px)] shadow-2xl rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center">
                    {renderCoverArt(selectedTrackForLyrics.coverArtDesign, selectedTrackForLyrics.coverGradient, "w-full h-full", selectedTrackForLyrics.coverImage)}
                  </div>

                  <div className="space-y-1.5 w-full">
                    <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Letra</span>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">{selectedTrackForLyrics.title}</h1>
                    <p className="text-zinc-400 text-sm md:text-base">por <span className="text-white font-bold">{selectedTrackForLyrics.artist}</span></p>
                    <p className="text-zinc-500 text-xs md:text-sm">Álbum: {selectedTrackForLyrics.album}</p>
                  </div>

                  {/* Direct Play/Pause in Lyric view */}
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        const album = albums.find(a => a.tracks.some(t => t.id === selectedTrackForLyrics.id));
                        if (album) {
                          const trackIndex = album.tracks.findIndex(t => t.id === selectedTrackForLyrics.id);
                          const isThisPlaying = currentTrack && currentTrack.id === selectedTrackForLyrics.id && isPlaying;
                          if (isThisPlaying) {
                            setIsPlaying(false);
                          } else {
                            setCurrentPlaylist(album.tracks);
                            setCurrentTrackIndex(trackIndex);
                            setIsPlaying(true);
                            setCurrentTime(0);
                          }
                        }
                      }}
                      className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm md:text-base rounded-full transition-all hover:scale-105 shadow-lg shadow-emerald-500/25 cursor-pointer"
                    >
                      {currentTrack && currentTrack.id === selectedTrackForLyrics.id && isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current text-black" />
                          <span>Pausar canción</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 md:w-5 md:h-5 text-black" />
                          <span>Reproducir ahora</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Column: Full Lyrics */}
                <div className="flex-1 w-full space-y-4 md:space-y-6">

                  {/* Lyrics area */}
                  <div className="text-zinc-300 text-xs md:text-sm font-medium leading-relaxed md:leading-loose whitespace-pre-line tracking-wide font-sans select-text max-w-3xl pt-2 pb-24 md:pb-28 pr-4">
                    {(() => {
                      // La letra guardada desde el panel de administración tiene
                      // prioridad; si no existe, se usan las letras por defecto.
                      if (selectedTrackForLyrics.lyrics && selectedTrackForLyrics.lyrics.trim()) {
                        return selectedTrackForLyrics.lyrics;
                      }
                      switch (selectedTrackForLyrics.title.toLowerCase()) {
                        case "papeles rotos":
                          return `Escribo en el viento palabras sin dueño
Las sombras me miran romper este sueño
Pedazos del alma que flotan sin rumbo
Cartas vacías para cambiar el mundo.

[Coro]
Y son papeles rotos bajo la lluvia
Historias perdidas que el tiempo diluye
No busques respuestas en esta ceniza
El viento se lleva lo que fue prisa.

Cruzar la frontera de lo que perdimos
Buscando las huellas que nunca seguimos
El tiempo es un río que corre hacia atrás
Papeles rotos que no vuelven más.`;
                        case "cero":
                          return `Empezar de nuevo desde la nada
Cruzar el abismo con la mirada
El pulso se apaga, la luz se enciende
El frío del alma que nadie comprende.

[Coro]
Volver a cero, volver a andar
Bajo este cielo frente al mar
Sin equipaje, sin dirección
Solo el latido del corazón.
Cruzar el abismo con la mirada
El pulso se apaga, la luz se enciende
El frío del alma que nadie comprende.

[Coro]
Volver a cero, volver a andar
Bajo este cielo frente al mar
Sin equipaje, sin dirección
Solo el latido del corazón.
Cruzar el abismo con la mirada
El pulso se apaga, la luz se enciende
El frío del alma que nadie comprende.

[Coro]
Volver a cero, volver a andar
Bajo este cielo frente al mar
Sin equipaje, sin dirección
Solo el latido del corazón.
Cruzar el abismo con la mirada
El pulso se apaga, la luz se enciende
El frío del alma que nadie comprende.

[Coro]
Volver a cero, volver a andar
Bajo este cielo frente al mar
Sin equipaje, sin dirección
Solo el latido del corazón.
Cruzar el abismo con la mirada
El pulso se apaga, la luz se enciende
El frío del alma que nadie comprende.

[Coro]
Volver a cero, volver a andar
Bajo este cielo frente al mar
Sin equipaje, sin dirección
Solo el latido del corazón.

El minutero gira al revés
Olvidar las sombras de lo que fue
Una nueva página por escribir
Volver a cero para vivir.`;
                        case "imposibles":
                          return `Caminos de tierra que cruzan el fuego
Las reglas del juego que ya no aceptamos
Miradas de hielo en la gran ciudad
Buscando un destello de honestidad.

[Coro]
Son imposibles que se hacen reales
Rompiendo muros de cemento y metales
Una palabra que enciende la luz
Cargando el silencio de esta cruz.

El tiempo no espera, la noche es eterna
Una llama enciende la cueva interna
Seguir la corriente no es la solución
Imposibles que grita el corazón.`;
                        default:
                          return `Bajo este cielo de metal y neón
Escucho el eco de tu voz en el viento
Las luces bailan en la habitación
Marcando el ritmo de este momento.

[Coro]
Y seguimos bailando en la oscuridad
Buscando una chispa de eternidad
Las horas pasan sin pedir perdón
Alimentando esta dulce adicción.

No queda espacio para la duda
Cuando la música suena desnuda
Déjate llevar por la vibración
Que viaja directo a tu dirección.`;
                      }
                    })()}
                  </div>
                </div>

              </div>
            </div>
          </div>
          ) : isAboutOpen ? (
            /* ========================================================================= */
            /* ABOUT / SOBRE CONEXIÓN VIEW                                               */
            /* ========================================================================= */
            <div className="relative z-10 flex-1 min-h-0 w-full bg-[#080808] p-2 text-white md:p-3 flex flex-col">
              <div className="relative flex flex-1 min-h-0 w-full flex-col overflow-y-auto overflow-x-hidden rounded-xl bg-[#121212] animate-fade-in">
              {/* BACKGROUND IMAGE (Top Right - Desktop) */}
              <div className="absolute top-0 right-0 w-full md:w-3/5 lg:w-[750px] xl:w-[850px] max-w-full h-[50vh] min-h-[400px] overflow-hidden pointer-events-none z-0 hidden md:block">
                <BackgroundCrossfade currentBg={currentBg} albums={albums} slides={slides} />
                {/* Degradados suaves restringidos solo a los bordes (izquierdo e inferior) */}
                <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-to-r from-[#121212] to-transparent z-10" />
                <div className="absolute left-0 right-0 bottom-0 h-1/4 bg-gradient-to-t from-[#121212] to-transparent z-10" />
              </div>

              {/* Header — matches Home header position */}
              <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 rounded-t-xl p-4 md:px-7 md:py-5 lg:flex-nowrap">
                {backButton(() => updateUrl(null, null), "Volver al inicio")}
              </header>

              {/* HERO SECTION (Half Screen Height) */}
              <div className="relative w-full min-h-[50vh] flex flex-col justify-center items-center text-center px-4 md:px-7 py-8 z-10">
                <div className="max-w-3xl flex flex-col items-center space-y-4 md:space-y-6 animate-fade-in">
                  <img src="/brand/conexionlogo.svg" alt="Conexión" className="h-12 md:h-16 lg:h-20 w-auto drop-shadow-2xl" />
                  <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Sobre conexión</span>
                  <p className="text-zinc-300 text-sm md:text-base lg:text-lg leading-relaxed max-w-3xl mx-auto">
                    Conexión es un proyecto grunge/post-grunge nacido desde el caos mental, la ansiedad y la necesidad de convertir heridas en sonido.
                  </p>
                </div>
              </div>

              {/* Albums blocks */}
              <div className="w-full flex flex-col gap-12 md:gap-16 lg:gap-20 pb-44 md:pb-52 z-10 max-w-4xl">
                {albums.map((album, index) => (
                  <div key={album.id} className="w-full max-w-[880px] mx-auto px-4 md:px-7 relative grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
                    {/* Left Column: Cover */}
                    <div className="w-full lg:col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-3">
                      <div className="w-56 h-56 sm:w-72 sm:h-72 lg:w-full lg:h-auto lg:aspect-square shadow-2xl rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => updateUrl(album.id, null)}>
                        {renderCoverArt(album.coverArtDesign, album.coverGradient, "w-full h-full", album.disabled ? "/cd/cover_cover_conexion.png" : album.coverImage)}
                      </div>
                    </div>

                    {/* Right Column: Title, Intro & Description */}
                    <div className="w-full lg:col-span-2 space-y-3">
                      {(() => {
                        const content = ALBUM_ABOUT_TEXTS[album.id] || ALBUM_ABOUT_TEXTS[slugify(album.title)] || (index === 4 ? ALBUM_ABOUT_TEXTS["blackout"] : undefined);
                        const isExpanded = !!expandedDetails[album.id];
                        const intro = (album.aboutIntro && album.aboutIntro.trim()) ? album.aboutIntro : content?.intro;
                        const details = (album.aboutDetails && album.aboutDetails.trim()) ? album.aboutDetails : (content?.details || album.description);
                        const titleDisplay = album.disabled ? `Disco ${index + 1}` : album.title;

                        return (
                          <>
                            <div className="space-y-1">
                              <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">{album.year}</span>
                              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                                {titleDisplay}
                              </h2>
                            </div>

                            <div className="text-zinc-300 text-sm md:text-base font-medium leading-relaxed tracking-wide font-sans select-text max-w-2xl py-1 space-y-3">
                              {intro && (
                                <p className="text-zinc-200 font-medium leading-relaxed">
                                  {intro}
                                </p>
                              )}
                              {details && (
                                <>
                                  <button
                                    onClick={() => toggleDetails(album.id)}
                                    className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-400 transition-colors cursor-pointer py-1"
                                  >
                                    <span>{isExpanded ? "Ocultar descripción" : "Ver descripción"}</span>
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                  {isExpanded && (
                                    <div className="pt-2 text-zinc-400 text-sm leading-relaxed space-y-3 border-t border-zinc-900/80 animate-fade-in">
                                      <p className="whitespace-pre-line">{details}</p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </>
                        );
                      })()}

                      {/* Album details: tracks count */}
                      <div className="flex items-center gap-3 text-xs md:text-sm text-zinc-400 font-medium pt-2">
                        <span className="flex items-center gap-1.5">
                          <Music className="w-4 h-4 text-emerald-400" />
                          <span className="text-zinc-200 font-bold">{album.tracks.length}</span> canciones
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          ) : isMarketplaceOpen ? (
            /* ========================================================================= */
            /* MARKETPLACE VIEW                                                          */
            /* ========================================================================= */
            <div className="relative z-10 flex-1 min-h-0 w-full bg-[#080808] p-2 text-white md:p-3 flex flex-col">
              <div className="relative flex flex-1 min-h-0 w-full flex-col overflow-y-auto overflow-x-hidden rounded-xl bg-[#121212] animate-fade-in">
              {/* BACKGROUND IMAGE (Top Right - Desktop) */}
              <div className="absolute top-0 right-0 w-full md:w-3/5 lg:w-[750px] xl:w-[850px] max-w-full h-[50vh] min-h-[400px] overflow-hidden pointer-events-none z-0 hidden md:block">
                <BackgroundCrossfade currentBg={currentBg} albums={albums} slides={slides} />
                <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-to-r from-[#121212] to-transparent z-10" />
                <div className="absolute left-0 right-0 bottom-0 h-1/4 bg-gradient-to-t from-[#121212] to-transparent z-10" />
              </div>

              {/* Header — matches Home header position */}
              <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 rounded-t-xl p-4 md:px-7 md:py-5 lg:flex-nowrap">
                {backButton(() => updateUrl(null, null), "Volver al inicio")}
              </header>

              {/* Marketplace Main Container (Max width 880px, same as albums, centered) */}
              <div className="w-full max-w-[880px] mx-auto px-4 md:px-7 py-8 pb-44 flex flex-col gap-8">

                {/* Header Title */}
                <div className="space-y-1 text-center lg:text-left">
                  <span className="text-xs font-bold tracking-widest text-[#FFC400] uppercase">TIENDA OFICIAL</span>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Marketplace</h1>
                  <p className="text-zinc-400 text-sm max-w-xl">
                    Adquiere lanzamientos oficiales en formato físico y merchandising original de Conexión.
                  </p>
                </div>

                {/* Products Grid (2 columns on mobile, 3 columns on desktop) */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {marketplaceProducts.map((product) => {
                    const album = albums.find((a) => a.id === product.image);
                    return (
                      <div
                        key={product.id}
                        onClick={() => setToastMessage("El marketplace aún no está disponible...")}
                        className="bg-zinc-900/35 backdrop-blur-sm border border-zinc-800/60 rounded-2xl overflow-hidden flex flex-col hover:border-zinc-700/60 transition-all group hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-black/20 cursor-pointer"
                      >
                        {/* Image Container (Ratio square) */}
                        <div className="w-full aspect-1 bg-zinc-950 overflow-hidden relative border-b border-zinc-900 flex items-center justify-center">
                          <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-500 ease-out">
                            {album ? (
                              renderCoverArt(album.coverArtDesign, album.coverGradient, "w-full h-full object-cover", album.coverImage)
                            ) : product.image && (product.image.startsWith("http") || product.image.startsWith("/")) ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className={`w-full h-full ${product.image || "bg-zinc-900"} flex items-center justify-center relative`}>
                                <Store className="w-8 h-8 text-zinc-600/40" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Text & Price Details */}
                        <div className="p-2 md:p-4 flex-1 flex flex-col justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{product.category}</span>
                            <h4 className="font-semibold text-xs md:text-sm text-white group-hover:text-[#FFC400] transition-colors leading-snug line-clamp-1">
                              {product.name}
                            </h4>
                          </div>

                          <div className="flex flex-col gap-2 pt-1 mt-auto">
                            <span className="text-sm md:text-base font-semibold text-white/50">
                              ${product.price.toFixed(2)} USD
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            </div>
          ) : isUniversoOpen ? (
            /* ========================================================================= */
            /* UNIVERSO VIEW (Coming Soon Empty State)                                   */
            /* ========================================================================= */
            <div className="relative z-10 flex-1 min-h-0 w-full bg-[#080808] p-2 text-white md:p-3 flex flex-col">
              <div className="relative flex flex-1 min-h-0 w-full flex-col overflow-y-auto overflow-x-hidden rounded-xl bg-[#121212] animate-fade-in">

              {/* BACKGROUND IMAGE (Top Right - Desktop) */}
              <div className="absolute top-0 right-0 w-full md:w-3/5 lg:w-[750px] xl:w-[850px] max-w-full h-[50vh] min-h-[400px] overflow-hidden pointer-events-none z-0 hidden md:block">
                <BackgroundCrossfade currentBg={currentBg} albums={albums} slides={slides} />
                <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-to-r from-[#121212] to-transparent z-10" />
                <div className="absolute left-0 right-0 bottom-0 h-1/4 bg-gradient-to-t from-[#121212] to-transparent z-10" />
              </div>

              {/* BACKGROUND IMAGE (Top-Centered with Crossfade) */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 flex items-start justify-center rounded-xl">
                <div className="relative w-[1300px] h-auto flex items-start justify-center">
                  <img
                    src="/universe/dark.png"
                    alt=""
                    className={`w-full h-auto transition-opacity duration-300 ease-in-out ${hoveredProximamente ? 'opacity-0' : 'opacity-100'}`}
                  />
                  <img
                    src="/universe/light.png"
                    alt=""
                    className={`absolute inset-0 w-full h-auto transition-opacity duration-300 ease-in-out ${hoveredProximamente ? 'opacity-100' : 'opacity-0'}`}
                  />
                </div>
              </div>

              {/* Header — matches Home header position */}
              <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 rounded-t-xl p-4 md:px-7 md:py-5 lg:flex-nowrap">
                {backButton(() => updateUrl(null, null), "Volver al inicio")}
              </header>

              {/* Centered Content */}
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto py-16 md:py-24 space-y-6">
                {/* <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl relative group">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all animate-pulse" />
                  <Globe className="w-10 h-10 text-emerald-400 relative z-10" />
                </div> */}
                <div className="space-y-2">
                  <span
                    onMouseEnter={() => setHoveredProximamente(true)}
                    onMouseLeave={() => setHoveredProximamente(false)}
                    className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black tracking-widest text-emerald-400 uppercase cursor-help transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    PRÓXIMAMENTE
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">Universo Conexión</h2>
                  <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                    Explora la historia profunda, letras comentadas, curiosidades y el trasfondo lírico de cada una de las canciones de conexión.
                  </p>
                </div>
              </div>
            </div>
            </div>
          ) : selectedAlbum === null && !USE_CLASSIC_HOME ? (
            /* ========================================================================= */
            /* HOME PAGE VIEW — interfaz principal                         */
            /* ========================================================================= */
            <AltHomeView
              albums={enabledAlbums}
              greeting={greeting}
              totalAlbums={totalAlbums}
              totalTracks={totalTracks}
              totalMinutes={totalMinutes}
              onOpenAlbum={(albumId) => updateUrl(albumId, null)}
              currentTrackId={currentTrack?.id}
              isPlaying={isPlaying}
              currentBg={currentBg}
              onHoverAlbum={setHoveredAlbumId}
              bgImages={Array.from(new Set([...slides, ...albums.map(a => a.bgImage).filter((b): b is string => !!b)]))}
              onPlay={(album, index) => {
                if (currentTrack?.id === album.tracks[index]?.id) {
                  setIsPlaying(!isPlaying);
                  return;
                }
                setCurrentPlaylist(album.tracks);
                setCurrentTrackIndex(index);
                setCurrentTime(0);
                setIsPlaying(true);
              }}
            />
          ) : selectedAlbum === null ? (
            /* ========================================================================= */
            /* HOME PAGE VIEW (Netflix-style hero + Discos row)                          */
            /* ========================================================================= */
            <div className="relative z-10 w-full pb-44 md:pb-52">

              {/* BACKGROUND IMAGE (Top Right) */}
              <div className="absolute top-0 right-0 w-full md:w-3/5 lg:w-[750px] xl:w-[850px] max-w-full h-[320px] md:h-[420px] lg:h-[460px] overflow-hidden pointer-events-none -z-10">
                <BackgroundCrossfade currentBg={currentBg} albums={albums} slides={slides} />
                {/* Degradados suaves restringidos solo a los bordes (izquierdo e inferior) */}
                <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
                <div className="absolute left-0 right-0 bottom-0 h-1/4 bg-gradient-to-t from-zinc-950 to-transparent z-10" />
              </div>

              {/* ===== NETFLIX-STYLE HERO ===== */}
              <div className="relative w-full min-h-[clamp(200px,28vh,360px)] flex items-center mb-4 md:mb-[clamp(1rem,3vh,2rem)]">

                {/* CONTENT aligned LEFT */}
                <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-12 lg:px-16 xl:px-20 py-6 md:py-[clamp(1.25rem,3.5vh,3rem)]">
                  <div className="max-w-xl flex flex-col items-start text-left space-y-4 md:space-y-[clamp(0.75rem,2vh,1.25rem)] animate-fade-in">

                    {/* Greeting + Logo */}
                    <div className="w-full max-w-md space-y-1">
                      <p className="text-xs font-semibold tracking-wide text-zinc-400 drop-shadow-md md:text-sm">{greeting}</p>
                      <img
                        src="/brand/conexionlogo.svg"
                        alt="Conexión"
                        className="h-8 w-auto drop-shadow-2xl md:h-9 lg:h-10"
                      />
                    </div>

                    {/* Random Song */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={playRandomSong}
                      className="flex items-center gap-3 px-6 py-2.5 md:px-8 md:py-3 bg-[#FFC107] hover:bg-[#FFD54F] text-black font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-[#FFC107]/20 cursor-pointer"
                    >
                      <Shuffle className="w-5 h-5" />
                      <span>Canción aleatoria</span>
                    </button>

                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-zinc-400 pt-2 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Disc3 className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-200 font-bold">{totalAlbums}</span> discos
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span className="flex items-center gap-1.5">
                        <Music className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-200 font-bold">{totalTracks}</span> canciones
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-200 font-bold">{totalMinutes}</span> min
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DISCOS — Cover Flow 3D */}
              <div className="relative max-w-[1400px] mx-auto w-full px-0 md:px-8 lg:px-12">
                <AppleCoverFlow
                  items={albums.map((album, index) => ({
                    id: album.id,
                    title: album.disabled ? `Disco ${index + 1}` : album.title,
                    image: album.disabled
                      ? "/cd/cover_cover_conexion.png"
                      : (album.coverImage ?? "/cd/cover_cover_conexion.png").replace("/brand/", "/cd/"),
                    link: `?album=${encodeURIComponent(album.id)}`,
                    subtitle: `Por ${album.artist} • ${album.year}`,
                    disabled: album.disabled,
                  }))}
                  onActiveChange={(item) => setHoveredAlbumId(item?.id ?? null)}
                  onOpen={(item) => router.push(item.link, { scroll: false })}
                />
              </div>

            </div>
          ) : (
            /* ========================================================================= */
            /* ALBUM DETAILS VIEW                                                        */
            /* ========================================================================= */
            <div className="relative z-10 flex-1 min-h-0 w-full bg-[#080808] p-2 text-white md:p-3 flex flex-col">
            <div 
              ref={mainRef}
              onScroll={handleScroll}
              className="relative flex flex-1 min-h-0 w-full flex-col overflow-y-auto overflow-x-hidden rounded-xl bg-[#121212]"
            >

              {/* BACKGROUND IMAGE (Top Right - Desktop) */}
              <div className="absolute top-0 right-0 w-full md:w-3/5 lg:w-[750px] xl:w-[850px] max-w-full h-[50vh] min-h-[400px] overflow-hidden pointer-events-none z-0 hidden md:block rounded-tr-xl">
                <BackgroundCrossfade currentBg={currentBg} albums={albums} slides={slides} />
                <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-to-r from-[#121212] to-transparent z-10" />
                <div className="absolute left-0 right-0 bottom-0 h-1/4 bg-gradient-to-t from-[#121212] to-transparent z-10" />
              </div>

              {/* Header — matches Home header position */}
              <header className={`sticky top-0 z-30 flex flex-wrap items-center gap-3 rounded-t-xl p-4 md:px-7 md:py-5 lg:flex-nowrap transition-colors ${showStickyHeader
                ? "bg-[#121212]/95 backdrop-blur-xl"
                : ""
                }`}>

                {/* Centered Logo */}
                <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 pointer-events-none z-40 ${showStickyHeader ? 'opacity-80' : 'opacity-0'}`}>
                  <img src="/brand/conexionlogo.svg" alt="Conexión" className="h-5 md:h-6 w-auto shrink-0" />
                </div>

                {backButton(() => updateUrl(null, null), "Volver al inicio")}

                {/* Album details mini-summary */}
                <div className={`flex items-center gap-3 ${showStickyHeader ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <div className="w-8 h-8 rounded overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
                    {renderCoverArt(selectedAlbum.coverArtDesign, selectedAlbum.coverGradient, "w-full h-full", selectedAlbum.coverImage)}
                  </div>
                  <span className="font-bold text-sm text-white truncate max-w-[150px] sm:max-w-xs">{selectedAlbum.title}</span>
                </div>

                <div className="flex items-center gap-4 lg:ml-auto">
                  {/* Play button on sticky bar */}
                  <div className={`${showStickyHeader ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button
                      onClick={() => playEntireAlbum(selectedAlbum)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFC107] text-black shadow-lg shadow-black/30 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFC107] cursor-pointer"
                      aria-label={`Reproducir ${selectedAlbum.title}`}
                    >
                      <Play className="w-4 h-4 text-black" />
                    </button>
                  </div>
                </div>

                {/* Hueco del menú fijo: reserva su caja para que el play y el
                    resumen del disco nunca queden debajo. */}
                <div aria-hidden className="hidden h-12 w-[470px] shrink-0 xl:block" />
              </header>

              {/* Album Body Content Centered (mobile y tablet) */}
              <div className="relative mx-auto flex w-full max-w-[1400px] flex-col pb-44 md:pb-52 lg:hidden">

                {/* Album Hero Info */}
                <div className="relative z-10 flex flex-col items-center gap-6 px-4 md:px-7 pb-8 pt-5 md:flex-row md:items-end md:pb-10 md:pt-12">

                  {/* Album cover */}
                  <div className="flex aspect-square w-[min(62vw,240px)] shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-900 shadow-2xl shadow-black/60 md:w-52 lg:w-60">
                    {renderCoverArt(selectedAlbum.coverArtDesign, selectedAlbum.coverGradient, "w-full h-full", selectedAlbum.coverImage)}
                  </div>

                  {/* ALBUM METADATA */}
                  <div className="relative z-10 min-w-0 w-full flex-1 space-y-3 text-center md:text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white">Álbum</span>
                    <div className="w-full">
                      <h1 className="break-words text-4xl font-black leading-[0.95] tracking-[-0.04em] text-white drop-shadow-lg sm:text-5xl lg:text-7xl xl:text-8xl">{selectedAlbum.title}</h1>
                    </div>

                    {/* Album Intro (bajo del título, y arriba de la línea del año) */}
                    {(() => {
                      const resolvedIntro = selectedAlbum.aboutIntro && selectedAlbum.aboutIntro.trim()
                        ? selectedAlbum.aboutIntro
                        : (ALBUM_ABOUT_TEXTS[selectedAlbum.id]?.intro || ALBUM_ABOUT_TEXTS[slugify(selectedAlbum.title)]?.intro || (selectedAlbum.id === "blackout" || slugify(selectedAlbum.title) === "blackout" ? ALBUM_ABOUT_TEXTS["blackout"]?.intro : undefined));

                      if (!resolvedIntro) return null;

                      return (
                        <p className="max-w-3xl whitespace-pre-wrap py-1 text-sm font-medium leading-relaxed text-zinc-300 animate-fade-in">
                          {resolvedIntro}
                        </p>
                      );
                    })()}

                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs md:justify-start md:text-sm">
                      <div className="flex items-center gap-1 font-bold text-white">
                        <Music className="w-4 h-4" />
                        <span>{selectedAlbum.creator}</span>
                      </div>
                      <span className="text-zinc-400 md:text-zinc-600">•</span>
                      <span className="text-white md:text-zinc-300 font-semibold">{selectedAlbum.year}</span>
                      <span className="text-zinc-400 md:text-zinc-600">•</span>
                      <span className="text-zinc-300 md:text-zinc-400">{selectedAlbum.tracksCount}</span>
                      <span className="text-zinc-400 md:text-zinc-600">•</span>
                      <span className="text-zinc-300 md:text-zinc-400">{selectedAlbum.durationText}</span>
                    </div>
                  </div>
                </div>


                {/* Playback controls */}
                <div className="relative z-10 flex items-center gap-5 border-t border-white/5 bg-gradient-to-b from-black/15 to-transparent px-4 md:px-7 py-6">
                  <button
                    onClick={() => playEntireAlbum(selectedAlbum)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFC107] text-black shadow-lg shadow-black/40 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFC107]"
                    aria-label={`Reproducir ${selectedAlbum.title}`}
                  >
                    <Play className="h-6 w-6 translate-x-0.5" fill="currentColor" />
                  </button>
                  <button
                    onClick={() => setIsShuffle((value) => !value)}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFC107] ${isShuffle ? "text-[#FFC107]" : "text-zinc-400 hover:text-white"}`}
                    aria-label={isShuffle ? "Desactivar reproducción aleatoria" : "Activar reproducción aleatoria"}
                    aria-pressed={isShuffle}
                  >
                    <Shuffle className="h-6 w-6" />
                  </button>
                </div>

                {/* Track List */}
                <div className="relative z-10 px-4 md:px-7 pb-16 md:pb-24 mt-8 md:mt-12">
                  <div className="w-full">

                    <div className="grid grid-cols-12 gap-4 border-b border-white/10 px-3 py-3 text-xs font-medium text-zinc-400">
                      <div className="col-span-8 md:col-span-7"># &nbsp;&nbsp; Título</div>
                      <div className="col-span-4 hidden md:block">Álbum</div>
                      <div className="col-span-4 md:col-span-1 text-right">Duración</div>
                    </div>

                    <div className="mt-2">
                      {selectedAlbum.tracks.map((track, index) => {
                        const isTrackActive = currentTrack && currentTrack.id === track.id;
                        return (
                          <div
                            key={track.id}
                            onClick={() => handleTrackSelectInAlbum(selectedAlbum.tracks, index)}
                            className={`group grid min-h-14 grid-cols-12 items-center gap-4 rounded-md px-3 py-2 transition-colors cursor-pointer ${isTrackActive
                              ? "bg-white/10"
                              : "hover:bg-white/5"
                              }`}
                          >

                            {/* Title Info */}
                            <div className="col-span-8 md:col-span-7 flex items-center gap-3 min-w-0">
                              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center text-sm text-zinc-400">
                                <span className="group-hover:hidden">{isTrackActive && isPlaying ? <span className="text-[#FFC107]">♪</span> : index + 1}</span>
                                <span className="hidden group-hover:block">
                                  {isTrackActive && isPlaying ? <Pause className="h-4 w-4 text-white" fill="currentColor" /> : <Play className="h-4 w-4 text-white" fill="currentColor" />}
                                </span>
                              </div>
                              <div className="truncate">
                                <span className={`block truncate text-sm font-medium ${isTrackActive ? 'text-[#FFC107]' : 'text-white'}`}>
                                  {track.title}
                                </span>
                                <span className="block text-zinc-400 text-xs truncate group-hover:text-zinc-300 mt-0.5">
                                  {track.artist}
                                </span>
                              </div>
                            </div>

                            {/* Album info & Stats */}
                            <div className="col-span-4 hidden md:block text-zinc-400 text-sm truncate group-hover:text-zinc-300">
                              <span className="block truncate">{track.album}</span>
                            </div>

                            {/* Duration, Like & Chevron */}
                            <div className="col-span-4 md:col-span-1 flex items-center justify-end gap-3 text-zinc-400 text-sm">
                              <button
                                onClick={(e) => handleLike(e, track.id, track.likes)}
                                className={`flex min-h-9 items-center gap-1 rounded px-1 transition-colors cursor-pointer ${localLikes[track.id] && localLikes[track.id] > track.likes ? 'text-[#FFC107]' : 'text-zinc-500 hover:text-[#FFC107]'}`}
                                title="Me gusta"
                                aria-label={`Me gusta ${track.title}`}
                              >
                                <HandIcon className={`w-3.5 h-3.5 ${localLikes[track.id] && localLikes[track.id] > track.likes ? 'text-[#FFC107]' : ''}`} />
                                <span className="text-xs">{localLikes[track.id] ?? track.likes}</span>
                              </button>
                              <span className="font-mono text-xs">{formatTime(track.duration)}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateUrl(selectedAlbum.id, track.title);
                                }}
                                className="flex min-h-9 min-w-9 items-center justify-center rounded text-zinc-500 transition-colors hover:text-[#FFC107] cursor-pointer"
                                title="Ver letra"
                                aria-label={`Ver letra de ${track.title}`}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

              </div>

              {/* ===================================================================== */}
              {/* DESKTOP: ficha del disco a dos columnas (info + tracklist)            */}
              {/* ===================================================================== */}
              <div className="relative z-10 mx-auto hidden w-full max-w-[1400px] grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] items-start gap-x-14 gap-y-6 px-4 md:px-7 pb-44 pt-10 lg:grid xl:gap-x-14">
                
                {/* ROW 1: Title and Intro (Left column) */}
                <div className="col-span-1 flex flex-col w-full max-w-[420px]">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-300">Álbum</span>
                    <span className="font-mono text-xs font-semibold text-zinc-400">{selectedAlbum.year}</span>
                  </div>

                  <h1 className="mt-2 break-words text-6xl font-black leading-[0.9] tracking-[-0.04em] text-white drop-shadow-lg xl:text-7xl">
                    {selectedAlbum.title}
                  </h1>

                  {(() => {
                    const resolvedIntro = selectedAlbum.aboutIntro && selectedAlbum.aboutIntro.trim()
                      ? selectedAlbum.aboutIntro
                      : (ALBUM_ABOUT_TEXTS[selectedAlbum.id]?.intro || ALBUM_ABOUT_TEXTS[slugify(selectedAlbum.title)]?.intro);

                    if (!resolvedIntro) return null;

                    return (
                      <p className="mt-5 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-300 animate-fade-in">
                        {resolvedIntro}
                      </p>
                    );
                  })()}
                </div>
                
                {/* ROW 1: Right column (Empty to align tracklist with cover) */}
                <div className="col-span-1"></div>

                {/* ROW 2: Cover & Stats (Left column) */}
                <div className="col-span-1 flex flex-col lg:sticky lg:top-24 w-full max-w-[420px] self-start">
                  <div className="aspect-square w-full overflow-hidden rounded-[20px] bg-zinc-900 shadow-2xl shadow-black/60">
                    {renderCoverArt(selectedAlbum.coverArtDesign, selectedAlbum.coverGradient, "w-full h-full", selectedAlbum.coverImage)}
                  </div>

                  {/* Resumen del disco: likes acumulados, duración y número de canciones */}
                  <div className="mt-7 grid w-full grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center gap-2.5">
                      <Heart className="h-5 w-5 text-zinc-300" />
                      <span className="text-[11px] text-zinc-400">Te gusta</span>
                    </div>
                    <div className="flex flex-col items-center gap-2.5">
                      <Hourglass className="h-5 w-5 text-zinc-300" />
                      <span className="text-[11px] text-zinc-400">{selectedAlbum.durationText}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2.5">
                      <Disc3 className="h-5 w-5 text-zinc-300" />
                      <span className="text-[11px] text-zinc-400">{selectedAlbum.tracksCount}</span>
                    </div>
                  </div>
                </div>

                {/* ROW 2: Tracklist (Right column) */}
                <div className="col-span-1 flex flex-col gap-1">
                  {selectedAlbum.tracks.map((track, index) => {
                    const isTrackActive = currentTrack && currentTrack.id === track.id;
                    const trackLikes = localLikes[track.id] ?? track.likes;

                    return (
                      <div
                        key={track.id}
                        onClick={() => handleTrackSelectInAlbum(selectedAlbum.tracks, index)}
                        className={`group flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 transition-colors ${isTrackActive
                          ? "bg-black"
                          : "bg-transparent hover:bg-white/[0.04]"
                          }`}
                      >
                        {/* Índice / indicador de reproducción */}
                        <div className="flex w-8 shrink-0 items-center justify-center">
                          {isTrackActive ? (
                            isPlaying
                              ? <Pause className="h-4 w-4 text-[#FFC107]" fill="currentColor" />
                              : <Play className="h-4 w-4 text-[#FFC107]" fill="currentColor" />
                          ) : (
                            <>
                              <span className="font-mono text-xs text-zinc-500 group-hover:hidden">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <Play className="hidden h-4 w-4 text-white group-hover:block" fill="currentColor" />
                            </>
                          )}
                        </div>

                        {/* Título y duración */}
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <span className="block truncate text-[14px] font-bold text-white">
                            {track.title}
                          </span>
                          <span className="mt-0.5 block font-mono text-[11px] text-zinc-500">
                            {formatTime(track.duration)}
                          </span>
                        </div>

                        {/* Me gusta */}
                        <button
                          onClick={(e) => handleLike(e, track.id, track.likes)}
                          className="flex min-h-9 shrink-0 items-center gap-1.5 rounded px-2 transition-colors cursor-pointer text-zinc-500 hover:text-white"
                          title="Me gusta"
                          aria-label={`Me gusta ${track.title}`}
                        >
                          <HandIcon className="h-4 w-4" />
                          <span className="text-[11px]">{trackLikes}</span>
                        </button>

                        {/* Más opciones (3 puntos) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateUrl(selectedAlbum.id, track.title);
                          }}
                          className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded transition-colors cursor-pointer text-zinc-500 hover:text-white"
                          title="Opciones"
                          aria-label={`Opciones de ${track.title}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
            </div>
          )}

        </main>

        {/* GLOBAL PLAYER BAR: solo aparece cuando hay una canción seleccionada. */}
        <AnimatePresence mode="wait">
          {currentTrack && (
            <motion.div
              key="global-player"
              role="region"
              aria-label={`Reproduciendo ${currentTrack.title}`}
              initial={{
                opacity: 0,
                transform: reduceMotion
                  ? "translateX(-50%)"
                  : "translate(-50%, -125%)",
              }}
              animate={{ opacity: 1, transform: "translate(-50%, 0%)" }}
              exit={{
                opacity: 0,
                transform: reduceMotion
                  ? "translateX(-50%)"
                  : "translate(-50%, -125%)",
              }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="fixed bottom-[88px] md:bottom-[112px] left-1/2 w-[calc(100%-2rem)] max-w-[720px] bg-zinc-950/45 backdrop-blur-md border border-white/10 rounded-full z-45 shadow-xl shadow-black/60 px-4 md:px-6 py-2 md:py-2.5 will-change-transform"
            >
          <div className="flex items-center justify-between h-12 md:h-14 gap-3 md:gap-4 w-full">

            {/* Track info */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 md:flex-none md:w-[200px] lg:w-[220px] shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
                {renderCoverArt(currentTrack.coverArtDesign, currentTrack.coverGradient, "w-full h-full", currentTrack.coverImage)}
              </div>
              <div className="truncate min-w-0 pr-1">
                <span className="block font-bold text-xs md:text-sm truncate text-white">{currentTrack.title}</span>
                <span className="block text-zinc-400 text-[10px] md:text-xs truncate">{currentTrack.artist}</span>
              </div>
            </div>

            {/* Desktop: transport controls + seek bar */}
            <div className="hidden md:flex flex-col items-center flex-1 gap-1 min-w-0 max-w-[260px] lg:max-w-[280px] mx-auto">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrev}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all cursor-pointer shadow-md"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current text-black" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-black" />
                  )}
                </button>
                <button
                  onClick={handleNext}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>
              </div>
              <div className="flex items-center gap-2 w-full text-[10px] text-zinc-400 font-mono">
                <span className="shrink-0">{formatTime(displayTime)}</span>
                <div
                  onClick={handleSeek}
                  className="flex-1 bg-zinc-800/80 h-1 rounded-full overflow-hidden cursor-pointer"
                >
                  <div
                    className="bg-zinc-100 h-full transition-all duration-300 pointer-events-none"
                    style={{ width: `${displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0}%` }}
                  />
                </div>
                <span className="shrink-0">{formatTime(displayDuration)}</span>
              </div>
            </div>

            {/* Desktop: volume */}
            <div className="hidden md:flex items-center gap-2 md:w-[160px] lg:w-[180px] shrink-0 justify-end text-zinc-400">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="hover:text-white cursor-pointer shrink-0"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 lg:w-20 accent-zinc-100 bg-zinc-800 h-1 rounded-lg appearance-none cursor-pointer"
              />
              {currentTrack && (
                <button
                  onClick={(e) => {
                    const hasLiked = (localLikes[currentTrack.id] ?? currentTrack.likes) > currentTrack.likes;
                    if (!hasLiked) {
                      handleLike(e, currentTrack.id, currentTrack.likes);
                    }
                  }}
                  className={`hover:scale-110 transition-transform cursor-pointer shrink-0 ml-1 ${(localLikes[currentTrack.id] ?? currentTrack.likes) > currentTrack.likes
                    ? 'text-yellow-500'
                    : 'hover:text-yellow-500'
                    }`}
                  title={(localLikes[currentTrack.id] ?? currentTrack.likes) > currentTrack.likes ? "Te gusta" : "Dar me gusta"}
                >
                  <HandIcon className={`w-4 h-4 ${(localLikes[currentTrack.id] ?? currentTrack.likes) > currentTrack.likes
                    ? 'text-yellow-500'
                    : ''
                    }`} />
                </button>
              )}
            </div>

            {/* Mobile: compact controls */}
            <div className="flex md:hidden items-center gap-3 shrink-0">
              <button
                onClick={handlePlayPause}
                className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3 fill-current text-black" />
                ) : (
                  <Play className="w-3 h-3 text-black" />
                )}
              </button>
              <button
                onClick={handleNext}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* Mobile: progress bar at the top of the player */}
          <div className="absolute top-0 left-10 right-10 h-0.5 bg-zinc-800/80 overflow-hidden md:hidden rounded-full">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0}%` }}
            />
          </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MENÚ FLOTANTE DESKTOP — fijo al viewport, idéntico en todas las vistas */}
        {floatingTopNav}

        {/* BOTTOM NAVIGATION BAR (all screen sizes, per wireframe) */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 md:h-20 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-900 flex justify-around md:justify-end md:gap-4 items-center md:pr-8 z-50 xl:hidden">
          <button
            onClick={goHome}
            className={`flex-1 md:flex-none w-full md:w-32 lg:w-40 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 cursor-pointer transition-colors ${isHomeActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <HomeIcon className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-[10px] md:text-[15px] font-medium">Inicio</span>
          </button>
          <button
            onClick={openAbout}
            className={`flex-1 md:flex-none w-full md:w-32 lg:w-40 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 cursor-pointer transition-colors ${isAboutOpen ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Info className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-[10px] md:text-[15px] font-medium">Sobre conexión</span>
          </button>
          {/* Ocultado temporalmente
          <button
            onClick={() => router.push("?view=marketplace", { scroll: false })}
            className={`flex-1 md:flex-none w-full md:w-32 lg:w-40 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 cursor-pointer transition-colors ${isMarketplaceOpen ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Store className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-[10px] md:text-[15px] font-medium">Marketplace</span>
          </button>
          */}
          <button
            onClick={() => router.push("?view=universo", { scroll: false })}
            className={`flex-1 md:flex-none w-full md:w-32 lg:w-40 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 cursor-pointer transition-colors ${isUniversoOpen ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Globe className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-[10px] md:text-[15px] font-medium">Universo</span>
          </button>
        </nav>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 z-[100] animate-fade-in-up">
            <div className="flex items-center gap-3 bg-zinc-950/95 border border-[#FFC400]/30 px-5 py-3 rounded-xl shadow-2xl shadow-black/85 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFC400] animate-pulse shrink-0" />
              <p className="text-zinc-200 text-xs md:text-sm font-semibold tracking-wide">
                {toastMessage}
              </p>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
