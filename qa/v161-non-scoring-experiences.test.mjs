import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),html=fs.readFileSync(new URL('index.html',root),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
function section(start,end){const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return html.slice(a,b);}
function harness(cards=[]){
 const window={COCO_GENERAL_RANKING_IDS_V153:JSON.parse(html.match(/COCO_GENERAL_RANKING_IDS_V153=Object.freeze\((\[[^;]+?\])\)/)[1])};
 const writes=[],context=vm.createContext({window,console,setTimeout,clearTimeout,Number,Math,Promise,
  document:{querySelectorAll:selector=>selector.includes('.cocoGameCard[data-coco-juego]')?cards:[]},
  removeBasketballEverywhere(){},DISPLAY_NAMES:{},GAME_META:{},GAMES:{},
  clamp:(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0)),
  gameClient:()=>null,currentSession:async()=>null,
  saveLocal:async(id,points)=>{writes.push({id,points});return{ok:true,local:true}}});
 vm.runInContext(fs.readFileSync(new URL('coco-scoring-v160110.js',root),'utf8'),context);
 context.scoringApi=()=>window.CocoScoringV160110;
 vm.runInContext(section('  var GENERAL_IDS=','  var TITLE_TO_ID='),context);
 vm.runInContext(section('  function classificationIsGeneral','  function demoLeaderboard'),context);
 vm.runInContext(section('  function discoverGames(){','  function upgradeCarnetBrain'),context);
 vm.runInContext(section('  async function saveScore(','  function classificationIsGeneral'),context);
 vm.runInContext(section('  var COG_AREAS=','  function closeFamilyReport'),context);
 vm.runInContext(section('  function cognitiveProfile(rows){','  async function loadPlayerRows'),context);
 return{context,window,writes};
}
const unranked=['ciudad','bank','padel','eneagrama','generala'];
test('catalogue discovery cannot promote companion tools or unknown cards into the general league',()=>{
 const cards=[...unranked,'inventado','cocomed'].map(id=>({dataset:{cocoJuego:id,cocoKind:'tool',cocoClasificacion:'general'},classList:{contains:()=>false},querySelector:()=>({textContent:id})}));
 const {context,window}=harness(cards);context.discoverGames();
 assert.deepEqual(plain(context.GENERAL_IDS),window.COCO_GENERAL_RANKING_IDS_V153);
 for(const id of [...unranked,'inventado']){
  assert.equal(context.classificationIsGeneral(id),false,id);
  assert.equal(window.CocoCognitiveCatalog.registerGame(id,{classification:'general'}),false,id);
 }
 assert.equal(window.CocoCognitiveCatalog.registerGame('memoria',{classification:'own'}),true);
 assert.equal(context.classificationIsGeneral('memoria'),true);
 assert.deepEqual(plain(context.OWN_IDS),['cocomed']);
});
test('generic score saving performs no local or remote write for companion tools, unknown games, or free chess',async()=>{
 const {context,writes}=harness();
 context.gameClient=()=>{throw Error('Unranked experience reached the database client')};
 for(const id of [...unranked,'inventado','ajedrez']){
  const result=await context.saveScore(id,100,{},'synthetic');
  assert.equal(result.ok,false,id);assert.equal(result.unranked,true,id);
 }
 assert.deepEqual(writes,[]);
});
test('daily cognitive games and the separate Coco Med score retain their existing saving path',async()=>{
 const {context,writes}=harness();
 assert.equal((await context.saveScore('memoria',90,{},'synthetic')).ok,true);
 assert.equal((await context.saveScore('cocomed',800,{},'synthetic')).ok,true);
 assert.deepEqual(writes,[{id:'memoria',points:90},{id:'cocomed',points:800}]);
});
test('companion results cannot alter cognitive report values or counted plays',()=>{
 const {context,window}=harness();
 const ranked=[{juego:'memoria',puntos:80,puntuacion_version:'balanced-v1',rendimiento:.8}];
 const contamination=unranked.map(juego=>({juego,puntos:100000,puntuacion_version:'balanced-v1',rendimiento:1}));
 assert.deepEqual(plain(context.cognitiveProfile([...ranked,...contamination])),plain(context.cognitiveProfile(ranked)));
 const audit=window.CocoCognitiveCatalog.audit();
 assert.deepEqual(plain(audit.companionGames).sort(),[...unranked].sort());
 assert.equal(audit.unmappedGames.length,0);
 for(const ids of Object.values(audit.areas))for(const id of unranked)assert.ok(!ids.includes(id));
});
