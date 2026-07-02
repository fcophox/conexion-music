#!/usr/bin/env node
/**
 * Convierte una pista de audio a HLS cifrado con AES-128.
 *
 * Uso:
 *   node scripts/protect-audio.mjs <archivo-de-audio> <trackId>
 *   node scripts/protect-audio.mjs ~/musica/papeles-rotos.wav 101
 *
 * Resultado:
 *   media/hls/<trackId>/index.m3u8   playlist (con URI de clave placeholder)
 *   media/hls/<trackId>/seg_XXX.ts   segmentos cifrados (inútiles sin la clave)
 *   media/keys/<trackId>.key         clave AES de 16 bytes (NUNCA se sirve estáticamente)
 *
 * La clave solo se entrega en tiempo de reproducción por /api/stream/<id>/key,
 * validando sesión + token firmado con expiración.
 */
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const [input, trackId] = process.argv.slice(2);

if (!input || !trackId || !/^[a-zA-Z0-9_-]{1,64}$/.test(trackId)) {
  console.error("Uso: node scripts/protect-audio.mjs <archivo-de-audio> <trackId>");
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`No existe el archivo: ${input}`);
  process.exit(1);
}

const root = path.join(import.meta.dirname, "..");
const outDir = path.join(root, "media", "hls", trackId);
const keyPath = path.join(root, "media", "keys", `${trackId}.key`);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(path.dirname(keyPath), { recursive: true });

// Clave e IV aleatorios por pista
const key = randomBytes(16);
const iv = randomBytes(16).toString("hex");
writeFileSync(keyPath, key, { mode: 0o600 });

// El keyinfo le dice a ffmpeg: URI que irá en el m3u8, ruta local de la clave, IV.
// La URI es un placeholder que la API reescribe con un token firmado al servir.
const keyInfoPath = path.join(tmpdir(), `cnx-keyinfo-${trackId}-${Date.now()}`);
writeFileSync(keyInfoPath, `__KEY_URI__\n${keyPath}\n${iv}\n`, { mode: 0o600 });

try {
  execFileSync(
    "ffmpeg",
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", input,
      "-vn",
      "-c:a", "aac",
      "-b:a", "192k",
      "-hls_time", "6",
      "-hls_list_size", "0",
      "-hls_playlist_type", "vod",
      "-hls_key_info_file", keyInfoPath,
      "-hls_segment_filename", path.join(outDir, "seg_%03d.ts"),
      path.join(outDir, "index.m3u8"),
    ],
    { stdio: "inherit" }
  );
} finally {
  rmSync(keyInfoPath, { force: true });
}

console.log(`✔ Pista ${trackId} protegida en media/hls/${trackId}/ (clave en media/keys/${trackId}.key)`);
