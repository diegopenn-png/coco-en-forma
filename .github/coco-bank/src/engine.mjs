export const DAY = 86400000;
export const CATALOG = [
  {id:'AAPL',name:'Apple',symbol:'AAPL',kind:'Acciones',risk:3,icon:'A',color:'#e9eef7',lesson:'Al comprar una fracción de una acción participas en una empresa. Su precio puede bajar aunque te gusten sus productos.'},
  {id:'TSLA',name:'Tesla',symbol:'TSLA',kind:'Acciones',risk:4,icon:'T',color:'#ffe8e6',lesson:'Una empresa popular también puede perder valor. Las expectativas, los resultados y las noticias cambian su cotización.'},
  {id:'SAMSUNG',name:'Samsung',symbol:'005930.KS',kind:'Acciones',risk:3,icon:'S',color:'#e5eaff',lesson:'Esta acción cotiza en wones coreanos. Tu resultado en euros también cambia con el tipo de cambio.'},
  {id:'BONDS',name:'Bonos del Tesoro · fondo IEF',symbol:'IEF',kind:'Fondo de bonos',risk:2,icon:'B',color:'#e1f4ec',lesson:'IEF es un fondo que reúne bonos del Tesoro de EE. UU. de 7 a 10 años. No es un bono individual: no tiene una fecha de devolución de tu capital. Puede bajar si suben los tipos, y añade riesgo de cambio dólar/euro.'},
  {id:'BTC',name:'Bitcoin',symbol:'BTC-EUR',kind:'Criptomonedas',risk:5,icon:'₿',color:'#fff0cc',lesson:'Bitcoin no es una empresa ni paga intereses por tenerlo. Su precio puede cambiar mucho. Practica con una parte pequeña y que puedas permitirte perder.'}
];
export function fail(message){throw new Error(message)}
export const day = t => new Date(t).toISOString().slice(0,10);
export function cents(v){const n=Number(v);if(!Number.isFinite(n)||n<0||n>1e6)fail('Introduce un importe entre 0 y 1.000.000 CB.');return Math.round(n*1000)}
const positive = v => {const n=cents(v);if(n<1)fail('El importe debe ser mayor que cero.');return n};
const clone = o => structuredClone(o);
const log=(s,type,text,amount,now)=>{s.ledger.unshift({id:crypto.randomUUID(),type,text,amount,at:now});s.ledger=s.ledger.slice(0,240)};
export function fresh(p,now){return !!p&&Number.isFinite(p.eur)&&p.eur>0&&p.at<=now&&now-p.at<5*DAY&&now-p.fetchedAt<36*3600000}
export function depositValue(d,now){return d.principal+Math.floor(d.principal*d.rate/100*Math.max(0,Math.min(now,d.endsAt)-d.startsAt)/DAY/365)}
export function valuation(s,m,now){return Math.round(Object.entries(s.holdings).reduce((v,[id,h])=>v+h.qty*(m.prices[id]?.eur||h.lastEur)*100,0))+s.deposits.reduce((v,d)=>v+depositValue(d,now),0)+s.investmentCash}
const nav=(s,m,n)=>s.units>1e-9?valuation(s,m,n)/s.units:s.lastNav;
export function summary(s,m,now){
 const value=valuation(s,m,now), bills=s.bills.filter(b=>!b.paid).reduce((v,b)=>v+b.amount,0), earmarked=s.orders.filter(o=>o.side==='buy').reduce((v,o)=>v+o.amount,0);
 return {value,bills,earmarked,available:Math.max(0,s.cash-s.config.reserve-bills-earmarked),netWorth:s.cash+value-bills,returnPct:s.units>1e-9?(value/s.units/100-1)*100:(s.lastNav/100-1)*100,profit:value+s.withdrawn-s.contributed,contributed:s.contributed,withdrawn:s.withdrawn,daysLeft:Math.max(0,Math.ceil((s.config.endsAt-now)/DAY)),finished:now>s.config.endsAt,started:now>=s.config.startsAt};
}
export function createState(input,m,now){
 const startsAt=Date.parse(input.start+'T00:00:00Z'), endsAt=Date.parse(input.end+'T23:59:59Z');
 if(!Number.isFinite(startsAt)||!Number.isFinite(endsAt)||endsAt<=startsAt||endsAt-startsAt>731*DAY||startsAt<Date.parse(day(now)+'T00:00:00Z'))fail('Elige un inicio desde hoy y un final dentro de los próximos dos años.');
 const salary=cents(input.salary), expenses={house:cents(input.house),car:cents(input.car),other:cents(input.other)},reserve=cents(input.reserve),initial=cents(input.initial);
 if(salary<Object.values(expenses).reduce((a,b)=>a+b,0))fail('El sueldo debe cubrir los gastos mensuales.');
 if(reserve>initial+salary-Object.values(expenses).reduce((a,b)=>a+b,0))fail('La reserva supera el dinero disponible después de pagar el primer mes.');
 const rate=m.rate?.annualPct;
 const suggested=Number.isFinite(rate)?Math.max(0,rate)*(endsAt-startsAt)/DAY/365:0;
 const target=Number(input.target);
 if(!Number.isFinite(target)||target<0||target>100)fail('El objetivo debe estar entre 0 % y 100 %.');
 if(target>Math.max(1,suggested*2+0.25))fail('Ese objetivo es demasiado exigente para este plazo. Usa la referencia propuesta o amplía la fecha.');
 const title=String(input.title||'Mi bicicleta').trim().slice(0,80),reward=cents(input.reward);
 return {version:1,createdAt:now,config:{title,startsAt,endsAt,salary,expenses,reserve,initial,target,reward,referenceRate:rate??null},cash:initial,investmentCash:0,holdings:{},deposits:[],orders:[],bills:[],months:[],ledger:[],seenEvents:[],lessons:[],units:0,lastNav:100,contributed:0,withdrawn:0,recentIds:[],lastSettled:now};
}
function addUnits(s,amount,m,now){const n=nav(s,m,now);s.units+=amount/Math.max(0.000001,n);s.contributed+=amount}
function removeUnits(s,amount,m,now){const n=nav(s,m,now);s.lastNav=n;s.units=Math.max(0,s.units-amount/Math.max(0.000001,n));s.withdrawn+=amount}
export function settle(original,m,now){
 const s=clone(original), t=Math.min(now,s.config.endsAt);
 // Each monthly salary/bill is issued exactly once, on the start-day anniversary (clamped in shorter months).
 const start=new Date(s.config.startsAt),limit=new Date(t);
 for(let i=0;i<25;i++){
   const y=start.getUTCFullYear(),mo=start.getUTCMonth()+i,last=new Date(Date.UTC(y,mo+1,0)).getUTCDate();
   const at=Date.UTC(y,mo,Math.min(start.getUTCDate(),last));
   if(at>t)break;
   const key=day(at);if(s.months.includes(key))continue;s.months.push(key);s.cash+=s.config.salary;
   log(s,'salary','Sueldo mensual',s.config.salary,at);
   for(const [kind,amount] of Object.entries(s.config.expenses))if(amount)s.bills.push({id:key+'-'+kind,kind,amount,at,paid:false});
 }
 // Apply corporate actions before today's trades; no adjusted-close double counting.
 for(const e of [...(m.events||[])].sort((a,b)=>a.at-b.at)){
   if(e.at<=s.createdAt||e.at>t||s.seenEvents.includes(e.id))continue;
   const h=s.holdings[e.asset];
   if(h&&e.type==='split'){h.qty*=e.ratio;h.lastEur/=e.ratio;for(const o of s.orders)if(o.asset===e.asset&&o.side==='sell')o.qty*=e.ratio;log(s,'split','Desdoblamiento de '+e.asset,0,e.at)}
   if(h&&e.type==='dividend'){const amount=Math.round(h.qty*e.eur*100);s.investmentCash+=amount;log(s,'dividend','Dividendo de '+e.asset,amount,e.at)}
   s.seenEvents.push(e.id);
 }
 // Orders expire at the challenge deadline; never execute retroactively on a known closing price.
 const pending=[];
 for(const o of s.orders){
   if(now>s.config.endsAt){log(s,'cancel','Orden cancelada al finalizar el desafío',0,now);continue}
   const p=m.prices[o.asset];
   if(!fresh(p,now)||p.at<=o.createdAt){pending.push(o);continue}
   const unit=p.eur*100;
   if(o.side==='buy'){
     addUnits(s,o.amount,m,t);s.cash-=o.amount;
     const h=s.holdings[o.asset]||(s.holdings[o.asset]={qty:0,lastEur:p.eur});h.qty+=o.amount/unit;h.lastEur=p.eur;
     log(s,'buy','Compra de '+o.asset,-o.amount,now);
   }else{
     const h=s.holdings[o.asset];if(!h||h.qty+1e-9<o.qty)continue;
     const amount=Math.round(o.qty*unit);removeUnits(s,amount,m,t);h.qty-=o.qty;s.cash+=amount;
     if(h.qty<1e-9)delete s.holdings[o.asset];log(s,'sell','Venta de '+o.asset,amount,now);
   }
 }
 s.orders=pending;
 s.deposits=s.deposits.filter(d=>{if(d.endsAt>t)return true;const value=depositValue(d,d.endsAt);s.investmentCash+=value;log(s,'maturity','Plazo fijo vencido: capital e intereses',value,d.endsAt);return false});
 if(s.units>1e-9)s.lastNav=nav(s,m,t);
 s.seenEvents=s.seenEvents.slice(-300);s.lastSettled=now;
 return s;
}
export function action(original,m,a,now){
 if(!a||typeof a.requestId!=='string'||!/^[\w-]{8,80}$/.test(a.requestId))fail('Identificador de operación inválido.');
 if(a.type==='setup'){
  if(original)fail('Ya hay un desafío. Reinícialo primero si quieres crear otro.');
  const s=settle(createState(a.config,m,now),m,now);s.recentIds.push(a.requestId);return s;
 }
 if(!original)fail('Crea primero un desafío.');
 if(original.recentIds.includes(a.requestId))return original;
 let s=settle(original,m,now);
 if(a.type==='reset'){
  if(a.confirm!=='REINICIAR')fail('Confirma el reinicio.');return null;
 }
 const info=summary(s,m,now);
 if(a.type!=='lesson'&&(!info.started||info.finished))fail('Las operaciones están disponibles durante las fechas del desafío.');
 if(a.type==='pay'){
  const b=s.bills.find(b=>b.id===a.billId&&!b.paid);if(!b)fail('La factura ya está pagada.');
  if(s.cash-info.earmarked<b.amount)fail('No tienes saldo disponible para esta factura.');s.cash-=b.amount;b.paid=true;log(s,'bill','Pago de '+({house:'casa',car:'coche',other:'administración'}[b.kind]),-b.amount,now);
 }else if(a.type==='buy'){
  if(!CATALOG.some(c=>c.id===a.asset))fail('Instrumento no válido.');
  if(!fresh(m.prices[a.asset],now))fail('Esperando una cotización reciente y verificada.');
  if(!s.lessons.includes(a.asset))fail('Lee y responde primero la ficha de este instrumento.');
  const amount=positive(a.amount);if(amount>info.available)fail('Respeta la reserva, los gastos pendientes y las órdenes en curso.');
  s.orders.push({id:a.requestId,side:'buy',asset:a.asset,amount,createdAt:now});log(s,'order','Orden de compra en espera: '+a.asset,-amount,now);
 }else if(a.type==='sell'){
  const h=s.holdings[a.asset];if(!h)fail('No tienes este activo.');
  if(!fresh(m.prices[a.asset],now))fail('Esperando una cotización reciente.');
  if(s.orders.some(o=>o.side==='sell'&&o.asset===a.asset))fail('Ya tienes una venta pendiente.');
  s.orders.push({id:a.requestId,side:'sell',asset:a.asset,qty:h.qty,createdAt:now});log(s,'order','Venta completa en espera: '+a.asset,0,now);
 }else if(a.type==='cancel'){
  if(!s.orders.some(o=>o.id===a.orderId))fail('La orden ya no está pendiente.');s.orders=s.orders.filter(o=>o.id!==a.orderId);log(s,'cancel','Orden cancelada',0,now);
 }else if(a.type==='deposit'){
  if(!s.lessons.includes('DEPOSIT'))fail('Completa primero la ficha del plazo fijo.');
  const amount=positive(a.amount),term=Number(a.term);
  if(![30,90,180].includes(term))fail('Elige un plazo válido.');
  if(now+term*DAY>s.config.endsAt)fail('El plazo fijo debe vencer antes del final del desafío.');
  if(!m.rate||now-m.rate.fetchedAt>36*3600000||now-Date.parse(m.rate.date)>7*DAY)fail('La referencia del BCE aún no está actualizada.');
  if(amount>info.available)fail('No hay saldo libre suficiente.');
  const rate=m.rate.annualPct;if(rate<0)fail('La referencia actual es negativa: revisa la ficha antes de abrir nuevos plazos.');
  addUnits(s,amount,m,now);s.cash-=amount;s.deposits.push({id:a.requestId,principal:amount,rate,startsAt:now,endsAt:now+term*DAY});log(s,'deposit','Plazo fijo educativo de '+term+' días',-amount,now);
 }else if(a.type==='withdraw'){
  const amount=s.investmentCash;if(!amount)fail('No hay efectivo de inversión disponible.');removeUnits(s,amount,m,now);s.investmentCash=0;s.cash+=amount;log(s,'withdraw','Traspaso de la cartera a tu cuenta',amount,now);
 }else if(a.type==='lesson'){
  const answers={AAPL:'risk',TSLA:'risk',SAMSUNG:'currency',BONDS:'rates',BTC:'risk',DEPOSIT:'locked'};
  if(!answers[a.asset]||a.answer!==answers[a.asset])fail('Prueba otra vez: revisa la explicación de Coco.');
  if(!s.lessons.includes(a.asset))s.lessons.push(a.asset);
 }else fail('Operación desconocida.');
 s.recentIds.push(a.requestId);s.recentIds=s.recentIds.slice(-200);return s;
}
