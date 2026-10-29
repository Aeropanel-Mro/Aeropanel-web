# AeroPlanner · Plan de recuperación rápida

Si la página deja de abrir, siga esta guía en orden. Con el respaldo en mano, la página vuelve a estar en línea en **menos de 5 minutos**.

## 1. Qué es y dónde vive

| Pieza | Dónde está |
|---|---|
| Página publicada | https://aeropanel-mro.github.io/Aeropanel-web/ |
| Código | Repositorio GitHub `aeropanel-mro/Aeropanel-web`, rama `main` |
| Archivos del sitio | `index.html` (≈0.8 MB: la app), carpeta **`lib/`** (componentes: lector y generador de PDF, 3D, OCR, demostración; se descargan solo cuando se usan), `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `.nojekyll`. **Suba siempre la carpeta `lib/` junto con `index.html`.** |
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

Tenga a mano el respaldo `AeroPlanner_sitio_respaldo.zip` (o descargue el repositorio: GitHub → **Code → Download ZIP**). Descomprímalo: debe quedar una carpeta con `index.html`, la carpeta `lib/` y los demás archivos.

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
1. Cree un repositorio nuevo, suba los archivos de la carpeta, incluida `lib/` (Add file → Upload files).
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

- **Monitor cada hora** (Actions → «Monitor de la página»): revisa que la página abra, que los componentes de `lib/` descarguen y que la base de datos **no** se pueda leer sin iniciar sesión. Si algo falla, abre un aviso (*Issue*) y GitHub le envía un correo; el aviso se cierra solo cuando todo vuelve a funcionar.
- **Respaldo semanal** (Actions → «Respaldo semanal», cada lunes): crea la rama `respaldo-AAAA-MM-DD` con la copia exacta del sitio. Opcional: respaldo cifrado de la base de datos (siguiente sección).

## 8. Respaldo semanal de la base de datos (opcional, 10 minutos, una sola vez)

1. Google Cloud → proyecto **aeropanelmro** → **IAM y administración → Cuentas de servicio → Crear**. Nombre: `respaldo-aeroplanner`. Rol: **Cloud Datastore Viewer** (solo lectura).
2. En esa cuenta: **Claves → Agregar clave → JSON**. Se descarga un archivo.
3. GitHub → repositorio → **Settings → Secrets and variables → Actions → New repository secret**:
   - `FIREBASE_SA_JSON` = todo el contenido del archivo JSON.
   - `BACKUP_PASSPHRASE` = una frase larga que solo usted conozca (guárdela en un lugar seguro: sin ella el respaldo no se puede abrir).
4. Listo: cada lunes aparece en Actions → «Respaldo semanal» un archivo `aeroplanner-datos-AAAA-MM-DD.jsonl.gz.enc` (se guarda 90 días).
5. Para abrirlo: `openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -in ARCHIVO.enc -out datos.jsonl.gz -pass pass:"SU FRASE"` y luego `gunzip datos.jsonl.gz`.

## 9. Dominio propio (opcional, más profesional)

1. Compre el dominio (por ejemplo `aeroplanner.mx`) en su proveedor preferido.
2. En el proveedor, cree un registro **CNAME** `www` → `aeropanel-mro.github.io` (y, para el dominio sin `www`, los 4 registros **A** de GitHub Pages: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153).
3. GitHub → **Settings → Pages → Custom domain** → escriba `www.aeroplanner.mx` → **Save** → active **Enforce HTTPS** cuando aparezca.
4. Autorice el dominio en Firebase (paso 4) y, si limitó la clave de API, agréguelo también ahí.

## 10. Mensaje para pedirle a Claude que la levante de nuevo

Copie y pegue esto en una conversación nueva con Claude (adjunte el zip del respaldo si lo tiene):

> Necesito volver a poner en línea mi página web **AeroPlanner · MRO** (planeación de remoción de Access Panels para Embraer 190).
> - El código está en el repositorio de GitHub `aeropanel-mro/Aeropanel-web` (rama `main`); también te adjunto el respaldo `AeroPlanner_sitio_respaldo.zip`. Es un sitio estático: `index.html`, la carpeta `lib/` (componentes), `sw.js`, `manifest.webmanifest`, íconos y `.nojekyll`.
> - Los datos están en Firebase, proyecto `aeropanelmro` (Authentication + Firestore, proyectos cifrados). La configuración va dentro de `index.html` en `<script id="ap-fb">`. **No la cambies ni la borres.**
> - Pasos: 1) agrega el repositorio y revisa que `index.html` esté completo (corre `node .github/scripts/check-site.mjs`); 2) si la página publicada falla por un cambio, regresa al último commit bueno o a la rama `respaldo-*`; 3) si GitHub Pages no está disponible, dime exactamente cómo publicarla en Netlify Drop, Cloudflare Pages o Firebase Hosting, y recuérdame autorizar el dominio nuevo en Firebase Authentication.
> - Reglas que no se pueden romper: solo entran correos autorizados por el propietario; nadie puede compartir la app ni los proyectos; nunca inventar la ubicación de un acceso; nunca dar por confirmado algo aproximado; ante cualquier duda: **REQUIERE VERIFICACIÓN**; no borrar historial ni modificar los PDF originales; sin logos ni nombres de aerolíneas reales (solo la marca AeroPlanner); no enviar mi correo a servicios ajenos.
> - Al terminar, dame el enlace funcionando y la lista de revisión (entrar, abrir proyecto, avión 3D, reporte PDF).

---
Herramienta de apoyo documental. No sustituye AMM / IPC / SRM.

## 11. Si olvida su llave de propietario

- Al activar la llave, la página muestra **una sola vez** un *código de recuperación* (30 letras/números). Descárguelo o imprímalo y guárdelo fuera de la página.
- ¿Olvidó la llave? En la tarjeta de la llave pulse **«¿Olvidó su llave?»**, escriba el código y una llave nueva. Recibirá un código **nuevo** (el anterior deja de servir). Todo sigue visible igual que antes.
- ¿Perdió también el código? En el mismo lugar abra **«También perdí el código» → Crear llave nueva**. Los proyectos de sus invitados se vuelven a proteger con la llave nueva cuando cada invitado los abre; la contraseña de invitados de esos proyectos aparecerá como «—» hasta que el creador la cambie.
- Si activó la llave antes de existir esta opción, al desbloquearla verá **«Crear código ahora»**.

## 12. Monitoreo de accesos y bloqueo

- En su pantalla de inicio (y en «Acceso a la página web» dentro de un proyecto) está **Monitoreo de accesos**: quién está en línea, entradas, equipos usados (24 h / 7 días), alertas y actividad reciente.
- **Bloquear / Desbloquear** por persona. El bloqueo lo aplica el servidor (reglas v3): la persona queda fuera al momento y no puede volver a entrar.
- **Bloqueo automático**: si una cuenta entra desde más equipos de los permitidos en 24 h. Lo aplica su página mientras usted tenga AeroPlanner abierto (revisa cada minuto). Al desbloquear, el conteo empieza de cero.
- Requiere las **reglas v3** publicadas en Firebase. Si faltan, la tarjeta «Reglas de seguridad del servidor» aparece sola en su inicio; cuando están al día, no se muestra.

## 13. Velocidad, «no es acceso», cierre de sesión y QR para invitados (reglas v4)

- **Velocidad en computadora**: la vista 3D ya no redibuja sin parar, calcula las sombras solo cuando cambia la escena, baja la resolución mientras se gira el avión y prepara los gráficos en segundo plano. La pantalla se redibuja una sola vez por ráfaga de datos.
- **«No es un Access Panel — no volver a mostrar»** (en la decisión de Verificación): el código desaparece de todas las vistas de ese proyecto, también al volver a analizar. Se puede deshacer en **Aprendizaje → Ocultos en este proyecto → Volver a mostrar**.
- **Cerrar sesión**: botón en la barra superior de la app (sale de la cuenta en ese equipo).
- **Vista previa de etiquetas QR**: botones − / + / Ajustar, doble toque o Ctrl + rueda para acercar; la hoja se muestra en alta resolución para escanear desde la pantalla.
- **Invitados generan QR con dibujo**: requiere publicar las **reglas v4**. Cada invitado desactiva solo sus enlaces; el propietario desactiva todos. El monitoreo registra quién publicó etiquetas.
- Las reglas v4 también permiten guardar en el servidor el **aprendizaje compartido** (antes se quedaba en cada equipo).

## 14. Escaneo más rápido, QR más rápidos e inspección por día

- **Escaneo**: «Rápido» es el modo por defecto (los proyectos que ya eligieron otro modo lo conservan). «Equilibrado» y «Completo» ya no pasan OCR sobre páginas 100 % digitales cuyos rótulos vienen como texto exacto; «Completo» hace segunda lectura solo cuando la primera es dudosa. Si Rápido no encuentra algún acceso, use Equilibrado.
- **QR con dibujo**: las imágenes se suben en segundo plano mientras se dibuja la siguiente; si vuelve a generar las etiquetas del mismo análisis, los enlaces vigentes se reutilizan (casi instantáneo). Desactivar los enlaces borra también esa memoria.
- **Inspection por día** (pestaña propia): las figuras de zona se cargan una sola vez; con «+ Agregar día» se crean Día 1, Día 2… y en cada día se cargan sus inspection cards (sin fechas). Un solo análisis; el resultado se separa por día: accesos a remover, nuevos ese día, ya abiertos en un día anterior y pendientes. Cada día genera su reporte y sus etiquetas QR (nombrados «Dia_N», sin fecha) y «Documentos de todos los días (ZIP)». «Ver en avión y zonas» filtra toda la app a ese día.
- Los nombres de archivo usan la fecha local (antes, después de las 6 pm salían con la fecha del día siguiente).
- **Velocidad de imágenes**: las páginas de figuras ya dibujadas se reutilizan entre tarjetas, reportes, QR y fotos (caché en memoria de ~40 Mpx); al ver una tarjeta se preparan en segundo plano las siguientes; el reporte del día muestra su avance y, si no cambió nada, se vuelve a abrir al instante.
- **Impresión**: cada hoja del reporte se ajusta a una sola hoja de papel (vertical u horizontal, botón «Imprimir» o Ctrl+P con la vista previa abierta). Las barras de avance son un avión que recorre la ruta.
- **Accesos verificados**: al verificar un acceso en la cola (casilla «Recordar que es un acceso a remover», marcada por defecto) sale de la cola, se conserva aunque vuelva a analizar y se aprende: en futuros análisis y proyectos se reconoce solo como acceso a remover. Una discrepancia nunca se oculta así. Se ve en «Verificados» y en Aprendizaje → «Accesos verificados» (se puede desactivar).
- **Avión 3D**: nariz con anillo del radomo, sondas pitot, veleta AoA, sonda TAT y limpiaparabrisas; en modo Hangar MRO, cintas rojas «Remove Before Flight» en las sondas.
- **QR para invitados (interruptor)**: en su inicio (tarjeta Monitoreo de accesos) y en Reports → Etiquetas QR, «Etiquetas QR para invitados: ACTIVADAS / DESACTIVADAS». Viene DESACTIVADO: los invitados no ven nada de QR hasta que usted lo active. Se guarda en el servidor (config/escrow), sin reglas nuevas.
- **Avión 3D en modo Hangar MRO** (según fotos de hangar): los accesos a remover se ven como huecos abiertos con borde de primer amarillo-verde; puerta de carga trasera y puerta del E-bay abiertas; panel del carenado ala-fuselaje retirado (primer verde y ductos naranjas); fundas rojas en las llantas y en los pitot. Radomo con 3 tiras desviadoras y limpiaparabrisas estacionados verticales al centro.

## 15. Permisos por persona y pestaña Materiales (reglas v5)

- **Personas autorizadas**: por cada invitado, **Planning** (proyectos, remoción de accesos, reportes), **QR** (generar etiquetas) y **Materiales** (No / Ver / Editar). Los aplica el servidor (reglas v5). Valores iniciales: Planning sí, QR no, Materiales no. Quien no tiene Planning solo ve Materiales en su inicio.
- **Materiales**: catálogo global (colección «materials»), no depende del proyecto. Componente, tipo, descripción, P/N del manual, alternos usados, cantidad, ATA, accesos, referencia IPC/AMM, palabras clave y notas. Detecta el tipo por el número de parte (NAS/MS/AN/Hi-Lok…), importa desde Excel (copiar y pegar) o CSV, exporta CSV. Buscador en español e inglés de aviación que aprende palabras nuevas. La hoja de cada acceso muestra sus materiales.

## 16. Materiales v2 (buscador, filtros, ficha, kit por día, almacén)

- **Buscador:** tecla «/», sugerencias, tolera errores («lavatroy» → lavatory), búsqueda por voz en el celular y línea «→ …» con lo que entendió.
- **Escanear etiqueta:** foto → código de barras o OCR integrado → propone el P/N (usted confirma).
- **Importar IPC (PDF):** lee la página de la lista de partes (texto u OCR) y propone renglones editables. No se guarda nada hasta que usted elige «Importar seleccionadas». El PDF original no se modifica.
- **Filtros:** capítulo ATA, zona 100–800, tipo (pictogramas), estado (reemplazo obligatorio, caducidad < 30 días, alterno sin referencia, bajo mínimo).
- **Alternos:** «✓ Aprobado» solo si usted registra la referencia (IPC / SB). Lo usado en taller sin referencia aparece siempre como «◌ usado · requiere verificación».
- **Ficha de parte:** lectura del número marcada como orientativa («Verifique en el estándar»), intercambiabilidad, instalación (torque, sellador, herramienta), dónde se usa e historial.
- **Kit por día:** suma el material de los accesos que se remueven ese día. Incluye hoja de surtido en PDF con QR, CSV para almacén, avance de surtido (guardado cifrado en el proyecto) y «Registrar uso», que anota el historial y descuenta existencia.
- **Almacén:** existencia, mínimo, ubicación, lote y caducidad, con la pestaña «Alertas».
- No hace falta cambiar las reglas: siguen siendo las v5.

## 17. Foto de apuntes, corrección con historial, permisos separados y biblioteca CMM (reglas v7)

- **Publique las reglas v7.** En su inicio, abra la tarjeta «Reglas de seguridad del servidor», cópielas y péguelas en Firebase → Firestore → Reglas → Publicar. Hasta que lo haga, Materiales (permisos nuevos) y CMM le pedirán publicarlas.
- **Foto de apuntes** (Materiales): lee varios números de parte escritos a mano o impresos, cada uno con el recorte de la foto.
  - Las letras dudosas (0/O, 1/I, 5/S, 8/B…) se marcan para que usted elija; la app nunca cambia un NP sola.
  - Usted indica qué es, el componente, el acceso y la cantidad. Si el NP ya existe, se actualiza en lugar de duplicarse.
- **Escanear:** cámara en vivo con lector de QR propio (sirve en iPhone y Android). Con foto, lee el QR y el texto de etiquetas inclinadas o lejanas.
- **Corregir:** «✎ Corregir / editar» guarda el valor anterior en el historial (quién, cuándo, motivo). El buscador encuentra la pieza también por su número viejo, y existe «Volver a la versión anterior».
- **Permisos de Materiales por persona:** Ver · Agregar (foto / manual) · Corregir / editar · Borrar. Los aplica el servidor.
- **CMM:**
  - Biblioteca de manuales de componente en PDF, global para todos los proyectos. El archivo original se guarda tal cual, en piezas.
  - Busca por número, P/N, ATA o palabras, y también un P/N **dentro** de los manuales, con la página donde aparece.
  - Visor dentro de la app. Las revisiones anteriores se conservan como «Rev. anterior».
  - Permisos por persona: interruptor «Acceso» y casilla «Subir manuales». Solo el propietario borra.
  - Límite: 80 MB por archivo. El espacio gratuito de Firebase es de 1 GB en total; vigile el tamaño en Firebase → Uso.

## 18. Escaneo → inventario

- **Si es un material del catálogo:** al escanear el QR o la etiqueta se ve «SE AGREGARÁ AL INVENTARIO DE: nombre · P/N», con la existencia actual → la nueva. La cantidad, el lote y la caducidad se leen de la etiqueta y se pueden corregir. Nada se guarda hasta tocar «Agregar al inventario», y queda anotado en el historial.
- **Si el P/N es nuevo:** muestra «SE GUARDARÁ COMO» (nombre · P/N, componente, ubicación, existencia, lote), que se actualiza mientras usted escribe.
- **Si no se detecta un P/N:** lo dice, muestra el texto leído de la etiqueta (toque un renglón para usarlo como P/N o nombre) y permite agregarlo a mano.
- **Permisos:** sumar existencia a una pieza existente requiere «Corregir / editar»; dar de alta una nueva requiere «Agregar».

## 19. «Descripción» y «Dónde se usa», sugerencias y aprendizaje del escaneo

- **Nombres de los campos:** «Tipo» ahora se llama «Descripción» (filtro y columna), y el lugar de uso se llama «Dónde se usa». La clasificación (washer, nut…) se pone sola según la descripción o el P/N, y se puede cambiar. Los datos guardados no cambian.
- **Sugerencias:** al escribir un P/N, la app propone la descripción y «Dónde se usa» con lo que ya aprendió del mismo P/N o de su familia (NAS1291…, MS21042…). Las listas de sugerencias se abren al tocar el campo.
- **Escaneo:**
  - Con una pieza reconocida se pueden editar su descripción y «Dónde se usa», o agregarla como otra entrada para un lugar de uso distinto.
  - Cada QR o código de barras guardado se recuerda: la próxima vez lleva directo a esa pieza.

## 20. Escaneo = formulario de material · Importar IPC por columnas

- **Al escanear un QR o una etiqueta** se abre siempre el formulario completo del material, ya lleno con lo que se leyó: P/N, descripción, dónde se usa, clasificación, cantidad, ubicación, accesos, lote, caducidad y notas. Todo se puede editar antes de tocar «Agregar como material».
  - Si el P/N ya existe, ofrece «Sumar a la existente» o «Guardar como material nuevo».
  - Si no se lee un P/N, se escribe a mano o se toca un renglón leído.
- **Importar IPC (PDF):** «Buscar partes en todo el PDF» reconoce la tabla por sus encabezados **PART NUMBER** y **NOMENCLATURE**, además de FIG/ITEM y UNITS PER ASSY.
  - Salta la portada y los dibujos, acepta P/N numéricos (190-73215-401, 2345678-3), quita los puntos de sangría y une los renglones de continuación.
  - Las páginas escaneadas se leen con OCR, que es más lento.
  - Antes de importar se revisa todo en una tabla editable; se guarda como referencia la página del IPC de cada parte.

## 21. IPC de Embraer (formato real) y foto de la página

- **Formato reconocido:** FIG. · ITEM · PART NUMBER · AIRLINE STOCK NUMBER · NOMENCLATURE 1234567 · USAGE RANGE · UNITS PER ASSY.
- **Renglones de continuación:**
  - «OPTIONAL P/N» y «ORDER TRUE P/N» pasan a alternos aprobados, con la referencia IPC Fig./item.
  - «SUPERSEDED BY» queda en notas; «SUPPLIER CODE» queda en notas como proveedor.
  - «FOR NHA / FOR DETAILS SEE FIGURE», fechas, usuario, revisión, aplicabilidad (MSN / serie del avión) y textos laterales se omiten.
- **Importar desde una foto** de la página, por ejemplo de la pantalla: la imagen se amplía, se quita la marca de agua y se lee dos veces. El P/N se corrige con su propio «ORDER TRUE / OPTIONAL P/N» cuando falla una letra. **Revise siempre la tabla antes de importar.**
