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

test('registry never overclaims teacher review or exhaustive territorial mapping', () => {
  assert.equal(sources.human_teacher_reviewed, false);
  assert.match(sources.scope_note, /not a claim/i);
});
