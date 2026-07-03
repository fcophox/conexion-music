# 🎵 Conexión Music

Una experiencia musical interactiva e inmersiva diseñada exclusivamente para la discografía de **Conexión**. Inspirado en los reproductores de música más modernos, este proyecto web permite explorar álbumes, simular la reproducción de canciones y leer las letras en una interfaz oscura, elegante y completamente responsiva.

## ✨ Características Principales

- 🎧 **Reproductor Integrado:** Controles completos de reproducción (Play/Pause, Anterior/Siguiente), barra de progreso y control de volumen.
- 💿 **Explorador de Álbumes:** Navega a través de la discografía con metadatos completos, duraciones de canciones y portadas dinámicas.
- 🎤 **Vista de Letras (Lyrics View):** Un panel dedicado para leer la letra de las canciones, con fondos atmosféricos, gradientes y desenfoques (blur) basados en la portada del álbum en reproducción.
- 🔍 **Buscador Inteligente:** Encuentra rápidamente cualquier canción filtrando en tiempo real desde un modal de búsqueda.
- 📱 **Diseño 100% Responsivo:** Interfaz premium adaptada para navegadores de escritorio y dispositivos móviles, incluyendo un *mini reproductor* flotante inferior y barra de navegación móvil.
- ✨ **Animaciones y Detalles UI:** Pantalla de carga (Splash Screen) animada que se divide en dos, micro-interacciones en los botones y visualizadores de audio ("ecualizador") para las pistas activas.

## 🛠️ Tecnologías Utilizadas

- **[Next.js 15](https://nextjs.org/):** Framework de React utilizando App Router para máximo rendimiento.
- **[React](https://react.dev/):** Para el manejo de estado e interfaz de usuario.
- **[Tailwind CSS](https://tailwindcss.com/):** Estilos avanzados, diseño Glassmorphism, gradientes, y animaciones personalizadas (como el pulso del logo y transiciones fluidas).
- **[Lucide React](https://lucide.dev/):** Colección de iconos limpios y modernos.

## 🚀 Instalación y Desarrollo Local

Sigue estos pasos para correr el proyecto en tu propia máquina:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/fcophox/conexion-music.git
   ```
2. Entra al directorio del proyecto:
   ```bash
   cd conexion-music
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación en acción.

---

*Desarrollado con 💚 para expandir la música de Conexión.*

## Panel de administración (/management)

Mantenedor web protegido por login para gestionar el catálogo.

- **Acceso**: `/management`. Contraseña en `MANAGEMENT_PASSWORD` (`.env.local`).
  El login usa una cookie de sesión firmada (HMAC con `STREAM_SECRET`), válida 8 h.
- **Vista**: sidebar con los discos; al seleccionar uno se listan sus canciones
  con el número de **reproducciones** de cada una y una barra proporcional.
- **Reordenar**: arrastra las canciones por la manija (⋮⋮) de la izquierda y pulsa
  **Guardar orden**. El nuevo orden se persiste y el home lo toma al recargar.

### Dónde viven los datos

- `data/catalog.json` — fuente de verdad del catálogo (álbumes, canciones y su
  orden). Se siembra desde `src/lib/seed.ts` la primera vez. Ignorado por git.
- `data/plays.json` — contador de reproducciones por pista. Se incrementa cuando
  una canción real empieza a sonar (una vez por reproducción).

El home (`src/app/page.tsx`) es un componente de servidor `force-dynamic` que lee
`data/catalog.json` en cada request, por eso los cambios del panel se reflejan al
recargar sin reconstruir.
