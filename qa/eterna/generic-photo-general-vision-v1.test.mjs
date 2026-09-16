import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('eterna-worker/src/index.js','utf8');

function buildRoute(){
  const match=source.match(/function preferGeneralWorksheetVision\(text,intake\)\{([^}]*)\}/);
  assert.ok(match,'preferGeneralWorksheetVision must exist');
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
  return new Function('currentTurnSubjectHint','canonicalAcademicSubject',`return function preferGeneralWorksheetVision(text,intake){${match[1]}}`)(currentTurnSubjectHint,canonicalAcademicSubject);
}

test('generic photo message defaults to general worksheet vision, not arithmetic',()=>{
  const route=buildRoute();
  assert.equal(route('He adjuntado una foto de mi tarea.',{}),true);
  assert.equal(route('He adjuntado una foto de mi tarea.',{subject:null}),true);
});

test('language worksheets use general worksheet vision',()=>{
  const route=buildRoute();
  assert.equal(route('Es una tarea de Lengua.',{}),true);
  assert.equal(route('He adjuntado una foto de mi tarea.',{subject:'Lengua Castellana y Literatura'}),true);
});

test('explicitly detected mathematics keeps the arithmetic-specialized route',()=>{
  const route=buildRoute();
  assert.equal(route('Es una tarea de Matemáticas.',{}),false);
  assert.equal(route('He adjuntado una foto de mi tarea.',{subject:'Matemáticas'}),false);
});

test('release exposes the generic-photo routing capability',()=>{
  assert.match(source,/const VERSION="160\.99\.17-generic-photo-general-vision";/);
  assert.match(source,/generic_photo_general_vision_v1:true/);
});
