import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("la portada conserva la miniatura social aprobada de Coco y Eterna", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const identity = fs.readFileSync(path.join(root, "coco-v155-identity.js"), "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  const socialImage = "https://www.cocoenforma.com/share/eterna.png?v=160116";

  assert.ok(head.includes(`<meta property="og:image" content="${socialImage}">`));
  assert.ok(head.includes(`<meta property="og:image:secure_url" content="${socialImage}">`));
  assert.ok(head.includes(`<meta name="twitter:image" content="${socialImage}">`));
  assert.ok(head.includes('<meta property="og:image:width" content="1200">'));
  assert.ok(head.includes('<meta property="og:image:height" content="630">'));
  assert.match(identity, /background-image:url\('\.\/share\/eterna\.png\?v=160116'\)/);
  assert.match(identity, /eternaLauncherLoggedOutFinal3 \.eternaLauncherVisualFinal3/);
  assert.match(identity, /eternaLauncherLoggedInFinal3 \.eternaLauncherVisualFinal3/);
  assert.match(identity, /aspect-ratio:1200\/630/);

  const image = fs.readFileSync(path.join(root, "share", "eterna.png"));
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
  assert.equal(crypto.createHash("sha256").update(image).digest("hex"), "cb7a7928428707a2ee323d2a99027c00c9d925d6f5c38171782408f6aad907e1");
});
