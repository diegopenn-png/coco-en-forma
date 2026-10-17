import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../eterna-v159.js',import.meta.url),'utf8');
const modes=['homework','ask','review','explain','exam','practice'];
function harness(){
 const input={value:'Respuesta anterior',placeholder:'Escribe tu respuesta…',focus(){}};
 const elements=[];
 const makeNode=()=>({className:'',innerHTML:'',children:new Map(),appendChild(node){elements.push(node)},querySelector(selector){if(selector==='.eternaV160Start')return null;if(!this.children.has(selector))this.children.set(selector,{onclick:null,remove(){}});return this.children.get(selector)},querySelectorAll(){return[]},setAttribute(){},classList:{remove(){}}});
 const chat=makeNode(),composer=makeNode(),overlay={querySelector:s=>s==='[data-et-input]'?input:s==='[data-et-composer]'?composer:chat};
 const context={window:{},document:{readyState:'loading',addEventListener(){},createElement:makeNode},console,Set,URL,URLSearchParams,setTimeout,clearTimeout};
 vm.createContext(context);
 const injected=source.replace('  window.CocoEternaV160=Object.freeze({',`  window.__qa={state,resetVisibleSession,appendMessage,MODE_CONFIG};
    overlay=()=>globalThis.fakeOverlay;
    invalidateInFlight=()=>{};ensureActivity=()=>{};activityModeState=()=>({});clearImage=()=>{};stopAudio=()=>{};persistLearningSession=()=>{};renderConversation=()=>{};syncSendAvailability=()=>{};announceUiReset=()=>{};messageIsActionable=()=>false;
    setMode=(mode)=>{state.mode=mode;resetVisibleSession(true)};
    send=()=>{globalThis.sent={mode:state.mode,text:globalThis.fakeInput.value,history:state.history.slice()}};
    window.CocoEternaV160=Object.freeze({`);
 context.fakeOverlay=overlay;context.fakeInput=input;
 vm.runInContext(injected,context);
 return{api:context.window.__qa,input,elements,context};
}
for(const mode of modes){
 test(`${mode}: new activity clears stale answer and restores its input prompt`,()=>{
  const h=harness();h.api.state.mode=mode;h.api.state.history=[{role:'assistant',text:'Old question'}];
  h.api.resetVisibleSession(true);
  assert.equal(h.input.value,'');assert.equal(h.input.placeholder,h.api.MODE_CONFIG[mode].placeholder);assert.equal(h.api.state.history.length,0);
 });
 test(`${mode}: recommendation button carries the exact topic into fresh practice`,()=>{
  const h=harness();h.api.state.mode=mode;h.api.state.history=[{role:'assistant',text:'Old unrelated exercise'}];
  h.api.appendMessage('assistant','Practiquemos.',{verification_status:'verified',practice_suggestion:'Comparar fracciones con distinto denominador.',subject:'Matemáticas',concept:'comparación de fracciones'},false);
  const mission=h.elements.find(x=>x.className==='eternaV159Mission');assert.ok(mission);
  mission.querySelector('[data-et-practice]').onclick();
  const sent=h.context.sent;assert.equal(sent.mode,'practice');assert.match(sent.text,/Comparar fracciones con distinto denominador/);assert.match(sent.text,/Tema: comparación de fracciones/);assert.equal(sent.history.length,0);assert.ok(sent.text.length<=1800);
 });
}
