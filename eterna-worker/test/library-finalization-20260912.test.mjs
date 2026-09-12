import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const c = {Intl};
vm.createContext(c);
vm.runInContext(read('../src/library/content-v1.js'), c);
vm.runInContext(read('../src/library/runtime-v1.js'), c);
vm.runInContext(read('../src/library/curriculum-sources-v2.js'), c);
const lessons = JSON.parse(JSON.stringify(c.ETERNA_LIBRARY_CONTENT.lessons));
const library = c.EternaOwnedLibrary;
const sources = JSON.parse(JSON.stringify(c.ETERNA_CURRICULUM_SOURCES_V2));
const stages = ['infantil','primaria','eso','bachillerato'];

const bannedAbsolutes = /\b(?:siempre garantiza|cura segura|nunca falla|100% seguro|todos los alumnos deben|obligatorio en toda españa)\b/i;
const unsafeInstruction = /\b(?:mezcla lejía|fabricar explosiv|hacer una bomba|autolesionarse|dosis de medicamento)\b/i;

function corpus(l){
  return [l.title,l.explanation,l.simpler,l.example,l.why,l.misconception,...(l.hints||[]),...(l.quiz||[]).flatMap(q=>[q.question,...q.options,q.hint])].join(' ');
}

test('finalization gate preserves the complete prepared corpus and stage balance', () => {
  assert.equal(lessons.length, 310);
  assert.equal(lessons.flatMap(l=>l.quiz).length, 930);
  assert.deepEqual(Object.fromEntries(stages.map(s=>[s,lessons.filter(l=>l.stage===s).length])), {infantil:38,primaria:95,eso:97,bachillerato:80});
  assert.equal(new Set(lessons.map(l=>l.id)).size, lessons.length);
  for (const stage of stages) assert.ok(new Set(lessons.filter(l=>l.stage===stage).map(l=>l.subject)).size >= 3, stage);
});

test('every lesson passes a multidisciplinary structural and pedagogical minimum', () => {
  for (const l of lessons) {
    assert.ok(stages.includes(l.stage), l.id);
    assert.ok(l.subject?.trim(), l.id);
    assert.ok(l.title?.trim(), l.id);
    assert.ok(Array.isArray(l.school_years) && l.school_years.length, l.id);
    assert.ok(Array.isArray(l.aliases) && l.aliases.length, l.id);
    assert.ok(l.explanation.length >= 90, l.id);
    assert.ok(l.simpler.length >= 40, l.id);
    assert.ok(l.example.length >= 40, l.id);
    assert.ok(l.why.length >= 50, l.id);
    assert.ok(l.misconception?.length >= 15, l.id);
    assert.equal(l.quiz.length, 3, l.id);
    assert.equal(l.human_teacher_reviewed, false, l.id);
    assert.equal(l.source_kind, 'original_teaching_material', l.id);
    assert.match(l.curriculum_source, /^https:\/\/www\.boe\.es\//, l.id);
    assert.doesNotMatch(corpus(l), bannedAbsolutes, l.id);
    assert.doesNotMatch(corpus(l), unsafeInstruction, l.id);
    for (const q of l.quiz) {
      assert.equal(q.options.length, 3, `${l.id}:${q.id}`);
      assert.equal(new Set(q.options).size, 3, `${l.id}:${q.id}`);
      assert.match(q.answer, /^[ABC]$/, `${l.id}:${q.id}`);
      assert.ok(q.question.trim().length > 8, `${l.id}:${q.id}`);
      assert.ok(q.hint.trim().length > 10, `${l.id}:${q.id}`);
    }
  }
});

test('every prepared lesson stays usable in all six modes without a model dependency', () => {
  for (const l of lessons) for (const mode of ['homework','ask','review','explain','exam','practice']) {
    const d = library.decision({text:'Explícame '+l.title, profile:{school_year:l.school_years[0]}, mode});
    assert.equal(d?.lesson?.id, l.id, `${l.id}:${mode}`);
    assert.equal(d.model_calls, 0, `${l.id}:${mode}`);
    if (mode === 'review') assert.match(d.reply, /Necesito ver/, l.id);
    if (mode === 'homework') assert.match(d.reply, /enunciado/, l.id);
    if (mode === 'exam' || mode === 'practice') assert.ok(d.check_question, `${l.id}:${mode}`);
  }
});

test('all 930 prepared checks retain deterministic grading and do not trust client answer keys', () => {
  for (const l of lessons) for (let pos=0; pos<l.quiz.length; pos++) {
    const q = l.quiz[pos];
    const ped = {current_mode:'practice',active_concept:l.title,pending_question:library.question(q),pending_question_id:'final-'+pos,next_teaching_goal:`lib:v1:${l.id}:${pos}:0:practice`,expected_key_ideas:['CLIENT_KEY_MUST_NOT_WIN']};
    const right = library.decision({text:q.answer,mode:'practice',profile:{school_year:l.school_years[0]},pedState:ped});
    assert.equal(right?.assessment, 'correct', `${l.id}:${q.id}`);
    const wrongLetter = q.answer === 'A' ? 'B' : 'A';
    const wrong = library.decision({text:wrongLetter,mode:'practice',profile:{school_year:l.school_years[0]},pedState:ped});
    assert.equal(wrong?.assessment, 'incorrect', `${l.id}:${q.id}`);
  }
});

test('curriculum traceability keeps state baseline separate from territorial implementation', () => {
  assert.deepEqual(Object.keys(sources.national), stages);
  assert.equal(sources.human_teacher_reviewed, false);
  const andalucia = sources.autonomous_communities['Andalucía'];
  assert.ok(andalucia);
  assert.deepEqual(Object.keys(andalucia.stages), stages);
  for (const stage of stages) {
    assert.match(andalucia.stages[stage].decree.url, /^https:\/\/www\.juntadeandalucia\.es\/boja\//);
    assert.match(andalucia.stages[stage].development_order.url, /^https:\/\/www\.juntadeandalucia\.es\/boja\//);
  }
  assert.match(sources.scope_note, /not a claim/i);
});

test('finalization truthfulness: prepared coverage is broad but never mislabeled as exhaustive or human-certified', () => {
  assert.equal(c.ETERNA_LIBRARY_CONTENT.coverage_complete, false);
  assert.equal(c.ETERNA_LIBRARY_CONTENT.human_teacher_reviewed, false);
  for (const l of lessons) {
    assert.doesNotMatch(l.review_method, /human teacher certified/i, l.id);
    assert.match(l.license_note, /sin aval oficial/i, l.id);
  }
});
