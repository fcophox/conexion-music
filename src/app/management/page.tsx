import type { Metadata } from "next";
import ManagementClient from "./ManagementClient";

export const metadata: Metadata = {
  title: "conexión · Manager",
  robots: { index: false, follow: false },
};

export default function ManagementPage() {
  return <ManagementClient />;
}
