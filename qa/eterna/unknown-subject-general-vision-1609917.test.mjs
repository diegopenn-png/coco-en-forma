import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const worker = fs.readFileSync('eterna-worker/src/index.js', 'utf8');
const fnMatch = worker.match(/function preferGeneralWorksheetVision\(text,intake\)\{[^}]+\}/);
assert.ok(fnMatch, 'preferGeneralWorksheetVision must exist in Worker');

const context = {
  currentTurnSubjectHint(text) {
    const value = String(text || '').toLowerCase();
    if (value.includes('matem')) return 'math';
    if (value.includes('lengua')) return 'language';
    return null;
  },
  canonicalAcademicSubject(subject) { return subject || null; }
};
vm.createContext(context);
vm.runInContext(`${fnMatch[0]}; globalThis.routeVision = preferGeneralWorksheetVision;`, context);

const routeVision = context.routeVision;

test('generic photo caption with unknown subject uses general worksheet vision', () => {
  assert.equal(routeVision('He adjuntado una foto de mi tarea.', {}), true);
});

test('explicit mathematics still uses arithmetic-specific vision', () => {
  assert.equal(routeVision('Es una tarea de Matemáticas.', {}), false);
});

test('explicit language uses general worksheet vision', () => {
  assert.equal(routeVision('Es una tarea de Lengua.', {}), true);
});

test('unknown current caption does not inherit an old math subject when current intake has no subject', () => {
  assert.equal(routeVision('He adjuntado una foto nueva.', { subject: null }), true);
});

test('worker carries 160.99.17 release identifier', () => {
  assert.match(worker, /const VERSION="160\.99\.17-unknown-subject-general-vision";/);
});
