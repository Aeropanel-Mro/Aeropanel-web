// Monitor (cada hora): revisa que la página abra y que la base de datos NO se pueda leer sin iniciar sesión.
// Si algo falla 3 veces seguidas, abre un aviso (issue) en el repositorio: GitHub le manda un correo al propietario.
// Cuando todo vuelve a estar bien, cierra el aviso solo.
const SITE = process.env.SITE_URL || "https://aeropanel-mro.github.io/Aeropanel-web/";
const REPO = process.env.GITHUB_REPOSITORY, TOKEN = process.env.GITHUB_TOKEN;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url, opt = {}) { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 30000); try { return await fetch(url, { ...opt, signal: ac.signal, redirect: "follow" }); } finally { clearTimeout(t); } }
async function checkOnce() {
  const problems = [];
  let html = "";
  try { const r = await get(SITE, { headers: { "Cache-Control": "no-cache" } }); html = await r.text(); if (!r.ok) problems.push(`La página respondió HTTP ${r.status}.`); else if (!/AeroPlanner/.test(html) || !/id="app"/.test(html)) problems.push("La página abrió pero no contiene la aplicación (contenido inesperado)."); }
  catch (e) { problems.push("La página no responde: " + (e.message || e)); }
  if (html) {
    for (const m of html.matchAll(/id="(three-src|lib-pdfjs)"[^>]*data-src="([^"]+)"/g)) { try { const r = await get(new URL(m[2].replace(/&amp;/g, "&"), SITE)); if (!r.ok) problems.push(`Falta el componente ${m[1]} (HTTP ${r.status}).`); } catch (e) { problems.push(`No se pudo descargar ${m[1]}.`); } }
    const cfgM = html.match(/<script type="application\/json" id="ap-fb">([^<]+)<\/script>/);
    if (cfgM) { try { const c = JSON.parse(cfgM[1]);
      for (const col of ["projects", "acl", "requests", "sessions", "access", "verify", "learning", "materials"]) {
        const r = await get(`https://firestore.googleapis.com/v1/projects/${c.projectId}/databases/(default)/documents/${col}?pageSize=1&key=${c.apiKey}`);
        if (r.ok) problems.push(`SEGURIDAD: la colección «${col}» se puede leer SIN iniciar sesión. Revise las reglas de Firestore (Firestore → Reglas) y publique las que genera la app.`);
        else if (r.status >= 500) problems.push(`Firestore respondió HTTP ${r.status} (posible falla temporal de Firebase).`);
      } } catch (e) { problems.push("No se pudo revisar Firebase: " + (e.message || e)); } }
  }
  return problems;
}
let problems = [];
for (let i = 0; i < 3; i++) { problems = await checkOnce(); if (!problems.length) break; await sleep(20000); }
console.log(problems.length ? "PROBLEMAS:\n- " + problems.join("\n- ") : "Todo en orden: " + SITE);
if (!REPO || !TOKEN) process.exit(problems.length ? 1 : 0);
const api = (p, opt = {}) => fetch(`https://api.github.com/repos/${REPO}${p}`, { ...opt, headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", ...(opt.headers || {}) } });
const open = await (await api(`/issues?state=open&labels=monitor&per_page=10`)).json();
const cur = Array.isArray(open) ? open[0] : null;
const now = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
if (problems.length && !cur) {
  await api(`/issues`, { method: "POST", body: JSON.stringify({ title: "⚠️ AeroPlanner: la página tiene un problema", labels: ["monitor"], body: `Detectado: ${now}\n\n- ${problems.join("\n- ")}\n\nQué hacer: abra RECUPERACION.md en este repositorio y siga los pasos. Este aviso se cierra solo cuando todo vuelve a estar bien.` }) });
} else if (problems.length && cur) {
  await api(`/issues/${cur.number}/comments`, { method: "POST", body: JSON.stringify({ body: `Sigue el problema (${now}):\n- ${problems.join("\n- ")}` }) });
} else if (!problems.length && cur) {
  await api(`/issues/${cur.number}/comments`, { method: "POST", body: JSON.stringify({ body: `✅ La página volvió a funcionar (${now}).` }) });
  await api(`/issues/${cur.number}`, { method: "PATCH", body: JSON.stringify({ state: "closed" }) });
}
process.exit(problems.length ? 1 : 0);
