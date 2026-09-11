// Revalidate automatic Send at target capture, after the existing asynchronous legal gate.
import{readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const hash=s=>createHash('sha256').update(s).digest('hex');
const path='eterna-mic-only-v4.js';let s=readFileSync(path,'utf8');assert.equal(hash(s),'aacc7fef5919a8d2d805d2cb0329afdd71092876b7e4f8d9623d7cb8f999164c');
s=s.replace('var session=null,pending=null,writing=false;','var session=null,pending=null,writing=false,dispatchTurn=null;');
s=s.replace('function cancelPending(){var s=pending;','function cancelPending(){if(dispatchTurn){dispatchTurn.cancelled=true;dispatchTurn=null}var s=pending;');
s=s.replace("    s.sent=true;pending=null;status('Enviando tu pregunta…','ok');button.click();return true",`    dispatchTurn=s;
    // The legal layer may replay this click asynchronously. Check the original intent again.
    if(button.addEventListener)button.addEventListener('click',function(ev){
      if(dispatchTurn===s)dispatchTurn=null;
      if(s.cancelled||s.overlay!==overlay()||s.field!==input()||!s.overlay.classList.contains('is-open')||document.hidden||s.key!==activityKey()||busy()||field.disabled||button.disabled||clean(field.value)!==clean(text)){
        ev.preventDefault();ev.stopImmediatePropagation()
      }
    },{capture:true,once:true});
    s.sent=true;pending=null;status('Enviando tu pregunta…','ok');button.click();return true`);
s=s.replace("if(!writing&&pending&&ev.target===input())", "if(!writing&&(pending||dispatchTurn)&&ev.target===input())");writeFileSync(path,s);
const p='eterna-worker/test/mic-auto-send.test.mjs';let t=readFileSync(p,'utf8');assert.equal(hash(t),'593c8731851ea310b8342bc4b179115f31bc4ce037c4c79bf34575507d5dbfd7');
t=t.replace('permission=null,canonical=false','permission=null,canonical=false,delayedGate=false');
t=t.replace('let now=10000,seq=0,voiced=false,requestPending=false,blockSend=false;','let now=10000,seq=0,voiced=false,requestPending=false,blockSend=false,gatePending=false;const targetGuards=[];');
t=t.replace("disabled:true,clicks:0,onclick:null,click(){if(this.disabled)return;emit(docListeners,'click',{target:this});this.clicks++;", "disabled:true,clicks:0,onclick:null,addEventListener(type,fn){targetGuards.push(fn)},click(){if(this.disabled)return;emit(docListeners,'click',{target:this});if(delayedGate&&!gatePending){gatePending=true;return}let blocked=false;const event={preventDefault(){},stopImmediatePropagation(){blocked=true}};for(const guard of targetGuards.splice(0)){guard(event);if(blocked)return}this.clicks++;");
t+=`\ntest('asynchronous legal gate accepts the same automatic intent exactly once',async()=>{const h=harness({delayedGate:true});await h.transcribe();assert.equal(h.send.clicks,0);h.send.click();assert.equal(h.send.clicks,1)});
test('close during the existing legal gate prevents its delayed automatic replay',async()=>{const h=harness({delayedGate:true});await h.transcribe();h.close();h.send.click();assert.equal(h.send.clicks,0)});
test('new activity during the legal gate prevents its delayed automatic replay',async()=>{const h=harness({delayedGate:true});await h.transcribe();h.ctx.session_id='another-session';h.event('coco:eterna-context-invalidated');h.send.click();assert.equal(h.send.clicks,0)});
`;
writeFileSync(p,t);console.log('Final dispatch boundary covered without changing the legal gate.');
