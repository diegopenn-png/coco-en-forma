const endpoint='https://fcatttsfufjiphgohgwp.supabase.co/functions/v1/coco-truco';
const publicKey='sb_publishable_Jn3efpb36_j-vhx0nr_k3A_PLCY0y5X';
export function hex(bytes){return Array.from(crypto.getRandomValues(new Uint8Array(bytes)),x=>x.toString(16).padStart(2,'0')).join('');}
export function credential(code) {
  const id='coco.truco.seat.'+code;
  let key=localStorage.getItem(id);
  if(!key){key=hex(32);localStorage.setItem(id,key);}
  return key;
}
export async function request(action,code,values={}) {
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(endpoint,{method:'POST',signal:controller.signal,
      headers:{'Content-Type':'application/json',apikey:publicKey,'x-truco-seat':credential(code)},
      body:JSON.stringify({action,code,...values})});
    const data=await response.json();if(!response.ok)throw Error(data.error||'connectError');return data;
  }finally{clearTimeout(timeout);}
}
