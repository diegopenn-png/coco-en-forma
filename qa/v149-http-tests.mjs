import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(qaDir);
const port = 8876;
const origin = `http://127.0.0.1:${port}`;
const server = spawn("python3", ["-u", "-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });

await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("El servidor local no inició a tiempo.")), 5000);
  const ready = chunk => { if (/Serving HTTP/.test(String(chunk))) { clearTimeout(timer); resolve(); } };
  server.stdout.on("data", ready); server.stderr.on("data", ready); server.once("error", reject);
});

try {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  const refs = new Set(["/", "/index.html", "/manifest.webmanifest", "/manifest.json"]);
  for (const match of html.matchAll(/(?:src|href)=["'](\.\.?\/[^"'#?]+)/g)) refs.add("/" + match[1].replace(/^\.\//, ""));
  for (const match of sw.matchAll(/["'](\.\/[^"'?]+)["']/g)) refs.add("/" + match[1].slice(2));
  const ids = ["numeros", "calculo", "palabras", "series", "memoria", "sudoku", "sopa", "crucigrama", "tiempo", "verdadero", "diferencias", "cococorre", "cocomed", "futbol", "padel"];
  const slugs = { cococorre: "coco-corre" };
  for (const id of ids) { refs.add(`/share/${id}-v149.png`); refs.add(`/juego/${slugs[id] || id}/index.html`); }

  const failures = [], types = [];
  for (const ref of refs) {
    const response = await fetch(origin + ref, { redirect: "manual" });
    if (response.status !== 200) failures.push(`${ref} -> ${response.status}`);
    if (ref.endsWith(".png")) types.push(response.headers.get("content-type") || "");
    await response.arrayBuffer();
  }
  assert.deepEqual(failures, []);
  assert.ok(types.every(type => /^image\/png/i.test(type)));
  console.log(`PASS  HTTP local: ${refs.size}/${refs.size} recursos respondieron 200; 0 peticiones 404.`);
  console.log(`PASS  Miniaturas: ${types.length} imágenes sociales servidas como image/png.`);
} finally {
  server.kill("SIGTERM");
}
