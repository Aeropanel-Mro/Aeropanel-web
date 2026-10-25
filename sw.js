/* AeroPlanner · copia sin conexión.
   - Red primero (siempre la versión más nueva), con tiempo límite: si la red tarda o falla, se usa la copia guardada.
   - Solo se guardan respuestas correctas (200): un error temporal de GitHub nunca reemplaza la copia buena.
   - Las versiones viejas de la caché se borran al activar. */
const C = "aeroplanner-v16";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
const TIMEOUT_NAV = 8000, TIMEOUT_ASSET = 12000;

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => Promise.all(CORE.map(u => fetch(u, { cache: "no-store" }).then(r => r.ok ? c.put(u, r) : null).catch(() => null)))));
});
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== C) await caches.delete(k);
  await self.clients.claim();
})()));

const withTimeout = (p, ms) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error("timeout")), ms); p.then(v => { clearTimeout(t); res(v); }, err => { clearTimeout(t); rej(err); }); });

self.addEventListener("fetch", e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== "GET" || u.origin !== location.origin) return;   // Firebase y demás servicios: directo, sin caché
  const nav = req.mode === "navigate";
  e.respondWith((async () => {
    const cache = await caches.open(C);
    try {
      const r = await withTimeout(fetch(req), nav ? TIMEOUT_NAV : TIMEOUT_ASSET);
      if (r && r.ok && r.type === "basic") { cache.put(nav ? "./" : req, r.clone()).catch(() => {}); return r; }
      const saved = await cache.match(nav ? "./" : req, { ignoreSearch: true });
      return saved || r;   // error del servidor: preferir la copia buena si existe
    } catch {
      const saved = await cache.match(nav ? "./" : req, { ignoreSearch: true }) || (nav ? await cache.match("index.html") : null);
      if (saved) return saved;
      return new Response("<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'><body style='font:16px system-ui;background:#0B2251;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px'><div><h1 style='font-size:22px'>AeroPlanner</h1><p>Sin conexión. Cuando vuelva el internet, la página se abrirá sola.</p><p><button onclick='location.reload()' style='font:inherit;padding:10px 18px;border-radius:10px;border:0;background:#2F72DA;color:#fff'>Reintentar</button></p></div><script>addEventListener('online',()=>location.reload())</script>", { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
  })());
});
