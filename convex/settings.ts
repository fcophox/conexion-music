import { query } from "./_generated/server";
import { v } from "convex/values";

// Comparación en tiempo constante (el runtime de Convex no expone
// crypto.timingSafeEqual de Node).
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

// Verifica la contraseña del panel sin exponer nunca su valor: no existe una
// query pública que devuelva el contenido de `settings`.
export const verifyManagementPassword = query({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "MANAGEMENT_PASSWORD"))
      .unique();
    if (!setting) throw new Error("MANAGEMENT_PASSWORD no encontrado en settings de Convex");
    return safeEqual(password, setting.value);
  },
});
