import {actor,bot,calls,deck,envido,newMatch,move,view} from './engine.mjs?v=mesa-3';
import {hex,request} from './online.mjs';
import {getLanguage,setLanguage,messages} from './locale.mjs?v=mesa-5';
import {cue,muteSound,resetTableSound,tableSound,unlockSound} from './sound.mjs?v=mesa-2';
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
let profileName='',profileId='',soundOn=read('coco.truco.sound',true);
const guestNames=[];
if(invited)mode='online';
const button=(label,act,cls='',extra='')=>'<button type="button" class="btn '+cls+'" data-act="'+esc(act)+'" '+extra+'>'+esc(label)+'</button>';
const options=(arr,selected)=>arr.map(x=>'<option value="'+x+'"'+(x===selected?' selected':'')+'>'+x+'</option>').join('');
const backs=(n=3)=>'<div class="backs" aria-hidden="true">'+('<i class="backCard"></i>').repeat(n)+'</div>';
const teamName=team=>t.team+' '+(team+1);
const seatLabel=s=>t.seat+' '+(s+1);
function displayName(value){
 const name=String(value??'').trim();
 return name.replace(/\p{L}/u,letter=>letter.toLocaleUpperCase(lang));
}
function seatName(v,s){
 return displayName(tableName(v,s));
}
function tableName(v,s){
 if(page==='online')return v.names[s];
 if(s===0){
  if(page==='local'&&local.mode==='local'&&local.nicknames?.[0])return local.nicknames[0];
  return profileName||(page==='local'&&local.nicknames?.[0])||seatLabel(0);
 }
 if(page==='daily'||local.mode==='solo')return v.names.length===2?'Coco':'Coco '+s;
 return local.nicknames?.[s]||seatLabel(s);
}
function teamPlayers(v,team){
 const names=v.names.flatMap((_,s)=>s%2===team?[seatName(v,s)]:[]);
 return typeof Intl.ListFormat==='function'?new Intl.ListFormat(lang).format(names):names.join(' + ');
}
function victoryText(v){
 const names=teamPlayers(v,v.matchWinner);
 if(lang==='es')return (v.names.length===2?'Ganó ':'Ganaron ')+names;
 return t.victory+' · '+names;
}
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
function getClient(){
 return authClient??=window.supabase.createClient('https://fcatttsfufjiphgohgwp.supabase.co','sb_publishable_Jn3efpb36_j-vhx0nr_k3A_PLCY0y5X',{auth:{detectSessionInUrl:false}});
}
function showProfileName(value){
 value=displayName(value);
 if(value===profileName)return;
 const old=profileName;
 profileName=value;
 if(page==='menu'){
  const guest=app.querySelector('[data-guest-seat="0"]');
  if(guest){guest.placeholder=profileName||seatLabel(0);guest.closest('label').hidden=!!profileName&&mode==='solo';}
  const online=app.querySelector('#name');
  if(online&&!name&&online.value===old)online.value=profileName;
 }else if(page!=='online')render();
}
async function useProfile(user){
 const id=user?.id||'';
 if(id===profileId)return;
 profileId=id;
 const meta=user?.user_metadata||{};
 showProfileName(id?read('coco.truco.profile.'+id,'')||meta.apodo||meta.username||'':'');
 if(!id)return;
 try{
  const {data}=await getClient().from('perfiles').select('apodo').eq('id',id).maybeSingle();
  if(id!==profileId||!data?.apodo)return;
  write('coco.truco.profile.'+id,data.apodo);showProfileName(data.apodo);
 }catch{ /* A local match can continue offline. */ }
}
function watchProfile(){
 if(!window.supabase)return;
 // Run the profile query after Supabase has released its auth lock.
 getClient().auth.onAuthStateChange((event,session)=>{setTimeout(()=>useProfile(session?.user),0);});
}
async function dailyPlay(action){
 if(busy)return;
 busy=true;
 try{
 const {data:{session}}=await getClient().auth.getSession();
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
 (mode==='online'?'<label class="field">'+esc(t.nickname)+'<input id="name" autocomplete="nickname" maxlength="24" value="'+esc(displayName(name||profileName))+'"></label><div class="actions">'+button(t.create,'create','primary')+'</div><div class="formRow"><label class="field">'+esc(t.code)+'<input id="code" class="code" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="20" value="'+esc(joinCode)+'"></label>'+button(t.join,'join','primary')+'</div>'+ (hasRoom?'<div class="box">'+button(t.resumeRoom,'resumeRoom')+'</div>':''):
 playerFields()+'<div class="actions">'+button(t.start,'start','primary')+(local?.mode===mode?button(t.continueGame,'resumeLocal'):'')+'</div>')+
 (networkIssue?'<p class="status" role="status">'+esc(msg(networkIssue))+'</p>':'')+
 '</section><aside class="panel guide"><details><summary>'+esc(t.rules)+'</summary><p>'+esc(t.rulesText)+'</p></details><p class="muted small">'+esc(t.ranking)+'</p>'+button(t.share,'share','minor')+'</aside></div>';
 if(busy)app.querySelectorAll('button,input,select').forEach(x=>x.disabled=true);
}
function playerFields(){
 const count=mode==='local'?capacity:1;
 return '<div class="playerFields">'+Array.from({length:count},(_,s)=>{
  const label=mode==='solo'?t.nickname:seatLabel(s);
  return '<label class="field"'+(!s&&profileName&&mode==='solo'?' hidden':'')+'>'+esc(label)+'<input data-guest-seat="'+s+'" maxlength="24" placeholder="'+esc(!s&&profileName||seatLabel(s))+'" value="'+esc(displayName(guestNames[s]))+'"></label>';
 }).join('')+'</div>';
}
function renderLobby(){
 app.innerHTML='<section class="hero"><h1>'+esc(t.waiting)+'</h1><p>'+esc(t.players)+' · '+room.names.length+' / '+room.capacity+'</p></section><section class="panel box"><h2>'+esc(t.code)+'</h2><p class="code" dir="ltr">'+room.code.match(/.{1,4}/g).join(' – ')+'</p><div class="navActions">'+button(t.invite,'invite','primary')+'</div><ol class="seatList">'+room.names.map((n,i)=>'<li class="tag">'+esc(displayName(n))+' · '+esc(teamName(i%2))+'</li>').join('')+'</ol>'+onlineFoot()+'</section>';
}
function onlineFoot(showStatus=true){return '<div class="tools">'+(showStatus?button(t.menu,'menu','minor'):'')+button(t.retry,'refresh','minor')+button(t.leave,'askLeave','minor')+'</div>'+(showStatus&&networkIssue?'<p role="status" class="muted small">'+esc(msg(networkIssue))+'</p>':'');}
function cardHTML(card,clickable=false,mini=false) {
 const [num,suit]=card.split('-'),label=num+' · '+t[suit];
 const inner='<strong>'+num+'</strong><img alt="" src="./art/'+suit+'.svg"><i aria-hidden="true">'+num+'</i>'+(!mini?'<small>'+esc(t[suit])+'</small>':'');
 return clickable?'<button class="card" data-act="'+card+'" aria-label="'+esc(label)+'">'+inner+'</button>':'<span class="card" role="img" aria-label="'+esc(label)+'">'+inner+'</span>';
}
function playedTable(v){
 const n=v.names.length,seats=[];
 for(let offset=0;offset<n;offset++){
  const seat=(v.seat+offset)%n;
  const played=v.played.filter(play=>play.seat===seat);
  const slots=[0,1,2].map(trick=>{
   const play=played.find(p=>p.trick===trick);
   return '<span class="trickSlot"'+(play?' data-laid-card="'+esc(play.card)+'"':'')+' aria-label="'+esc(t.trick)+' '+(trick+1)+'">'+(play?cardHTML(play.card,false,true):'')+'</span>';
  }).join('');
  const older=played.filter(p=>p.trick===null).map(p=>cardHTML(p.card,false,true)).join('');
  seats.push('<div class="tableSeat position'+offset+'"><div class="seatLabel">'+esc(seatName(v,seat))+
    (n>2?' <small>· '+esc(teamName(seat%2))+'</small>':'')+
    (seat===v.mano?' <span class="manoTag">'+esc(t.firstSeat)+'</span>':'')+'</div><div class="playedRow">'+slots+'</div>'+
    (older?'<div class="earlierCards">'+older+'</div>':'')+'</div>');
 }
 return '<div class="playedTable seats'+n+'" data-hand="'+v.handNo+'" data-plays="'+v.played.length+'"><span class="tableCoco" aria-hidden="true"><img src="./art/coco-jugando.webp" alt="" width="360" height="360"><img class="throwPose" src="./art/coco-tirando.webp" alt="" width="360" height="360"></span>'+seats.join('')+'</div>';
}
// A daily server response may include two consecutive plays when Coco wins the lead.
function animateCocoPlays(plays){
 if(!plays.length || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const figure=app.querySelector('.tableCoco'),bounds=figure.getBoundingClientRect();
 if(!figure.animate)return;
 const handX=bounds.left+bounds.width*(document.dir==='rtl'?.13:.87);
 const handY=bounds.top+bounds.height*.79;
 const beat=400;
 const reveal=[{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.58},{opacity:0}];
 figure.querySelector('.throwPose').animate(reveal,{duration:beat,iterations:plays.length});
 figure.firstElementChild.animate(reveal.map(frame=>({...frame,opacity:1-frame.opacity})),{duration:beat,iterations:plays.length});
 plays.forEach((play,index)=>{
  const card=app.querySelector('[data-laid-card="'+CSS.escape(play.card)+'"] .card');
  if(!card)return;
  const box=card.getBoundingClientRect();
  const dx=handX-box.left-box.width/2,dy=handY-box.top-box.height/2;
  const start='translate('+dx+'px,'+dy+'px) scale(.48) rotate(-16deg)';
  card.animate([{transform:start,opacity:0},{transform:start,opacity:1,offset:.12},
   {transform:'translate(0,0) scale(1) rotate(0)',opacity:1}],
   {duration:265,delay:index*beat+95,fill:'backwards',easing:'ease-out'});
 });
}
function envidoResult(v){
 const result=v.events.find(e=>e.type==='envResult');
 if(!result)return '';
 const calls=v.envidoCalls.map(e=>'<span>'+esc(seatName(v,e.seat))+' <b>'+e.score+'</b></span>').join('');
 const verdict=result.score===undefined?t.decline+' · '+t.won:t.won;
 return '<section class="envResult"><strong>Envido</strong> '+calls+'<span>'+esc(verdict)+' · '+esc(seatName(v,result.seat))+' +'+result.points+'</span></section>';
}
function envidoBuilder(v){
 const own=[...v.cards,...v.played.filter(p=>p.seat===v.seat).map(p=>p.card)];
 const key=[page,v.handNo,v.seat,...own.slice().sort()].join(':');
 const old=app.querySelector('.envidoBuilder');
 const same=old?.dataset.key===key;
 const selected=same?Array.from(old.querySelectorAll('[aria-pressed="true"]'),b=>b.dataset.countCard):[];
 const choices=own.map(card=>'<button type="button" data-count-card="'+esc(card)+'" aria-pressed="'+selected.includes(card)+'">'+cardHTML(card,false,true)+'</button>').join('');
 return '<details class="envidoBuilder" data-key="'+esc(key)+'"'+(same&&old.open?' open':'')+'><summary>'+esc(t.buildEnvido)+'</summary><p>'+esc(t.countHint)+'</p><div class="countChoices">'+choices+'</div><output aria-live="polite">'+envidoEquation(selected)+'</output></details>';
}
function envidoEquation(cards){
 if(!cards.length)return '—';
 const values=cards.map(card=>{const n=Number(card.split('-')[0]);return n<10?n:0;});
 return (cards.length===2?'20 + '+values.join(' + ')+' = ':'')+envido(cards);
}
function countCard(button){
 const builder=button.closest('.envidoBuilder'),suit=button.dataset.countCard.split('-')[1];
 const chosen=Array.from(builder.querySelectorAll('[aria-pressed="true"]'));
 const adding=button.getAttribute('aria-pressed')!=='true';
 if(adding){
  for(const prior of chosen)if(prior.dataset.countCard.split('-')[1]!==suit)prior.setAttribute('aria-pressed','false');
  if(chosen.length===2)chosen[0].setAttribute('aria-pressed','false');
 }
 button.setAttribute('aria-pressed',String(adding));
 builder.querySelector('output').textContent=envidoEquation(Array.from(builder.querySelectorAll('[aria-pressed="true"]'),b=>b.dataset.countCard));
}
const tallyStrokes=['M4 21 L4 4','M4 4 L21 4','M21 4 L21 21','M21 21 L4 21','M3 22 L22 3'];
function tallyMarks(points){
 const groups=[];
 for(let start=0;start<Math.max(15,points);start+=5){
  const marks=tallyStrokes.slice(0,Math.max(0,points-start)).map(line=>'<path d="'+line+'"/>').join('');
  groups.push('<svg viewBox="0 0 25 25" focusable="false">'+marks+'</svg>');
 }
 return '<span class="tallyMarks" aria-hidden="true">'+groups.join('')+'</span>';
}
function scoreAward(v){
 if(v.phase==='finished')return {team:v.matchWinner,label:t.winner,kind:'match'};
 if(v.phase==='between')return {team:v.handWinner,label:t.handWinnerLabel,kind:'hand'};
 const last=v.events.at(-1);
 if(last?.type==='envResult')return {team:last.seat%2,label:t.envidoWinnerLabel,kind:'envido'};
 return null;
}
function scoreboard(v){
 const award=scoreAward(v);
 const key=award?[v.handNo,award.kind,award.team].join('-'):'';
 const changed=key!==app.querySelector('.score')?.dataset.award;
 const teams=v.scores.map((points,i)=>{
  const name=teamPlayers(v,i);
  const wins=award?.team===i;
  const badge=wins?'<strong class="winnerBadge"><span aria-hidden="true">★</span> '+esc(award.label)+'</strong>':'';
  return '<div class="teamScore'+(wins?' scoreWinner'+(changed?' scoreGlow':''):'')+'"><div class="scoreLine"><strong>'+esc(name)+'</strong><span dir="ltr"><b>'+points+'</b> / '+v.goal+'</span></div>'+tallyMarks(points)+badge+'</div>';
 });
 return '<section class="score" data-award="'+esc(key)+'" aria-label="'+esc(t.points)+'">'+teams.join('')+'</section>';
}
function soundButton(){
 const icon=soundOn?'M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14':'m16 9 6 6m0-6-6 6';
 return '<button type="button" class="btn soundSwitch" data-act="sound" aria-label="'+esc(t.sound)+'" title="'+esc(t.sound)+'" aria-pressed="'+soundOn+'"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="'+icon+'"/></svg></button>';
}
function tableTools(){
 return '<nav class="tableTools">'+button(t.rules,'rules')+button(t.menu,'menu')+soundButton()+'</nav>';
}
// Keep the same reading order at every seat: answers, envido, then truco and fold.
function moveControls(v,canPlay,openingEnvido){
 if(v.phase==='between')return '<div class="moveRows"><div class="moveRow">'+button(t.next,'next','primary')+'</div></div>';
 if(!canPlay)return '';
 const rows=[['accept','decline'],['envido','real','falta'],['truco','retruco','cuatro','fold']];
 const html=rows.map(group=>{
  const choices=group.filter(action=>v.options.includes(action)).map(action=>{
   if(action==='fold')return button(t.fold,'askFold','foldButton');
   const label=action==='envido'&&openingEnvido?t.openEnvido:labelAct(action);
   const cls=action==='accept'?'primary':action==='decline'?'':group[0]==='envido'?'envidoButton':'prominent';
   return button(label,action,cls);
  });
  return choices.length?'<div class="moveRow">'+choices.join('')+'</div>':'';
 }).join('');
 return '<div class="moveRows">'+html+'</div>';
}
function tableConversation(v,status,controls){
 let last;
 for(let i=v.events.length-1;i>=0;i--)if(v.events[i].type==='action'){last=v.events[i];break;}
 const words=last&&(last.action==='fold'?t.sayFold:labelAct(last.action));
 const log=last?'<p class="talkLine'+(last.seat===v.seat?' own':'')+'" role="status"><strong><bdi>'+esc(seatName(v,last.seat))+'</bdi></strong> <span>'+esc(words)+'</span></p>':'';
 const prompt=v.phase==='play'?'<p class="status talkTurn" aria-live="polite">'+esc(status)+'</p>':'';
 return '<section class="tableTalk" aria-labelledby="talkTitle"><h3 id="talkTitle"><svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 4h14v10H8l-5 4V4Z"/><path d="M9 17h7l5 4V9h-2"/></svg>'+esc(t.tableTalk)+'</h3>'+log+prompt+controls+'</section>';
}
function renderBoard(v) {
 const s=v.seat,current=actor(v),mine=current===s,canPlay=mine&&v.phase==='play'&&!busy;
 const ended=v.phase!=='play';
 const openingEnvido=canPlay && s===v.mano && !v.events.length && !v.tricks.length && !v.table.length && v.options.includes('envido');
 const status=ended?(v.phase==='finished'?victoryText(v):t.between+' · '+teamPlayers(v,v.handWinner)):
 v.pending?t.replyToCall.replace(/\{(name|call)\}/g,(_,key)=>key==='name'?seatName(v,current):labelAct(v.pending.last)):
 mine?seatName(v,current)+' · '+t.chooseCard:t.turn+' · '+seatName(v,current);
 const showExtras=!!app.querySelector('.boardExtras[open]');
 const previous=app.querySelector('.playedTable');
 const hasBots=page==='daily'||(page==='local'&&local.mode==='solo');
 let newPlays=[];
 if(hasBots && previous){
  const start=Number(previous.dataset.hand)===v.handNo?Number(previous.dataset.plays):0;
  newPlays=v.played.slice(start).filter(play=>play.seat!==0);
 }else if(page==='daily' && dailyState.version===0 && v.handNo===1 && v.played.length===1){
  newPlays=v.played.filter(play=>play.seat!==0);
 }
 const handLabel=page==='local'&&local.mode==='local'?t.yourCards+' · '+seatName(v,s):t.yourCards;
 app.innerHTML=tableTools()+scoreboard(v)+(ended?'<p class="resultBanner" role="status">'+esc(status)+'</p>':'')+
 '<div class="felt"><div class="feltHead"><strong>'+esc(t.hand)+' '+v.handNo+' · '+esc(t.trick)+' '+Math.min(3,v.tricks.length+1)+'</strong><span>×'+v.stake+'</span></div>'+playedTable(v)+envidoResult(v)+'</div>'+
 '<div class="boardInfo"><h3>'+esc(handLabel)+'</h3><div class="hand">'+v.cards.map(c=>cardHTML(c,canPlay&&v.options.includes(c))).join('')+'</div>'+
 '<div class="handControls">'+tableConversation(v,status,moveControls(v,canPlay,openingEnvido))+envidoBuilder(v)+'</div></div>'+
 (page==='online'&&networkIssue?'<p role="status">'+esc(msg(networkIssue))+'</p>':'')+
 '<details class="boardExtras"'+(showExtras?' open':'')+'><summary>'+esc(t.more)+'</summary>'+
 '<ul class="seatList">'+v.names.map((n,i)=>'<li class="tag '+(!ended&&i===current?'active':'')+'">'+esc(seatName(v,i))+' · '+esc(teamName(i%2))+(v.folded?.includes(i)?' · '+esc(t.fold):'')+'</li>').join('')+'</ul>'+
 (page==='online'?onlineFoot(false):'')+'</details>';
 if(v.phase==='finished'&&previous){
  const winner=app.querySelector('.scoreWinner.scoreGlow');
  if(winner&&winner.getBoundingClientRect().top<0)winner.scrollIntoView({block:'center',behavior:'instant'});
 }
 animateCocoPlays(newPlays);
}
function render(){
 clearTimeout(botTimer);
 if(page==='menu'){resetTableSound();return renderMenu();}
 if(page==='daily'){tableSound(dailyState.game);renderBoard(dailyState.game);app.insertAdjacentHTML('afterbegin','<p class="dailyHeading">'+esc(t.daily)+' · '+esc(dailyState.dia)+'</p>');if(dailyState.points!==null)app.insertAdjacentHTML('beforeend','<p>'+esc(t.points)+' +'+dailyState.points+'</p>');return;}
 if(page==='online'){
   if(!room)return renderMenu();
   if(room.closed){app.innerHTML='<div class="cover panel"><h1>'+esc(t.left)+'</h1>'+button(t.menu,'menu','primary')+'</div>';return;}
   if(!room.game)return renderLobby();
   tableSound(room.game);return renderBoard(room.game);
 }
 if(!local){page='menu';return renderMenu();}
 const g=local.game,a=actor(g),pass=local.mode==='local';
 tableSound(g);
 if(pass && shownSeat!==a && g.phase!=='finished'){
   app.innerHTML=tableTools()+'<div class="cover panel">'+backs()+'<h1>'+esc(t.handover)+'<br>'+esc(seatName(g,a))+'</h1><p>'+esc(t.privacy)+'</p>'+button(t.reveal,'reveal','primary')+'</div>';return;
 }
 renderBoard(view(g,pass?a:0));
 if(!pass && g.phase==='play'&&a!==0)botTimer=setTimeout(()=>{if(page==='local'){move(g,a,bot(view(g,a)));write(localKey,local);render();}},750);
}
function startLocal(){
 const names=Array.from({length:capacity},(_,i)=>mode==='solo'&&i!==0?'Coco '+i:t.seat+' '+(i+1));
 local={mode,nicknames:guestNames.slice(0,capacity),game:newMatch(names,goal)};write(localKey,local);shownSeat=null;page='local';cue('deal');render();
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
 if(['join','create'].includes(action)){name=displayName(document.querySelector('#name')?.value);if(!name){notice(t.nameError);document.querySelector('#name')?.focus();return;}}
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
 case 'sound':{
   soundOn=!soundOn;write('coco.truco.sound',soundOn);
   if(soundOn){unlockSound();cue('tap');}else muteSound();
   const current=app.querySelector('.soundSwitch');current.outerHTML=soundButton();app.querySelector('.soundSwitch').focus({preventScroll:true});return;
 }
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
 case 'askLeave':return modal('<p>'+esc(t.confirmLeave)+'</p>'+button(t.leave,'leave','primary'));
 case 'askFold':{
   const rows=app.querySelector('.moveRows');
   rows.innerHTML='<p class="foldPrompt">'+esc((lang==='es'?'¿':'')+t.fold+'?')+'</p><div class="moveRow">'+button(t.fold,'fold','primary')+button(t.close,'cancelFold')+'</div>';
   rows.querySelector('[data-act="cancelFold"]').focus({preventScroll:true});return;
 }
 case 'cancelFold':render();app.querySelector('[data-act="askFold"]')?.focus({preventScroll:true});return;
 case 'leave':dialog.close();return onlineAction('leave');
 default:if(dialog.open)dialog.close();return gameMove(action);
 }
}
document.addEventListener('click',e=>{
 if(soundOn)unlockSound();
 const counter=e.target.closest('[data-count-card]');
 if(counter){countCard(counter);cue('tap');return;}
 const b=e.target.closest('[data-act]');
 if(e.target.closest('summary,#dialogClose')||['reveal','rules','menu','askFold','askLeave'].includes(b?.dataset.act))cue('tap');
 if(b&&!busy)handle(b.dataset.act);
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&app.querySelector('[data-act="cancelFold"]'))handle('cancelFold');
});
document.addEventListener('input',e=>{if(e.target.matches('[data-guest-seat]'))guestNames[Number(e.target.dataset.guestSeat)]=e.target.value.trim();if(e.target.id==='name'){name=e.target.value;write('coco.truco.nick',name);}if(e.target.id==='code')joinCode=e.target.value;});
document.addEventListener('change',e=>{if(e.target.id==='capacity'){capacity=Number(e.target.value);if(mode==='local')renderMenu();}if(e.target.id==='goal')goal=Number(e.target.value);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&page==='local'&&local?.mode==='local'){shownSeat=null;render();}if(!document.hidden&&page==='online')refresh();});
setHeader();render();watchProfile();
if(invited&&read(roomKey)===invited)onlineAction('resumeRoom');
