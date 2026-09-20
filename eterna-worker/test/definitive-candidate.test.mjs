import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const workerSource = read("../src/index.js");
const executableWorker = workerSource
  .replace(/^import\s+[^;]+;\s*/gm, "")
  .replace(/\nexport default\s*\{[\s\S]*?\};\s*$/, "");

function workerApi() {
  const sandbox = {
    console,
    URL,
    URLSearchParams,
    Request,
    Response,
    Headers,
    TextEncoder,
    TextDecoder,
    FormData,
    Blob,
    File,
    crypto: webcrypto,
    fetch,
    setTimeout,
    clearTimeout,
    Intl,
  };
  vm.createContext(sandbox);
  vm.runInContext(read("../../eterna-state-contract-v3.js"), sandbox);
  vm.runInContext(read("../src/library/compass-data-v1.js"), sandbox);
  vm.runInContext(`${executableWorker}\n;globalThis.__candidateApi={officialCurriculumSubjects,explicitOfficialSubject,currentTurnSubjectHint,broadSubjectIntakePayload,healthFeatures};`, sandbox);
  return sandbox.__candidateApi;
}

test("all 70 stage-subject entries route deterministically when named exactly", () => {
  const api = workerApi();
  const subjects = JSON.parse(JSON.stringify(api.officialCurriculumSubjects()));
  const compassBox = { Intl };
  vm.createContext(compassBox);
  vm.runInContext(read("../src/library/compass-data-v1.js"), compassBox);
  const stageEntries = Object.values(compassBox.ETERNA_COMPASS_DATA.subjects).flat();
  assert.equal(stageEntries.length, 70);
  assert.equal(subjects.length, new Set(stageEntries).size);
  for (const subject of subjects) {
    assert.equal(api.explicitOfficialSubject(subject, { exact: true }), subject, subject);
    assert.equal(api.currentTurnSubjectHint(`Quiero estudiar ${subject}`), subject, subject);
    const intake = api.broadSubjectIntakePayload(subject, "ask", {}, {});
    assert.equal(intake?.subject, subject, subject);
    assert.equal((intake?.reply.match(/\?/g) || []).length, 1, subject);
  }
});

test("common school aliases enter the official router without a model call", () => {
  const api = workerApi();
  const cases = new Map([
    ["plástica", "Educación Plástica, Visual y Audiovisual"],
    ["valores cívicos", "Educación en Valores Cívicos y Éticos"],
    ["dibujo técnico", "Dibujo Técnico"],
    ["historia del arte", "Historia del Arte"],
    ["tecnología e ingeniería", "Tecnología e Ingeniería"],
  ]);
  for (const [input, expected] of cases) assert.equal(api.currentTurnSubjectHint(`Quiero repasar ${input}`), expected);
});

test("frequent local protocols vary naturally while keeping one useful student act", () => {
  const sandbox = { Intl };
  vm.createContext(sandbox);
  vm.runInContext(read("../src/library/content-v1.js"), sandbox);
  vm.runInContext(read("../src/library/runtime-v1.js"), sandbox);
  const library = sandbox.EternaOwnedLibrary;
  for (const kind of ["how_are_you", "goodbye", "mission", "tired", "exam_nerves", "overloaded", "frustrated", "celebrate", "show_reasoning", "teach_back", "integrity", "disagreement", "curiosity", "topic_choice"]) {
    const variants = [0, 1, 2].map(turn_index => library.cordial(kind, { profile: { school_year: "5º de Primaria" }, base: { apodo: "Luna" }, pedState: { turn_index } }));
    assert.equal(new Set(variants).size, 3, kind);
    for (const reply of variants) assert.ok((reply.match(/\?/g) || []).length <= 1, `${kind}: ${reply}`);
  }
});

test("candidate configuration activates the bounded library, factory and compass", () => {
  const config = JSON.parse(read("../wrangler.jsonc"));
  assert.equal(config.vars.ENABLE_ETERNA_LIBRARY, "true");
  assert.equal(config.vars.ETERNA_LIBRARY_RELEASE, "eterna-library-2026.09-v8-410-consolidated-1c484e");
  assert.equal(config.vars.ETERNA_EXERCISE_FACTORY, "v1");
  assert.equal(config.vars.ETERNA_CURRICULAR_COMPASS, "v1");
  const features = workerApi().healthFeatures({});
  assert.equal(features.verification_repair_recheck_v1, true);
  assert.equal(features.single_verifier_call_path, false);
  assert.equal(features.bounded_verifier_recheck_v1, true);
  assert.equal(features.extended_repetition_window_v1, true);
  assert.equal(features.official_subject_router_v1, true);
});

test("a verifier correction is rechecked before it can be returned", () => {
  assert.match(workerSource, /recheck=await verify\(env,\{\.\.\.verifyArgs,tutorOutput:repairedTutorData\}\)/);
  assert.match(workerSource, /if\(!recheckDecision\.blocking\)\{tutorData=repairedTutorData/);
  assert.match(workerSource, /verification_rechecked:verificationRechecked/);
  assert.doesNotMatch(workerSource, /verification_repair_retry:false/);
});
