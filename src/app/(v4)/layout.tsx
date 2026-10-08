import { Archivo } from "next/font/google";

// Tipografía de la interfaz principal (v4). El panel y la versión anterior
// siguen con la del layout raíz.
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
