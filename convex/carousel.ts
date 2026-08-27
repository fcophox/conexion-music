import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Obtener todas las imágenes del carrusel ordenadas por sortOrder.
export const getSlides = query({
  args: {},
  handler: async (ctx) => {
    const slides = await ctx.db.query("carouselSlides").collect();
    slides.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return slides.map((s) => ({
      id: String(s._id),
      storageId: String(s.storageId),
      url: s.url,
    }));
  },
});

// Guardar una nueva imagen en el carrusel a partir de un storageId.
export const addSlide = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Archivo no encontrado en storage");

    const slides = await ctx.db.query("carouselSlides").collect();
    const maxSort = slides.reduce((max, s) => Math.max(max, s.sortOrder ?? 0), 0);

    const slideId = await ctx.db.insert("carouselSlides", {
      storageId,
      url,
      sortOrder: maxSort + 1,
    });

    return { id: String(slideId), url };
  },
});

// Borrar una imagen del carrusel por ID, y eliminarla del storage.
export const deleteSlide = mutation({
  args: {
    id: v.id("carouselSlides"),
  },
  handler: async (ctx, { id }) => {
    const slide = await ctx.db.get(id);
    if (!slide) throw new Error("Diapositiva no encontrada");

    await ctx.storage.delete(slide.storageId);
    await ctx.db.delete(id);
    return { ok: true };
  },
});

// Reordenar diapositivas según una lista ordenada de IDs.
export const reorderSlides = mutation({
  args: {
    orderedIds: v.array(v.id("carouselSlides")),
  },
  handler: async (ctx, { orderedIds }) => {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const slide = await ctx.db.get(id);
      if (slide) {
        await ctx.db.patch(id, { sortOrder: i });
      }
    }
    return { ok: true };
  },
});
