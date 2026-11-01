// The same Auth storage as the main Coco site; no new account system.
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
export class OnlineChess{
 constructor(){this.api=null;this.user=null;this.channel=null;this.generation=0}
 async init(){this.api??=await client();if(!this.authSubscription)this.authSubscription=this.api.auth.onAuthStateChange((event,session)=>{if(this.user&&session?.user?.id!==this.user.id){this.user=null;this.onState?.(false,'La sesión cambió. Vuelve a entrar con tu cuenta.');this.stop()}});const {data,error}=await this.api.auth.getUser();this.user=!error&&!data.user?.is_anonymous?data.user:null;return this.user}
 async login(email,password){this.api??=await client();const {data,error}=await this.api.auth.signInWithPassword({email,password});if(error)throw new Error('No pudimos iniciar sesión. Comprueba tu correo y contraseña.');this.user=data.user;return this.user}
 async call(action,values={}){
  const {data}=await this.api.auth.getSession();if(!data.session||data.session.user.is_anonymous)throw new Error('Inicia sesión con tu cuenta registrada de Coco.');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch(URL+'/functions/v1/coco-chess',{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({action,...values}),signal:controller.signal});
   const result=await response.json();if(!response.ok){const error=new Error(result.error||'No se pudo actualizar la sala.');error.status=response.status;throw error}return result;
  }catch(e){if(e.name==='AbortError'||e instanceof TypeError)throw new Error('Se perdió la conexión. Actualiza para comprobar la última jugada.');throw e}finally{clearTimeout(timeout)}
 }
 stop(){this.generation++;if(this.channel){this.api.removeChannel(this.channel);this.channel=null}}
 watch(id,onRoom,onState){
  this.stop();const generation=this.generation;this.onRoom=onRoom;this.onState=onState;this.roomId=id;
  this.channel=this.api.channel('chess:'+id+':'+generation).on('postgres_changes',{event:'UPDATE',schema:'public',table:'coco_chess_games',filter:'id=eq.'+id},({new:room})=>{if(this.generation===generation)onRoom(room)}).subscribe(async state=>{
   if(this.generation!==generation)return;
   if(state==='SUBSCRIBED')await this.refresh();else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(state))onState(false);
  });
 }
 async refresh(){
  if(!this.channel)return;const generation=this.generation;
  try{const {room}=await this.call('get',{id:this.roomId});if(generation!==this.generation)return;this.onRoom(room);this.onState(true)}catch(e){if(generation===this.generation)this.onState(false,e.message)}
 }
 reconnect(){if(this.roomId&&this.onRoom)this.watch(this.roomId,this.onRoom,this.onState)}
}
