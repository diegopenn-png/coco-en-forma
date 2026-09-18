import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = file => readFileSync(new URL(file, root), "utf8");

const client = read("eterna-v159.js");
const experience = read("eterna-experience-v160.js");
const index = read("index.html");
const bootstrap = read("coco-v153-fixes.js");
const identity = read("coco-v155-identity.js");
const serviceWorker = read("sw.js");

test("Eterna keeps all six pedagogical modes with text and voice input", () => {
  assert.match(client, /160\.99\.25-contextual-dialogue/);
  for (const mode of ["homework", "ask", "review", "explain", "exam", "practice"]) {
    assert.match(client, new RegExp(`${mode}:\\{`));
  }
  assert.match(client, /data-et-input/);
  assert.match(client, /data-et-mic/);
  assert.match(client, /Escribe o habla/);
  assert.match(client, /allow_image_input:false/);
  assert.match(client, /allow_image_input:false,allow_audio_input/);
});

test("the browser has no remaining photo intake path", () => {
  for (const token of [
    "data-et-camera",
    "data-et-file",
    'accept="image/*"',
    "prepareImage",
    "compressImage",
    "renderImageCrop",
    "image_data_url",
    "image_regions",
    "photo_contract_version",
    "ETERNA_PHOTO_TRANSPORT_FAILED"
  ]) assert.equal(client.includes(token), false, `retired browser token: ${token}`);
  assert.doesNotMatch(client, /\["photo"|action==="photo"/);
});

test("public Eterna copy presents only writing and voice", () => {
  const publicCopy = [
    client,
    experience,
    index.slice(0, 2500),
    read("eterna.html"),
    read("eterna-captacion.html"),
    read("eterna-landing-captacion-v1.html"),
    read("manifest.json"),
    read("manifest.webmanifest"),
    read("informacion-ia-eterna.html"),
    read("centro-de-confianza.html"),
    read("politica-de-cookies.html"),
    read("politica-de-privacidad.html"),
    read("privacidad-menores.html"),
    read("proteccion-de-datos.html"),
    read("eterna-marketing-landing-v1.js")
  ].join("\n");
  for (const phrase of [
    "Haz una foto",
    "Foto, voz",
    "foto, voz",
    "foto y voz",
    "por foto",
    "adjunta una foto",
    "enviar una foto",
    "Permitir fotos",
    "Las fotos se procesan",
    "fotografías de tareas",
    "📷",
    "📸"
  ]) assert.equal(publicCopy.includes(phrase), false, `retired public claim: ${phrase}`);
  assert.match(publicCopy, /Escritura y voz|escritura y voz/);
});

test("web and PWA invalidate every changed text-and-voice asset together", () => {
  assert.match(index, /manifest\.webmanifest\?v=160108/);
  assert.match(index, /coco-v153-fixes\.js\?v=160108/);
  assert.match(index, /eterna-v159\.js\?v=160114/);
  assert.match(index, /sw\.js\?v=160117-r1/);
  assert.match(index, /coco-v155-identity\.js\?v=160109/);
  assert.match(bootstrap, /eterna-experience-v160\.js\?v=160108/);
  assert.match(identity, /share\/eterna\.png\?v=160116/);
  assert.match(serviceWorker, /CACHE_VERSION="coco-en-forma-v160\.100\.17-eterna-contextual-dialogue-r1"/);
});
