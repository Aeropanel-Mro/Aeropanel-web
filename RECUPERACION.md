# AeroPlanner · Plan de recuperación rápida

Si la página deja de abrir, siga esta guía en orden. Con el respaldo en mano, la página vuelve a estar en línea en **menos de 5 minutos**.

## 1. Qué es y dónde vive

| Pieza | Dónde está |
|---|---|
| Página publicada | https://aeropanel-mro.github.io/Aeropanel-web/ |
| Código | Repositorio GitHub `aeropanel-mro/Aeropanel-web`, rama `main` |
| Archivos del sitio | `index.html` (≈8.3 MB, trae TODO dentro: app, pdf.js, pdf-lib, three.js, OCR, fuentes), `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `.nojekyll` |
| Datos (proyectos, usuarios autorizados) | Firebase, proyecto **aeropanelmro** (Authentication + Firestore). Los proyectos están **cifrados** (AES-256) |
| Configuración de Firebase | Dentro de `index.html`, en `<script type="application/json" id="ap-fb">` (apiKey, projectId, authDomain, ownerUid) |
| Puntos de restauración | Ramas `respaldo-AAAA-MM-DD` en el repositorio (copia exacta de una versión buena) |

**Importante:** si la página se cae, **los datos no se pierden**: siguen en Firebase. Cualquier copia de `index.html` publicada en otro sitio vuelve a mostrarlos, siempre que ese dominio esté autorizado en Firebase (paso 4).

## 2. Primero, descarte lo simple (1 minuto)

1. Abra la página en otro dispositivo o en una ventana privada.
2. Si aparece la pantalla **«La página no terminó de cargar»**, pulse **«Limpiar copia guardada y recargar»**.
3. Revise https://www.githubstatus.com (GitHub Pages) y https://status.firebase.google.com (inicio de sesión / datos).
4. Si GitHub está bien, pero la página falla después de un cambio: vuelva a la versión anterior (paso 5).

## 3. Levantar la página en otro sitio (elija una opción)

Tenga a mano el respaldo `AeroPlanner_sitio_respaldo.zip` (o descargue el repositorio: GitHub → **Code → Download ZIP**). Descomprímalo: debe quedar una carpeta con `index.html` y los demás archivos.

**A. Netlify Drop (lo más rápido, sin instalar nada)**
1. Entre a https://app.netlify.com/drop (cree cuenta gratis si no tiene).
2. Arrastre **la carpeta** completa. En segundos le da un enlace `https://algo.netlify.app`.
3. Haga el paso 4 con ese dominio.

**B. Cloudflare Pages**
1. https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Upload assets**.
2. Nombre del proyecto, arrastre la carpeta, **Deploy**. Enlace: `https://nombre.pages.dev`.
3. Paso 4 con ese dominio.

**C. Firebase Hosting (mismo proyecto de los datos; el dominio ya queda autorizado)**
```bash
npm install -g firebase-tools
firebase login
cd carpeta-del-sitio
firebase init hosting      # proyecto: aeropanelmro · public directory: .  · single-page app: No
firebase deploy --only hosting
```
Enlace: `https://aeropanelmro.web.app`.

**D. Volver a GitHub Pages (si el repositorio se borró)**
1. Cree un repositorio nuevo, suba los archivos de la carpeta (Add file → Upload files).
2. **Settings → Pages → Source: Deploy from a branch → main / (root)**.

## 4. Autorizar el nuevo dominio (obligatorio para poder entrar)

1. https://console.firebase.google.com → proyecto **aeropanelmro** → **Authentication → Settings → Authorized domains → Add domain** → escriba el dominio nuevo (por ejemplo `algo.netlify.app`).
2. Si limitó la clave de API por sitio web: https://console.cloud.google.com → **APIs y servicios → Credenciales** → su clave → **Restricciones de sitios web** → agregue `https://dominio-nuevo/*`.
3. Avise a su equipo el enlace nuevo. Sus usuarios y contraseñas siguen siendo los mismos.

## 5. Volver a una versión anterior que funcionaba

En GitHub: repositorio → **Commits** → abra el último cambio bueno → **⋯ → Revert** (o pida a Claude: «revierte el último cambio»).
Con Git:
```bash
git clone https://github.com/aeropanel-mro/Aeropanel-web.git && cd Aeropanel-web
git checkout origin/respaldo-2026-10-24 -- .     # o el commit bueno
git commit -m "Restaurar versión buena" && git push
```

## 6. Revisión después de levantarla (2 minutos)

- [ ] Abre la pantalla de entrada con el logo AeroPlanner.
- [ ] Entra con su correo y contraseña.
- [ ] Aparece la lista de proyectos y uno se abre con su contraseña.
- [ ] Zonas → el avión 3D carga dentro del hangar.
- [ ] Reportes → se genera un PDF.

## 7. Protección ya instalada

- Copia sin conexión en cada dispositivo (`sw.js`): si la red tarda más de 8 s o falla, abre la copia guardada; un error temporal nunca reemplaza la copia buena.
- Reintentos automáticos hacia Firebase con tiempo límite; la sincronización espera progresivamente si el servidor falla.
- Pantalla de recuperación en lugar de pantalla en blanco.
- GitHub Actions **«Verificar y publicar»** revisa cada cambio. Para que **solo se publiquen versiones revisadas**: Settings → Pages → Source: **GitHub Actions**, y en Settings → Secrets and variables → Actions → Variables cree `PUBLICAR_CON_REVISION` = `true`.

## 8. Mensaje para pedirle a Claude que la levante de nuevo

Copie y pegue esto en una conversación nueva con Claude (adjunte el zip del respaldo si lo tiene):

> Necesito volver a poner en línea mi página web **AeroPlanner · MRO** (planeación de remoción de Access Panels para Embraer 190).
> - El código está en el repositorio de GitHub `aeropanel-mro/Aeropanel-web` (rama `main`); también te adjunto el respaldo `AeroPlanner_sitio_respaldo.zip`. Es un sitio estático: `index.html` (todo embebido), `sw.js`, `manifest.webmanifest`, íconos y `.nojekyll`.
> - Los datos están en Firebase, proyecto `aeropanelmro` (Authentication + Firestore, proyectos cifrados). La configuración va dentro de `index.html` en `<script id="ap-fb">`. **No la cambies ni la borres.**
> - Pasos: 1) agrega el repositorio y revisa que `index.html` esté completo (corre `node .github/scripts/check-site.mjs`); 2) si la página publicada falla por un cambio, regresa al último commit bueno o a la rama `respaldo-*`; 3) si GitHub Pages no está disponible, dime exactamente cómo publicarla en Netlify Drop, Cloudflare Pages o Firebase Hosting, y recuérdame autorizar el dominio nuevo en Firebase Authentication.
> - Reglas que no se pueden romper: solo entran correos autorizados por el propietario; nadie puede compartir la app ni los proyectos; nunca inventar la ubicación de un acceso; nunca dar por confirmado algo aproximado; ante cualquier duda: **REQUIERE VERIFICACIÓN**; no borrar historial ni modificar los PDF originales; sin logos ni nombres de aerolíneas reales (solo la marca AeroPlanner); no enviar mi correo a servicios ajenos.
> - Al terminar, dame el enlace funcionando y la lista de revisión (entrar, abrir proyecto, avión 3D, reporte PDF).

---
Herramienta de apoyo documental. No sustituye AMM / IPC / SRM.
