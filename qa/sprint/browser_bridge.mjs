// Stdio-only test bridge: canonical Worker code, synthetic DB; no listening ports or network.
import readline from 'node:readline';import{harness}from'../../eterna-worker/test/sprint-harness.mjs';
const workers=new Map();let requests=0;let queue=Promise.resolve();
const rl=readline.createInterface({input:process.stdin});
rl.on('line',line=>{queue=queue.then(async()=>{try{const input=JSON.parse(line);if(input.stats){console.log(JSON.stringify({requests,model_calls:[...workers.values()].reduce((n,h)=>n+h.inferences.length,0)}));return}
 const year=String(input.year||'5º de Primaria');let h=workers.get(year);if(!h){h=harness({year});workers.set(year,h)}
 const r=await h.fetchTurn(input.body);await h.drain();requests++;console.log(JSON.stringify(r));
}catch(e){console.log(JSON.stringify({status:500,data:{error:String(e.message)}}))}})});
console.log(JSON.stringify({ready:true}));
