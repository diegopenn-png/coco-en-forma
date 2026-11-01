const {JSDOM,VirtualConsole}=require(process.env.COCO_JSDOM_PATH||'jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const settle=()=>new Promise(r=>setImmediate(r));
(async()=>{
 const {Chess}=await import('../games/ajedrez/vendor/chess.mjs');
 const content=await import('../games/ajedrez/content.mjs');
 const {chooseMove}=await import('../games/ajedrez/engine.mjs');
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync('games/ajedrez/index.html','utf8'),{url:'https://cocoenforma.com/games/ajedrez/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window,d=w.document;Object.assign(w,{Chess,chooseMove,...content});w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(value=''){this.returnValue=value;this.open=false;this.dispatchEvent(new w.Event('close'))};
 let user=null,latest=null,watched=null,networkCalls=[],daily=null,day='2026-11-01';
 class FakeOnline{
  get user(){return user}async init(){return user}async login(){user={id:'white-user'};return user}stop(){}reconnect(){}async refresh(){}
  async call(action,body={}){networkCalls.push(action);
   if(action==='daily_get')return {daily,day};
   if(action==='daily_start'){daily??={id:'daily-1',user_id:user.id,day,status:'active',pgn:'',version:0,points:null};return {daily,day}}
   if(action==='daily_move'){assert.equal(body.version,daily.version);const g=new Chess();if(daily.pgn)g.loadPgn(daily.pgn);g.move({from:body.from,to:body.to});g.move('e5');daily={...daily,pgn:g.pgn(),version:daily.version+1};return {daily,day}}
   if(action==='daily_resign'){daily={...daily,status:'finished',result:'0-1',points:0,end_reason:'Has abandonado.',version:daily.version+1};return {daily,day}}
   if(action==='list')return {rooms:latest?[latest]:[]};if(action==='create'){latest={id:'room-1',invite_code:'1234567890ABCDEF',white_user:user.id,white_name:'Ana',black_user:null,status:'waiting',pgn:'',version:0};return {room:latest}}if(action==='move'){assert.equal(body.version,latest.version);const g=new Chess();if(latest.pgn)g.loadPgn(latest.pgn);g.move(body);latest={...latest,pgn:g.pgn(),version:latest.version+1};return {room:latest}}if(action==='cancel')return {room:{...latest,status:'cancelled',version:latest.version+1}};throw new Error('Unexpected '+action)}
  watch(id,onRoom,onState){watched=onRoom;onState(true)}
 }
 w.FakeOnline=FakeOnline;
 const source=fs.readFileSync('games/ajedrez/app.mjs','utf8').replace(/^import .*;\n/gm,'').replaceAll('import.meta.url',JSON.stringify('https://cocoenforma.com/games/ajedrez/app.mjs')).replace("await import('./online.mjs')",'({OnlineChess:window.FakeOnline})');w.eval(source);
 const $=id=>d.getElementById(id),click=sel=>d.querySelector(sel).click(),route=name=>{assert.equal(d.body.dataset.screen,name);const visible=[...d.querySelectorAll('main>.screen')].filter(x=>!x.hidden);assert.equal(visible.length,1,'only one screen is visible');assert.equal($('playing').hidden,name!=='play')};
 click('#dailyEntry');await settle();await settle();route('daily');assert.ok(!$('dailyLogin').hidden);assert.ok($('dailyStart').hidden);assert.equal(networkCalls.length,0);click('#back');
 route('home');assert.equal($('board').children.length,0,'no inactive board at entry');
 click('[data-mode=standard]');route('setup');assert.equal(d.activeElement.id,'setupTitle');click('[data-opponent=local]');assert.ok($('aiSettings').hidden);
 click('#start');await settle();route('play');assert.equal($('board').children.length,64);assert.equal(d.activeElement.id,'turnTitle');
 click('[data-square=e2]');click('[data-square=e4]');await settle();assert.ok($('board').querySelector('[data-square=e4] .piece'));const saved=JSON.parse(w.localStorage.getItem('coco-chess-standard-v1')).pgn;
 click('#options');assert.ok($('optionsDialog').open);click('[data-close=optionsDialog]');assert.ok(!$('optionsDialog').open);
 click('#back');route('setup');click('#back');route('home');click('[data-mode=learn]');route('catalog');click('.catalog-item');route('play');click('[data-square=e4]');await settle();assert.ok(!$('next').hidden);assert.equal(JSON.parse(w.localStorage.getItem('coco-chess-standard-v1')).pgn,saved,'lessons preserve local match');
 click('#back');route('catalog');click('#back');route('home');click('#resume');await settle();route('play');assert.ok($('board').querySelector('[data-square=e4] .piece'));
 click('#back');click('#back');click('#onlineEntry');await settle();await settle();route('online');assert.ok(!$('onlineLogin').hidden);assert.ok($('onlineChoices').hidden);assert.equal(networkCalls.length,0,'anonymous has no room access');
 $('onlineEmail').value='fixture@example.invalid';$('onlinePassword').value='fixture-password';$('onlineLogin').dispatchEvent(new w.Event('submit',{cancelable:true}));await settle();await settle();assert.ok(!$('onlineChoices').hidden);assert.equal($('onlinePassword').value,'');
 click('#createRoom');await settle();route('waiting');assert.match($('inviteCode').textContent,/1234 5678 90AB CDEF/);assert.ok($('playing').hidden);
 latest={...latest,black_user:'black-user',black_name:'Luis',status:'active',version:1};watched(latest);route('play');assert.ok($('hint').hidden);assert.ok($('undo').hidden);
 click('[data-square=e2]');click('[data-square=e4]');await settle();assert.equal(networkCalls.filter(x=>x==='move').length,1);assert.ok($('board').querySelector('[data-square=e4] .piece'));
 click('[data-square=e7]');click('[data-square=e5]');await settle();assert.equal(networkCalls.filter(x=>x==='move').length,1,'cannot move rival pieces');
 w.dispatchEvent(new w.Event('offline'));assert.ok(!$('reconnectRoom').hidden);click('[data-square=d2]');click('[data-square=d4]');await settle();assert.equal(networkCalls.filter(x=>x==='move').length,1,'no moves while disconnected');
 assert.equal(JSON.parse(w.localStorage.getItem('coco-chess-standard-v1')).pgn,saved,'online game preserves local save');
 click('#back');await settle();route('online');assert.ok(d.querySelector('.room-item'));click('#back');route('home');
 click('[data-rules]');assert.ok($('rulesDialog').open);click('[data-close=rulesDialog]');assert.ok(!$('rulesDialog').open);

 click('#dailyEntry');await settle();await settle();route('daily');assert.ok($('dailyLogin').hidden);click('#dailyStart');await settle();route('play');assert.ok($('hint').hidden);assert.ok($('undo').hidden);assert.match($('modeBadge').textContent,/DÍA/);
 click('[data-square=e2]');click('[data-square=e4]');await settle();assert.equal(networkCalls.filter(x=>x==='daily_move').length,1);assert.ok($('board').querySelector('[data-square=e5] .piece'));assert.equal(JSON.parse(w.localStorage.getItem('coco-chess-standard-v1')).pgn,saved);
 click('#back');await settle();await settle();route('daily');assert.match($('dailyStart').textContent,/Continuar/);click('#dailyStart');await settle();route('play');assert.ok($('board').querySelector('[data-square=e4] .piece'));
 w.dispatchEvent(new w.Event('offline'));assert.ok(!$('dailyRefresh').hidden);click('[data-square=d2]');click('[data-square=d4]');assert.equal(networkCalls.filter(x=>x==='daily_move').length,1);click('#dailyRefresh');await settle();assert.ok($('dailyRefresh').hidden);
 click('#options');click('#resign');await settle();assert.ok($('dialog').open);$('dialog').close('yes');await settle();assert.match($('status').textContent,/0 puntos guardados/);assert.equal(daily.status,'finished');
 click('#back');await settle();await settle();route('daily');assert.match($('dailyStart').textContent,/resultado/);click('#back');click('[data-mode=standard]');route('setup');assert.ok(!$('start').disabled,'free play remains available');
 click('#back');day='2026-11-02';daily=null;click('#dailyEntry');await settle();await settle();assert.match($('dailyStart').textContent,/Empezar/);assert.equal(networkCalls.filter(x=>x==='daily_start').length,1,'viewing next day does not consume it');
 assert.deepEqual(errors,[]);w.close();console.log('PASS: separate screens, board entry, local resume, lessons, dialogs, registered online entry, private invitation, turn ownership, daily scoring, resume, offline guard, new day and free play after daily completion.');
})().catch(e=>{console.error(e);process.exitCode=1});
