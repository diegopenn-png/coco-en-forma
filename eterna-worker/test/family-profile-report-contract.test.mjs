import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const familyProfile = readFileSync(new URL("coco-family-friendly-v160100.js", root), "utf8");
const reportKit = readFileSync(new URL("coco-v153-fixes.js", root), "utf8");
const index = readFileSync(new URL("index.html", root), "utf8");
const eterna = readFileSync(new URL("eterna-v159.js", root), "utf8");
const experience = readFileSync(new URL("eterna-experience-v160.js", root), "utf8");
const reto = readFileSync(new URL("coco-reto-2026-v160908.js", root), "utf8");

function functionBody(source, name, nextName) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing ${name}`);
  const end = source.indexOf(`function ${nextName}(`, start + 1);
  assert.notEqual(end, -1, `missing ${nextName}`);
  return source.slice(start, end);
}

function loadFamilyProfileApi() {
  const document = {
    readyState: "loading",
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    getElementById() { return null; },
  };
  const window = { addEventListener() {} };
  const context = {
    window,
    document,
    Date,
    WeakMap,
    Object,
    String,
    Number,
    Math,
    localStorage: { getItem() { return null; }, setItem() {} },
    queueMicrotask,
  };
  vm.createContext(context);
  vm.runInContext(familyProfile, context);
  return context.window.CocoFamilyFriendlyV160100;
}

test("the account birth date calculates age at birthday boundaries", () => {
  const api = loadFamilyProfileApi();
  assert.equal(api.version, "160.100.0-account-birth-date");
  const today = new Date(2026, 8, 12, 18, 0, 0);
  assert.equal(api.ageFromDob("2016-09-12", today), 10);
  assert.equal(api.ageFromDob("2016-09-13", today), 9);
  assert.equal(api.ageFromDob("2024-02-29", new Date(2025, 1, 28)), 0);
  assert.equal(api.ageFromDob("2024-02-29", new Date(2025, 2, 1)), 1);
  assert.equal(api.ageFromDob("2026-02-30", today), null);
  assert.equal(api.ageFromDob("2026-09-13", today), null);
  assert.equal(api.ageFromDob("1895-09-12", today), null);
});

test("birth date persistence is account-scoped and course remains the academic reference", () => {
  assert.match(familyProfile, /DOB_KEY_PREFIX\+uid/);
  assert.match(familyProfile, /cli\.auth\.updateUser\(\{data:\{birth_date:birthDate,edad:String\(age\)\}\}\)/);
  assert.match(familyProfile, /\/v1\/profile-age/);
  assert.match(familyProfile, /eterna_student_profiles/);
  assert.match(familyProfile, /Curso actual:/);
  assert.match(familyProfile, /Eterna sigue usando el curso actual como referencia académica/);
  assert.doesNotMatch(familyProfile, /localStorage\.setItem\(\s*["']coco_birthdate["']/);
  assert.equal(index.split('id="coco-family-friendly-v160100"').length - 1, 1);
});

test("child-facing progress omits the level while adaptive difficulty remains intact", () => {
  const modeBar = functionBody(eterna, "renderModeBar", "setPlaceholder");
  assert.doesNotMatch(modeBar, /Nivel\s*\d|difficulty/);
  assert.match(eterna, /difficulty:Number\(activity\.difficulty\|\|2\)/);
  assert.match(eterna, /modeState:\{question_number:0,correct_count:0,partial_count:0,incorrect_count:0,difficulty:2/);
});

test("Eterna reports only worked subjects and never evaluates one interaction", () => {
  for (const [source, name, next] of [
    [eterna, "buildFamilyLearningReportModel", "getFamilyLearningReportModel"],
    [experience, "buildLearningReportModel", "getLearningReportModel"],
  ]) {
    const body = functionBody(source, name, next);
    assert.match(body, /observed=concepts\.filter/);
    assert.match(body, /evaluable=observed\.filter\(function\(x\)\{return Number\(x\.attempts\|\|0\)>=2\}/);
    assert.match(body, /subjects=.*observed\.map/);
    assert.match(body, /academicMemory\.map/);
    assert.match(body, /sin inventar conclusiones/);
    assert.doesNotMatch(body, /Matemáticas|Matematicas/);
    assert.doesNotMatch(body, /retiredEnglish|familyRetiredEnglish/);
  }
  assert.match(reportKit, /cocoV160100PlainSummary/);
});

test("Coco reports only trained skills and requires repetition for comparisons", () => {
  const body = functionBody(reportKit, "buildGamesReportModel", "splitPersonMeta");
  assert.match(index, /data-coco-evidence/);
  assert.match(body, /x\.evidence>0/);
  assert.match(body, /x\.evidence>=2/);
  assert.match(body, /groups:\[\]/);
  assert.match(body, /ha entrenado/);
  assert.match(body, /Una sola partida no basta/);
  assert.doesNotMatch(body, /Memoria, atención, cálculo, lógica, lenguaje, velocidad/);
});

test("Reto Coco stays removed and no longer owns the family feature", () => {
  assert.match(reto, /disabled v160\.100\.0/);
  assert.match(reto, /getElementById\('cocoReto2026'\)/);
  assert.doesNotMatch(reto, /family-friendly|innerWidth|orientationchange|reto-coco-2026-v160958\.jpg/);
});
