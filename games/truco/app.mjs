import {actor,bot,calls,deck,newMatch,move,view} from './engine.mjs';
import {hex,request} from './online.mjs';
import {getLanguage,setLanguage,messages} from './locale.mjs';
const app=document.querySelector('#app'),dialog=document.querySelector('#dialog');
const localKey='coco.truco.local.v1',roomKey='coco.truco.room.v1';
const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}};
const write=(k,v)=>{try{v===null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v));}catch{}};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const languages={es:'Español',en:'English',de:'Deutsch',nl:'Nederlands',fr:'Français',it:'Italiano',pl:'Polski',uk:'Українська',ru:'Русский','zh-Hans':'中文',ar:'العربية',sv:'Svenska',fi:'Suomi',nb:'Norsk',da:'Dansk'};
let lang=getLanguage(),t=messages[lang],local=read(localKey),room=null,page='menu',mode='solo',capacity=2,goal=15;
if(!local?.game||!['solo','local'].includes(local.mode))local=null;
const url=new URL(location.href);
const normalize=value=>String(value||'').trim().replace(/[\s-]/g,'').toUpperCase();
const invited=normalize(url.searchParams.get('mesa')||new URLSearchParams(url.hash.slice(1)).get('mesa'));
let joinCode=invited,name=read('coco.truco.nick',''),pendingCreate='',busy=false,shownSeat=null,botTimer,pollTimer,toastTimer,generation=0,networkIssue='';
if(invited)mode='online';
const button=(label,act,cls='',extra='')=>'<button type="button" class="btn '+cls+'" data-act="'+esc(act)+'" '+extra+'>'+esc(label)+'</button>';
const options=(arr,selected)=>arr.map(x=>'<option value="'+x+'"'+(x===selected?' selected':'')+'>'+x+'</option>').join('');
const backs=(n=3)=>'<div class="backs" aria-hidden="true">'+('<i class="backCard"></i>').repeat(n)+'</div>';
const teamName=team=>t.team+' '+(team+1);
const seatName=(v,s)=>local&&page==='local'?(local.mode==='solo'?(s===0?t.you:'Coco '+s):t.seat+' '+(s+1)):v.names[s];
const labelAct=a=>calls[a]||t[a]||a;
function msg(key){return t[key]||t.connectError;}
function notice(text){const n=document.querySelector('#notice');n.textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.textContent='',3500);}
function modal(html){document.querySelector('#dialogBody').innerHTML=html;document.querySelector('#dialogClose').textContent=t.close;if(!dialog.open)dialog.showModal();}
document.querySelector('#dialogClose').onclick=()=>dialog.close();
async function copy(link){
  try{await navigator.clipboard.writeText(link);notice(t.copied);}catch{modal('<label class="field">'+esc(t.fallbackCopy)+'<input readonly id="copyField" value="'+esc(link)+'"></label>');document.querySelector('#copyField').select();}
}
function gameURL(code){const u=new URL('/games/truco/',location.origin);u.searchParams.set('lang',lang);if(code)u.hash='mesa='+code;return u.href;}
function setHeader(){
  document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  document.title=t.title+' · Coco en Forma';const back=document.querySelector('#back');back.textContent=t.back;
  back.href='/?lang='+encodeURIComponent(lang)+'#juegos';
  document.querySelector('#lang').innerHTML=Object.entries(languages).map(([k,n])=>'<option value="'+k+'"'+(k===lang?' selected':'')+'>'+n+'</option>').join('');
}
document.querySelector('#lang').onchange=e=>{setLanguage(e.target.value);lang=getLanguage();t=messages[lang];setHeader();render();};
let dailyState,authClient;
async function dailyPlay(action){
 if(busy)return;
 busy=true;
 try{
 authClient??=window.supabase.createClient('https://fcatttsfufjiphgohgwp.supabase.co','sb_publishable_Jn3efpb36_j-vhx0nr_k3A_PLCY0y5X');
 const {data:{session}}=await authClient.auth.getSession();
 if(!session){modal('<p>'+esc(t.login)+'</p><a href="/?lang='+lang+'">'+esc(t.back)+'</a>');return;}
 const call=async body=>fetch('https://fcatttsfufjiphgohgwp.supabase.co/functions/v1/coco-truco-diario',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json',apikey:'sb_publishable_Jn3efpb36_j-vhx0nr_k3A_PLCY0y5X'},body:JSON.stringify(body)});
 let r=await call(action?{move:action,version:dailyState.version,dia:dailyState.dia}:{});
 if(r.status===409)r=await call({});
 if(!r.ok)throw Error(r.status===401?t.login:t.connectError);
 dailyState=await r.json();page='daily';
 }catch(e){notice(e.message||t.connectError);}finally{busy=false;render();}
}
function renderMenu(){
 const hasRoom=read(roomKey);
 app.innerHTML='<section class="hero"><h1>'+esc(t.title)+'</h1><p>'+esc(t.entry)+'</p></section><div class="panels"><section class="panel">'+button(t.daily+' · '+t.solo,'daily','prominent')+'<p class="small">'+esc(t.victory)+' +100 · '+esc(t.goal)+' 15</p><h2>'+esc(t.newGame)+'</h2><div class="modes">'+['solo','local','online'].map(x=>button(t[x],'mode-'+x,'mode','aria-pressed="'+(mode===x)+'"')).join('')+'</div>'+
 '<div class="settings"><label>'+esc(t.players)+'<select id="capacity">'+options([2,4,6],capacity)+'</select></label><label>'+esc(t.goal)+'<select id="goal">'+options([15,30],goal)+'</select></label></div>'+
 (mode==='online'?'<label class="field">'+esc(t.nickname)+'<input id="name" autocomplete="nickname" maxlength="24" value="'+esc(name)+'"></label><div class="actions">'+button(t.create,'create','primary')+'</div><div class="formRow"><label class="field">'+esc(t.code)+'<input id="code" class="code" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="20" value="'+esc(joinCode)+'"></label>'+button(t.join,'join','primary')+'</div>'+ (hasRoom?'<div class="box">'+button(t.resumeRoom,'resumeRoom')+'</div>':''):
 '<div class="actions">'+button(t.start,'start','primary')+(local?.mode===mode?button(t.continueGame,'resumeLocal'):'')+'</div>')+
 (networkIssue?'<p class="status" role="status">'+esc(msg(networkIssue))+'</p>':'')+
 '</section><aside class="panel guide"><details><summary>'+esc(t.rules)+'</summary><p>'+esc(t.rulesText)+'</p></details><p class="muted small">'+esc(t.ranking)+'</p>'+button(t.share,'share','minor')+'</aside></div>';
 if(busy)app.querySelectorAll('button,input,select').forEach(x=>x.disabled=true);
}
function renderLobby(){
 app.innerHTML='<section class="hero"><h1>'+esc(t.waiting)+'</h1><p>'+esc(t.players)+' · '+room.names.length+' / '+room.capacity+'</p></section><section class="panel box"><h2>'+esc(t.code)+'</h2><p class="code" dir="ltr">'+room.code.match(/.{1,4}/g).join(' – ')+'</p><div class="navActions">'+button(t.invite,'invite','primary')+'</div><ol class="seatList">'+room.names.map((n,i)=>'<li class="tag">'+esc(n)+' · '+esc(teamName(i%2))+'</li>').join('')+'</ol>'+onlineFoot()+'</section>';
}
function onlineFoot(showStatus=true){return '<div class="tools">'+button(t.menu,'menu','minor')+button(t.retry,'refresh','minor')+button(t.leave,'askLeave','minor')+'</div>'+(showStatus&&networkIssue?'<p role="status" class="muted small">'+esc(msg(networkIssue))+'</p>':'');}
function cardHTML(card,clickable=false,mini=false) {
 const [num,suit]=card.split('-'),label=num+' · '+t[suit];
 const inner='<strong>'+num+'</strong><img alt="" src="./art/'+suit+'.svg"><i aria-hidden="true">'+num+'</i>'+(!mini?'<small>'+esc(t[suit])+'</small>':'');
 return clickable?'<button class="card" data-act="'+card+'" aria-label="'+esc(label)+'">'+inner+'</button>':'<span class="card" role="img" aria-label="'+esc(label)+'">'+inner+'</span>';
}
function laidCards(v,table){return table.map(({seat,card})=>'<div class="slot">'+cardHTML(card,false,true)+'<span>'+esc(seatName(v,seat))+'</span></div>').join('');}
function logText(v,e){
 if(e.type==='action')return seatName(v,e.seat)+' · '+labelAct(e.action);
 if(e.type==='envResult')return seatName(v,e.seat)+(e.score===undefined?'':' ('+e.score+')')+' · +'+e.points;
 if(e.type==='award')return teamName(e.team)+' · +'+e.points;
 return t.trick+' · '+(e.team===-1?t.tie:teamName(e.team));
}
const tallyStrokes=['M4 21 L4 4','M4 4 L21 4','M21 4 L21 21','M21 21 L4 21','M3 22 L22 3'];
function tallyMarks(points){
 const groups=[];
 for(let start=0;start<points;start+=5){
  const marks=tallyStrokes.slice(0,points-start).map(line=>'<path d="'+line+'"/>').join('');
  groups.push('<svg viewBox="0 0 25 25" focusable="false">'+marks+'</svg>');
 }
 return '<span class="tallyMarks" aria-hidden="true">'+groups.join('')+'</span>';
}
function scoreboard(v){
 const teams=v.scores.map((points,i)=>{
  const name=v.names.length===2?seatName(v,i):teamName(i);
  return '<div class="teamScore"><div class="scoreLine"><strong>'+esc(name)+'</strong><span dir="ltr"><b>'+points+'</b> / '+v.goal+'</span></div>'+tallyMarks(points)+'</div>';
 });
 return '<section class="score" aria-label="'+esc(t.points)+'">'+teams.join('')+'</section>';
}
function renderBoard(v) {
 const s=v.seat,current=actor(v),mine=current===s,canPlay=mine&&v.phase==='play'&&!busy;
 const ended=v.phase!=='play';
 const status=ended?(v.phase==='finished'?t.victory+' · '+teamName(v.matchWinner):t.between+' · '+teamName(v.handWinner)):
 v.pending?seatName(v,v.pending.by)+' · '+labelAct(v.pending.last)+' · '+(mine?t.answer:t.turn+' · '+seatName(v,current)):
 mine?t.chooseCard:t.turn+' · '+seatName(v,current);
 const showExtras=!!app.querySelector('.boardExtras[open]');
 const handLabel=page==='local'&&local.mode==='local'?t.yourCards+' · '+seatName(v,s):t.yourCards;
 const lastTrick=!v.table.length&&v.lastTable.length;
 app.innerHTML=scoreboard(v)+
 '<div class="felt"><div class="feltHead"><strong>'+esc(t.hand)+' '+v.handNo+' · '+esc(t.trick)+' '+Math.min(3,v.tricks.length+1)+'</strong><span>×'+v.stake+'</span></div><div class="tableCards">'+(v.table.length?laidCards(v,v.table):lastTrick?laidCards(v,v.lastTable):backs())+'</div>'+
 (lastTrick?'<p class="lastTrick">'+esc(t.latest)+'</p>':'')+'</div>'+
 '<div class="boardInfo"><div class="rowTitle"><h3>'+esc(handLabel)+'</h3><span class="pill">'+esc(t.pointsInHand)+' '+v.myEnvido+'</span></div><div class="hand">'+v.cards.map(c=>cardHTML(c,canPlay&&v.options.includes(c))).join('')+'</div><p class="status" aria-live="polite">'+esc(status)+'</p>'+
 '<div class="actions">'+(canPlay?v.options.filter(x=>!deck.includes(x)&&x!=='fold').map(x=>button(labelAct(x),x,['accept','truco','envido'].includes(x)?'prominent':'')).join(''):'')+
 (canPlay&&v.options.includes('fold')?button(t.fold,'askFold','quiet'):'')+
 (v.phase==='between'?button(t.next,'next','primary'):v.phase==='finished'?button(t.menu,'menu','primary'):'')+'</div></div>'+
 (page==='online'&&networkIssue?'<p role="status">'+esc(msg(networkIssue))+'</p>':'')+
 '<details class="boardExtras"'+(showExtras?' open':'')+'><summary>'+esc(t.more)+'</summary>'+
 '<p class="small">'+esc(t.hand)+' · '+esc(seatName(v,v.mano))+'</p><ul class="seatList">'+v.names.map((n,i)=>'<li class="tag '+(!ended&&i===current?'active':'')+'">'+esc(seatName(v,i))+' · '+esc(teamName(i%2))+(v.folded?.includes(i)?' · '+esc(t.fold):'')+'</li>').join('')+'</ul>'+
 '<details class="histBlock"'+(app.querySelector('.histBlock[open]')?' open':'')+'><summary>'+esc(t.history)+'</summary><ul class="history">'+v.events.map(e=>'<li>'+esc(logText(v,e))+'</li>').join('')+'</ul></details>'+
 '<div class="tools">'+button(t.rules,'rules','minor')+(page!=='online'?button(t.menu,'menu','minor'):'')+'</div>'+
 (page==='online'?onlineFoot(false):'')+'</details>';
}
function render(){
 clearTimeout(botTimer);
 if(page==='menu')return renderMenu();
 if(page==='daily'){dailyState.game.names=[t.you,'Coco'];renderBoard(dailyState.game);app.insertAdjacentHTML('afterbegin','<p class="dailyHeading">'+esc(t.daily)+' · '+esc(dailyState.dia)+'</p>');if(dailyState.points!==null)app.insertAdjacentHTML('beforeend','<p>'+esc(t.points)+' +'+dailyState.points+'</p>');return;}
 if(page==='online'){
   if(!room)return renderMenu();
   if(room.closed){app.innerHTML='<div class="cover panel"><h1>'+esc(t.left)+'</h1>'+button(t.menu,'menu','primary')+'</div>';return;}
   return room.game?renderBoard(room.game):renderLobby();
 }
 if(!local){page='menu';return renderMenu();}
 const g=local.game,a=actor(g),pass=local.mode==='local';
 if(pass && shownSeat!==a && g.phase!=='finished'){
   app.innerHTML='<div class="cover panel">'+backs()+'<h1>'+esc(t.handover)+'<br>'+esc(t.seat)+' '+(a+1)+'</h1><p>'+esc(t.privacy)+'</p>'+button(t.reveal,'reveal','primary')+button(t.menu,'menu','minor')+'</div>';return;
 }
 renderBoard(view(g,pass?a:0));
 if(!pass && g.phase==='play'&&a!==0)botTimer=setTimeout(()=>{if(page==='local'){move(g,a,bot(view(g,a)));write(localKey,local);render();}},750);
}
function startLocal(){
 const names=Array.from({length:capacity},(_,i)=>mode==='solo'&&i!==0?'Coco '+i:t.seat+' '+(i+1));
 local={mode,game:newMatch(names,goal)};write(localKey,local);shownSeat=null;page='local';render();
}
function enterRoom(data){
 room=data;page='online';write(roomKey,data.code);networkIssue='';render();schedule();
}
function schedule(){
 clearTimeout(pollTimer);
 if(page==='online'&&room&&!room.closed&&room.game?.phase!=='finished'){
   pollTimer=setTimeout(async()=>{if(!document.hidden&&!busy)await refresh();schedule();},3000);
 }
}
async function refresh(){
 const id=generation,code=room?.code;if(!code||page!=='online')return;
 try{const next=await request('get',code);
 if(id!==generation||page!=='online'||busy||next.version<(room?.version??0))return;
 const changed=next.version!==room.version||networkIssue;room=next;networkIssue='';if(changed)render();
 }catch(e){if(id===generation&&page==='online'&&networkIssue!==e.message){networkIssue=e.message;render();}}
}
async function onlineAction(action,moveName){
 if(busy)return;
 if(['join','create'].includes(action)&&!name.trim()){notice(t.nameError);document.querySelector('#name')?.focus();return;}
 let code=room?.code,body={};
 if(action==='create'){code=pendingCreate||hex(6).toUpperCase();pendingCreate=code;body={name,capacity,goal};}
 if(action==='join'){code=normalize(joinCode);if(!/^[0-9A-F]{12}$/.test(code)){notice(t.invalidCode);return;}body={name};}
 if(action==='resumeRoom'){code=read(roomKey);action='get';}
 if(['play','leave'].includes(action))body={version:room.version,move:moveName};
 const id=++generation;busy=true;networkIssue='';render();
 try{
   const result=await request(action,code,body);if(id!==generation)return;
   if(action==='leave'){write(roomKey,null);room=null;page='menu';notice(t.left);}
   else {if(action==='create')pendingCreate='';enterRoom(result);}
 }catch(e){networkIssue=e.message;notice(msg(e.message));if(page==='online'&&room){try{const latest=await request('get',room.code);if(id===generation)room=latest;}catch{}}}
 finally{if(id===generation){busy=false;render();schedule();}}
}
function goMenu(){generation++;busy=false;page='menu';shownSeat=null;networkIssue='';clearTimeout(pollTimer);render();}
function gameMove(action){
 if(page==='daily')return dailyPlay(action);
 if(page==='online')return onlineAction('play',action);
 const g=local.game,s=local.mode==='solo'?0:actor(g);try{move(g,s,action);write(localKey,local);render();}catch{render();}
}
async function handle(action){
 if(action.startsWith('mode-')){mode=action.slice(5);networkIssue='';render();return;}
 switch(action){
 case 'start':if(local&&local.game.phase!=='finished'){modal('<p>'+esc(t.confirmLeave)+'</p>'+button(t.newGame,'replace','primary'));return;}return startLocal();
 case 'replace':dialog.close();return startLocal();
 case 'resumeLocal':page='local';shownSeat=null;return render();
 case 'reveal':shownSeat=actor(local.game);return render();
 case 'daily':return dailyPlay();
 case 'menu':return goMenu();
 case 'rules':return modal('<h2>'+esc(t.rules)+'</h2><p style="margin-top:.7rem;white-space:pre-line">'+esc(t.rulesText)+'</p>');
 case 'share':{
   const link=new URL('/juego/truco/?lang='+lang,location.origin).href;
   if(navigator.share){
    try{await navigator.share({title:t.title+' · Coco en Forma',url:link});return;}
    catch(error){if(error.name==='AbortError')return;}
   }
   return copy(link);
  }
 case 'invite':return copy(gameURL(room.code));
 case 'create':case 'join':case 'resumeRoom':return onlineAction(action);
 case 'refresh':return refresh();
 case 'askLeave':case 'askFold':return modal('<p>'+esc(action==='askLeave'?t.confirmLeave:t.fold+'?')+'</p>'+button(action==='askLeave'?t.leave:t.fold,action==='askLeave'?'leave':'fold','primary'));
 case 'leave':dialog.close();return onlineAction('leave');
 default:if(dialog.open)dialog.close();return gameMove(action);
 }
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&!busy)handle(b.dataset.act);});
document.addEventListener('input',e=>{if(e.target.id==='name'){name=e.target.value;write('coco.truco.nick',name);}if(e.target.id==='code')joinCode=e.target.value;});
document.addEventListener('change',e=>{if(e.target.id==='capacity')capacity=Number(e.target.value);if(e.target.id==='goal')goal=Number(e.target.value);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&page==='local'&&local?.mode==='local'){shownSeat=null;render();}if(!document.hidden&&page==='online')refresh();});
setHeader();render();
if(invited&&read(roomKey)===invited)onlineAction('resumeRoom');
