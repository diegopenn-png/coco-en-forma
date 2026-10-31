const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const drawing=new Proxy({},{get:()=>()=>{},set:()=>true});
for(const difficulty of [1,2,3])for(const day of [1,2,3,4]){
 const elements={},messages=[];const el=()=>({style:{},setAttribute(){},replaceChildren(){},getContext:()=>drawing,getBoundingClientRect:()=>({left:0,top:0,width:600,height:600}),setPointerCapture(){},scrollIntoView(){}});
 const box={console,URLSearchParams,location:{search:`?difficulty=${difficulty}&day=${day}`,origin:'https://coco.test'},document:{querySelector:s=>elements[s]??=el(),createElement:el,documentElement:{scrollHeight:800},body:{}},window:{parent:{postMessage:m=>messages.push(m)},addEventListener(){},scrollTo(){}},assert};vm.createContext(box);
 vm.runInContext(fs.readFileSync('games/conecta/levels.js','utf8')+fs.readFileSync('games/conecta/game.js','utf8')+`
 function e(p){return{clientX:p[0],clientY:p[1],pointerId:1}}
 assert.equal(mission.length,3);assert.equal(new Set(mission).size,3);
 $('#next').onclick();assert.equal(missionStep,0);
 $('#hint').onclick();$('#hint').onclick();assert.equal(hinted.size,1);assert.ok(hint>=0);
 for(let step=0;step<3;step++){
  for(const route of levels[level].paths){canvas.onpointerdown(e(route[0]));for(const p of route.slice(1))canvas.onpointermove(e(p));canvas.onpointerup(e(route.at(-1)))}
  assert.equal(Object.keys(paths).length,levels[level].paths.length);
  $('#next').onclick();
 }
 $('#next').onclick();assert.equal(submitted,true);`,box);
 const finishes=messages.filter(m=>m.type==='coco-connect-complete');assert.equal(finishes.length,1);assert.equal(finishes[0].completed,3);assert.equal(finishes[0].hints,1);assert.equal(finishes[0].mistakes,0);
}
const html=fs.readFileSync('index.html','utf8');const start=html.indexOf('  function startConnect(){'),end=html.indexOf('  function classificationAudit()',start);
let receiver,finished=0;const run={level:3,phase:'playing',startedAt:Date.now()},frame={style:{},contentWindow:{}};
const box={active:run,document:{createElement:()=>frame},body:{replaceChildren(){}},dailySerial:()=>1,setHud(){},window:{addEventListener:(_,fn)=>receiver=fn,removeEventListener(){}},location:{origin:'https://coco.test'},Date,balancedScore:(_,level,p)=>Math.round(102*1.08*p),finishGame:(points,metrics)=>{finished++;run.phase='result';assert.equal(points,99);assert.equal(metrics.performance,.9)}};
vm.runInNewContext(html.slice(start,end)+'startConnect();',box);
const data={type:'coco-connect-complete',completed:3,hints:1,mistakes:0};receiver({origin:'https://evil.test',source:frame.contentWindow,data});receiver({origin:box.location.origin,source:{},data});assert.equal(finished,0);
receiver({origin:box.location.origin,source:frame.contentWindow,data});receiver({origin:box.location.origin,source:frame.contentWindow,data});assert.equal(finished,1);
for(const token of ['conecta:{executive:.6,visual:.4}','["conecta","Colores"]','clasificacion_global_v160122','conecta:{domain:"Planificación y percepción visoespacial"'])assert.ok(html.includes(token),token);
console.log('PASS: 12 missions / 36 boards, immediate hint, one completion, parent source/origin isolation, scoring and report/catalog coverage.');
