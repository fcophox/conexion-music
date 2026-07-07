import { Suspense } from "react";
import HomeClient from "./HomeClient";
import { getCatalogWithStats } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Page() {
  const albums = await getCatalogWithStats();
  return (
    <Suspense fallback={<div className="h-screen w-full bg-zinc-950 flex items-center justify-center text-zinc-500">Cargando...</div>}>
      <HomeClient albums={albums} />
    </Suspense>
  );
}
