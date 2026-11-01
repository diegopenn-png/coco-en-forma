import {Chess} from './vendor/chess.mjs';
import {NAMES,MOVEMENT,LESSONS,CHALLENGES,challengeSolved} from './content.mjs';
import {chooseMove} from './engine.mjs';
const $=id=>document.getElementById(id),KEY='coco-chess-standard-v1',PROGRESS='coco-chess-progress-v1';
const glyph={p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'};
let game=new Chess(),mode='standard',screen='setup',opponent='ai',human='w',level=2,flipped=false,selected=null,last=null,worker=null,requestId=0,busy=false,ended='',itemIndex=0,solved=false,highlight=null,sound=false,audio=null,theme='steel';
let saved=read(KEY),progress=read(PROGRESS)||{lessons:[],challenges:[]};
progress.lessons=Array.isArray(progress.lessons)?progress.lessons.filter(x=>LESSONS.some(l=>l.id===x)):[];
progress.challenges=Array.isArray(progress.challenges)?progress.challenges.filter(x=>CHALLENGES.some(l=>l.id===x)):[];
function read(key){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'&&!Array.isArray(value)?value:null}catch{return null}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),2800)}
function beep(capture=false){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);osc.type='sine';osc.frequency.setValueAtTime(capture?330:640,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(capture?180:840,audio.currentTime+.13);gain.gain.setValueAtTime(.06,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);osc.start();osc.stop(audio.currentTime+.17)}catch{}}
function cancelWork(){requestId++;worker?.terminate();worker=null;busy=false}
function save(){if(mode!=='standard'||screen!=='play')return;saved={pgn:game.pgn(),opponent,human,level,ended,finished:complete(),flipped,updated:Date.now()};if(!write(KEY,saved))toast('No se pudo guardar. Esta partida seguirá disponible mientras mantengas la página abierta.')}
function modal(title,text,choices){return new Promise(resolve=>{const d=$('dialog');$('dialogTitle').textContent=title;$('dialogText').textContent=text;$('dialogChoices').replaceChildren();for(const [value,label]of choices){const b=document.createElement('button');b.value=value;b.textContent=label;b.className='primary';$('dialogChoices').append(b)}d.returnValue='cancel';d.addEventListener('close',()=>resolve(d.returnValue),{once:true});d.showModal()})}
function selectedArt(type='n',color='w'){const el=$('piecePreview');el.dataset.type=type;el.dataset.color=color}
function item(){return(mode==='learn'?LESSONS:CHALLENGES)[itemIndex]}
function complete(){return Boolean(ended)||game.isGameOver()}
function canMove(){return screen==='play'&&!busy&&!ended&&!solved&&(mode!=='standard'||!game.isGameOver())&&(mode!=='standard'||opponent==='local'||game.turn()===human)}
function renderBoard(arrived=''){
 const board=$('board'),focused=document.activeElement?.dataset?.square;board.replaceChildren();board.classList.toggle('inactive',screen!=='play');
 const files=flipped?'hgfedcba':'abcdefgh',ranks=flipped?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1];
 const legal=selected&&canMove()?game.moves({square:selected,verbose:true}):[];
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const sq=files[col]+ranks[row],p=game.get(sq),b=document.createElement('button');b.type='button';b.className='square';b.dataset.square=sq;b.tabIndex=sq===(selected||focused||'e2')?0:-1;
  if((sq.charCodeAt(0)-97+Number(sq[1]))%2===1)b.classList.add('dark');
  if(p){b.classList.add('has-piece');const art=document.createElement('span');art.className='piece';art.dataset.color=p.color;art.dataset.type=p.type;art.setAttribute('aria-hidden','true');b.append(art)}
  const dest=legal.some(m=>m.to===sq);if(dest&&$('legal').checked)b.classList.add('target');
  if(selected===sq)b.classList.add('selected');
  if(last&&(last.from===sq||last.to===sq))b.classList.add('last');
  if(p?.type==='k'&&p.color===game.turn()&&game.isCheck())b.classList.add('check');
  if(highlight&&(highlight.from===sq||highlight.to===sq))b.classList.add('hint');
  if(screen==='play'&&mode==='learn'&&!solved&&sq===item().to)b.classList.add('lesson-target');
  if(arrived===sq)b.classList.add('arrived');
  if(col===0){const c=document.createElement('span');c.className='coord rank';c.textContent=ranks[row];b.append(c)}
  if(row===7){const c=document.createElement('span');c.className='coord file';c.textContent=files[col];b.append(c)}
  b.setAttribute('aria-label',sq+': '+(p?NAMES[p.type]+(p.color==='w'?' blanco':' negro'):'vacía')+(dest?', destino disponible':''));b.setAttribute('aria-pressed',String(selected===sq));board.append(b);
 }
 const bottom=flipped?'b':'w',top=bottom==='w'?'b':'w';
 function label(color){return color==='w'?'Equipo plata':'Equipo grafito'}
 $('topName').textContent=screen==='play'&&mode==='standard'&&opponent==='ai'?(top===human?'Tú · '+label(top):'Coco · '+label(top)):label(top);
 $('bottomName').textContent=screen==='play'&&mode==='standard'&&opponent==='ai'?(bottom===human?'Tú · '+label(bottom):'Coco · '+label(bottom)):label(bottom);
 $('topCaption').textContent=top==='w'?'Blancas · Luz azul':'Negras · Luz ámbar';$('bottomCaption').textContent=bottom==='w'?'Blancas · Luz azul':'Negras · Luz ámbar';
 $('topTurn').hidden=screen!=='play'||game.turn()!==top||Boolean(ended)||solved||(mode==='standard'&&game.isGameOver());$('bottomTurn').hidden=screen!=='play'||game.turn()!==bottom||Boolean(ended)||solved||(mode==='standard'&&game.isGameOver());
 const avatars=document.querySelectorAll('.avatar');avatars[0].className='avatar '+(top==='w'?'silver':'graphite');avatars[1].className='avatar '+(bottom==='w'?'silver':'graphite');
 const history=game.history({verbose:true});for(const [where,color]of[['topCaptured',top],['bottomCaptured',bottom]]){$(where).replaceChildren();for(const m of history.filter(m=>m.color===color&&m.captured)){const s=document.createElement('span');s.textContent=glyph[m.captured];s.title=NAMES[m.captured];$(where).append(s)}}
 if(focused)board.querySelector(`[data-square="${focused}"]`)?.focus({preventScroll:true});
}
function endMessage(){if(ended)return ended;if(game.isCheckmate())return 'Jaque mate. Gana el equipo '+(game.turn()==='b'?'plata (blancas).':'grafito (negras).');if(game.isStalemate())return 'Tablas por ahogado: no hay jugadas legales y el rey no está en jaque.';if(game.isInsufficientMaterial())return 'Tablas: no queda material suficiente para dar mate.';if(game.isThreefoldRepetition())return 'Tablas por tercera repetición de la posición.';if(game.isDrawByFiftyMoves())return 'Tablas por 50 movimientos sin mover un peón ni capturar.';if(game.isDraw())return 'La partida termina en tablas.';return ''}
function renderStatus(){
 const isStandard=mode==='standard',isOver=isStandard&&complete();$('boardHelp').textContent=screen==='play'?(isStandard?(isOver?endMessage():busy?'Coco está pensando…':game.isCheck()?'¡Jaque! Protege a tu rey.':'Turno de '+(game.turn()==='w'?'blancas · Equipo plata':'negras · Equipo grafito')):(solved?'¡Lo has conseguido! Puedes continuar debajo del tablero.':item().instruction)):'Elige un modo y empieza a jugar.';
 $('setup').hidden=screen!=='setup'||mode!=='standard';$('catalog').hidden=screen!=='setup'||mode==='standard';$('playing').hidden=screen!=='play';document.body.classList.toggle('is-playing',screen==='play');
 $('modeBadge').textContent={standard:'PARTIDA ESTÁNDAR',learn:'APRENDER JUGANDO',challenge:'DESAFÍOS'}[mode];$('playingEyebrow').textContent=$('modeBadge').textContent;
 $('gameMeta').textContent=isStandard?'A tu ritmo · Sin reloj':screen==='play'?`${itemIndex+1} / ${(mode==='learn'?LESSONS:CHALLENGES).length}`:'Elige tu próximo paso';
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.mode===mode)));
 $('resume').hidden=!saved;$('aiSettings').hidden=opponent==='local';document.querySelectorAll('[data-opponent]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.opponent===opponent)));$('standardActions').hidden=!isStandard||isOver;$('draw').hidden=opponent!=='local';$('historyPanel').hidden=!isStandard;
 $('hint').disabled=busy||isOver||solved;$('undo').disabled=busy||!game.history().length||!isStandard||Boolean(ended);$('undo').hidden=!isStandard;
 $('next').hidden=!solved;$('next').textContent=itemIndex+1<(mode==='learn'?LESSONS:CHALLENGES).length?'Siguiente '+(mode==='learn'?'lección':'desafío')+' →':'Volver al recorrido →';$('retry').hidden=isStandard;
 if(screen!=='play')return;
 if(isStandard){$('turnTitle').textContent=isOver?'Partida terminada':busy?'Coco está pensando…':opponent==='ai'?'Tu turno':game.turn()==='w'?'Turno de las blancas':'Turno de las negras';$('status').textContent=isOver?endMessage():busy?'Busca la siguiente jugada. Puedes volver al menú cuando quieras.':game.isCheck()?'¡Jaque! Protege a tu rey con una jugada legal.':'Elige una pieza y toca su casilla de destino.'}
 else{$('turnTitle').textContent=solved?'¡Lo has conseguido!':item().title;$('status').textContent=solved?item().success:item().instruction;}
 const history=game.history({verbose:true});$('moveCount').textContent=Math.ceil(history.length/2);$('history').replaceChildren();
 for(let i=0;i<history.length;i+=2){const li=document.createElement('li');for(const value of [(i/2+1)+'.',history[i].san,history[i+1]?.san||'…']){const s=document.createElement('span');s.textContent=value;li.append(s)}$('history').append(li)}
 if($('historyPanel').open)$('history').scrollTop=$('history').scrollHeight;
}
function render(arrived=''){renderBoard(arrived);renderStatus()}
function showCoach(text){$('coach').hidden=false;$('coach').textContent=text}
function resetSelection(){selected=null;highlight=null;$('coach').hidden=true;selectedArt();$('pieceName').textContent='Tu próxima jugada';$('pieceInfo').textContent='Elige una pieza del tablero.'}
function chooseSquare(sq){
 if(screen!=='play'){toast('Pulsa «Jugar partida estándar» o elige un modo para empezar.');return}if(!canMove())return;
 const p=game.get(sq);
 if(selected===sq){resetSelection();renderBoard();return}
 const available=selected?game.moves({square:selected,verbose:true}).filter(m=>m.to===sq):[];
 if(available.length){perform(available);return}
 if(p?.color===game.turn()){
  selected=sq;highlight=null;selectedArt(p.type,p.color);$('pieceName').textContent=NAMES[p.type]+' · '+sq;$('pieceInfo').textContent=MOVEMENT[p.type];
  if(!game.moves({square:sq}).length)showCoach('Esta pieza no tiene movimientos legales ahora. Prueba con otra.');else $('coach').hidden=true;renderBoard();
 }else if(selected){showCoach('Esa casilla no es un destino legal. Elige una casilla marcada o cambia de pieza.')}else toast('Elige una pieza del equipo que tiene el turno.');
}
async function perform(moves){
 let move=moves[0];if(moves.some(m=>m.promotion)){const pick=await modal('¡Tu peón corona!','Elige la pieza que ocupará su lugar.',[['q','Dama'],['r','Torre'],['b','Alfil'],['n','Caballo']]);if(pick==='cancel')return;move=moves.find(m=>m.promotion===pick);if(!move)return}
 applyMove(move);
}
function applyMove(move){
 let m;try{m=game.move(move)}catch{return}last=m;resetSelection();
 if(mode!=='standard'){
  const good=mode==='learn'?m.from===item().from&&m.to===item().to:challengeSolved(item(),game,m);
  if(!good){game.undo();last=null;render();showCoach(mode==='learn'?`Busca la pieza de ${item().from} y muévela a ${item().to}, donde está la estrella.`:'Es una jugada legal, pero todavía no resuelve este desafío. La posición vuelve al inicio para que pruebes otra idea.');return}
  solved=true;const bucket=mode==='learn'?'lessons':'challenges';if(!progress[bucket].includes(item().id)){progress[bucket].push(item().id);write(PROGRESS,progress)}
  if(mode==='challenge'&&[2,4].includes(progress.challenges.length))toast('Has desbloqueado un nuevo acabado para el tablero.');
 }
 beep(Boolean(m.captured));render(m.to);save();
 if(mode==='standard'&&!complete()&&opponent==='ai'&&game.turn()!==human)requestEngine('play');
}
function engineResult(purpose,move){
 busy=false;worker?.terminate();worker=null;renderStatus();if(!move)return;
 if(purpose==='play')applyMove(move);else{highlight=move;selected=move.from;selectedArt(game.get(move.from)?.type||'n',game.turn());$('pieceName').textContent=NAMES[game.get(move.from)?.type]+' · '+move.from;$('pieceInfo').textContent='Pista opcional';renderBoard();const simulated=new Chess(game.fen());const m=simulated.move(move);let why=simulated.isCheckmate()?'Esta jugada da jaque mate.':m.captured?'Esta opción captura '+NAMES[m.captured].toLowerCase()+'. Comprueba también cómo queda protegida tu pieza.':m.flags.includes('k')||m.flags.includes('q')?'El enroque ayuda a proteger al rey y conecta tus torres.':m.promotion?'Este peón puede coronar.':m.san.includes('+')?'Esta opción da jaque y obliga al rival a responder.':'Es una opción para mejorar tu posición. Revisa las amenazas del rival antes de decidir.';showCoach(`${NAMES[m.piece]}: ${m.from} → ${m.to}. ${why} Es una sugerencia del rival local, no una garantía de la mejor jugada.`)}
}
function requestEngine(purpose){
 cancelWork();busy=true;const id=requestId,fen=game.fen(),payload={id,pgn:game.pgn(),fen,level:purpose==='hint'?3:level,timeMs:purpose==='hint'?900:level===3?1400:level===2?500:150};renderStatus();
 const fallback=()=>{if(id!==requestId)return;worker?.terminate();worker=null;try{engineResult(purpose,chooseMove(game,{level:1,timeMs:150}))}catch{busy=false;renderStatus();showCoach('No se pudo calcular la jugada. Vuelve al menú y continúa la partida.')}};
 try{worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});worker.onmessage=({data})=>{if(data.id!==id||id!==requestId||game.fen()!==fen)return;if(data.error){fallback();return}engineResult(purpose,data.move)};worker.onerror=fallback;worker.postMessage(payload);setTimeout(()=>{if(busy&&requestId===id)fallback()},6000)}catch{fallback()}
}
function showSetup(nextMode=mode){save();cancelWork();screen='setup';mode=nextMode;ended='';solved=false;game=new Chess();last=null;resetSelection();render();if(mode!=='standard')renderCatalog();}
async function startStandard(resume=false){
 if(!resume&&saved?.pgn&&!saved.ended&&!saved.finished){const ok=await modal('¿Empezar otra partida?','La nueva partida sustituirá a la que tienes guardada en este navegador.',[['yes','Empezar otra']]);if(ok!=='yes')return}
 cancelWork();mode='standard';screen='play';game=new Chess();ended='';solved=false;last=null;resetSelection();
 if(resume&&saved){try{if(saved.pgn)game.loadPgn(saved.pgn);opponent=saved.opponent==='local'?'local':'ai';human=saved.human==='b'?'b':'w';level=[1,2,3].includes(saved.level)?saved.level:2;flipped=Boolean(saved.flipped);ended=typeof saved.ended==='string'?saved.ended:'';last=game.history({verbose:true}).at(-1)||null}catch{saved=null;localStorage.removeItem(KEY);showSetup('standard');toast('La partida guardada no se pudo recuperar. Puedes empezar una nueva.');return}}
 else{human=$('color').value;level=Number($('level').value);flipped=opponent==='ai'&&human==='b'}
 render();save();if(!complete()&&opponent==='ai'&&game.turn()!==human)requestEngine('play');if(matchMedia('(max-width:760px)').matches)$('board').scrollIntoView({block:'center',behavior:'instant'});
}
function startItem(index){cancelWork();screen='play';itemIndex=index;solved=false;ended='';game=new Chess(item().fen);flipped=false;last=null;resetSelection();if(mode==='learn'){selected=item().from;selectedArt(item().piece);$('pieceName').textContent=NAMES[item().piece];$('pieceInfo').textContent=MOVEMENT[item().piece]}render();if(matchMedia('(max-width:760px)').matches)$('board').scrollIntoView({block:'center',behavior:'instant'})}
function renderCatalog(){
 const learn=mode==='learn',list=learn?LESSONS:CHALLENGES,done=learn?progress.lessons:progress.challenges,box=$('catalog');box.replaceChildren();
 const eyebrow=document.createElement('span');eyebrow.className='eyebrow';eyebrow.textContent=learn?'PASO A PASO':'PEQUEÑAS VICTORIAS';const h=document.createElement('h2');h.textContent=learn?'Conoce a tu equipo':'Encuentra la jugada';const p=document.createElement('p');p.className='muted';p.textContent=learn?'Seis lecciones cortas para aprender jugando. Puedes empezar por cualquiera.':'Seis posiciones para observar, probar y aprender. Repite las veces que quieras.';box.append(eyebrow,h,p);
 const status=document.createElement('p');status.className='progress-info';status.textContent=`${done.length} de ${list.length} completados en este navegador`;box.append(status);
 const cards=document.createElement('div');cards.className='catalog-list';list.forEach((item,i)=>{const b=document.createElement('button');b.className='catalog-item'+(done.includes(item.id)?' completed':'');const n=document.createElement('span');n.className='catalog-num';n.textContent=done.includes(item.id)?'✓':String(i+1).padStart(2,'0');const copy=document.createElement('div');const title=document.createElement('strong');title.textContent=item.title;const small=document.createElement('small');small.textContent=item.subtitle;copy.append(title,small);b.append(n,copy);b.onclick=()=>startItem(i);cards.append(b)});box.append(cards);
 if(!learn){const p=document.createElement('p');p.className='local-note';p.textContent='Completa 2 desafíos para desbloquear Aurora y 4 para Atardecer.';const swatches=document.createElement('div');swatches.className='swatches';for(const [id,name,min]of[['steel','Acero',0],['aurora','Aurora',2],['sunset','Atardecer',4]]){const b=document.createElement('button');b.textContent=name+(progress.challenges.length<min?' · '+min:'');b.disabled=progress.challenges.length<min;b.setAttribute('aria-pressed',String(theme===id));b.onclick=()=>{theme=id;document.body.dataset.theme=id;renderCatalog()};swatches.append(b)}box.append(p,swatches)}
}
$('board').addEventListener('click',e=>{const square=e.target.closest('[data-square]');if(square)chooseSquare(square.dataset.square)});
$('board').addEventListener('keydown',e=>{const el=e.target.closest('[data-square]');if(!el)return;const keys={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8};if(e.key in keys){e.preventDefault();const children=Array.from($('board').children),i=children.indexOf(el),next=i+keys[e.key];if(next>=0&&next<64){el.tabIndex=-1;children[next].tabIndex=0;children[next].focus()}}if(e.key==='Escape'){resetSelection();renderBoard()}});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>showSetup(b.dataset.mode));
document.querySelectorAll('[data-opponent]').forEach(b=>b.onclick=()=>{opponent=b.dataset.opponent;document.querySelectorAll('[data-opponent]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('aiSettings').hidden=opponent==='local'});
$('start').onclick=()=>startStandard();$('resume').onclick=()=>startStandard(true);
$('back').onclick=()=>{if(screen==='play')showSetup();else location.assign('../../')};$('newGame').onclick=()=>showSetup('standard');
$('flip').onclick=()=>{flipped=!flipped;renderBoard();save()};$('view').onclick=()=>{const on=$('view').getAttribute('aria-pressed')!=='true';$('view').setAttribute('aria-pressed',String(on));document.querySelector('.arena').classList.toggle('inclined',on);$('view').textContent=on?'▦ Vista desde arriba':'◇ Vista inclinada'};
$('legal').onchange=()=>renderBoard();$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Desactivar sonido':'Activar sonido');toast(sound?'Sonido activado':'Sonido desactivado');if(sound)beep()};
$('hint').onclick=()=>{if(!canMove())return;if(mode==='standard')requestEngine('hint');else{const it=item(),from=mode==='learn'?it.from:it.solution.slice(0,2),to=mode==='learn'?it.to:it.solution.slice(2,4);highlight={from,to};selected=from;renderBoard();showCoach(`Observa ${NAMES[game.get(from).type].toLowerCase()} en ${from}. Prueba llevarlo a ${to}.`)}};
$('undo').onclick=()=>{if(mode!=='standard'||busy||ended)return;cancelWork();game.undo();if(opponent==='ai'&&game.turn()!==human&&game.history().length)game.undo();last=game.history({verbose:true}).at(-1)||null;resetSelection();render();save();if(opponent==='ai'&&game.turn()!==human&&!complete())requestEngine('play')};
$('retry').onclick=()=>startItem(itemIndex);$('next').onclick=()=>{if(itemIndex+1<(mode==='learn'?LESSONS:CHALLENGES).length)startItem(itemIndex+1);else showSetup()};
$('resign').onclick=async()=>{const color=opponent==='ai'?human:game.turn();const ok=await modal('¿Abandonar esta partida?','Ganará el otro equipo. Puedes empezar una partida nueva después.',[['yes','Abandonar']]);if(ok!=='yes')return;cancelWork();ended='El equipo '+(color==='w'?'plata':'grafito')+' abandona. Gana el equipo '+(color==='w'?'grafito.':'plata.');render();save()};
$('draw').onclick=async()=>{const ok=await modal('¿Ambos aceptáis las tablas?','Usad esta opción solo si los dos jugadores estáis de acuerdo en empatar.',[['yes','Ambos aceptamos']]);if(ok!=='yes')return;ended='Tablas por acuerdo de ambos jugadores.';render();save()};
$('export').onclick=()=>{const copy=new Chess();copy.loadPgn(game.pgn());copy.header('Event','Coco Ajedrez','White',opponent==='ai'?(human==='w'?'Jugador':'Coco'):'Blancas','Black',opponent==='ai'?(human==='b'?'Jugador':'Coco'):'Negras');const result=game.isCheckmate()?(game.turn()==='w'?'0-1':'1-0'):ended.includes('abandona')?(ended.includes('plata abandona')?'0-1':'1-0'):ended||game.isDraw()?'1/2-1/2':'*';copy.header('Result',result);const url=URL.createObjectURL(new Blob([copy.pgn()],{type:'application/x-chess-pgn'}));const a=document.createElement('a');a.href=url;a.download='coco-ajedrez.pgn';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('share').onclick=async()=>{const url=new URL('./',location.href).href;try{if(navigator.share){await navigator.share({title:'Coco Ajedrez · La ciudad del futuro',url});return}await navigator.clipboard.writeText(url);toast('Enlace copiado. Ya puedes compartirlo.')}catch(e){if(e.name!=='AbortError'){const choice=await modal('Comparte Coco Ajedrez',url,[['copy','Seleccionar enlace']]);if(choice==='copy'){const range=document.createRange();range.selectNodeContents($('dialogText'));$('dialog').showModal();getSelection().removeAllRanges();getSelection().addRange(range)}}}};
window.addEventListener('pagehide',()=>{save();cancelWork()});window.addEventListener('pageshow',()=>{if(screen==='play'&&mode==='standard'&&!complete()&&opponent==='ai'&&game.turn()!==human&&!busy)requestEngine('play')});
selectedArt();render();
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('../../sw.js').catch(()=>{});
