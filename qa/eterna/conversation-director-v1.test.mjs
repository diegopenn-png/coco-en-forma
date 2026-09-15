import fs from 'node:fs';
import assert from 'node:assert/strict';

const worker=fs.readFileSync('eterna-worker/src/index.js','utf8');

assert.match(worker,/160\.99\.10-grounded-arithmetic-normalization/);
assert.match(worker,/CONVERSATION_DIRECTOR_VERSION="conversation-director-v1"/);
assert.match(worker,/function profileAgeFromContext/);
assert.match(worker,/function isStudentAgeQuestion/);
assert.match(worker,/function conversationDirector/);
assert.match(worker,/route:"profile_age"/);
assert.match(worker,/route:"personal"/);
assert.match(worker,/route:"safety"/);
assert.match(worker,/recentInterventionTags\(history\)/);
assert.match(worker,/escuchar→comprender→aclarar→ayudar→comprobar→cerrar/);
assert.match(worker,/No tengo tu edad confirmada en el perfil/);
assert.match(worker,/Tienes \\?\$\{age\} años/);
assert.match(worker,/conversation_director_v1:true/);
assert.match(worker,/semantic_repetition_guard_v1:true/);
assert.match(worker,/profile_age_resolution_v1:true/);

const safetyPos=worker.indexOf('if(scope.scope==="safety"||director.route==="safety")');
const agePos=worker.indexOf('if(director.route==="profile_age")');
const personalPos=worker.indexOf('scope.intent==="personal_help"||director.route==="personal"');
assert.ok(safetyPos>0 && agePos>safetyPos && personalPos>agePos,'priority must remain safety > profile > personal/academic routing');

console.log('conversation-director-v1 regression checks passed');
