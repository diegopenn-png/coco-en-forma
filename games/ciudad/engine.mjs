import {BOARD,CARDS,CARD_BY_ID,GOALS} from './content.mjs';
export class GameError extends Error {constructor(message,status=409){super(message);this.status=status}}
const must=(ok,message,status)=>{if(!ok)throw new GameError(message,status)};
export function randomInt(n){must(Number.isSafeInteger(n)&&n>0,'Azar no válido.',400);const a=new Uint32Array(1),max=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=max);return a[0]%n}
const name=s=>String(s||'Jugador').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,32)||'Jugador';
export function player(id,nickname){return{id,name:name(nickname),pos:0,money:1500,salary:250,skill:0,experience:0,community:0,wellbeing:2,goal:0}}
export function newGame(id,nickname){return{v:1,phase:'waiting',players:[player(id,nickname)],round:1,rounds:12,order:[],turn:0,draw:{queue:[],index:0,rolls:{}},properties:{},used:{},card:null,log:[],lastRoll:null,rollSeq:0,market:{factor:1,until:0},offer:null,auction:null,managed:false}}
export function actorIndex(s){if(s.phase==='draw')return s.draw.queue[s.draw.index];if(s.phase==='offer')return s.offer.to;if(s.phase==='auction')return s.auction.queue[s.auction.index];return s.order[s.turn]??0}
export function currentPlayer(s){return s.players[actorIndex(s)]}
function log(s,text){s.log.push(text);if(s.log.length>60)s.log.shift()}
function apply(p,e){for(const[k,v]of Object.entries(e)){if(['money','salary','skill','experience','community','wellbeing'].includes(k))p[k]+=v;}for(const k of ['skill','experience','community','wellbeing'])p[k]=Math.max(0,p[k]);p.salary=Math.max(100,p.salary)}
function owned(s,p){return Object.entries(s.properties).filter(([,v])=>v.owners.includes(p.id))}
export function metrics(s,p){const list=owned(s,p);return{...p,properties:list.length,business:list.filter(([id])=>BOARD[id].business).length,upgrades:list.reduce((n,[,v])=>n+v.level,0),worth:p.money+list.reduce((n,[,v])=>n+Math.floor((v.paid+v.level*150)/v.owners.length),0)}}
export function score(s,p){const m=metrics(s,p),goal=GOALS[p.goal],completed=goal.targets.filter(([k,target])=>m[k]>=target).length;return{player:p.id,name:p.name,total:Math.floor(m.worth/100)+p.skill*2+p.experience*3+p.community*3+p.wellbeing*2+completed*15,completed,worth:m.worth}}
export function ranking(s){return s.players.map(p=>score(s,p)).sort((a,b)=>b.total-a.total)}
function next(s){s.card=null;s.offer=null;s.auction=null;s.managed=false;s.turn++;if(s.turn===s.order.length){s.turn=0;s.round++;}if(s.round>s.rounds){s.phase='finished';s.results=ranking(s);log(s,'La partida ha terminado.');}else s.phase='roll'}
function complete(s,message){s.phase='end';log(s,message)}
function drawCard(s,type,rng){const all=CARDS.filter(c=>c.type===type);s.used[type]??=[];let available=all.filter(c=>!s.used[type].includes(c.id));if(!available.length){s.used[type]=[];available=all;}const c=available[rng(available.length)];s.used[type].push(c.id);return c}
function landing(s,p,rng){const tile=BOARD[p.pos],prop=s.properties[p.pos];s.card=null;
 if(tile.type==='property'&&prop){if(prop.owners.includes(p.id)){complete(s,p.name+' visita su propiedad: '+tile.name+'.');return}const rent=Math.round((tile.rent+prop.level*25)*(s.round<=s.market.until?s.market.factor:1));p.money-=rent;prop.owners.forEach((id,i)=>{s.players.find(q=>q.id===id).money+=Math.floor(rent/prop.owners.length)+(i===0?rent%prop.owners.length:0)});complete(s,p.name+' paga '+rent+' CB de alquiler en '+tile.name+'.');return}
 const card=drawCard(s,tile.type,rng);s.card={id:card.id,square:p.pos,price:tile.type==='property'?Math.max(200,tile.price+card.shift):null};s.phase=tile.type==='property'?'property':'choice';
 if(card.type==='city'&&[0,1,12,13].includes(Number(card.id.split('-')[1]))){s.market={factor:[0,12].includes(Number(card.id.split('-')[1]))?1.2:.8,until:s.round+1};log(s,card.title+': alquileres '+(s.market.factor>1?'+20 %':'−20 %')+' hasta el final de la ronda '+s.market.until+'.');}
 log(s,p.name+' cae en '+(p.pos+1)+': '+tile.name+' · '+card.title+'.');
}
export function transition(input,uid,action,values={},rng=randomInt){
 const s=structuredClone(input);must(s.v===1,'Versión de partida no compatible.');const idx=s.players.findIndex(p=>p.id===uid);must(idx>=0,'No perteneces a esta sala.',403);
 if(action==='start'){must(s.phase==='waiting'&&idx===0,'Solo quien creó la sala puede comenzar.');must(s.players.length>=2&&s.players.length<=6,'La sala necesita entre 2 y 6 jugadores.');let goals=[0,1,2,3,4,5];for(const p of s.players)p.goal=goals.splice(rng(goals.length),1)[0];s.phase='draw';s.draw={queue:s.players.map((_,i)=>i),index:0,rolls:{}};log(s,'Tirada inicial: empieza el número más alto.');return s;}
 must(!['waiting','finished'].includes(s.phase),'Esta partida no está en juego.');must(actorIndex(s)===idx,'Ahora le toca a '+currentPlayer(s).name+'.');const p=s.players[idx];
 if(action==='roll'&&s.phase==='draw'){
  const n=rng(6)+1;s.draw.rolls[idx]=n;s.lastRoll={seq:++s.rollSeq,player:idx,value:n,kind:'draw',path:[]};log(s,p.name+' saca '+n+' en el sorteo.');s.draw.index++;
  if(s.draw.index===s.draw.queue.length){const high=Math.max(...s.draw.queue.map(i=>s.draw.rolls[i])),leaders=s.draw.queue.filter(i=>s.draw.rolls[i]===high);if(leaders.length>1){s.draw={queue:leaders,index:0,rolls:{}};log(s,'Empate: repiten '+leaders.map(i=>s.players[i].name).join(', ')+'.');}else{s.order=Array.from({length:s.players.length},(_,i)=>(leaders[0]+i)%s.players.length);s.turn=0;s.phase='roll';log(s,'Empieza '+s.players[leaders[0]].name+'. El orden queda fijado.');}}return s;
 }
 if(action==='roll'&&s.phase==='roll'){
  const n=rng(6)+1,path=[];for(let i=0;i<n;i++){p.pos=(p.pos+1)%40;path.push(p.pos);if(p.pos===0){p.money+=p.salary;log(s,p.name+' pasa por salida y cobra '+p.salary+' CB.');}}s.lastRoll={seq:++s.rollSeq,player:idx,value:n,kind:'move',path};log(s,p.name+' saca '+n+' y avanza '+n+' casillas.');landing(s,p,rng);return s;
 }
 if(action==='choose'&&s.phase==='choice'){
  const card=CARD_BY_ID[s.card.id],option=card.options[values.option];must(Number.isInteger(values.option)&&option,'Elige una opción de la tarjeta.',400);must(card.type==='cost'||p.money+(option.effects.money||0)>=0,'No tienes saldo para esa opción.');apply(p,option.effects);complete(s,p.name+': '+option.label+'.');return s;
 }
 if(action==='buy'&&s.phase==='property'){
  const c=s.card;must(!s.properties[c.square]&&p.money>=c.price,'No puedes comprar esta propiedad ahora.');p.money-=c.price;s.properties[c.square]={owners:[uid],paid:c.price,level:0};complete(s,p.name+' compra '+BOARD[c.square].name+' por '+c.price+' CB.');return s;
 }
 if(action==='pass'&&s.phase==='property'){complete(s,p.name+' decide guardar su dinero.');return s;}
 if(action==='partner'&&s.phase==='property'){
  const to=s.players.findIndex(q=>q.id===values.to),q=s.players[to],cost=Math.ceil(s.card.price/2);must(q&&to!==idx&&p.money>=cost&&q.money>=s.card.price-cost,'Elige un socio con saldo suficiente.');s.offer={kind:'partner',from:idx,to,square:s.card.square,price:s.card.price};s.phase='offer';log(s,p.name+' propone a '+q.name+' comprar '+BOARD[s.card.square].name+' a medias.');return s;
 }
 if(action==='auction'&&s.phase==='property'){
  s.auction={square:s.card.square,queue:Array.from({length:s.players.length},(_,i)=>(idx+i)%s.players.length),index:0,high:0,bidder:null,minimum:Math.ceil(s.card.price*.6)};s.phase='auction';log(s,'Subasta de una vuelta: cada persona puede pujar o pasar.');return s;
 }
 if(['bid','pass'].includes(action)&&s.phase==='auction'){
  const a=s.auction,bid=a.high?a.high+50:a.minimum;if(action==='bid'){must(p.money>=bid,'No tienes saldo para esa puja.');a.high=bid;a.bidder=idx;log(s,p.name+' ofrece '+bid+' CB.');}else log(s,p.name+' pasa en la subasta.');a.index++;
  if(a.index===a.queue.length){if(a.bidder!==null){const buyer=s.players[a.bidder];buyer.money-=a.high;s.properties[a.square]={owners:[buyer.id],paid:a.high,level:0};log(s,buyer.name+' gana la subasta por '+a.high+' CB.');}else log(s,'La propiedad sigue disponible.');s.phase='end';s.auction=null;}return s;
 }
 if(action==='offer'&&s.phase==='roll'){
  must(!s.managed,'Ya hiciste una gestión en este turno.');const prop=s.properties[values.square],to=s.players.findIndex(q=>q.id===values.to);must(prop&&prop.owners.length===1&&prop.owners[0]===uid&&to>=0&&to!==idx,'Elige una propiedad tuya y otro jugador.');must(Number.isInteger(values.price)&&values.price>=1&&values.price<=5000,'El precio debe estar entre 1 y 5.000 CB.',400);s.offer={kind:'trade',from:idx,to,square:values.square,price:values.price};s.phase='offer';s.managed=true;log(s,p.name+' ofrece '+BOARD[values.square].name+' a '+s.players[to].name+' por '+values.price+' CB.');return s;
 }
 if(['accept','decline'].includes(action)&&s.phase==='offer'){
  const offer=s.offer,seller=s.players[offer.from];if(action==='accept'){
   if(offer.kind==='trade'){must(p.money>=offer.price,'No tienes saldo suficiente.');const prop=s.properties[offer.square];must(prop&&prop.owners.length===1&&prop.owners[0]===seller.id,'La propiedad cambió.');p.money-=offer.price;seller.money+=offer.price;prop.owners=[p.id];}
   else{const cost=Math.ceil(offer.price/2);must(seller.money>=cost&&p.money>=offer.price-cost&&!s.properties[offer.square],'No hay saldo suficiente para compartir la compra.');seller.money-=cost;p.money-=offer.price-cost;s.properties[offer.square]={owners:[seller.id,p.id],paid:offer.price,level:0};}
   log(s,p.name+' acepta el acuerdo con '+seller.name+'.');
  }else log(s,p.name+' rechaza la propuesta.');s.phase=offer.kind==='trade'?'roll':action==='accept'?'end':'property';s.offer=null;return s;
 }
 if(['upgrade','sell'].includes(action)&&s.phase==='roll'){
  must(!s.managed,'Solo puedes hacer una gestión antes de tirar.');const prop=s.properties[values.square];must(prop&&prop.owners.length===1&&prop.owners[0]===uid,'Solo puedes gestionar una propiedad que sea totalmente tuya.');
  if(action==='upgrade'){must(prop.level<2&&p.money>=150,'La reforma cuesta 150 CB y el máximo es dos.');p.money-=150;prop.level++;log(s,p.name+' reforma '+BOARD[values.square].name+'.');}
  else{const value=Math.floor((prop.paid+prop.level*150)*.7);p.money+=value;delete s.properties[values.square];log(s,p.name+' vende al banco '+BOARD[values.square].name+' por '+value+' CB.');}s.managed=true;return s;
 }
 if(action==='end'&&s.phase==='end'){next(s);return s;}
 throw new GameError('Esa acción no está disponible en este momento.');
}
export function autoAction(s){
 if(['draw','roll'].includes(s.phase))return['roll',{}];if(s.phase==='property')return['pass',{}];if(s.phase==='auction')return['pass',{}];if(s.phase==='offer')return['decline',{}];if(s.phase==='end')return['end',{}];
 if(s.phase==='choice'){const card=CARD_BY_ID[s.card.id],p=currentPlayer(s);let candidates=card.options.map((o,i)=>({o,i})).filter(({o})=>card.type==='cost'||p.money+(o.effects.money||0)>=0);const free=candidates.find(({o})=>Object.keys(o.effects).length===0);return['choose',{option:free?.i??candidates.sort((a,b)=>(b.o.effects.money||0)-(a.o.effects.money||0))[0].i}];}
 throw new GameError('No hay un turno pendiente.');
}
