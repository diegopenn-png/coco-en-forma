import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("la portada conserva la miniatura social aprobada de Coco y Eterna", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  const socialImage = "https://www.cocoenforma.com/share/eterna.png?v=160114";

  assert.ok(head.includes(`<meta property="og:image" content="${socialImage}">`));
  assert.ok(head.includes(`<meta property="og:image:secure_url" content="${socialImage}">`));
  assert.ok(head.includes(`<meta name="twitter:image" content="${socialImage}">`));
  assert.ok(head.includes('<meta property="og:image:width" content="1200">'));
  assert.ok(head.includes('<meta property="og:image:height" content="630">'));

  const image = fs.readFileSync(path.join(root, "share", "eterna.png"));
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});
