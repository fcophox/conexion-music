import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El audio protegido vive en media/ (fuera de public/) y las rutas
  // /api/stream lo leen del disco en runtime. Next no rastrea estos archivos
  // automáticamente porque las rutas se construyen con process.cwd(), así que
  // le decimos explícitamente que los incluya en la función serverless de
  // Vercel; sin esto el catálogo sale vacío y la app cae en modo simulación.
  outputFileTracingIncludes: {
    "/api/stream/**": ["./media/hls/**/*", "./media/keys/**/*"],
  },
};

export default nextConfig;
