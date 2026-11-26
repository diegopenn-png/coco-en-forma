import {newMatch,move,view} from '../../../games/truco/engine.mjs';
const origins=new Set(['https://cocoenforma.com','https://www.cocoenforma.com','https://diegopenn-png.github.io']);
const random=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
function fail(message,status){throw Object.assign(new Error(message),{status});}
export function makeHandler(db, salt) {
  const table=()=>db.from('coco_truco_rooms');
  return async req=>{
    const origin=req.headers.get('Origin');
    const headers={'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Origin'};
    const reply=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers});
    if(origin&&!origins.has(origin))return reply({error:'expired'},403);
    if(origin) Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type, apikey, x-truco-seat'});
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
    try {
      if(req.method!=='POST')fail('expired',405);
      const token=req.headers.get('x-truco-seat')||'';
      if(!/^[a-f0-9]{64}$/.test(token))fail('expired',401);
      const raw=await req.text();if(raw.length>1500)fail('invalidCode',400);
      let body;try{body=JSON.parse(raw);}catch{fail('invalidCode',400);}
      if(!body||typeof body!=='object')fail('invalidCode',400);
      const {action,code,capacity,goal}=body;
      if(!/^[A-F0-9]{12}$/.test(code))fail('invalidCode',400);
      const key=await hash(code+'|'+token);
      const name=typeof body.name==='string'?body.name.trim().replace(/[\p{C}]/gu,'').slice(0,24):'';
      const select=async()=>{
        const {data,error}=await table().select('version,state,expires_at').eq('code',code).maybeSingle();
        if(error)fail('connectError',503);return data;
      };
      let row=await select();
      if(action==='create'&&!row) {
        if(!name)fail('nameError',400);
        if(![2,4,6].includes(capacity)||![15,30].includes(goal))fail('stale',400);
        const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()||'unknown';
        const creator=await hash(salt+'|'+new Date().toISOString().slice(0,10)+'|'+ip);
        const state={capacity,goal,players:[{key,name}],game:null,closed:false};
        const {data,error}=await db.rpc('coco_truco_create',{room_code:code,room_state:state,creator});
        if(error)fail('connectError',503);
        row=await select();if(!row)fail(data?'connectError':'limit',429);
      }
      if(!row||Date.parse(row.expires_at)<Date.now())fail('expired',404);
      for(let attempt=0;attempt<6;attempt++){
        const state=row.state;
        let seat=state.players.findIndex(p=>p.key===key);
        const visible=version=>({code,version,capacity:state.capacity,goal:state.goal,seat,
          names:state.players.map(p=>p.name),closed:state.closed,game:state.game?view(state.game,seat):null});
        if(seat<0 && action==='join') {
          if(state.closed||state.game||state.players.length>=state.capacity)fail('full',409);
          if(!name)fail('nameError',400);
          seat=state.players.length;state.players.push({key,name});
          if(state.players.length===state.capacity)state.game=newMatch(state.players.map(p=>p.name),state.goal,random);
        } else {
          if(seat<0)fail('expired',404);
          if(['get','join','create'].includes(action))return reply(visible(row.version));
          if(state.closed||body.version!==row.version)fail('stale',409);
          if(action==='leave') {
            if(state.game||seat===0){state.closed=true;}else{state.players.splice(seat,1);}
          } else if(action==='play'&&state.game){
            try{move(state.game,seat,body.move,random);}catch{fail('stale',409);}
          } else fail('stale',409);
        }
        const version=row.version+1;
        const updated=await table().update({state,version}).eq('code',code).eq('version',row.version).select('version').maybeSingle();
        if(updated.error)fail('connectError',503);
        if(updated.data)return reply(action==='leave'?{closed:true}:visible(version));
        if(action!=='join')fail('stale',409);
        row=await select();if(!row)fail('expired',404);
      }
      fail('stale',409);
    }catch(e){return reply({error:e.status?e.message:'connectError'},e.status||500);}
  };
}
