import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../coco-variety-director-v160960.js", import.meta.url), "utf8");
const excellenceSource = readFileSync(new URL("../coco-excellence-v160934.js", import.meta.url), "utf8");

function harness() {
  const calls = [];
  const rotation = {
    choose(config) {
      calls.push(config);
      return (config.items || []).slice(0, config.count || 1);
    },
    chooseLegacy() {
      throw new Error("the director must route legacy pools through enhanced choose");
    },
    generateLegacy(_userId, _key, factory) {
      return factory();
    },
  };
  const window = { CocoRotationV134: rotation };
  const sandbox = { window, Object, Array, String, Number, Math, RegExp, Intl, Date, setTimeout };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return { window, rotation, calls };
}

test("the variety director covers the 13 active experiences without touching product contracts", () => {
  const { window } = harness();
  const audit = window.CocoVarietyDirectorV160960.audit();
  assert.equal(audit.activeGames, 13);
  assert.equal(audit.rotationWrapped, true);
  assert.equal(audit.balancedCategories, true);
  assert.equal(audit.balancedAnswers, true);
  assert.equal(audit.generatedMechanicGuard, true);
  assert.equal(audit.exactSignatureGuardPreserved, true);
  assert.equal(audit.noAuthMutation, true);
  assert.equal(audit.noPaymentMutation, true);
  assert.equal(audit.noDailyLimitMutation, true);
  assert.equal(audit.noScoreMutation, true);
});

test("content pools gain useful categories and balanced true-false answers", () => {
  const { window, rotation, calls } = harness();
  const director = window.CocoVarietyDirectorV160960;
  assert.equal(director.classify("palabras", ["ECOSISTEMA", "Seres vivos y su entorno"]).category, "ciencia");
  assert.equal(director.classify("crucigrama", ["METÁFORA", "Comparación implícita"]).category, "lengua");
  assert.equal(director.classify("verdadero", ["Una fracción representa partes iguales", true]).answer, "verdadero");
  assert.equal(director.classify("verdadero", ["La fotosíntesis es una resta", false]).answer, "falso");

  rotation.chooseLegacy("student-1", "palabras_2", [["PLANETA", "Gira alrededor de una estrella"]], 1, (item) => item[0]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].game, "palabras");
  assert.equal(calls[0].level, "2");
  assert.equal(calls[0].getCategory(calls[0].items[0], 0), "ciencia");
});

test("generated rounds avoid the same mechanic family when another is available", () => {
  const { window, rotation } = harness();
  const values = [
    { texto: "2 + 2" },
    { texto: "3 + 4" },
    { texto: "3 × 4" },
  ];
  const factory = () => values.shift();
  const first = rotation.generateLegacy("student-1", "calculo_1", factory, 60, (item) => item.texto);
  const second = rotation.generateLegacy("student-1", "calculo_1", factory, 60, (item) => item.texto);
  assert.equal(first.texto, "2 + 2");
  assert.equal(second.texto, "3 × 4");
  assert.equal(window.CocoVarietyDirectorV160960.generatedFamily("calculo_1", first), "suma");
  assert.equal(window.CocoVarietyDirectorV160960.generatedFamily("calculo_1", second), "producto");
});

test("path, sequence, speed and football generators expose different mechanic families", () => {
  const { window } = harness();
  const family = window.CocoVarietyDirectorV160960.generatedFamily;
  assert.match(family("numeros_1", [0, 1, 2, 5, 4, 3, 6, 7, 8]), /entrada-norte/);
  assert.equal(family("series_2", { tipo: "alternancia doble" }), "alternancia doble");
  assert.equal(family("tiempo_2", { tag: "memoria visual" }), "memoria visual");
  assert.equal(family("futbol_3", { safe: 2, tempo: 1, order: [0, 1, 3, 4, 5] }), "tempo-1");
});

test("the release loads the director after rotation and caches it offline", () => {
  const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const serviceWorker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  assert.ok(index.indexOf("coco-v142-runtime.js?v=160100") < index.indexOf("coco-variety-director-v160960.js?v=160960"));
  assert.match(serviceWorker, /"\.\/coco-variety-director-v160960\.js"/);
  assert.match(serviceWorker, /v160\.100\.2-greeting-timing-r3/);
});

test("every active experience exposes three deterministic daily focus variants", () => {
  const window = {};
  const document = { readyState: "loading", addEventListener() {} };
  const sandbox = { window, document, Object, Array, String, Math, Intl, Date, setTimeout, requestAnimationFrame() { return 1; } };
  vm.createContext(sandbox);
  vm.runInContext(excellenceSource, sandbox);
  const audit = window.CocoExcellenceV160934.audit();
  assert.equal(audit.games, 13);
  assert.equal(audit.dynamicDailyMissions, true);
  assert.equal(audit.focusVariants, 39);
  assert.equal(window.CocoExcellenceV160934.dailyFocus("calculo"), window.CocoExcellenceV160934.dailyFocus("calculo"));
  assert.notEqual(window.CocoExcellenceV160934.dailyFocus("calculo"), null);
});
