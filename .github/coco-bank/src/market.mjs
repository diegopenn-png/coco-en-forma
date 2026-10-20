import {CATALOG,DAY} from './engine.mjs';
async function get(url,json=true){const r=await fetch(url,{headers:{'User-Agent':'CocoBankPrivate/1.0 (educational simulation)','Accept':json?'application/json':'*/*'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('HTTP '+r.status);return json?r.json():r.text()}
export async function refreshMarket(previous={prices:{},events:[]},now=Date.now()){
 const m={...previous,prices:{...previous.prices},events:[...(previous.events||[])],updatedAt:now,errors:[]};
 let fx;
 try{const xml=await get('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',false);const date=xml.match(/time=['"]([^'"]+)/)?.[1];fx={EUR:1};for(const x of xml.matchAll(/currency=['"]([A-Z]+)['"]\s+rate=['"]([\d.]+)['"]/g))fx[x[1]]=Number(x[2]);if(!date||!fx.USD||now-Date.parse(date)>7*DAY)throw new Error('Cambio sin fecha reciente');m.fx={date,rates:fx,fetchedAt:now,source:'Banco Central Europeo'};}catch(e){m.errors.push('Tipos de cambio: '+e.message);if(previous.fx&&now-Date.parse(previous.fx.date)<7*DAY)fx=previous.fx.rates;}
 await Promise.all(CATALOG.map(async c=>{
  try{
   if(c.id==='BTC'){
    const d=await get('https://api.coinbase.com/v2/prices/BTC-EUR/spot');const eur=Number(d.data?.amount);if(!(eur>0)||d.data.currency!=='EUR')throw new Error('Precio no válido');
    m.prices.BTC={eur,local:eur,currency:'EUR',at:now,fetchedAt:now,source:'Coinbase · referencia spot'};return;
   }
   const d=await get('https://query1.finance.yahoo.com/v8/finance/chart/'+c.symbol+'?interval=1d&range=1mo&events=div%2Csplits');
   const x=d.chart?.result?.[0],currency=x?.meta?.currency,rate=fx?.[currency];if(!x||!rate)throw new Error('Cotización o cambio no disponible');
   const duration=(x.meta.currentTradingPeriod?.regular?.end-x.meta.currentTradingPeriod?.regular?.start)*1000||23400000;
   const rows=(x.timestamp||[]).map((ts,i)=>({at:ts*1000+duration,local:x.indicators?.quote?.[0]?.close?.[i]})).filter(p=>p.at<=now&&Number.isFinite(p.local)&&p.local>0);
   const p=rows.at(-1);if(!p||now-p.at>5*DAY)throw new Error('Cierre sin actualizar');
   m.prices[c.id]={...p,eur:p.local/rate,currency,fx:rate,fxDate:m.fx?.date,fetchedAt:now,source:'Yahoo Finance · cierre diario',history:rows.map(r=>({at:r.at,eur:r.local/rate}))};
   for(const e of Object.values(x.events?.dividends||{})){
    const id=c.id+'-div-'+e.date;if(!m.events.some(e=>e.id===id))m.events.push({id,asset:c.id,type:'dividend',at:e.date*1000,eur:e.amount/rate});
   }
   for(const e of Object.values(x.events?.splits||{})){
    const id=c.id+'-split-'+e.date,ratio=Number(e.numerator)/Number(e.denominator);if(ratio>0&&!m.events.some(e=>e.id===id))m.events.push({id,asset:c.id,type:'split',at:e.date*1000,ratio});
   }
  }catch(e){m.errors.push(c.name+': '+e.message)}
 }));
 try{
  const csv=await get('https://data-api.ecb.europa.eu/service/data/EST/B.EU000A2X2A25.WT?format=csvdata&lastNObservations=1',false);
  const lines=csv.trim().split(/\r?\n/),header=lines[0].split(','),row=lines.at(-1).split(','),date=row[header.indexOf('TIME_PERIOD')],annualPct=Number(row[header.indexOf('OBS_VALUE')]);
  if(!date||!Number.isFinite(annualPct)||now-Date.parse(date)>7*DAY)throw new Error('Tipo sin actualizar');
  m.rate={annualPct,date,fetchedAt:now,source:'BCE · €STR'};
 }catch(e){m.errors.push('Referencia del depósito: '+e.message)}
 m.events=m.events.filter(e=>now-e.at<35*DAY);return m;
}
