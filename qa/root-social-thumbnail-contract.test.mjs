import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("la portada comparte la nueva miniatura social de Coco y Eterna", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const identity = fs.readFileSync(path.join(root, "coco-v155-identity.js"), "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  const socialImage = "https://www.cocoenforma.com/share/premium-v160127/hero.jpg";

  assert.ok(head.includes(`<meta property="og:image" content="${socialImage}">`));
  assert.ok(head.includes(`<meta property="og:image:secure_url" content="${socialImage}">`));
  assert.ok(head.includes(`<meta name="twitter:image" content="${socialImage}">`));
  assert.ok(head.includes('<meta property="og:image:width" content="1200">'));
  assert.ok(head.includes('<meta property="og:image:height" content="630">'));
  assert.match(identity, /background-image:url\('\.\/share\/premium-v160127\/hero\.jpg'\)/);
  assert.match(identity, /eternaLauncherLoggedOutFinal3 \.eternaLauncherVisualFinal3/);
  assert.match(identity, /eternaLauncherLoggedInFinal3 \.eternaLauncherVisualFinal3/);
  assert.match(identity, /aspect-ratio:1200\/630/);

  const image = fs.readFileSync(path.join(root, "share", "premium-v160127", "hero.jpg"));
  assert.equal(image.readUInt16BE(0), 0xffd8, "JPEG signature");
  let dimensions;
  for (let offset = 2; offset + 9 < image.length;) {
    assert.equal(image[offset], 0xff);
    const marker = image[offset + 1];
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      dimensions = [image.readUInt16BE(offset + 7), image.readUInt16BE(offset + 5)];
      break;
    }
    offset += 2 + image.readUInt16BE(offset + 2);
  }
  assert.deepEqual(dimensions, [1200, 630]);
  assert.ok(head.includes('<meta property="og:image:type" content="image/jpeg">'));
  assert.equal(crypto.createHash("sha256").update(image).digest("hex"), "e4b49bfb8aeec81a45dcb555d5cac2c8a3990f4ab7f32e602244ab8821b4adf2");
});
