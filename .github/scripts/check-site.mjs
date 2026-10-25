// Revisión automática antes de publicar: si algo falla, el sitio publicado se queda en la última versión buena
// (cuando GitHub Pages está configurado para publicar con "GitHub Actions").
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { execFileSync } from "node:child_process";
const fail = []; const ok = m => console.log("✓ " + m); const bad = m => { console.log("✗ " + m); fail.push(m); };
for (const f of ["index.html", "sw.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", ".nojekyll"]) fs.existsSync(f) ? ok("existe " + f) : bad("falta " + f);
const html = fs.readFileSync("index.html", "utf8");
const mb = Buffer.byteLength(html) / 1e6; mb < 90 ? ok(`index.html pesa ${mb.toFixed(1)} MB`) : bad(`index.html demasiado grande (${mb.toFixed(1)} MB)`);
/<title>[^<]+<\/title>/.test(html) ? ok("tiene título") : bad("sin <title>");
/<div class="app" id="app"/.test(html) && /id="auth"/.test(html) ? ok("estructura principal presente") : bad("falta #app o #auth");
// every executable inline script must parse
const scripts = [...html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)];
let n = 0;
for (const [, attrs = "", code] of scripts) {
  if (/type="(application\/json|application\/octet-stream|text\/plain)"/.test(attrs) || /\bsrc=/.test(attrs) || !code.trim()) continue;
  n++; const isModule = /type="module"/.test(attrs);
  const tmp = path.join(os.tmpdir(), `ap-script-${n}.${isModule ? "mjs" : "cjs"}`); fs.writeFileSync(tmp, code);
  try { execFileSync(process.execPath, ["--check", tmp], { stdio: "pipe" }); ok(`script ${n}${isModule ? " (módulo)" : ""} sin errores de sintaxis`); }
  catch (e) { bad(`script ${n}${isModule ? " (módulo)" : ""}: ${String(e.stderr || e.message).split("\n").slice(0, 5).join(" ")}`); }
}
n > 0 ? ok(`${n} scripts revisados`) : bad("no se encontraron scripts");
for (const id of ["lib-pdfjs", "lib-pdflib", "three-src"]) html.includes(`id="${id}"`) ? ok("librería embebida " + id) : bad("falta librería " + id);
try { new Function(fs.readFileSync("sw.js", "utf8")); ok("sw.js sin errores"); } catch (e) { bad("sw.js: " + e.message); }
try { const m = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8")); m.name && m.icons?.length ? ok("manifest válido") : bad("manifest incompleto"); } catch (e) { bad("manifest: " + e.message); }
if (fail.length) { console.log(`\n${fail.length} problema(s): NO se publica esta versión.`); process.exit(1); }
console.log("\nTodo en orden: se puede publicar.");
