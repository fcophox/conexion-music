import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Devuelve el catálogo completo con la misma forma que el tipo Album de la app
// (id de negocio, tracks anidados y ordenados).
export const getCatalog = query({
  args: {},
  handler: async (ctx) => {
    const albums = await ctx.db.query("albums").collect();
    albums.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return Promise.all(
      albums.map(async (a) => {
        const tracks = await ctx.db
          .query("tracks")
          .withIndex("by_albumId", (q) => q.eq("albumId", a.albumId))
          .collect();
        tracks.sort((t1, t2) => (t1.sortOrder ?? 0) - (t2.sortOrder ?? 0));

        return {
          id: a.albumId || String(a._id),
          title: a.title,
          artist: a.artist,
          description: a.description,
          aboutIntro: a.aboutIntro,
          aboutDetails: a.aboutDetails,
          creator: a.creator,
          tracksCount: a.tracksCount,
          durationText: a.durationText,
          coverGradient: a.coverGradient,
          coverArtDesign: a.coverArtDesign,
          coverImage: a.coverImage,
          year: a.year,
          disabled: a.disabled,
          tracks: tracks.map((t) => ({
            id: t.trackId,
            title: t.title,
            artist: t.artist,
            album: t.album,
            duration: t.duration,
            coverGradient: t.coverGradient,
            coverArtDesign: t.coverArtDesign,
            coverImage: t.coverImage,
            bgImage: t.bgImage,
            lyrics: t.lyrics,
            disabled: t.disabled,
          })),
        };
      })
    );
  },
});

// Estadísticas de todas las pistas (plays y likes).
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const stats = await ctx.db.query("trackStats").collect();
    return stats.map((s) => ({ trackId: s.trackId, plays: s.plays, likes: s.likes }));
  },
});

// Las mutaciones de Convex son transaccionales: el leer-incrementar-escribir
// ya no tiene la condición de carrera que existía con Supabase.
export const incrementPlay = mutation({
  args: { trackId: v.number() },
  handler: async (ctx, { trackId }) => {
    const stat = await ctx.db
      .query("trackStats")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!stat) {
      await ctx.db.insert("trackStats", { trackId, plays: 1, likes: 0 });
      return 1;
    }
    await ctx.db.patch(stat._id, { plays: stat.plays + 1 });
    return stat.plays + 1;
  },
});

export const incrementLike = mutation({
  args: { trackId: v.number() },
  handler: async (ctx, { trackId }) => {
    const stat = await ctx.db
      .query("trackStats")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!stat) {
      await ctx.db.insert("trackStats", { trackId, plays: 0, likes: 1 });
      return 1;
    }
    await ctx.db.patch(stat._id, { likes: stat.likes + 1 });
    return stat.likes + 1;
  },
});

export const reorderTracks = mutation({
  args: { orderedTrackIds: v.array(v.number()) },
  handler: async (ctx, { orderedTrackIds }) => {
    for (let i = 0; i < orderedTrackIds.length; i++) {
      const track = await ctx.db
        .query("tracks")
        .withIndex("by_trackId", (q) => q.eq("trackId", orderedTrackIds[i]))
        .unique();
      if (track) await ctx.db.patch(track._id, { sortOrder: i });
    }
    return { ok: true as const };
  },
});

export const reorderAlbums = mutation({
  args: { orderedAlbumIds: v.array(v.string()) },
  handler: async (ctx, { orderedAlbumIds }) => {
    const allAlbums = await ctx.db.query("albums").collect();
    for (let i = 0; i < orderedAlbumIds.length; i++) {
      const targetId = orderedAlbumIds[i];
      const album = allAlbums.find((a) => a.albumId === targetId || String(a._id) === targetId);
      if (album) {
        await ctx.db.patch(album._id, { sortOrder: i });
      }
    }
    return { ok: true as const };
  },
});

export const createAlbum = mutation({
  args: {
    title: v.string(),
    coverImage: v.optional(v.string()),
    aboutIntro: v.optional(v.string()),
    aboutDetails: v.optional(v.string()),
  },
  handler: async (ctx, { title, coverImage, aboutIntro, aboutDetails }) => {
    const allAlbums = await ctx.db.query("albums").collect();
    const sortOrder = allAlbums.length;

    // Generate a slug from the title
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      || `album-${Date.now()}`;

    // Ensure uniqueness
    const existing = allAlbums.find((a) => a.albumId === slug);
    const albumId = existing ? `${slug}-${Date.now()}` : slug;

    await ctx.db.insert("albums", {
      albumId,
      title,
      artist: "conexión",
      description: aboutDetails ?? "",
      aboutIntro,
      aboutDetails,
      creator: "conexión",
      tracksCount: "0 canciones",
      durationText: "0 min",
      coverGradient: "from-zinc-800 to-black",
      coverArtDesign: "image",
      coverImage: coverImage ?? "/cd/cover_cover_conexion.png",
      year: new Date().getFullYear(),
      disabled: true,
      sortOrder,
    });

    return { ok: true as const, albumId };
  },
});


export const toggleAlbumStatus = mutation({
  args: { albumId: v.string(), disabled: v.boolean() },
  handler: async (ctx, { albumId, disabled }) => {
    let album = await ctx.db
      .query("albums")
      .withIndex("by_albumId", (q) => q.eq("albumId", albumId))
      .unique();
    if (!album) {
      const allAlbums = await ctx.db.query("albums").collect();
      album = allAlbums.find((a) => a.albumId === albumId || String(a._id) === albumId) ?? null;
    }
    if (!album) return { ok: false as const, error: "Álbum no encontrado" };
    await ctx.db.patch(album._id, { disabled });
    return { ok: true as const };
  },
});

export const toggleTrackStatus = mutation({
  args: { trackId: v.number(), disabled: v.boolean() },
  handler: async (ctx, { trackId, disabled }) => {
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!track) return { ok: false as const, error: "Canción no encontrada" };
    await ctx.db.patch(track._id, { disabled });
    return { ok: true as const };
  },
});

export const moveTrackToAlbum = mutation({
  args: { trackId: v.number(), targetAlbumId: v.string() },
  handler: async (ctx, { trackId, targetAlbumId }) => {
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!track) return { ok: false as const, error: "Canción no encontrada" };

    const targetAlbum = await ctx.db
      .query("albums")
      .withIndex("by_albumId", (q) => q.eq("albumId", targetAlbumId))
      .unique();
    if (!targetAlbum) return { ok: false as const, error: "Álbum destino no encontrado" };

    const targetTracks = await ctx.db
      .query("tracks")
      .withIndex("by_albumId", (q) => q.eq("albumId", targetAlbumId))
      .collect();
    const maxSortOrder = targetTracks.length > 0
      ? Math.max(...targetTracks.map((t) => t.sortOrder))
      : 0;

    await ctx.db.patch(track._id, {
      albumId: targetAlbumId,
      album: targetAlbum.title,
      sortOrder: maxSortOrder + 1,
    });

    return { ok: true as const };
  },
});

export const getNextTrackId = query({
  args: {},
  handler: async (ctx) => {
    const tracks = await ctx.db.query("tracks").collect();
    if (tracks.length === 0) return 101;
    const maxId = Math.max(...tracks.map((t) => t.trackId));
    return maxId + 1;
  },
});

export const addTrack = mutation({
  args: {
    trackId: v.number(),
    albumId: v.string(),
    title: v.string(),
    artist: v.string(),
    album: v.string(),
    duration: v.number(),
    coverGradient: v.string(),
    coverArtDesign: v.string(),
    coverImage: v.optional(v.string()),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tracks", {
      trackId: args.trackId,
      albumId: args.albumId,
      title: args.title,
      artist: args.artist,
      album: args.album,
      duration: args.duration,
      coverGradient: args.coverGradient,
      coverArtDesign: args.coverArtDesign,
      coverImage: args.coverImage,
      sortOrder: args.sortOrder,
    });
    await ctx.db.insert("trackStats", {
      trackId: args.trackId,
      plays: 0,
      likes: 0,
    });
    return { ok: true as const, trackId: args.trackId };
  },
});

export const renameTrack = mutation({
  args: { trackId: v.number(), title: v.string() },
  handler: async (ctx, { trackId, title }) => {
    const clean = title.trim();
    if (!clean || clean.length > 120) {
      return { ok: false as const, error: "Título inválido (1–120 caracteres)" };
    }
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!track) return { ok: false as const, error: "Canción no encontrada" };
    await ctx.db.patch(track._id, { title: clean });
    return { ok: true as const };
  },
});

// URL temporal de subida al storage de Convex. El navegador sube la imagen
// directo aquí (evita el límite de body de Vercel y el disco efímero).
export const generateImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

// Actualiza la imagen de fondo y/o la letra de una canción. Solo modifica los
// campos presentes en los argumentos; una cadena vacía en lyrics elimina la
// letra. La imagen vive en el storage de Convex: se guarda su URL pública en
// bgImage y el archivo anterior se borra al reemplazar o quitar.
export const updateTrackDetails = mutation({
  args: {
    trackId: v.number(),
    bgImageStorageId: v.optional(v.id("_storage")),
    removeImage: v.optional(v.boolean()),
    lyrics: v.optional(v.string()),
  },
  handler: async (ctx, { trackId, bgImageStorageId, removeImage, lyrics }) => {
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!track) return { ok: false as const, error: "Canción no encontrada" };

    const patch: {
      bgImage?: string | undefined;
      bgImageStorageId?: Id<"_storage"> | undefined;
      lyrics?: string | undefined;
    } = {};

    if (removeImage) {
      if (track.bgImageStorageId) await ctx.storage.delete(track.bgImageStorageId);
      patch.bgImage = undefined;
      patch.bgImageStorageId = undefined;
    } else if (bgImageStorageId) {
      const url = await ctx.storage.getUrl(bgImageStorageId);
      if (!url) return { ok: false as const, error: "Imagen no encontrada en storage" };
      if (track.bgImageStorageId) await ctx.storage.delete(track.bgImageStorageId);
      patch.bgImage = url;
      patch.bgImageStorageId = bgImageStorageId;
    }

    if (lyrics !== undefined) patch.lyrics = lyrics === "" ? undefined : lyrics;
    await ctx.db.patch(track._id, patch);

    const bgImage = removeImage ? undefined : patch.bgImage ?? track.bgImage;
    return { ok: true as const, bgImage };
  },
});

export const deleteAlbumTracks = mutation({
  args: { albumId: v.string() },
  handler: async (ctx, { albumId }) => {
    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_albumId", (q) => q.eq("albumId", albumId))
      .collect();

    for (const track of tracks) {
      // Borrar stats asociadas
      const stat = await ctx.db
        .query("trackStats")
        .withIndex("by_trackId", (q) => q.eq("trackId", track.trackId))
        .unique();
      if (stat) await ctx.db.delete(stat._id);
      // Borrar la pista
      await ctx.db.delete(track._id);
    }

    return { ok: true as const, deleted: tracks.length };
  },
});

export const deleteAlbum = mutation({
  args: { albumId: v.string() },
  handler: async (ctx, { albumId }) => {
    let album = await ctx.db
      .query("albums")
      .withIndex("by_albumId", (q) => q.eq("albumId", albumId))
      .unique();
    if (!album) {
      const allAlbums = await ctx.db.query("albums").collect();
      album = allAlbums.find((a) => a.albumId === albumId || String(a._id) === albumId) ?? null;
    }
    if (!album) return { ok: false as const, error: "Álbum no encontrado" };

    const tracks = await ctx.db
      .query("tracks")
      .withIndex("by_albumId", (q) => q.eq("albumId", album.albumId))
      .collect();

    for (const track of tracks) {
      const stat = await ctx.db
        .query("trackStats")
        .withIndex("by_trackId", (q) => q.eq("trackId", track.trackId))
        .unique();
      if (stat) await ctx.db.delete(stat._id);
      await ctx.db.delete(track._id);
    }

    await ctx.db.delete(album._id);
    return { ok: true as const };
  },
});

export const deleteTrack = mutation({
  args: { trackId: v.number() },
  handler: async (ctx, { trackId }) => {
    const track = await ctx.db
      .query("tracks")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (!track) return { ok: false as const, error: "Canción no encontrada" };

    // Borrar stats asociadas
    const stat = await ctx.db
      .query("trackStats")
      .withIndex("by_trackId", (q) => q.eq("trackId", trackId))
      .unique();
    if (stat) await ctx.db.delete(stat._id);

    // Borrar imagen en storage si la tiene
    if (track.bgImageStorageId) {
      await ctx.storage.delete(track.bgImageStorageId);
    }

    // Borrar la pista
    await ctx.db.delete(track._id);

    return { ok: true as const };
  },
});

export const updateAlbumDetails = mutation({
  args: {
    albumId: v.string(),
    title: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    year: v.optional(v.number()),
    aboutIntro: v.optional(v.string()),
    aboutDetails: v.optional(v.string()),
  },
  handler: async (ctx, { albumId, title, coverStorageId, year, aboutIntro, aboutDetails }) => {
    let album = await ctx.db
      .query("albums")
      .withIndex("by_albumId", (q) => q.eq("albumId", albumId))
      .unique();
    if (!album) {
      const allAlbums = await ctx.db.query("albums").collect();
      album = allAlbums.find((a) => a.albumId === albumId || String(a._id) === albumId) ?? null;
    }
    if (!album) return { ok: false as const, error: "Álbum no encontrado" };

    const patch: {
      title?: string;
      coverImage?: string;
      year?: number;
      aboutIntro?: string;
      aboutDetails?: string;
      description?: string;
    } = {};

    if (title !== undefined) {
      const clean = title.trim();
      if (!clean || clean.length > 120) {
        return { ok: false as const, error: "Título inválido (1–120 caracteres)" };
      }
      patch.title = clean;

      // Actualizar el nombre del álbum en sus pistas
      const tracks = await ctx.db
        .query("tracks")
        .withIndex("by_albumId", (q) => q.eq("albumId", albumId))
        .collect();
      for (const t of tracks) {
        await ctx.db.patch(t._id, { album: clean });
      }
    }

    if (coverStorageId) {
      const url = await ctx.storage.getUrl(coverStorageId);
      if (!url) return { ok: false as const, error: "Imagen no encontrada en storage" };
      patch.coverImage = url;

      // Actualizar la carátula de las canciones de este álbum
      const tracks = await ctx.db
        .query("tracks")
        .withIndex("by_albumId", (q) => q.eq("albumId", albumId))
        .collect();
      for (const t of tracks) {
        await ctx.db.patch(t._id, { coverImage: url });
      }
    }

    if (year !== undefined) {
      patch.year = year;
    }

    if (aboutIntro !== undefined) {
      patch.aboutIntro = aboutIntro;
    }

    if (aboutDetails !== undefined) {
      patch.aboutDetails = aboutDetails;
      patch.description = aboutDetails;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(album._id, patch);
    }

    return {
      ok: true as const,
      title: patch.title,
      coverImage: patch.coverImage,
      year: patch.year,
      aboutIntro: patch.aboutIntro,
      aboutDetails: patch.aboutDetails,
    };
  },
});

export const getMarketplaceProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("marketplace").collect();
    products.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return products.map(p => ({
      id: String(p._id),
      name: p.name,
      category: p.category,
      price: p.price,
      description: p.description || "",
      image: p.image,
      imageStorageId: p.imageStorageId,
    }));
  },
});

export const addMarketplaceProduct = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    price: v.number(),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.string()),
  },
  handler: async (ctx, { name, category, price, description, imageStorageId }) => {
    const products = await ctx.db.query("marketplace").collect();
    const sortOrder = products.length;

    let imageUrl = undefined;
    let storageId = undefined;
    if (imageStorageId) {
      storageId = imageStorageId as Id<"_storage">;
      const url = await ctx.storage.getUrl(storageId);
      if (url) {
        imageUrl = url;
      }
    }

    const productId = await ctx.db.insert("marketplace", {
      name,
      category,
      price,
      description,
      image: imageUrl,
      imageStorageId: storageId,
      sortOrder,
    });

    return { ok: true, id: productId };
  },
});

export const deleteMarketplaceProduct = mutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const product = await ctx.db.get(id as Id<"marketplace">);
    if (!product) {
      return { ok: false, error: "Producto no encontrado" };
    }

    if (product.imageStorageId) {
      try {
        await ctx.storage.delete(product.imageStorageId);
      } catch (err) {
        console.error("Error deleting product image from storage:", err);
      }
    }

    await ctx.db.delete(product._id);
    return { ok: true };
  },
});

export const seedMarketplaceIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("marketplace").first();
    if (existing) return { seeded: false };

    const initialProducts = [
      {
        name: "Vinilo 'Cero' (Edición Especial)",
        category: "Música",
        price: 34.99,
        image: "cero",
        description: "Vinilo de 180 gramos color negro translúcido. Incluye libreto con letras ilustradas."
      },
      {
        name: "CD 'Doble Cero' (Digipack)",
        category: "Música",
        price: 14.99,
        image: "doble-cero",
        description: "Formato CD de tres paneles con libreto exclusivo de 16 páginas."
      },
      {
        name: "Vinilo 'Géminis' (Doble Color)",
        category: "Música",
        price: 38.99,
        image: "geminis",
        description: "Edición coleccionista en doble vinilo color verde y negro marmoleado."
      },
      {
        name: "Camiseta 'Cero' Grunge",
        category: "Ropa",
        price: 24.99,
        image: "bg-gradient-to-br from-zinc-900 via-zinc-800 to-emerald-950",
        description: "Camiseta 100% algodón lavado tipo vintage con el logotipo del disco Cero en el pecho."
      },
      {
        name: "Sudadera Oversize Logo",
        category: "Ropa",
        price: 49.99,
        image: "bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-850",
        description: "Sudadera con capucha ultra cómoda de alto gramaje con bordado de la banda."
      },
      {
        name: "Póster Serigrafiado 'Cero'",
        category: "Pósteres",
        price: 19.99,
        image: "bg-gradient-to-br from-zinc-950 to-emerald-900/60",
        description: "Póster de 50x70 cm impreso a mano en papel de alta calidad. Numerado y firmado."
      },
      {
        name: "Tote Bag Conexión",
        category: "Accesorios",
        price: 12.99,
        image: "bg-gradient-to-br from-zinc-900 to-zinc-950",
        description: "Bolsa de tela de algodón orgánico negro con asas reforzadas."
      },
      {
        name: "Vinilo 'Vertical'",
        category: "Música",
        price: 32.99,
        image: "vertical",
        description: "Edición estándar en vinilo negro de 140g del último lanzamiento."
      }
    ];

    for (let i = 0; i < initialProducts.length; i++) {
      const p = initialProducts[i];
      await ctx.db.insert("marketplace", {
        name: p.name,
        category: p.category,
        price: p.price,
        description: p.description,
        image: p.image,
        sortOrder: i,
      });
    }

    return { seeded: true };
  },
});

