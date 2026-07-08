import "server-only";
import { ConvexHttpClient } from "convex/browser";

// Cliente HTTP de Convex, solo para uso en servidor (rutas API y RSC).
// La URL nunca se referencia en código cliente, así que no viaja al bundle.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;

if (!convexUrl) {
  console.error("Falta NEXT_PUBLIC_CONVEX_URL en las variables de entorno.");
}

export const convex = new ConvexHttpClient(convexUrl ?? "http://127.0.0.1:3210");
