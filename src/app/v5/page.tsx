import type { Metadata } from "next";

// Punto de partida de la siguiente interfaz (v5). Está vacía a propósito: la
// ruta existe para poder ir construyendo encima sin tocar la v4, que es la que
// hoy vive en la raíz. Fuera de los buscadores mientras sea un borrador.
export const metadata: Metadata = {
  title: "Conexión — v5",
  robots: { index: false, follow: false },
};

export default function V5Page() {
  return <main className="flex flex-1 flex-col" />;
}
