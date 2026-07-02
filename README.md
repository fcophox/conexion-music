This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Audio protegido (HLS + AES-128)

Las pistas no se sirven como archivos descargables: cada canción se convierte a
streaming HLS con segmentos cifrados (AES-128). La clave de descifrado solo se
entrega en tiempo de reproducción, ligada a una cookie de sesión `httpOnly` y a
un token firmado con expiración. Los archivos originales y las claves viven en
`media/` (fuera de `public/`, ignorado por git).

### Añadir una pista

```bash
node scripts/protect-audio.mjs /ruta/a/mi-cancion.wav 103
```

El segundo argumento es el `id` de la pista definido en `src/app/page.tsx`.
Acepta cualquier formato que entienda ffmpeg (wav, mp3, flac, m4a…). Al
recargar la app, la pista aparece en el catálogo y suena de verdad; las pistas
sin audio siguen en modo simulado.

### Requisitos

- `ffmpeg` instalado en el servidor.
- `STREAM_SECRET` definido en `.env.local` (32+ bytes aleatorios). En
  producción defínelo como variable de entorno del proceso.

### Endpoints

- `GET /api/stream/catalog` — pistas disponibles; abre la sesión de reproducción.
- `GET /api/stream/:id/playlist` — playlist HLS con tokens firmados por sesión.
- `GET /api/stream/:id/key?tk=…` — clave AES (cookie + token + rate limit).
- `GET /api/stream/:id/seg_XXX.ts?tk=…` — segmentos cifrados.
