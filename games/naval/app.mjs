import {SHIPS,SIZE,coordinate,cellsFor,placeShip,validateFleet,randomFleet,newGame,addPlayer,lockFleet,fire,resign,viewFor,chooseShot} from './engine.mjs';
import {OnlineNaval} from './online.mjs';
const $=id=>document.getElementById(id),esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SAVE='coco-naval-local-v1',STATS='coco-naval-stats-v1',SHARE='https://cocoenforma.com/juego/naval/';
// Local save identifiers also work in older WebViews and HTTP development previews.
const localId=()=>crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
let screen='home',mode=null,local=null,room=null,draft=[],selectedShip='carrier',vertical=false,selectedCell=null,boardView='attack',difficulty='normal',busy=false,botTimer=null,noticeTimer=null,finishShown=false;
const online=new OnlineNaval();
function read(key,fallback=null){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function notice(message){$('notice').textContent=message;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,6500);}
function show(next){
 const changed=screen!==next;screen=next;document.querySelectorAll('main>.screen').forEach(el=>el.hidden=el.id!==next);
 if(changed){window.scrollTo({top:0,behavior:'instant'});const h=$(next)?.querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
}
function view(){return mode==='online'?room?.game:local?viewFor(local.state,'you'):null;}
function saved(){const x=read(SAVE);try{
 if(x?.v!==1||!x.id||!['easy','normal','hard'].includes(x.difficulty)||x.state?.players?.length!==2||x.state.players[0].id!=='you'||x.state.players[1].id!=='coco')return null;
 for(const p of x.state.players){if(p.fleet)validateFleet(p.fleet);if(!Array.isArray(p.shots)||p.shots.length>100)return null;}
 if(!['placement','battle','finished','cancelled'].includes(x.state.phase))return null;
 return x;
 }catch{return null;}}
function persist(){if(mode==='bot'&&local){local.draft=draft;write(SAVE,local);}else if(mode==='online'&&room&&online.user&&!room.game.me.ready)write('coco-naval-draft:'+online.user.id+':'+room.id,draft);}
function home(){clearTimeout(botTimer);botTimer=null;online.stop();mode=null;room=null;busy=false;selectedCell=null;const s=saved();$('resume').hidden=!s||!['placement','battle'].includes(s.state.phase);show('home');}
function modal(title,html,actions=[]){$('modalTitle').textContent=title;$('modalBody').innerHTML=html;const row=document.createElement('div');row.className='modal-actions';for(const a of actions){const b=document.createElement('button');b.textContent=a.label;b.className=a.primary?'primary':'';b.onclick=()=>{$('modal').close();a.run?.();};row.append(b);}$('modalBody').append(row);$('modal').showModal();}
$('closeModal').onclick=()=>$('modal').close();
async function copy(text){try{await navigator.clipboard.writeText(text);notice('Enlace copiado. Ya puedes compartirlo.');}catch{modal('Copia este enlace','<p>Selecciona y copia el enlace para compartirlo.</p><input class="copy-field" aria-label="Enlace para copiar" readonly value="'+esc(text)+'">');const field=$('modalBody').querySelector('input');field.focus();field.select();}}
$('share').onclick=()=>copy(SHARE);
function startBot(){
 const run=()=>{online.stop();clearTimeout(botTimer);botTimer=null;mode='bot';room=null;draft=[];selectedShip='carrier';vertical=false;selectedCell=null;boardView='attack';finishShown=false;
  let state=addPlayer(newGame('you','Tú'),'coco','Coco');state=lockFleet(state,'coco',randomFleet());
  local={v:1,id:localId(),difficulty,state,draft:[]};persist();render();};
 const old=saved();if(old&&['placement','battle'].includes(old.state.phase))modal('¿Empezar una partida nueva?','<p>Tu partida local guardada será reemplazada.</p>',[{label:'Conservar mi partida'},{label:'Empezar otra',primary:true,run}]);else run();
}
$('playBot').onclick=()=>show('setup');$('learnPlay').onclick=()=>show('setup');$('prepareBot').onclick=startBot;
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{difficulty=b.dataset.level;document.querySelectorAll('[data-level]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
$('resume').onclick=()=>{const s=saved();if(!s)return notice('No hay una partida guardada disponible.');local=s;mode='bot';room=null;draft=Array.isArray(s.draft)?s.draft:[];difficulty=s.difficulty;finishShown=false;boardView='attack';selectedCell=null;render();};
document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>b.dataset.nav==='home'?home():show(b.dataset.nav));
$('back').onclick=()=>{if(screen==='home')location.assign('../../');else if(screen==='lobby'){online.stop();room=null;openOnline();}else home();};
$('help').onclick=()=>modal('Cómo jugar','<ol class="steps"><li>Coloca los cinco barcos. Puedes girarlos o distribuirlos al azar.</li><li>En tu turno, toca una casilla de <b>Atacar</b> y pulsa <b>Disparar</b>.</li><li>Agua: no hay barco. Tocado: acertaste. Hundido: completaste un barco.</li><li>Un disparo por turno, incluso cuando aciertas. Encuentra los cinco barcos para ganar.</li></ol><p>Tu flota está en otra pestaña. Los barcos pueden tocarse, pero no superponerse.</p>',[{label:'Entendido',primary:true}]);

function shipSvg(ships){return '<svg class="vessels" viewBox="0 0 100 100" aria-hidden="true">'+ships.map(ship=>{
 const cells=[...ship.cells].sort((a,b)=>a-b),v=cells[1]-cells[0]===10,x=(cells[0]%10)*10+(v?10:0),y=Math.floor(cells[0]/10)*10;
 return `<g transform="translate(${x} ${y}) rotate(${v?90:0})"><svg x="0.5" y="1.2" width="${cells.length*10-1}" height="7.6" viewBox="0 0 100 24" preserveAspectRatio="none"><path d="M8 2H76Q89 3 98 12Q89 21 76 22H8Q2 20 2 16V8Q2 4 8 2Z" fill="#e8d9a5" stroke="#fff1bc" stroke-width="1.3"/><path d="M18 6H64L76 12L64 18H18Z" fill="#52788b"/><path d="M30 5V19M44 5V19M58 5V19" stroke="#d4e8eb" stroke-width="2"/></svg></g>`;
 }).join('')+'</svg>';}
function board(target,{fleet=[],shots=[],clickable=false,placement=false}){
 const sunk=new Set(shots.filter(s=>s.kind==='sunk').flatMap(s=>s.cells)),byCell=new Map(shots.map(s=>[s.cell,s]));
 target.innerHTML='<div class="axis-top" aria-hidden="true">'+Array.from({length:10},(_,i)=>'<span>'+(i+1)+'</span>').join('')+'</div><div class="axis-side" aria-hidden="true">'+Array.from({length:10},(_,i)=>'<span>'+String.fromCharCode(65+i)+'</span>').join('')+'</div><div class="board-field">'+shipSvg(fleet)+'<div class="cell-grid" role="group" aria-label="'+(placement?'Coloca tu flota':boardView==='fleet'?'Tu flota':'Océano rival')+'">'+Array.from({length:100},(_,cell)=>{
  const shot=byCell.get(cell),kind=sunk.has(cell)?'sunk':shot?.kind,own=fleet.find(s=>s.cells.includes(cell));
  const label=coordinate(cell)+(kind?' · '+({miss:'Agua',hit:'Tocado',sunk:'Hundido'}[kind]):own?' · '+SHIPS.find(s=>s.id===own.id).name:' · Sin explorar');
  return `<button type="button" class="cell ${kind||''} ${!placement&&cell===selectedCell?'selected':''}" data-cell="${cell}" aria-label="${esc(label)}" ${!clickable||(!placement&&shot)?'disabled':''}>${kind==='miss'?'•':kind==='sunk'?'×':kind==='hit'?'✦':!placement&&cell===selectedCell?'◎':''}</button>`;
 }).join('')+'</div></div>';
 target.querySelectorAll('[data-cell]').forEach(b=>{
  b.onclick=()=>{if(busy)return;if(placement)placeAt(+b.dataset.cell);else{selectedCell=+b.dataset.cell;renderBattle(view());$('shoot').focus({preventScroll:true});}};
  b.onkeydown=e=>{const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-10,ArrowDown:10}[e.key];if(!delta)return;e.preventDefault();const cell=+b.dataset.cell;let next=cell+delta;while(next>=0&&next<100){const targetButton=target.querySelector('[data-cell="'+next+'"]');if(targetButton&&!targetButton.disabled){targetButton.focus();break;}next+=delta;}};
  if(placement){b.onpointerenter=()=>preview(+b.dataset.cell);b.onpointerleave=()=>preview(null);}
 });
}
function preview(cell){
 $('placementBoard').querySelectorAll('.preview,.invalid').forEach(c=>c.classList.remove('preview','invalid'));if(cell===null||busy)return;
 const spec=SHIPS.find(s=>s.id===selectedShip);if(!spec)return;const cells=cellsFor(cell,spec.size,vertical);let good=true;try{placeShip(draft,selectedShip,cell,vertical);}catch{good=false;}
 for(const c of cells.length?cells:[cell])$('placementBoard').querySelector('[data-cell="'+c+'"]')?.classList.add(good?'preview':'invalid');
}
function placeAt(cell){try{draft=placeShip(draft,selectedShip,cell,vertical);selectedShip=SHIPS.find(s=>!draft.some(p=>p.id===s.id))?.id||selectedShip;persist();renderPlacement();}catch(e){$('placementHint').textContent=e.message;notice(e.message);}}
function renderPlacement(){
 show('placement');$('placementCount').textContent=draft.length+' / 5 barcos';
 $('fleetList').innerHTML=SHIPS.map(s=>`<button class="fleet-choice ${draft.some(p=>p.id===s.id)?'placed':''}" data-ship="${s.id}" aria-pressed="${s.id===selectedShip}" aria-label="${esc(s.name)}, ${s.size} casillas"><b>${esc(s.name)}<span class="ship-dots" aria-hidden="true">${'<i></i>'.repeat(s.size)}</span></b><small>${s.size} casillas</small></button>`).join('');
 $('fleetList').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(busy)return;selectedShip=b.dataset.ship;renderPlacement();});
 $('rotate').textContent=vertical?'↻ Vertical':'↻ Horizontal';$('ready').disabled=draft.length!==5||busy;$('autoPlace').disabled=busy;$('clearFleet').disabled=busy;$('rotate').disabled=busy;
 $('placementHint').textContent=draft.length===5?'Tu flota está completa. Puedes mover un barco o confirmar.':'Coloca '+SHIPS.find(s=>s.id===selectedShip).name.toLowerCase()+': toca su primera casilla.';
 $('placementOnline').hidden=mode!=='online';board($('placementBoard'),{fleet:draft,clickable:!busy,placement:true});
}
$('rotate').onclick=()=>{vertical=!vertical;renderPlacement();};$('autoPlace').onclick=()=>{draft=randomFleet();persist();renderPlacement();};$('clearFleet').onclick=()=>{draft=[];selectedShip='carrier';persist();renderPlacement();};
$('ready').onclick=async()=>{
 if(busy)return;try{validateFleet(draft);}catch(e){return notice(e.message);}busy=true;renderPlacement();
 try{if(mode==='online'){const {room:r}=await online.call('ready',{id:room.id,version:room.version,fleet:draft});acceptRoom(r);}else{local.state=lockFleet(local.state,'you',draft);persist();}selectedCell=null;boardView='attack';}
 catch(e){notice(e.message);if(mode==='online')await online.refresh();}finally{busy=false;render();}
};
function resultText(last,v){if(!last)return 'Un océano de posibilidades. Un disparo por turno.';const name=last.actor===v.me.id?'Tú':v.opponent?.name||'Rival';return name+' · '+coordinate(last.cell)+' · '+({miss:'Agua',hit:'Tocado',sunk:'Hundido: '+(SHIPS.find(s=>s.id===last.ship)?.name||'barco')}[last.kind]);}
function renderBattle(v){
 show('battle');const done=v.phase==='finished',mine=v.turn===v.me.id&&!done,opponent=v.opponent;
 const mySunk=opponent.shots.filter(s=>s.kind==='sunk').length,enemySunk=v.me.shots.filter(s=>s.kind==='sunk').length;
 $('turnTitle').textContent=done?'Los dos océanos, al descubierto.':mine?'Tu turno, capitán.':'Turno de '+opponent.name+'.';
 $('battleEyebrow').textContent=done?'MISIÓN TERMINADA':'2 · ENCUENTRA SU FLOTA';
 $('myRemaining').textContent=5-mySunk;$('enemyRemaining').textContent=5-enemySunk;$('shotCount').textContent=v.me.shots.length+' disparos';
 $('refresh').hidden=mode!=='online';$('resign').hidden=done;$('claimTimeout').hidden=!(mode==='online'&&!mine&&!done&&room.deadline&&Date.parse(room.deadline)<=Date.now());
 $('boardTitle').textContent=boardView==='attack'?'Océano rival':'Mi flota';$('boardCaption').textContent=boardView==='fleet'?'Tus barcos y sus disparos':done?'La flota rival al descubierto':'Su flota está oculta';
 const fleet=boardView==='fleet'?v.me.fleet:done?opponent.fleet:opponent.sunk;
 board($('battleBoard'),{fleet:fleet||[],shots:boardView==='fleet'?opponent.shots:v.me.shots,clickable:boardView==='attack'&&mine&&!busy});
 document.querySelectorAll('[data-board]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.board===boardView)));
 const canShoot=mine&&!busy&&boardView==='attack'&&selectedCell!==null&&!v.me.shots.some(s=>s.cell===selectedCell);
 $('shoot').disabled=!canShoot;$('shoot').hidden=done;$('shoot').textContent=busy?'Disparando…':canShoot?'Disparar a '+coordinate(selectedCell):boardView==='fleet'?'Vuelve a Atacar':mine?'Selecciona una casilla':'Esperando al otro capitán';
 $('commandTitle').textContent=done?'Así terminó la batalla.':boardView==='fleet'?'Tu flota, bajo control.':canShoot?'Objetivo: '+coordinate(selectedCell):mine?'Elige tu próxima casilla.':'Observa y prepara tu jugada.';
 $('battleHint').textContent=done?'Puedes consultar ambos tableros y empezar otra partida.':boardView==='fleet'?'Aquí ves tus barcos y los disparos del rival. Pulsa Atacar para elegir un objetivo.':mine?'Toca una casilla y confirma el disparo.':'El turno cambia después de cada disparo, también cuando hay un acierto.';
 $('lastResult').textContent=resultText(v.last,v);$('enemyFleetStatus').innerHTML=SHIPS.map(s=>'<span class="'+(opponent.sunk.some(x=>x.id===s.id)?'down':'')+'">'+esc(s.name)+'</span>').join('');
 // Interleave according to whose shot count reveals the starter; no hidden state is used.
 const ownFirst=v.me.shots.length>opponent.shots.length||(v.me.shots.length===opponent.shots.length&&v.last?.actor===opponent.id);
 const a=ownFirst?v.me.shots:opponent.shots,b=ownFirst?opponent.shots:v.me.shots,rows=[];
 for(let i=0;i<Math.max(a.length,b.length);i++){if(a[i])rows.push({actor:ownFirst?v.me.id:opponent.id,...a[i]});if(b[i])rows.push({actor:ownFirst?opponent.id:v.me.id,...b[i]});}
 $('history').innerHTML=rows.slice(-12).reverse().map(s=>'<li>'+esc(resultText(s,v))+'</li>').join('');
 if(!rows.length)$('history').innerHTML='<li>La primera jugada está por llegar.</li>';
 if(done&&!$('command-panel-again')){const b=document.createElement('button');b.id='command-panel-again';b.textContent='Volver al resultado';b.onclick=()=>renderFinished(v);$('enemyFleetStatus').after(b);}else if(!done)$('command-panel-again')?.remove();
}
document.querySelectorAll('[data-board]').forEach(b=>b.onclick=()=>{boardView=b.dataset.board;renderBattle(view());});
function sound(kind){if(!$('sound').checked)return;try{const C=window.AudioContext||window.webkitAudioContext,ctx=new C(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=kind==='miss'?220:kind==='sunk'?660:440;g.gain.setValueAtTime(.08,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.25);o.start();o.stop(ctx.currentTime+.26);o.onended=()=>ctx.close();}catch{}}
$('shoot').onclick=async()=>{
 const v=view();if(busy||v?.turn!==v.me.id||selectedCell===null)return;const cell=selectedCell;busy=true;renderBattle(v);
 try{if(mode==='online'){const {room:r}=await online.call('fire',{id:room.id,version:room.version,cell});acceptRoom(r);}else{local.state=fire(local.state,'you',cell);persist();}selectedCell=null;sound(view().last?.kind);}
 catch(e){notice(e.message);if(mode==='online')await online.refresh();}finally{busy=false;render();$('battleBoard').querySelector('.board-field')?.classList.add('firing');}
};
function scheduleBot(){
 if(mode!=='bot'||local?.state.phase!=='battle'||local.state.turn!=='coco'||busy||botTimer||document.hidden)return;
 botTimer=setTimeout(()=>{botTimer=null;if(mode!=='bot'||local.state.phase!=='battle'||local.state.turn!=='coco')return;
  const bot=local.state.players.find(p=>p.id==='coco');const cell=chooseShot(bot.shots,local.difficulty);local.state=fire(local.state,'coco',cell);persist();sound(local.state.last.kind);render();$('battleBoard').querySelector('.board-field')?.classList.add('firing');
 },850);
}
function recordResult(v){
 if(v.phase!=='finished')return;const id=mode==='online'?'online:'+room.id:'bot:'+local.id,stats=read(STATS,{played:0,wins:0,shots:0,hits:0,done:[]});
 if(!Array.isArray(stats.done))stats.done=[];if(stats.done.includes(id))return;
 stats.played=(Number(stats.played)||0)+1;stats.wins=(Number(stats.wins)||0)+(v.winner===v.me.id?1:0);stats.shots=(Number(stats.shots)||0)+v.me.shots.length;stats.hits=(Number(stats.hits)||0)+v.me.shots.filter(s=>s.kind!=='miss').length;stats.done=[...stats.done,id].slice(-200);write(STATS,stats);
}
function renderFinished(v){
 recordResult(v);finishShown=true;show('finished');const won=v.winner===v.me.id;
 $('winner').textContent=won?'¡Victoria, capitán!':'Esta vez ganó '+v.opponent.name+'.';
 $('endReason').textContent=v.reason==='timeout'?'La partida terminó por inactividad.':v.reason==='resign'?'La partida terminó al abandonar uno de los capitanes.':won?'Encontraste los cinco barcos de la flota rival.':'Cada pista cuenta. La próxima estrategia empieza aquí.';
 const hits=v.me.shots.filter(s=>s.kind!=='miss').length,accuracy=v.me.shots.length?Math.round(hits/v.me.shots.length*100):0;
 $('resultStats').innerHTML='<div><strong>'+v.me.shots.length+'</strong><small>Disparos</small></div><div><strong>'+accuracy+'%</strong><small>Precisión</small></div><div><strong>'+v.me.shots.filter(s=>s.kind==='sunk').length+'</strong><small>Barcos hundidos</small></div>';
 $('again').textContent=mode==='online'?'Crear otra sala →':'Jugar la revancha →';
}
$('viewFinal').onclick=()=>{boardView='attack';renderBattle(view());};
$('again').onclick=()=>{if(mode==='online'){online.stop();room=null;openOnline();}else startBot();};
$('stats').onclick=()=>{const s=read(STATS,{played:0,wins:0,shots:0,hits:0});modal('Tus travesías','<div class="result-stats"><div><strong>'+esc(s.played||0)+'</strong><small>Partidas</small></div><div><strong>'+esc(s.wins||0)+'</strong><small>Victorias</small></div><div><strong>'+(s.shots?Math.round(s.hits/s.shots*100):0)+'%</strong><small>Precisión</small></div></div><p>Se guardan solo en este navegador. No suman puntos a la clasificación general.</p>',[{label:'Seguir jugando',primary:true}]);};
function render(){
 const v=view();if(!v)return;
 if(v.phase==='waiting'||(v.phase==='placement'&&v.me.ready))renderLobby(v);
 else if(v.phase==='placement')renderPlacement();
 else if(v.phase==='battle'){renderBattle(v);scheduleBot();}
 else if(v.phase==='finished'){if(!finishShown)renderFinished(v);else if(screen==='battle')renderBattle(v);else renderFinished(v);}
 else if(v.phase==='cancelled'){notice('La sala se ha cerrado. Puedes crear otra partida.');home();}
}
function acceptRoom(next){
 if(room&&next.id===room.id&&next.version<room.version)return;
 const isNew=!room||next.id!==room.id;mode='online';room=next;clearTimeout(botTimer);botTimer=null;
 if(isNew){finishShown=false;selectedCell=null;boardView='attack';selectedShip='carrier';draft=read('coco-naval-draft:'+online.user.id+':'+room.id,[]);if(!Array.isArray(draft))draft=[];}
 if(next.game.me.ready)draft=next.game.me.fleet||[];
 render();
}
function connection(ok,message){$('connection').textContent=ok?'Conectado':message||'Reconectando…';if(screen==='lobby')$('lobbyStatus').textContent=ok?'Sala conectada. Los cambios aparecen automáticamente.':message||'Reconectando. Pulsa Actualizar sala si lo necesitas.';}
function watchRoom(next){acceptRoom(next);online.watch(next.id,acceptRoom,connection);}
function renderLobby(v){
 show('lobby');$('lobbyTitle').textContent=v.me.ready?'Tu flota ya está lista.':'Falta el otro capitán.';
 $('lobbyHint').textContent=v.me.ready?'Esperamos a que '+v.opponent.name+' termine de colocar sus barcos. Su flota seguirá oculta.':'Comparte esta invitación. Tu amigo necesita su propia cuenta de Coco.';
 $('roomCode').textContent=room?.invite_code||'';$('copyInvite').hidden=!!v.opponent;$('lobbyStatus').textContent=v.opponent?v.opponent.name+' está preparando su flota.':'La sala admite dos capitanes.';
}
async function roomList(){
 const {rooms}=await online.call('list');$('rooms').innerHTML=rooms.length?rooms.map(r=>'<button class="room-item" data-room="'+r.id+'"><span>'+({waiting:'Esperando rival',placement:'Preparando flotas',battle:'Batalla en curso',finished:'Partida terminada'}[r.status]||'Partida')+'<small>'+esc(r.invite_code)+'</small></span><span>Continuar →</span></button>').join(''):'<p class="muted">Todavía no tienes partidas online.</p>';
 $('rooms').querySelectorAll('button').forEach(b=>b.onclick=async()=>{if(busy)return;busy=true;try{const {room:r}=await online.call('get',{id:b.dataset.room});watchRoom(r);}catch(e){notice(e.message);}finally{busy=false;render();}});
}
async function openOnline(){
 online.stop();clearTimeout(botTimer);botTimer=null;mode='online';room=null;show('online');$('authState').textContent='Comprobando tu cuenta…';$('login').hidden=true;$('onlineTools').hidden=true;
 try{const user=await online.init();$('login').hidden=!!user;$('onlineTools').hidden=!user;$('authState').textContent=user?'Tu cuenta de Coco está conectada.':'Entra con la misma cuenta que usas en Coco. La otra persona necesita una cuenta distinta.';if(user)await roomList();}
 catch(e){$('authState').textContent=e.message;$('login').hidden=false;}
 const code=new URL(location.href).searchParams.get('sala');if(code&&/^[0-9A-F]{16}$/i.test(code))$('joinCode').value=code.toUpperCase();
}
$('playOnline').onclick=openOnline;
$('login').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;const button=$('login').querySelector('button');button.disabled=true;try{await online.login($('email').value.trim(),$('password').value);$('password').value='';await openOnline();}catch(e){$('authState').textContent=e.message;}finally{busy=false;button.disabled=false;}};
async function connectRoom(action,values={}){if(busy)return;busy=true;const b=action==='create'?$('createRoom'):$('join').querySelector('button');b.disabled=true;try{const {room:r}=await online.call(action,values);watchRoom(r);}catch(e){notice(e.message);}finally{busy=false;b.disabled=false;render();}}
$('createRoom').onclick=()=>connectRoom('create');$('join').onsubmit=e=>{e.preventDefault();connectRoom('join',{code:$('joinCode').value});};
$('copyInvite').onclick=()=>copy('https://cocoenforma.com/games/naval/?sala='+room.invite_code);
$('refresh').onclick=()=>online.refresh();$('lobbyRefresh').onclick=()=>online.refresh();
function abandon(){if(busy)return;const v=view();modal(v.phase==='battle'?'¿Abandonar la batalla?':'¿Cerrar esta partida?',v.phase==='battle'?'<p>El otro capitán ganará esta partida. Puedes volver al menú y retomarla sin abandonar.</p>':'<p>La sala o preparación quedará cerrada. Puedes volver al menú para conservarla.</p>',[{label:'Seguir jugando'},{label:'Abandonar',primary:true,run:async()=>{
 busy=true;try{if(mode==='online'){const {room:r}=await online.call('resign',{id:room.id,version:room.version});acceptRoom(r);}else{local.state=resign(local.state,'you');persist();}render();}catch(e){notice(e.message);}finally{busy=false;}
 }}]);}
$('resign').onclick=abandon;$('leaveRoom').onclick=abandon;
$('claimTimeout').onclick=()=>modal('¿Finalizar por inactividad?','<p>Han pasado al menos 5 minutos sin que tu rival dispare. Si confirmas y sigue inactivo, ganarás esta partida.</p>',[{label:'Seguir esperando'},{label:'Finalizar',primary:true,run:async()=>{if(busy)return;busy=true;try{const {room:r}=await online.call('timeout',{id:room.id,version:room.version});acceptRoom(r);}catch(e){notice(e.message);await online.refresh();}finally{busy=false;render();}}}]);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(mode==='online')online.refresh();else scheduleBot();}});
window.addEventListener('pagehide',()=>{persist();online.stop();clearTimeout(botTimer);});
window.addEventListener('pageshow',e=>{if(e.persisted&&mode==='online'&&room)online.watch(room.id,acceptRoom,connection);else if(e.persisted)scheduleBot();});
home();if(new URL(location.href).searchParams.has('sala'))openOnline();
