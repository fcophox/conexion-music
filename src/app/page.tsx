import HomeClient from "./HomeClient";
import { getCatalogWithStats } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Page() {
  const albums = await getCatalogWithStats();
  return <HomeClient albums={albums} />;
}
