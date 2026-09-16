import fs from 'node:fs';

function replaceRequired(source, oldValue, newValue, label){
  if(source.includes(newValue)) return source;
  if(!source.includes(oldValue)) throw new Error(`${label} anchor missing`);
  return source.replace(oldValue,newValue);
}

const workerPath='eterna-worker/src/index.js';
let source=fs.readFileSync(workerPath,'utf8');
source=replaceRequired(source,'const VERSION="160.99.16-current-turn-subject-vision";','const VERSION="160.99.17-generic-photo-general-vision";','worker version');
source=replaceRequired(
  source,
  'function preferGeneralWorksheetVision(text,intake){const subject=currentTurnSubjectHint(text)||intake?.subject||null,canonical=canonicalAcademicSubject(subject);return Boolean(canonical&&canonical!=="math")}',
  'function preferGeneralWorksheetVision(text,intake){const subject=currentTurnSubjectHint(text)||intake?.subject||null,canonical=canonicalAcademicSubject(subject);return canonical!=="math"}',
  'generic photo routing'
);
source=replaceRequired(
  source,
  'regional_worksheet_vision_v1:true,grounded_arithmetic_ocr_v1:true',
  'regional_worksheet_vision_v1:true,generic_photo_general_vision_v1:true,grounded_arithmetic_ocr_v1:true',
  'vision feature'
);
fs.writeFileSync(workerPath,source);

const latencyPath='eterna-worker/test/latency-contract.test.mjs';
let latency=fs.readFileSync(latencyPath,'utf8');
for(const testName of [
  'a stalled primary Cloudflare vision call yields to grounded regional arithmetic',
  'a stale PWA without client regions falls back to the complete original image',
  'the complete image remains available when horizontal client crops cut equations',
]){
  const start=latency.indexOf(`test("${testName}"`);
  if(start<0) throw new Error(`latency test missing: ${testName}`);
  const end=latency.indexOf('\ntest("',start+10);
  const stop=end<0?latency.length:end;
  const block=latency.slice(start,stop);
  const oldText='"He adjuntado una foto de mi tarea."';
  const newText='"He adjuntado una foto de mi tarea de matemáticas."';
  if(block.includes(newText)) continue;
  if(!block.includes(oldText)) throw new Error(`generic arithmetic fixture missing: ${testName}`);
  latency=latency.slice(0,start)+block.replace(oldText,newText)+latency.slice(stop);
}
fs.writeFileSync(latencyPath,latency);

const hashUpdates=[
  ['eterna-worker/test/content-370.test.mjs','65fe4219e2c0ea8e17d4effd737b2569f649d183a515d514e4ceec1ab5d5558f','1b0ec7b83c999561ad99c73210ba077a8d03b82d80043ecf9b2772886f3881a7'],
  ['eterna-worker/test/content-410.test.mjs','28781f150336ddfea4e57d8db77f53a7b3ecb1884b429cf5bfbdc27f14dbfc16','3c8ad047885658a074bc8d47c86b3a3853d898a5d63eb144793b2ab887d5aeaf'],
];
for(const [path,oldHash,newHash] of hashUpdates){
  let text=fs.readFileSync(path,'utf8');
  text=replaceRequired(text,oldHash,newHash,`canonical hash ${path}`);
  fs.writeFileSync(path,text);
}

const diagnostic='qa/eterna/regression-1609917.log';
if(fs.existsSync(diagnostic)) fs.rmSync(diagnostic);
