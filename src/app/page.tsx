import HomeClient from "./HomeClient";
import { getCatalog } from "@/lib/catalog";

// Render dinámico: lee el catálogo (data/catalog.json) en cada request, así el
// orden que se guarde desde /management se refleja en el home al recargar.
export const dynamic = "force-dynamic";

export default async function Page() {
  const albums = await getCatalog();
  return <HomeClient albums={albums} />;
}
