import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const text = readFileSync(new URL('../src/library/curriculum-sources-v2.js', import.meta.url), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(text, context);
const sources = JSON.parse(JSON.stringify(context.ETERNA_CURRICULUM_SOURCES_V2));

test('national curriculum source registry covers all four school stages with BOE sources', () => {
  assert.deepEqual(Object.keys(sources.national), ['infantil','primaria','eso','bachillerato']);
  for (const urls of Object.values(sources.national)) {
    assert.ok(urls.length >= 1);
    for (const url of urls) assert.match(url, /^https:\/\/www\.boe\.es\//);
  }
});

test('territorial registry names all autonomous communities plus Ceuta and Melilla', () => {
  const expected = ['Andalucía','Aragón','Asturias','Illes Balears','Canarias','Cantabria','Castilla-La Mancha','Castilla y León','Cataluña','Comunitat Valenciana','Extremadura','Galicia','La Rioja','Madrid','Murcia','Navarra','País Vasco','Ceuta','Melilla'];
  assert.deepEqual(Object.keys(sources.autonomous_communities), expected);
  for (const entry of Object.values(sources.autonomous_communities)) {
    assert.equal(entry.status, 'territorial_reference_layer');
    assert.ok(entry.authority);
    assert.ok(entry.official_portals.length >= 1);
    for (const url of entry.official_portals) assert.match(url, /^https:\/\//);
  }
});

test('Andalucía pins the 2023 decree and development order for every supported stage', () => {
  const a = sources.autonomous_communities['Andalucía'];
  const expected = {
    infantil: ['100','38'],
    primaria: ['101','39'],
    eso: ['102','36'],
    bachillerato: ['103','37']
  };
  assert.deepEqual(Object.keys(a.stages), Object.keys(expected));
  for (const [stage,[decree,order]] of Object.entries(expected)) {
    const row = a.stages[stage];
    assert.match(row.decree.label, new RegExp(`Decreto ${decree}\\/2023`));
    assert.match(row.decree.url, new RegExp(`/boja/2023/90/[1-4]$`));
    assert.match(row.development_order.label, /Orden de 30 de mayo de 2023/);
    assert.match(row.development_order.url, new RegExp(`/boja/2023/104/${order}$`));
  }
  assert.equal(a.stages.bachillerato.corrections.length, 1);
  assert.match(a.stages.bachillerato.corrections[0].url, /\/boja\/2023\/112\/2$/);
});

test('registry never overclaims teacher review or exhaustive territorial mapping', () => {
  assert.equal(sources.human_teacher_reviewed, false);
  assert.match(sources.scope_note, /not a claim/i);
  assert.match(sources.autonomous_communities['Andalucía'].note, /must not be inferred/i);
});
