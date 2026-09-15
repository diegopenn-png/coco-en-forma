import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync('eterna-worker/src/index.js','utf8');
test('current turn subject/image outrank stale academic history',()=>{assert.match(src,/function currentTurnSubjectHint/);assert.match(src,/PRIORIDAD DEL TURNO ACTUAL/);assert.match(src,/imagen adjunta y el mensaje actual mandan sobre historial/);assert.match(src,/Nunca describas letras, palabras o huecos ortográficos como números/)});
test('language is an explicit current-turn subject signal',()=>{assert.match(src,/\['Lengua',\/\\b\(\?:lengua\|ortografia/)});
test('general regional vision is instructed to ignore contradictory historical subject',()=>{assert.match(src,/ignora la materia histórica si contradice lo visible o el mensaje actual/)});
