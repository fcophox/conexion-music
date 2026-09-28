import { Archivo } from "next/font/google";

// Tipografía propia de la v4 (variable): no cambia la del resto del sitio.
const archivo = Archivo({
  subsets: ["latin"],
});

export default function V4Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${archivo.className} flex flex-1 flex-col`}>{children}</div>
  );
}
