export const VERSION='1.0.0-pilot';
export const DOMAINS={logic:'Patrones y lógica',numbers:'Razonamiento numérico',words:'Lenguaje',space:'Orientación espacial',memory:'Memoria de secuencias',detail:'Atención a detalles'};
export function ageAt(dob,today=new Date()){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dob))throw Error('Introduce una fecha de nacimiento válida.');
 const [y,m,d]=dob.split('-').map(Number),birth=new Date(Date.UTC(y,m-1,d));
 if(birth.getUTCFullYear()!==y||birth.getUTCMonth()!==m-1||birth.getUTCDate()!==d)throw Error('La fecha no existe.');
 const ty=today.getFullYear(),tm=today.getMonth()+1,td=today.getDate();
 if(y>ty||y===ty&&(m>tm||m===tm&&d>td))throw Error('La fecha no puede estar en el futuro.');
 const years=ty-y-Number(tm<m||tm===m&&td<d);
 if(years<6||years>99)throw Error('Este piloto está preparado para edades de 6 a 99 años.');
 return {years,band:years<9?1:years<12?2:years<16?3:4};
}
export function shuffle(a,rng=Math.random){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function q(id,domain,prompt,answer,alternatives,explanation,extra={}){const options=[String(answer),...alternatives.map(String)];if(new Set(options).size!==4)throw Error('Opciones duplicadas '+id);return {id,domain,prompt,answer:String(answer),options,explanation,...extra}}
const verbal=[
 [['¿Qué palabra significa lo contrario de «vacío»?','Lleno',['Ligero','Lejos','Suave'],'Vacío y lleno expresan ideas opuestas.'],['¿Qué objeto se utiliza para medir una longitud?','Regla',['Cuchara','Almohada','Cepillo'],'Una regla permite medir longitudes.'],['¿Qué palabra incluye tanto manzanas como peras?','Frutas',['Muebles','Herramientas','Colores'],'Manzanas y peras pertenecen al grupo de las frutas.'],['La lluvia cesó y pudimos salir. ¿Qué significa «cesó»?','Terminó',['Aumentó','Comenzó','Volvió'],'Cesar significa dejar de ocurrir.']],
 [['¿Qué significa «escaso»?','Poco abundante',['Muy rápido','Muy antiguo','Siempre exacto'],'Escaso se refiere a una cantidad pequeña.'],['Si una explicación es «coherente», sus ideas…','Se relacionan sin contradicciones',['Son siempre verdaderas','Son difíciles de leer','Usan muchas palabras'],'Coherencia y verdad no son lo mismo.'],['Un plano es a una ciudad como un índice es a…','Un libro',['Una brújula','Una ventana','Una calle'],'Ambos ayudan a localizar partes de un conjunto.'],['Marta llevó paraguas por si llovía. ¿Qué podemos asegurar?','Se preparó para la posibilidad de lluvia',['Llovió todo el día','Marta se mojó','No había nubes'],'Prepararse para una posibilidad no confirma que ocurra.']],
 [['«Aunque era difícil, continuó». ¿Qué expresa «aunque»?','Una dificultad que no impidió continuar',['La causa de abandonar','Una fecha','Una consecuencia segura'],'Aunque introduce una objeción que no impide lo dicho.'],['Un argumento «plausible» es…','Razonable o creíble',['Demostrado sin ninguna duda','Falso por definición','Imposible de entender'],'Plausible no equivale a demostrado.'],['¿Qué relación hay entre «semilla» y «germinación»?','Elemento y proceso que puede experimentar',['Dos palabras opuestas','Lugar y habitante','Unidad y herramienta de medida'],'La germinación es un proceso que puede experimentar una semilla.'],['Algunos visitantes llegaron temprano. ¿Qué se deduce?','Al menos un visitante llegó temprano',['Todos llegaron temprano','Ninguno llegó tarde','La mayoría llegó temprano'],'Algunos no determina ni todos ni la mayoría.']],
 [['Una afirmación «refutable» es aquella que…','Podría resultar falsa ante determinada evidencia',['Ya se sabe que es falsa','Nunca puede comprobarse','Depende solo de gustos'],'Refutable significa susceptible de ser contradicha con evidencia.'],['«Correlación» entre dos variables indica…','Que varían de forma relacionada',['Que una causa necesariamente la otra','Que son idénticas','Que no tienen relación'],'Una asociación no demuestra por sí misma causalidad.'],['Una conclusión se sigue necesariamente de unas premisas cuando…','No pueden ser verdaderas las premisas y falsa la conclusión',['Suena convincente','La mayoría la acepta','Tiene muchos ejemplos'],'La validez deductiva se refiere a la relación lógica entre premisas y conclusión.'],['Si el informe es «provisional», entonces…','Puede revisarse con nueva información',['No contiene información','Es definitivamente falso','Está cerrado a cambios'],'Provisional indica que todavía puede cambiar.']]
];
export function buildItems(band){
 if(![1,2,3,4].includes(band))throw Error('Recorrido no válido');
 const items=[];
 for(let i=0;i<4;i++){
  const step=band+i+1,start=2+i,seq=Array.from({length:4},(_,k)=>band<3?start+k*step:start*(k+1)**2),answer=band<3?start+4*step:start*25;
  items.push(q('logic-'+i,'logic',`¿Qué número continúa? ${seq.join(' · ')} · ?`,answer,[answer+step,answer-step,answer+step+1],band<3?`En cada paso se suma ${step}.`:`Son ${start} multiplicado por 1², 2², 3², 4² y 5².`));
 }
 for(let i=0;i<4;i++){
  const n=3+i,b=band+2,answer=band===1?n+b:band===2?n*b:band===3?n*b*2:n*b;
  const prompt=band===1?`Tienes ${n} fichas y consigues ${b} más. ¿Cuántas tienes?`:band===2?`Hay ${n} bolsas con ${b} fichas en cada una. ¿Cuántas fichas hay?`:band===3?`Cada una de ${n} cajas contiene ${b} paquetes de 2 piezas. ¿Cuántas piezas hay?`:`Un objeto cuesta ${n*b*5} €. Tiene un descuento del 20 %. ¿Cuántos euros se descuentan?`;
  items.push(q('numbers-'+i,'numbers',prompt,answer,[answer+1,answer+b,answer-1],band===1?`Sumamos ${n} + ${b}.`:band===2?`Multiplicamos ${n} × ${b}.`:band===3?`Multiplicamos ${n} × ${b} × 2.`:`El 20 % es la quinta parte: ${n*b*5} ÷ 5 = ${answer}.`));
 }
 verbal[band-1].forEach((v,i)=>items.push(q('words-'+i,'words',...v)));
 const dirs=['↑','→','↓','←'];
 for(let i=0;i<4;i++){
  const turn=band<3?1:3,answer=dirs[(i+turn)%4];
  items.push(q('space-'+i,'space',`La flecha ${dirs[i]} gira ${turn===1?'un cuarto de vuelta':'tres cuartos de vuelta'} hacia la derecha (sentido del reloj). ¿Cómo queda?`,answer,dirs.filter(x=>x!==answer),`Partiendo de ${dirs[i]}, avanza ${turn} paso(s) en el orden ↑ → ↓ ←. El resultado es ${answer}.`));
 }
 for(let i=0;i<4;i++){
  const length=band+2,sequence=Array.from({length},(_,j)=>(i*3+j*2)%9+1),answer=sequence.join(' · '),reverse=[...sequence].reverse().join(' · '),changed=[...sequence];changed[length-1]=0;const first=[...sequence];first[0]=0;
  items.push(q('memory-'+i,'memory','¿Qué secuencia acabas de ver, en el mismo orden?',answer,[reverse,changed.join(' · '),first.join(' · ')],'La secuencia mostrada fue '+answer+'.',{sequence:answer}));
 }
 for(let i=0;i<4;i++){
  const length=8+band*3,letters=Array.from({length},(_,j)=>(j+i)%(band+2)===0?'B':'D'),answer=letters.filter(x=>x==='B').length;
  items.push(q('detail-'+i,'detail',`Cuenta únicamente las letras B: ${letters.join(' ')}`,answer,[answer+1,answer+2,answer-1],`Hay ${answer} letras B. Las demás son D.`));
 }
 return items;
}
export function score(items,responses){return Object.entries(DOMAINS).map(([id,title])=>{const qs=items.filter(q=>q.domain===id),answered=qs.filter(q=>responses[q.id]!==undefined&&responses[q.id]!==null);return {id,title,total:qs.length,answered:answered.length,correct:answered.filter(q=>responses[q.id]===q.answer).length,skipped:qs.length-answered.length}})}
export const PRACTICE={logic:'Inventad una serie y explicad la regla antes de resolverla.',numbers:'Comparad dos formas de resolver una cuenta cotidiana con fichas o dibujos.',words:'Leed un párrafo y contad con vuestras palabras qué afirma y qué no.',space:'Dibujad un recorrido y seguidlo girando una flecha de papel.',memory:'Recordad una lista corta, tapadla y probad a agrupar sus elementos.',detail:'Buscad diferencias en un dibujo a vuestro ritmo y explicad cómo las encontrasteis.'};
