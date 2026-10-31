import {REALITY,realExpensesCB} from './reality.mjs';
import {EXPENSES,detailedExpenses,expenseName} from './budget.mjs';
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
function readExpenses(input){if(!input||typeof input!=='object'||Array.isArray(input))fail('Revisa el presupuesto.');if(Object.keys(input).some(k=>!EXPENSES.some(x=>x.id===k)))fail('Gasto no reconocido.');return Object.fromEntries(EXPENSES.map(x=>[x.id,cents(input[x.id]??0)]))}
const clone = o => structuredClone(o);
const log=(s,type,text,amount,now)=>{s.ledger.unshift({id:crypto.randomUUID(),type,text,amount,at:now});s.ledger=s.ledger.slice(0,240)};
export function fresh(p,now){return !!p&&Number.isFinite(p.eur)&&p.eur>0&&p.at<=now&&now-p.at<5*DAY&&now-p.fetchedAt<36*3600000}
export function depositValue(d,now){return d.principal+Math.floor(d.principal*d.rate/100*Math.max(0,Math.min(now,d.endsAt)-d.startsAt)/DAY/365)}
export function valuation(s,m,now){return Math.round(Object.entries(s.holdings).reduce((v,[id,h])=>v+h.qty*(m.prices[id]?.eur||h.lastEur)*100,0))+s.deposits.reduce((v,d)=>v+depositValue(d,now),0)+s.investmentCash}
const nav=(s,m,n)=>s.units>1e-9?valuation(s,m,n)/s.units:s.lastNav;
export function summary(s,m,now){
 if(!s?.config)return null;
 const value=valuation(s,m,now), bills=s.bills.filter(b=>!b.paid).reduce((v,b)=>v+b.amount,0), earmarked=s.orders.filter(o=>o.side==='buy').reduce((v,o)=>v+o.amount,0);
 const challengeReturnPct=(nav(s,m,now)/(s.config.baselineNav||100)-1)*100;
 return {paidMonths:paidChallengeMonths(s),challengeReturnPct,value,bills,earmarked,available:Math.max(0,s.cash-s.config.reserve-bills-earmarked),netWorth:s.cash+value-bills,returnPct:s.units>1e-9?(value/s.units/100-1)*100:(s.lastNav/100-1)*100,profit:value+s.withdrawn-s.contributed,contributed:s.contributed,withdrawn:s.withdrawn,daysLeft:Math.max(0,Math.ceil((s.config.endsAt-now)/DAY)),finished:now>s.config.endsAt,started:now>=s.config.startsAt};
}
export function createState(input,m,now){
 const startsAt=Date.parse(input.start+'T00:00:00Z'), endsAt=Date.parse(input.end+'T23:59:59Z');
 if(!Number.isFinite(startsAt)||!Number.isFinite(endsAt)||endsAt<=startsAt||endsAt-startsAt>731*DAY||startsAt<Date.parse(day(now)+'T00:00:00Z'))fail('Elige un inicio desde hoy y un final dentro de los próximos dos años.');
 const salary=cents(input.salary), expenses=input.expenses?readExpenses(input.expenses):detailedExpenses({house:cents(input.house),car:cents(input.car),other:cents(input.other)}),reserve=cents(input.reserve),initial=cents(input.initial);
 if(salary<Object.values(expenses).reduce((a,b)=>a+b,0))fail('El sueldo debe cubrir los gastos mensuales.');
 if(reserve>initial+salary-Object.values(expenses).reduce((a,b)=>a+b,0))fail('La reserva supera el dinero disponible después de pagar el primer mes.');
 const rate=m.rate?.annualPct;
 const suggested=Number.isFinite(rate)?Math.max(0,rate)*(endsAt-startsAt)/DAY/365:0;
 const target=Number(input.target);
 if(!Number.isFinite(target)||target<0||target>100)fail('El objetivo debe estar entre 0 % y 100 %.');
 if(target>Math.max(1,suggested*2+0.25))fail('Ese objetivo es demasiado exigente para este plazo. Usa la referencia propuesta o amplía la fecha.');
 const title=String(input.title||'Mi bicicleta').trim().slice(0,80),reward=cents(input.reward);
 return {version:1,createdAt:now,config:{title,startsAt,endsAt,salary,expenses,reserve,initial,target,reward,referenceRate:rate??null,baselineNav:100,kind:input.kind==='saving'?'saving':'investment',goalAmount:input.kind==='saving'?positive(input.goalAmount):0,budgetReference:input.budgetReference===REALITY.id?REALITY.id:null},cash:initial,investmentCash:0,holdings:{},deposits:[],orders:[],bills:[],months:[],ledger:[],seenEvents:[],lessons:[],units:0,lastNav:100,contributed:0,withdrawn:0,recentIds:[],lastSettled:now};
}
function addUnits(s,amount,m,now){const n=nav(s,m,now);s.units+=amount/Math.max(0.000001,n);s.contributed+=amount}
function removeUnits(s,amount,m,now){const n=nav(s,m,now);s.lastNav=n;s.units=Math.max(0,s.units-amount/Math.max(0.000001,n));s.withdrawn+=amount}
export function settle(original,m,now){
 if(!original.config)return clone(original);
 const s=clone(original), t=Math.min(now,s.config.endsAt);
 s.config.expenses=detailedExpenses(s.config.expenses);
 s.journey ||= {funded:true,acknowledged:false,organized:false};
 s.account ||= {name:'Francesco',openedAt:s.createdAt};
 if(!s.journey.funded)return s;
 // Each monthly salary/bill is issued exactly once, on the start-day anniversary (clamped in shorter months).
 const start=new Date(s.config.payrollStartsAt||s.config.startsAt);
 for(let i=0;i<1200;i++){
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
function challengeParameters(input,m,now,start=now){
 const endsAt=Date.parse(input.end+'T23:59:59Z'),kind=input.kind,title=String(input.title||'').trim().slice(0,80);
 if(!title||!['saving','investment','budget'].includes(kind))fail('Elige el tipo y el nombre del desafío.');
 if(!Number.isFinite(endsAt)||endsAt<=now||endsAt-start>731*DAY)fail('Elige una fecha final futura dentro de dos años desde el inicio.');
 const target=Number(input.target||0),targetMonths=Number(input.targetMonths||1),ref=Math.max(0,m.rate?.annualPct||0)*(endsAt-start)/DAY/365;
 if(kind==='investment'&&(!Number.isFinite(target)||target<0||target>Math.max(1,ref*2+.25)))fail('Elige una meta de inversión cercana a la referencia orientativa.');
 if(kind==='budget'&&(!Number.isInteger(targetMonths)||targetMonths<1||targetMonths>24||targetMonths>Math.floor((endsAt-start)/DAY/28)+1))fail('Elige un número de meses compatible con el plazo.');
 return {title,kind,endsAt,goalAmount:kind==='saving'?positive(input.goalAmount):0,target:kind==='investment'?target:0,targetMonths:kind==='budget'?targetMonths:1,notes:String(input.notes||'').trim().slice(0,400)};
}
export function action(original,m,a,now,{parent=false,currentMarket=m}={}){
 if(!a||typeof a.requestId!=='string'||!/^[\w-]{8,80}$/.test(a.requestId))fail('Identificador de operación inválido.');
 if(['setup','reset','employer','budget','challenge','profile','challenge_save','challenge_update'].includes(a.type)&&!parent)fail('Entra con el PIN parental para tomar esta decisión.');
 if(original?.recentIds?.includes(a.requestId))return original;
 if(a.type==='open_account'){
  if(original)return original;
  const name=String(a.name||'').trim().slice(0,40);if(!name)fail('Escribe cómo quieres llamar a tu cuenta.');
  return {version:2,account:{name,openedAt:now},config:null,recentIds:[a.requestId]};
 }
 if(a.type==='setup'){
  if(!original?.account)fail('Crea primero tu cuenta del juego.');
  if(original.config)fail('Ya hay un plan. Elige el siguiente desde Desafíos.');
  const s=createState(a.config,m,now);s.version=2;s.account=original.account;s.cash=0;s.journey={funded:false,acknowledged:false,organized:false};s.employment={title:'Mi primer trabajo',responsibilities:'Cuidar mis gastos y aprender a ahorrar.'};s.recentIds.push(a.requestId);return s;
 }
 if(!original)fail('Crea primero un desafío.');
 let s=settle(original,m,now);
 if(a.type==='reset'){
  if(a.confirm!=='REINICIAR')fail('Confirma el reinicio.');return null;
 }
 if(!s.config)fail('Pide a un adulto que prepare tu sueldo.');
 const info=summary(s,m,now);
 if(!['lesson','employer','ack_funds','organize','budget','challenge','profile','challenge_save','challenge_update'].includes(a.type)&&(!info.started||info.finished))fail('Las operaciones están disponibles durante las fechas del desafío.');
 if(a.type==='challenge_save'){
  if(!s.journey.funded)fail('Recibe primero tus fondos.');
  s.challengePlans ||= [];
  const existing=a.planId?s.challengePlans.find(x=>x.id===a.planId):null;
  if(a.planId&&!existing)fail('No encuentro ese desafío. Vuelve a la lista.');
  if(existing&&a.revision!==existing.revision)fail('El desafío ha cambiado. Vuelve a abrir su ficha.');
  if(!existing&&s.challengePlans.length>=24)fail('Ya tienes 24 desafíos preparados. Continúa con uno de ellos.');
  const config=challengeParameters(a.config||{},m,now);
  if(existing){existing.config=config;existing.updatedAt=now;existing.revision++;}
  else s.challengePlans.unshift({id:crypto.randomUUID(),config,createdAt:now,updatedAt:now,revision:0});
  log(s,'challenge_plan','Desafío preparado: '+config.title,0,now);
 }else if(a.type==='challenge_update'){
  if(info.finished)fail('Este desafío ya terminó. Prepara uno nuevo a partir de su ficha.');
  if(a.confirm!==(s.config.challengeId||(s.config.startsAt+':'+s.config.endsAt))||a.revision!==(s.config.revision||0))fail('El desafío ha cambiado. Vuelve a abrir su ficha.');
  if(a.config?.kind!==(s.config.kind||'investment'))fail('Para cambiar el tipo, prepara un nuevo desafío.');
  const config=challengeParameters(a.config||{},m,now,s.config.startsAt);
  if(s.deposits.some(d=>d.endsAt>config.endsAt))fail('La fecha debe cubrir los plazos fijos ya abiertos.');
  s.config={...s.config,...config,revision:(s.config.revision||0)+1};
  log(s,'challenge','Objetivo y plazo actualizados: '+config.title,0,now);
 }else if(a.type==='challenge'){
  if(!s.journey.funded)fail('Recibe primero tus fondos.');
  if(a.confirm!==(s.config.challengeId||(s.config.startsAt+':'+s.config.endsAt)))fail('El desafío ha cambiado. Revisa el resumen antes de aplicar otro.');
  const plan=a.planId?s.challengePlans?.find(x=>x.id===a.planId):null;if(a.planId&&!plan)fail('Ese desafío ya no está pendiente. Revisa la lista.');
  if(plan&&a.revision!==plan.revision)fail('El desafío ha cambiado. Vuelve a abrir su ficha.');
  const input=plan?{...plan.config,end:day(plan.config.endsAt),goalAmount:plan.config.goalAmount/1000}:a.config||{},end=Date.parse(input.end+'T23:59:59Z'),start=Date.parse(day(now)+'T00:00:00Z');
  if(!Number.isFinite(end)||end<=now||end-start>731*DAY)fail('Elige un final futuro dentro de los próximos dos años.');
  if(s.deposits.some(d=>d.endsAt>end))fail('El nuevo desafío debe terminar después de tus plazos fijos abiertos.');
  const kind=input.kind,title=String(input.title||'').trim().slice(0,80),target=Number(input.target);
  if(!title||!['investment','saving','budget'].includes(kind))fail('Elige y nombra tu desafío.');
  const ref=Math.max(0,m.rate?.annualPct||0)*(end-start)/DAY/365;
  if(kind==='investment'&&(!Number.isFinite(target)||target<0||target>Math.max(1,ref*2+.25)))fail('Elige una meta de inversión cercana a la referencia orientativa.');
  const goalAmount=kind==='saving'?positive(input.goalAmount):0;
  const months=Number(input.targetMonths||1);if(kind==='budget'&&(!Number.isInteger(months)||months<1||months>24||months>Math.floor((end-start)/DAY/28)+1))fail('Elige un número de meses compatible con el plazo.');
  s.challengeHistory ||= [];s.challengeHistory.unshift({config:clone(s.config),closedAt:now,status:info.finished?'Finalizado':'Sustituido',balance:s.cash,netWorth:info.netWorth,returnPct:info.challengeReturnPct,paidMonths:paidChallengeMonths(s)});
  s.config={...s.config,challengeId:crypto.randomUUID(),payrollStartsAt:s.config.payrollStartsAt||s.config.startsAt,title,startsAt:start,endsAt:end,kind,target:kind==='investment'?target:0,goalAmount,targetMonths:months,baselineNav:nav(s,m,Math.min(now,s.config.endsAt)),reward:0,revision:0,notes:String(input.notes||'').trim().slice(0,400)};
  s=settle(s,currentMarket,now);s.config.baselineNav=nav(s,currentMarket,now);
  if(plan)s.challengePlans=s.challengePlans.filter(x=>x.id!==plan.id);
  log(s,'challenge','Nuevo desafío: '+title+'. La cuenta continúa.',0,now);
 }else if(a.type==='profile'){
  if(a.profile!==REALITY.id)fail('La referencia ha cambiado. Revisa el presupuesto.');
  const expenses=readExpenses(realExpensesCB()),salary=cents(REALITY.salary/10);
  if(!s.journey.funded&&s.config.reserve>s.config.initial+salary-Object.values(expenses).reduce((x,y)=>x+y,0))fail('Ajusta la reserva antes de aplicar este perfil: supera lo disponible tras el primer mes.');
  s.config.expenses=expenses;s.config.salary=salary;s.config.budgetReference=REALITY.id;
  // Existing reserve, issued bills, cash, holdings and payroll dates are preserved.
  log(s,'budget','Perfil primer empleo aplicado: 1.600 € netos/mes estimados. Los próximos recibos usarán el presupuesto de referencia.',0,now);
 }else if(a.type==='budget'){
  const expenses=readExpenses(a.expenses),reserve=cents(a.reserve),total=Object.values(expenses).reduce((x,y)=>x+y,0);
  if(total>s.config.salary)fail('El sueldo debe cubrir el presupuesto mensual.');
  if(reserve>Math.max(0,s.journey.funded?s.cash-info.bills-info.earmarked:s.config.initial+s.config.salary-total))fail('La reserva no puede superar el saldo libre de facturas y órdenes.');
  s.config.expenses=expenses;s.config.reserve=reserve;log(s,'budget','Presupuesto actualizado para los próximos recibos. Reserva: '+reserve/1000+' CB.',0,now);
 }else if(a.type==='receive'){
  if(!s.journey.funded){s.journey.funded=true;s.journey.acknowledged=true;s.cash=s.config.initial;if(s.cash)log(s,'initial','Bienvenida: fondos iniciales',s.cash,now);s=settle(s,m,now);}
 }else if(a.type==='ack_funds'){
  if(!s.journey.funded)fail('Recibe primero tus fondos.');s.journey.acknowledged=true;
 }else if(a.type==='organize'){
  if(!s.journey.funded||!s.journey.acknowledged)fail('Recibe primero tus fondos.');
  if(s.bills.some(b=>!b.paid))fail('Paga primero los gastos pendientes.');s.journey.organized=true;
 }else if(a.type==='employer'){
  if(info.finished)fail('Este desafío ya terminó. Puedes crear uno nuevo desde el panel de adultos.');
  const reason=String(a.reason||'').trim().slice(0,160);if(!reason)fail('Añade una explicación breve para el niño.');
  if(a.decision==='salary'){
   const salary=positive(a.amount),expenses=Object.values(s.config.expenses).reduce((x,y)=>x+y,0);
   if(salary<expenses)fail('El sueldo debe cubrir los gastos mensuales.');
   const previous=s.config.salary;s.config.salary=salary;
   log(s,'employer','Nuevo sueldo: '+(salary/1000)+' CB/mes (antes '+(previous/1000)+'). '+reason,0,now);
  }else if(a.decision==='bonus'){
   if(!s.journey.funded||!info.started)fail('Primero debe recibir su primer sueldo.');
   const amount=positive(a.amount);s.cash+=amount;log(s,'bonus','Paga extra: '+reason,amount,now);
  }else if(a.decision==='job'){
   const title=String(a.title||'').trim().slice(0,60);if(!title)fail('Escribe el nombre del trabajo.');
   s.employment={title,responsibilities:reason};log(s,'employer','Trabajo: '+title+'. '+reason,0,now);
  }else fail('Decisión de empleador no válida.');
 }else if(!s.journey.funded){fail('Recibe primero tus fondos.');
 }else if(a.type==='pay_month'){
  if(typeof a.month!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(a.month))fail('Elige un mes válido.');
  const pending=s.bills.filter(b=>!b.paid&&day(b.at).slice(0,7)===a.month),total=pending.reduce((v,b)=>v+b.amount,0);
  if(!pending.length)fail('Ese mes no tiene recibos pendientes.');
  if(s.cash-info.earmarked<total)fail('No hay saldo disponible para pagar este mes.');
  for(const b of pending){s.cash-=b.amount;b.paid=true;b.paidAt=now;log(s,'bill','Pago de '+expenseName(b.kind),-b.amount,now)}
 }else if(a.type==='pay_all'){
  const pending=s.bills.filter(b=>!b.paid),total=pending.reduce((v,b)=>v+b.amount,0);
  if(s.cash-info.earmarked<total)fail('No hay saldo suficiente para todos los gastos.');
  for(const b of pending){s.cash-=b.amount;b.paid=true;b.paidAt=now;log(s,'bill','Pago de '+expenseName(b.kind),-b.amount,now)}
 }else if(a.type==='pay'){
  const b=s.bills.find(b=>b.id===a.billId&&!b.paid);if(!b)fail('La factura ya está pagada.');
  if(s.cash-info.earmarked<b.amount)fail('No tienes saldo disponible para esta factura.');s.cash-=b.amount;b.paid=true;b.paidAt=now;log(s,'bill','Pago de '+expenseName(b.kind),-b.amount,now);
 }else if(a.type==='buy'){
  if(!s.journey.organized)fail('Organiza primero tu dinero y paga tus gastos.');
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
  if(!s.journey.organized)fail('Organiza primero tu dinero y paga tus gastos.');
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

export function paidChallengeMonths(s){return s.months.filter(key=>{const at=Date.parse(key+'T00:00:00Z'),bills=s.bills.filter(b=>b.at===at);return at>=s.config.startsAt&&at<=s.config.endsAt&&bills.every(b=>b.paid)}).length}
