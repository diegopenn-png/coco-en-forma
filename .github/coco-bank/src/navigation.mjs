// Suggestions depend only on current account state. They never execute financial actions.
export function nextBankStep(data){
 const s=data.state,i=data.summary;
 if(!s)return {kind:'account',title:'Empieza por tu cuenta',text:'Solo necesitamos el nombre que quieres usar.',label:'Crear mi cuenta'};
 if(!s.config||!data.parent?.configured)return {kind:'parent',title:'Prepara el sueldo con un adulto',text:'El adulto elige los ingresos y los gastos con su PIN.',label:'Llamar a un adulto'};
 if(!s.journey?.funded)return i.started?{kind:'receive',title:'Tu primer sueldo está listo',text:'Recíbelo y después organizaremos los gastos.',label:'Recibir mi primer sueldo'}:{kind:'waiting',title:'Tu cuenta está preparada',text:'El sueldo estará disponible en la fecha de inicio acordada.',label:'Conocer mis gastos'};
 if(!s.journey.acknowledged)return {kind:'ack',title:'Tu dinero sigue aquí',text:'Conoce tu saldo y continúa donde lo dejaste.',label:'Conocer mi cuenta'};
 if(i.bills>0)return s.cash-i.earmarked<i.bills?{kind:'parent',title:'Revisa los gastos con un adulto',text:'No alcanza el dinero para todos los gastos. Pide ayuda para decidir qué hacer.',label:'Pedir ayuda al adulto'}:{kind:'expenses',title:'Primero, paga tus gastos',text:'Mira qué falta por pagar. Después podrás ahorrar lo que quede.',label:'Ver mis gastos'};
 if(!s.journey.organized)return {kind:'organize',title:'¡Ya has pagado tus gastos!',text:'Guardamos una parte por si la necesitas. El resto lo puedes ahorrar.',label:'Continuar con mi dinero'};
 if(s.orders.length)return {kind:'orders',title:'Tu operación está en espera',text:'Tu compra o venta espera al próximo precio. Puedes ver cómo va.',label:'Ver mi operación'};
 if(i.available<=0)return {kind:'school',title:'Todo tu dinero tiene un destino',text:'Puedes seguir aprendiendo mientras llega el próximo sueldo.',label:'Aprender con Coco'};
 return {kind:'investments',title:s.contributed?'Revisa cómo va tu cartera':'Tu dinero ya está organizado',text:s.contributed?'Mira cómo va el dinero que invertiste. Puede subir o bajar.':'Ahora puedes conocer las inversiones, a tu ritmo.',label:s.contributed?'Ver mi cartera':'Aprender a invertir'};
}
export function nextPayday(config,now){
 if(!config)return null;const start=new Date(config.payrollStartsAt||config.startsAt),current=new Date(now);
 if(start.getTime()>now)return (config.mode==='continuous'||start.getTime()<=config.endsAt)?start.getTime():null;
 for(let i=0;i<2;i++){const y=current.getUTCFullYear(),mo=current.getUTCMonth()+i,last=new Date(Date.UTC(y,mo+1,0)).getUTCDate(),at=Date.UTC(y,mo,Math.min(start.getUTCDate(),last));if(at>now)return (config.mode==='continuous'||at<=config.endsAt)?at:null}
 return null;
}

export function bankProgress(data){
 const s=data.state,c=s?.config,i=data.summary;
 if(!c||!i)return {billsPct:0,goalPct:0,period:null,total:0,paid:0,hasBills:false,remaining:0};
 const period=s.months?.length?s.months[s.months.length-1]:null;
 const receipts=(s.bills||[]).filter(b=>period&&new Date(b.at).toISOString().slice(0,10)===period);
 const total=receipts.reduce((v,b)=>v+b.amount,0),paid=receipts.filter(b=>b.paid).reduce((v,b)=>v+b.amount,0);
 const hasBills=!!period&&!!s.journey?.funded;
 const value=c.kind==='saving'?i.netWorth:c.kind==='budget'?(i.paidMonths||0):(i.challengeReturnPct??i.returnPct??0);
 const target=c.kind==='saving'?c.goalAmount:c.kind==='budget'?c.targetMonths:c.target;
 // A zero-return target is met only with invested capital and an observed result.
 const ratio=target>0?value/target:((s.contributed||0)>0&&value>=0?1:0);
 const goalPct=Math.max(0,Math.min(100,Math.floor(ratio*100+1e-8)));
 return {period,total,paid,hasBills,billsPct:hasBills?(total?Math.min(100,Math.floor(paid/total*100+1e-8)):100):0,goalPct,remaining:Math.max(0,(target||0)-value)};
}
