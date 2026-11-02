import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("la portada comparte exactamente el icono instalado de la PWA", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const identity = fs.readFileSync(path.join(root, "coco-v155-identity.js"), "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  const socialImage = "https://www.cocoenforma.com/assets/brand/coco-premium-v160127/icon-512.png";

  assert.ok(head.includes(`<meta property="og:image" content="${socialImage}">`));
  assert.ok(head.includes(`<meta property="og:image:secure_url" content="${socialImage}">`));
  assert.ok(head.includes(`<meta name="twitter:image" content="${socialImage}">`));
  assert.ok(head.includes('<meta property="og:image:width" content="512">'));
  assert.ok(head.includes('<meta property="og:image:height" content="512">'));
  assert.match(identity, /background-image:url\('\.\/share\/premium-v160127\/hero-explorer-v160129\.jpg'\)/);
  assert.match(identity, /eternaLauncherLoggedOutFinal3 \.eternaLauncherVisualFinal3/);
  assert.match(identity, /eternaLauncherLoggedInFinal3 \.eternaLauncherVisualFinal3/);
  assert.match(identity, /aspect-ratio:1200\/630/);

  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  const icon = manifest.icons.find(item => item.sizes === "512x512" && item.purpose === "any");
  assert.equal(new URL(icon.src, "https://www.cocoenforma.com/").href, socialImage);
  const image = fs.readFileSync(path.join(root, icon.src));
  assert.equal(image.subarray(1, 4).toString(), "PNG");
  assert.deepEqual([image.readUInt32BE(16), image.readUInt32BE(20)], [512, 512]);
  assert.ok(head.includes('<meta property="og:image:type" content="image/png">'));
});
