# Real Imperio F.C. — web oficial

Web estática (Next.js) publicada **solo en GitHub Pages**. Negro y oro. Sin servidor ni base de datos.

## Actualizar la web (lo que harás cada semana)

Todo se hace con ficheros. Haces `git push` a `main` y GitHub la publica sola en 1–2 minutos.

### Jugadores
1. Guarda la foto en `public/jugadores/` con el nombre **`Nombre_Apellidos_Posicion.jpg`**
   (p. ej. `Juan_Perez_Garcia_Delantero.jpg`). Se detecta sola; no hay que tocar código.
2. Posiciones válidas (última palabra): `Portero`, `Defensa`/`Central`/`Lateral`/`Carrilero`,
   `Medio`/`Mediocentro`/`Centrocampista`/`Pivote`/`Mediapunta`/`Interior`, `Delantero`/`Extremo`/`Punta`/`Ariete`.
3. *(Opcional)* dorsal, **`bio` (la breve descripción que sale en la lista de la plantilla)**, apodo, edad, altura, pie y estadísticas en `content/jugadores.json`, con el **mismo nombre sin extensión**:
   ```json
   { "Juan_Perez_Garcia_Delantero": { "dorsal": 9, "apodo": "El 9", "edad": 24, "altura": "1,82 m", "pie": "Derecho",
       "bio": "Texto libre.", "stats": { "Regate": 80, "Remate": 90 } } }
   ```
   Un jugador **sin foto** también vale: basta con su clave en el JSON (o `npm run nuevo -- jugador "Pedro Gomez Portero" --dorsal 1`).

### Partidos y resultados — `content/partidos.json`
```json
[
  { "fecha": "2026-12-05 18:30", "rival": "Rival FC", "local": true, "lugar": "Campo Municipal", "competicion": "Liga" },
  { "fecha": "2026-11-08 18:00", "rival": "Otro FC", "local": false, "goles": [3, 1] }
]
```
- La hora es la de Madrid. `goles` = `[nuestros, rival]`; con `goles` el partido pasa a *resultados*.
- «Próximo partido» y la cuenta atrás se calculan en el navegador: no hace falta recompilar al pasar el tiempo.
- Atajos (editan el JSON por ti):
  ```bash
  npm run nuevo -- partido "Rival FC" "2026-12-05 18:30" --lugar "Campo Municipal" --comp Liga   # añade --fuera si juegas fuera
  npm run nuevo -- resultado "Rival" 3 1
  ```

### Fotos y vídeos — `public/galeria/`
- Suelta el archivo en la subcarpeta de su categoría: `partidos/`, `entrenamientos/`, `celebraciones/` o `momentos/`.
  Fotos (`jpg, png, webp, avif`) y vídeos (`mp4, webm`) se detectan solos. El título sale del nombre del archivo.
- Para poner título/descripción a mano o añadir **vídeos de YouTube**, edita `content/galeria.json`:
  ```json
  { "descripciones": { "Derbi_contra_X.jpg": { "titulo": "Derbi", "descripcion": "Gran remontada" } },
    "videos": [ { "url": "https://youtu.be/XXXXXXXXXXX", "titulo": "Resumen", "categoria": "partidos" } ] }
  ```
- ⚠️ GitHub Pages admite sitios de hasta ~1 GB. Sube **fotos ≤ 1600 px (≈300 KB)** y **vídeos cortos o, mejor, YouTube**.

### Textos del club — `content/club.json`
Frase de presentación, valores y cita. (La historia del club se ha retirado; la plantilla con descripciones la sustituye.)

### Identidad — `src/config/club.ts`
Nombre, eslogan, colores (negro/oro) y escudo. El **WhatsApp que recibe las propuestas** y las **redes sociales** están en `content/ajustes.json` (o en el panel `/admin/`) (`crestSrc`: pon el archivo en `public/` y su ruta).

Si algo está mal escrito, la compilación se detiene con un mensaje en castellano que dice qué archivo y qué corregir.

## Panel de administración (`/admin/`)

Interfaz web para **editar jugadores (con foto), partidos y resultados, galería (fotos, vídeos, YouTube), textos del club, WhatsApp y redes**, sin tocar archivos. Está en `https://…/admin/` (no enlazada desde la web, `noindex`, excluida en `robots.txt`).

**Cómo funciona (y por qué es seguro con GitHub Pages).** Una web estática no tiene servidor donde comprobar una contraseña: cualquier comprobación en el navegador sería publicable. Por eso **la contraseña no se compara con nada ni se guarda en ningún sitio**: solo sirve para derivar una clave (PBKDF2-SHA256, 600 000 iteraciones) que descifra (AES-256-GCM) un **token de GitHub** guardado cifrado en `public/admin-vault.json`. Con el token descifrado, el panel edita los JSON y sube las imágenes **directamente a tu repositorio mediante la API de GitHub, en un único commit**; el workflow vuelve a publicar la web en 1–2 minutos.

### Activarlo (una sola vez)
1. Crea un token: GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*. **Repository access: Only select repositories → este repo**. **Repository permissions → Contents: Read and write**. Caducidad: la máxima que permita (al caducar, repites el paso 2).
2. En tu ordenador: `npm run admin:sellar -- --repo usuario/nombre-del-repo`. Te pide, **sin mostrarlo**, la contraseña (mín. 16 caracteres; usa una aleatoria larga de un gestor) y el token. Comprueba que el token tiene acceso de escritura y crea `public/admin-vault.json`.
3. `git add public/admin-vault.json && git commit && git push`. Abre `…/admin/`, escribe la contraseña y listo.

### Uso
Edita lo que quieras en las pestañas → el contador de arriba indica cuántos archivos cambiarán → **Publicar cambios**. Las fotos se reducen automáticamente (jugadores 1400 px, galería 1800 px). Vídeos propios hasta 40 MB; para más, YouTube. La sesión se cierra sola a los 20 minutos de inactividad y el token descifrado solo vive en memoria (no se guarda en el navegador).

### Qué hay que saber de seguridad
- **Lo único publicado es el token cifrado.** Quien lo descargue puede intentar adivinar la contraseña sin límite de intentos (ataque offline): con una contraseña aleatoria larga es inviable; con una corta o típica, no. No uses una frase reutilizada.
- Quien tenga la contraseña puede modificar **todo el contenido del repositorio** (limitado por los permisos del token: solo Contents de este repo). Si sospechas de una filtración: revoca el token en GitHub (inutiliza el vault al instante) y vuelve a sellar con otra contraseña.
- No hay recuperación de contraseña: si la pierdes, borra `public/admin-vault.json` y repite el paso 2.
- El panel nunca guarda la contraseña ni el token en disco, `localStorage` ni cookies, y no carga scripts de terceros.
- No lo he podido probar contra tu repositorio real (no existe aún): se verificó con una API de GitHub **simulada** (ver «Calidad»). Haz una primera publicación de prueba y comprueba el despliegue en la pestaña *Actions*.

## Probar en local
```bash
npm install
npm run dev          # http://localhost:3000  (contenido real)
npm run dev:demo     # lo mismo con jugadores/partidos de ejemplo de /content-demo
```

La web publicada siempre lee `content/` y `public/`. `dev:demo` es solo una vista local con `content-demo/` y fotos de prueba: lo que veas ahí no se publica salvo que lo copies a `content/` o lo añadas desde el panel.

## Publicar en GitHub Pages (una sola vez)
1. Sube el repo a GitHub (rama `main`).
2. **Settings → Pages → Source: «GitHub Actions»**.
3. Cada `git push` a `main` ejecuta `.github/workflows/deploy.yml` (typecheck + tests + build + despliegue).
   - Repo normal (`usuario/real-imperio`) → `https://usuario.github.io/real-imperio/` (el prefijo se calcula solo).
   - Repo `usuario.github.io` → raíz del dominio.
   - Dominio propio: añade `public/CNAME` con tu dominio y define `NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_BASE_PATH=""` en el workflow.

## Formulario «Proponer partido» → WhatsApp
GitHub Pages no tiene servidor, así que la web **no puede enviar el WhatsApp sola**. Al rellenar y pulsar el botón se abre WhatsApp (al número de `content/ajustes.json`) con el mensaje ya redactado y **quien propone el partido pulsa «Enviar»**. La pantalla de confirmación lo explica. Para recepción totalmente automática haría falta un servicio externo (WhatsApp Business API o similar).

## Calidad
`npm run typecheck` · `npm run lint` · `npm test` · `node scripts/whatsapp-test.mjs <url>` (formulario), `node scripts/carrusel-test.mjs` y `shatter-test.mjs` (plantilla) y `node scripts/admin-test.mjs <url> <foto.jpg> <carpeta>` (panel contra una API de GitHub simulada; necesita un `admin-vault.json` sellado con la contraseña de PRUEBA `clave-de-prueba-larga-0123456789` y repo `demo/prueba`; bórralo después), todos con Chromium · `node scripts/shot.mjs` (capturas).

## Pendiente
- Fotos de jugadores, galería y escudo (aún no hay).
- Revisar los valores/cita de `content/club.json` y la política de privacidad (`src/app/privacidad/page.tsx`) con quien asesore al club.
- Más redes sociales cuando existan.
