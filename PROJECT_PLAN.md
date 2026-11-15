# Football Club — Plan de proyecto

## Dirección artística
**Concepto: «campo de noche bajo focos».** Fondo tinta (#0b0c09), papel (#ece8dc), verde ácido (#d5ff3a) como acento principal y naranja señal (#ff4a1c) como secundario. Todo sale de `src/config/club.ts` → variables CSS.
- Tipografía: **Anton** (titulares, mayúsculas condensadas, a escala gigante), **Archivo** (texto), **JetBrains Mono** (etiquetas/datos, estética de marcador).
- Motivos propios: líneas de campo como retícula, haces de foco, halftone, cortes diagonales (`clip-cut`), números de dorsal gigantes, contorno vs. relleno.
- Se evita: degradados genéricos, tarjetas redondeadas de plantilla, cristal/aurora.

> **Actualización (personalización Real Imperio):** el sitio se publica solo en GitHub Pages → export estático. Se eliminaron Postgres, Drizzle, nodemailer, Server Actions y el panel admin; el formulario abre WhatsApp (`wa.me`) con el mensaje preparado. El contenido vive en `/content` + carpetas de `/public`, ver README. La tabla de abajo es el plan original.

## Stack y justificación
| Dependencia | Para qué |
|---|---|
| Next.js 16 (App Router) + React 19 + TypeScript | SSR/SEO, Server Actions para el formulario, metadatos, sitemap |
| Tailwind CSS 4 | tokens de diseño y responsive sin CSS suelto |
| motion | animaciones declarativas (reveal, layout, gestos) |
| lenis | scroll suave (se desactiva con `prefers-reduced-motion`) |
| three + @react-three/fiber + drei | balón y partículas; **solo** Lightformer/Environment de drei |
| drizzle-orm + pg + PostgreSQL | persistencia de solicitudes (SQL claro, sin generador pesado) |
| zod | validación compartida cliente/servidor |
| nodemailer | aviso por SMTP opcional |
| lucide-react | iconos UI (los de marca son SVG propios: lucide v1 los eliminó) |

**No incluido a propósito:** GSAP (motion + Lenis cubren lo necesario; evita duplicar), Prisma, librerías de UI, CAPTCHA de terceros.

## Estructura
```
src/config/club.ts        identidad, colores, redes, contacto, datos legales (ÚNICO sitio a editar)
src/data/*.ts             plantilla, partidos, galería, textos del club
src/components/sections/  Hero, Club, Squad, Gallery, Matches, Contact, Community
src/components/{layout,motion,three,ui}/
src/app/actions/          Server Action del formulario
src/app/admin/            panel de solicitudes (token)
src/db/ · src/lib/        esquema Drizzle · validación, seguridad, correo, scroll
scripts/                  shot.mjs, form-test.mjs, bake-ball.mjs
tests/                    Vitest
```

## Sistema de animación
1. **Intro** (1,2 s, una vez por sesión): escudo que se dibuja + contador; cortina que sube.
2. **Hero**: titular en dos capas (balón *entre* «UNIÓN» y «DEMO»), parallax por ratón y scroll, balón 3D que sigue al cursor, partículas.
3. **Scroll**: máscaras de imagen, parallax interno, titulares por palabras, contadores, texto outline a la deriva.
4. **Interacción**: cursor propio, botones magnéticos, tilt 3D en fichas, lightbox, menú circular a pantalla completa.
5. Todo respeta `prefers-reduced-motion`; en táctil no hay cursor ni tilt.

## Rendimiento
- Three.js solo carga con `dynamic(ssr:false)`, tras la intro y en `requestIdleCallback`; se pausa fuera de pantalla (`frameloop="never"`); se omite con reduced-motion, sin WebGL o `Save-Data`.
- Balón: sin `.glb`; texturas webp precalculadas (41 KB) con `scripts/bake-ball.mjs`.
- En móvil: esfera 32 segmentos, 90 partículas, dpr 1, cámara más lejana.
- Imágenes: `next/image` cuando hay `src`; si no, SVG generado (0 KB de red).

## Seguridad del formulario (versión original con servidor; ya no aplica)
Zod en cliente y servidor · honeypot · tiempo mínimo/máximo de relleno · límite por IP (memoria + BD, IP solo como hash con sal) · duplicados 24 h · sanitización (etiquetas y caracteres de control) · consultas parametrizadas · **éxito solo si el INSERT se confirma**.
