import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const c={Intl};vm.createContext(c);vm.runInContext(read("../src/library/content-v1.js"),c);vm.runInContext(read("../src/library/runtime-v1.js"),c);
const lib=c.EternaOwnedLibrary;
const cases=[
  ["Quiero que me expliques el doble y la mitad","2º de Primaria","p-double-half"],
  ["Necesito que me ayudes a entender la pendiente de una recta","3º de ESO","e-slope"],
  ["Me gustaría comprender la ley de Coulomb","2º de Bachillerato","b-coulomb"],
  ["¿Qué significa la mitad?","3º de Primaria","p-double-half"],
  ["Háblame de la ley de Coulomb","2º de Bachillerato","b-coulomb"],
  ["No entiendo bien la pendiente de una recta","4º de ESO","e-slope"],
];
for(const [text,year,id] of cases)test("natural zero-model phrasing: "+text,()=>{
  const lesson=lib.exactLesson(text,{school_year:year});
  assert.equal(lesson?.id,id);
  const d=lib.decision({text,profile:{school_year:year},mode:"explain"});
  assert.equal(d?.lesson.id,id);assert.equal(d?.model_calls,0);assert.equal(d?.generation_tokens,0);
});
test("fast phrasing remains closed-domain and rejects extra clauses",()=>{
  assert.equal(lib.exactLesson("Explícame la ley de Coulomb y dime el tiempo de mañana",{school_year:"2º de Bachillerato"}),null);
  assert.equal(lib.exactLesson("No entiendo bien algo que no está en la biblioteca",{school_year:"4º de ESO"}),null);
});
