// Letras sincronizadas en formato LRC: cada línea puede empezar con una marca
// de tiempo "[mm:ss.xx]". Las etiquetas de sección como "[Coro]" no llevan
// dígitos, así que se tratan como texto normal.

export type LyricLine = {
  // Segundo en que empieza la línea; null si la línea no tiene marca.
  time: number | null;
  text: string;
};

const TIMESTAMP_RE = /^\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]\s?/;

export function parseLyrics(raw: string): LyricLine[] {
  return raw.split(/\r?\n/).map((line) => {
    const match = line.match(TIMESTAMP_RE);
    if (!match) return { time: null, text: line };
    const [, min, sec, frac] = match;
    const fraction = frac ? Number(frac) / 10 ** frac.length : 0;
    return {
      time: Number(min) * 60 + Number(sec) + fraction,
      text: line.slice(match[0].length),
    };
  });
}

export function isSynced(lines: LyricLine[]): boolean {
  return lines.some((l) => l.time !== null);
}

// Índice de la última línea con marca cuyo tiempo ya pasó; -1 antes de la
// primera marca.
export function activeLineIndex(lines: LyricLine[], time: number): number {
  let active = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].time;
    if (t === null) continue;
    if (t <= time) active = i;
    else break;
  }
  return active;
}

export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, seconds);
  const min = Math.floor(total / 60);
  const sec = Math.floor(total % 60);
  const cs = Math.floor((total * 100) % 100);
  return `[${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs).padStart(2, "0")}]`;
}

export function serializeLyrics(lines: LyricLine[]): string {
  return lines
    .map((l) => (l.time === null ? l.text : `${formatTimestamp(l.time)}${l.text}`))
    .join("\n");
}

// Líneas que se cantan: ni vacías ni etiquetas de sección como "[Coro]".
export function isSungLine(line: LyricLine): boolean {
  const text = line.text.trim();
  return text !== "" && !/^\[[^\]]*\]$/.test(text);
}

/**
 * Sincronización automática aproximada para letras sin marcas: reparte las
 * líneas cantadas entre el final de la intro y el cierre de la canción, con
 * un peso según su longitud y una pausa extra entre estrofas (donde suele
 * haber instrumental). Es un punto de partida; lo exacto se marca a mano.
 */
export function estimateTimings(lines: LyricLine[], duration: number): LyricLine[] {
  if (!(duration > 0)) return lines;
  const sung = lines.map(isSungLine);
  if (!sung.some(Boolean)) return lines;

  const start = Math.min(duration * 0.08, 20);
  const end = duration * 0.9;
  const lineWeight = (l: LyricLine) => Math.max(l.text.trim().length, 12);
  const sungWeights = lines.filter((_, i) => sung[i]).map(lineWeight);
  const stanzaGap = (sungWeights.reduce((a, b) => a + b, 0) / sungWeights.length) * 1.5;

  // Peso acumulado antes de cada línea cantada.
  const offsets: number[] = [];
  let total = 0;
  let pendingGap = false;
  lines.forEach((line, i) => {
    if (!sung[i]) {
      if (!line.text.trim() && total > 0) pendingGap = true;
      return;
    }
    if (pendingGap) total += stanzaGap;
    pendingGap = false;
    offsets[i] = total;
    total += lineWeight(line);
  });

  const secondsPerWeight = (end - start) / total;
  return lines.map((line, i) =>
    sung[i] ? { ...line, time: Math.round((start + offsets[i] * secondsPerWeight) * 100) / 100 } : line
  );
}
