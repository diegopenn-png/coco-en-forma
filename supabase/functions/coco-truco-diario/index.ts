import {createClient} from 'npm:@supabase/supabase-js@2.112.3';
import {actor,bot,move,newMatch,view} from '../../../games/truco/engine.mjs';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const headers={'Access-Control-Allow-Origin':'https://cocoenforma.com','Access-Control-Allow-Headers':'authorization,apikey,content-type','Cache-Control':'no-store','Content-Type':'application/json'};
const rng=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
function settle(game){while(game.phase==='play'&&actor(game)===1)move(game,1,bot(view(game,1),rng),rng);return game;}
Deno.serve(async req=>{
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return reply({},405);
 try{
 const token=req.headers.get('Authorization')?.replace(/^Bearer /i,'');if(!token)return reply({},401);
 const {data:{user},error}=await db.auth.getUser(token);if(error||!user||user.is_anonymous)return reply({},401);
 const dia=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(new Date());
 const body=await req.json(), table=()=>db.from('coco_truco_diario'), own=query=>query.eq('usuario',user.id).eq('dia',dia);
 let {data:row,error:readError}=await own(table().select('*')).maybeSingle();if(readError)throw readError;
 if(!row){
 if(body.move)return reply({},409);
 const create=await table().upsert({usuario:user.id,dia,estado:settle(newMatch(['1','Coco'],15,rng))},{onConflict:'usuario,dia',ignoreDuplicates:true});
 if(create.error)throw create.error;
 const result=await own(table().select('*')).single();if(result.error)throw result.error;row=result.data;
 }
 if(body.move){
 if(body.dia!==dia||row.version!==body.version)return reply({},409);
 try{move(row.estado,0,body.move,rng);}catch{return reply({},409);}
 const result=await own(table().update({estado:settle(row.estado),version:row.version+1})).eq('version',row.version).select('*').maybeSingle();
 if(result.error)throw result.error;if(!result.data)return reply({},409);row=result.data;
 }
 return reply({game:view(row.estado,0),version:row.version,dia,points:row.puntos});
 }catch{return reply({},503);}
});
