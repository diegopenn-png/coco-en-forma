// Reuses the existing Coco account and SDK. Realtime carries metadata, never fleets.
const URL='https://fcatttsfufjiphgohgwp.supabase.co';
const KEY='sb_publishable_Jn3efpb36_j-vhx0nr_k3A_PLCY0y5X';
let sdkPromise;
async function client(){
 if(window.__COCO_SUPABASE_CLIENT)return window.__COCO_SUPABASE_CLIENT;
 if(!window.supabase){
  sdkPromise??=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='../../supabase-js-2.112.3.min.js';s.onload=resolve;s.onerror=()=>{sdkPromise=null;s.remove();reject(new Error('No se pudo conectar. Revisa tu conexión.'))};document.head.append(s)});
  await sdkPromise;
 }
 return window.__COCO_SUPABASE_CLIENT??=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
}
export class OnlineNaval{
 constructor(){this.api=null;this.user=null;this.channel=null;this.generation=0;this.inFlight=false;}
 async init(){
  this.api??=await client();
  if(!this.authSubscription)this.authSubscription=this.api.auth.onAuthStateChange((_event,session)=>{
   if(this.user&&session?.user?.id!==this.user.id){this.user=null;this.onState?.(false,'La sesión cambió. Vuelve a entrar con tu cuenta.');this.stop();}
  });
  const {data,error}=await this.api.auth.getUser();this.user=!error&&!data.user?.is_anonymous?data.user:null;return this.user;
 }
 async login(email,password){this.api??=await client();const {data,error}=await this.api.auth.signInWithPassword({email,password});if(error)throw new Error('No pudimos entrar. Comprueba tu correo y contraseña.');this.user=data.user;return this.user;}
 async call(action,values={}){
  const {data}=await this.api.auth.getSession();if(!data.session||data.session.user.is_anonymous)throw new Error('Entra con tu cuenta registrada de Coco.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
   const res=await fetch(URL+'/functions/v1/coco-naval',{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action,...values}),signal:controller.signal});
   const result=await res.json();if(!res.ok){const e=new Error(result.error||'No se pudo actualizar la partida.');e.status=res.status;throw e;}return result;
  }catch(e){if(e.name==='AbortError'||e instanceof TypeError)throw new Error('Se perdió la conexión. Pulsa Actualizar para comprobar la última jugada.');throw e;}finally{clearTimeout(timer);}
 }
 stop(){clearInterval(this.poll);this.generation++;if(this.channel){this.api.removeChannel(this.channel);this.channel=null;}this.roomId=null;}
 watch(id,onRoom,onState){
  this.stop();this.roomId=id;this.onRoom=onRoom;this.onState=onState;const generation=this.generation;
  this.channel=this.api.channel('naval:'+id+':'+generation).on('postgres_changes',{event:'UPDATE',schema:'public',table:'coco_naval_rooms',filter:'id=eq.'+id},()=>{if(generation===this.generation)this.refresh();}).subscribe(status=>{
   if(generation!==this.generation)return;if(status==='SUBSCRIBED')this.refresh();else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))onState(false,'Reconectando. También puedes pulsar Actualizar.');
  });
  this.poll=setInterval(()=>{if(!document.hidden)this.refresh();},8000);
 }
 async refresh(){
  if(!this.roomId||this.inFlight)return;this.inFlight=true;const generation=this.generation,id=this.roomId;
  try{const {room}=await this.call('get',{id});if(generation===this.generation){this.onRoom(room);this.onState(true);}}
  catch(e){if(generation===this.generation)this.onState(false,e.message);}finally{this.inFlight=false;}
 }
}
