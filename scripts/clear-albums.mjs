#!/usr/bin/env node
/**
 * Borra todas las canciones de los álbumes Géminis, Vertical y Doble Cero.
 * Uso: node scripts/clear-albums.mjs
 */
import { readFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";

// Leer URL de .env.local
const envContent = readFileSync(".env.local", "utf-8");
const match = envContent.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/);
if (!match) {
  console.error("No se encontró NEXT_PUBLIC_CONVEX_URL en .env.local");
  process.exit(1);
}
const url = match[1].trim();

// Importar API generada
const { api } = await import("../convex/_generated/api.js");

const client = new ConvexHttpClient(url);

const albumIds = ["geminis", "vertical", "doble-cero"];

for (const albumId of albumIds) {
  console.log(`Borrando canciones de álbum: ${albumId}...`);
  const result = await client.mutation(api.catalog.deleteAlbumTracks, { albumId });
  console.log(`  ✔ ${result.deleted} canciones eliminadas de "${albumId}"`);
}

console.log("\n✔ Listo. Los discos Géminis, Vertical y Doble Cero ahora están vacíos.");
