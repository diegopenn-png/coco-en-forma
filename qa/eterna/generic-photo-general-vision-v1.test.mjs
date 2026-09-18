import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('eterna-worker/src/index.js','utf8');

function buildRoute(){
  const start=source.indexOf('function allowArithmeticWorksheetRescue');
  const end=source.indexOf('function generalRegionPrompt',start);
  assert.ok(start>=0&&end>start,'allowArithmeticWorksheetRescue must exist');
  const fragment=source.slice(start,end);
  const currentTurnSubjectHint=text=>{
    const n=String(text||'').toLowerCase();
    if(n.includes('matemáticas')||n.includes('matematicas')||n.includes('mates')) return 'Matemáticas';
    if(n.includes('lengua')||n.includes('ortografía')||n.includes('ortografia')) return 'Lengua Castellana y Literatura';
    return null;
  };
  const canonicalAcademicSubject=value=>{
    const n=String(value||'').toLowerCase();
    if(!n) return null;
    if(n.includes('matem')||n.includes('mates')||n.includes('arit')) return 'math';
    if(n.includes('lengua')||n.includes('ortograf')||n.includes('literat')) return 'language';
    return n;
  };
  const arithmeticEvidenceIntake=evidence=>/[=×xX÷+−-]/.test(String(evidence||''))?{}:null;
  const fractionWorksheetEvidenceIntake=evidence=>/\d+\s*\/\s*\d+\s*[-+]\s*\d+\s*\/\s*\d+/.test(String(evidence||''))?{}:null;
  return new Function('currentTurnSubjectHint','canonicalAcademicSubject','arithmeticEvidenceIntake','fractionWorksheetEvidenceIntake',`${fragment};return allowArithmeticWorksheetRescue`)(currentTurnSubjectHint,canonicalAcademicSubject,arithmeticEvidenceIntake,fractionWorksheetEvidenceIntake);
}

test('generic photo message defaults to general worksheet vision, not arithmetic',()=>{
  const route=buildRoute();
  assert.equal(route('He adjuntado una foto de mi tarea.',{}),false);
  assert.equal(route('He adjuntado una foto de mi tarea.',{subject:null}),false);
});

test('language worksheets use general worksheet vision',()=>{
  const route=buildRoute();
  assert.equal(route('Es una tarea de Lengua.',{}),false);
  assert.equal(route('He adjuntado una foto de mi tarea.',{subject:'Lengua Castellana y Literatura'}),false);
});

test('explicitly detected mathematics keeps the arithmetic-specialized route',()=>{
  const route=buildRoute();
  assert.equal(route('Es una tarea de Matemáticas.',{}),true);
  assert.equal(route('He adjuntado una foto de mi tarea.',{subject:'Matemáticas'}),false);
  assert.equal(route('He adjuntado una foto de mi tarea.',{},'6 × hueco = 36'),true);
  assert.equal(route('He adjuntado una foto de mi tarea.',{},'7/5 - 2/3'),true);
});

test('release preserves generic-photo routing in the unified intake revision',()=>{
  assert.match(source,/const VERSION="160\.99\.24-contextual-dialogue";/);
  assert.match(source,/generic_photo_general_vision_v1:true/);
  assert.match(source,/unified_photo_intake_v2:true/);
});
