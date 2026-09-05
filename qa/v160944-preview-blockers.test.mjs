import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

function functionSource(source, name, nextName) {
  const start = source.indexOf(`function ${name}`);
  const end = source.indexOf(`function ${nextName}`, start);
  assert.notEqual(start, -1, `${name} debe existir`);
  assert.notEqual(end, -1, `${nextName} debe existir después de ${name}`);
  return source.slice(start, end);
}

test("the public Eterna launcher announces login without relying on an undeclared root", () => {
  const source = read("eterna-v159.js");
  const announce = functionSource(source, "announceEternaLogin", "createLauncher");
  assert.doesNotMatch(announce, /\broot\./);

  const calls = [];
  const context = vm.createContext({
    window: { CocoV144: { toast: (...args) => calls.push(args) } }
  });
  vm.runInContext(`${announce}; announceEternaLogin();`, context);
  assert.deepEqual(calls, [["Inicia sesión o crea una cuenta para abrir Eterna.", "info"]]);
});

test("the family reporting module defines normalization in the same closure as its header enhancer", () => {
  const source = read("eterna-experience-v160.js");
  const closureStart = source.lastIndexOf("(function(root){", source.indexOf("function clarifyFamilyHeader"));
  const closureEnd = source.indexOf("})(window);", closureStart);
  const closure = source.slice(closureStart, closureEnd);
  assert.match(closure, /function norm\(v\)/);
  assert.match(closure, /var text=norm\(node\.textContent\)/);
});

test("the browser cache invalidates both repaired frontend modules", () => {
  assert.match(read("index.html"), /eterna-v159\.js\?v=160941/);
  assert.match(read("coco-v153-fixes.js"), /eterna-experience-v160\.js\?v=160944/);
  assert.match(read("sw.js"), /coco-en-forma-v160\.94\.4-preview-blockers-r1/);
  assert.match(read("sw.js"), /basePromise=cachedPatch\(ETERNA_CORE_PATH\)/);
});
