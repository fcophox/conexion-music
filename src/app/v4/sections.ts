// Secciones de la v4 y su dirección (slug en inglés). Cada ícono del menú
// lateral tiene la suya: /v4, /v4/playlist, /v4/albums, etc. La búsqueda no
// es una sección: se abre como modal sobre la sección actual.

export type MenuItemId = "home" | "music" | "albums" | "x";

export const V4_BASE = "/v4";

export const SECTION_SLUGS: Record<MenuItemId, string> = {
  home: "",
  music: "playlist",
  albums: "albums",
  x: "experience",
};

export const SECTION_TITLES: Record<MenuItemId, string> = {
  home: "Conexión",
  music: "Playlist",
  albums: "Discos",
  x: "Experience",
};

export function sectionPath(id: MenuItemId) {
  const slug = SECTION_SLUGS[id];
  return slug ? `${V4_BASE}/${slug}` : V4_BASE;
}

// Sección que corresponde a un slug; null si no existe.
export function sectionFromSlug(slug: string): MenuItemId | null {
  const match = (Object.keys(SECTION_SLUGS) as MenuItemId[]).find(
    (id) => SECTION_SLUGS[id] === slug
  );
  return match ?? null;
}

// Sección que corresponde a una ruta completa (cae en inicio si no reconoce).
export function sectionFromPath(pathname: string): MenuItemId {
  const slug = pathname.slice(V4_BASE.length).replace(/^\/+|\/+$/g, "");
  return sectionFromSlug(slug) ?? "home";
}

export function sectionDocumentTitle(id: MenuItemId) {
  return id === "home" ? "Conexión — v4" : `${SECTION_TITLES[id]} — Conexión`;
}
