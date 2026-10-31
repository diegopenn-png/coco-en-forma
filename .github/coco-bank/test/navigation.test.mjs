import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {renderApp} from '../src/ui.mjs';
import {action,summary,CATALOG} from '../src/engine.mjs';
const now=Date.parse('2026-10-31T12:00:00Z');
const market={prices:{},rate:{annualPct:2.4,fetchedAt:now},events:[]};
const act=(s,a)=>action(s,market,{requestId:crypto.randomUUID(),...a},now,{parent:true});
const fixture=()=>{let s=act(null,{type:'open_account',name:'Ana <prueba>'});s=act(s,{type:'setup',config:{start:'2026-10-31',end:'2027-01-31',initial:10,salary:150,house:60,car:20,other:15,reserve:20,target:.6,title:'Mi meta',reward:10}});s=act(s,{type:'receive'});s=act(s,{type:'pay_all'});return act(s,{type:'organize'})};
async function harness(state=fixture(),failure=false){
 const handlers={},requests=[],root={innerHTML:'',addEventListener:(k,f)=>handlers[k]=f};const misc={};
 const document={getElementById:id=>id==='app'?root:['modal','status','retry'].includes(id)?(misc[id]??={innerHTML:'',replaceChildren(){}}):null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){}};
 let listener;const parent={postMessage(msg){requests.push(msg);if(msg.path==='/state')queueMicrotask(()=>listener({source:parent,data:{reply:true,channel:msg.channel,id:msg.id,...(failure?{error:'Sin conexión'}:{data:{state,summary:summary(state,market,now),market,catalog:CATALOG,serverTime:now,parent:{configured:true}}})}}))}};
 const context={document,parent,console,crypto,structuredClone,Date,Intl,scrollTo(){},scrollY:0,setTimeout:()=>1,clearTimeout(){},addEventListener:(k,f)=>{if(k==='message')listener=f}};context.window=context;
 vm.runInNewContext(renderApp().match(/<script>([\s\S]*)<\/script>/)[1],context);
 await new Promise(r=>setImmediate(r));
 return {root,requests,click:async(attrs)=>{const b={dataset:Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),v])),hasAttribute:k=>k in attrs};await handlers.click({target:{closest:()=>b}})}};
}
test('home guides the next step, renders four distinct areas, and escapes account names',async()=>{const h=await harness();assert.match(h.root.innerHTML,/Tu siguiente paso/);assert.match(h.root.innerHTML,/Ana &lt;prueba&gt;/);assert.equal((h.root.innerHTML.match(/class="hub-tile /g)||[]).length,4);assert.match(h.root.innerHTML,/Dinero que puedes usar/);assert.equal(h.requests.length,1)});
test('all five navigation destinations render and expose the correct active location without financial writes',async()=>{const h=await harness();for(const [attrs,expected,current] of [[{'data-section':'account'},'¿Cuánto dinero tienes?','account'],[{'data-account-view':'investments'},'Aprende antes de invertir','account'],[{'data-section':'house'},'Paga los gastos de tu casa','house'],[{'data-house-view':'budget'},'Consulta el plan','house'],[{'data-tab':'challenges'},'cuánto llevas','challenges'],[{'data-tab':'school'},'Toca una pregunta','school'],[{'data-tab':'home'},'Tu siguiente paso','home']]){await h.click(attrs);assert.ok(h.root.innerHTML.includes(expected),expected);assert.match(h.root.innerHTML,new RegExp('data-(?:section|tab)="'+current+'" aria-current="page"'));assert.match(h.root.innerHTML,/data-close aria-label="Volver a Coco"/)}assert.equal(h.requests.length,1)});
test('next-step action opens the intended destination and exit sends only a close event',async()=>{const h=await harness();await h.click({'data-next':'investments'});assert.match(h.root.innerHTML,/Aprende antes de invertir/);await h.click({'data-close':''});assert.equal(h.requests.at(-1).close,true);assert.equal(h.requests.filter(x=>x.path==='/action').length,0)});
test('connection errors still offer exit and retry',async()=>{const h=await harness(null,true);assert.match(h.root.innerHTML,/Sin conexión/);assert.match(h.root.innerHTML,/id="retry"/);await h.click({'data-close':''});assert.equal(h.requests.at(-1).close,true)});
test('parental setup and financial operations remain gated',()=>{assert.throws(()=>action(null,market,{type:'setup',requestId:'parent-denied'},now),/PIN parental/);let s=act(null,{type:'open_account',name:'Test'});assert.equal(s.config,null)});
