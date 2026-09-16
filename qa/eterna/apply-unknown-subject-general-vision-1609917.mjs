import fs from 'node:fs';

const path = 'eterna-worker/src/index.js';
let src = fs.readFileSync(path, 'utf8');

const oldVersion = 'const VERSION="160.99.16-current-turn-subject-vision";';
const newVersion = 'const VERSION="160.99.17-unknown-subject-general-vision";';
const oldFn = 'function preferGeneralWorksheetVision(text,intake){const subject=currentTurnSubjectHint(text)||intake?.subject||null,canonical=canonicalAcademicSubject(subject);return Boolean(canonical&&canonical!=="math")}';
const newFn = 'function preferGeneralWorksheetVision(text,intake){const subject=currentTurnSubjectHint(text)||intake?.subject||null,canonical=canonicalAcademicSubject(subject);return canonical!=="math"}';

for (const [label, needle] of [['version', oldVersion], ['routing function', oldFn]]) {
  const count = src.split(needle).length - 1;
  if (count !== 1) throw new Error(`Expected exactly one ${label} match, found ${count}`);
}

src = src.replace(oldVersion, newVersion).replace(oldFn, newFn);

if (src.includes(oldFn)) throw new Error('Old worksheet routing logic remains after patch');
if (!src.includes(newFn)) throw new Error('New worksheet routing logic was not written');
if (!src.includes(newVersion)) throw new Error('Worker version was not bumped');

fs.writeFileSync(path, src);
console.log('Applied Eterna 160.99.17 unknown-subject general vision patch');
