// Dependency-free, vector PDF. Text is WinAnsi, escaped as ASCII octal for byte-safe xrefs.
import {REPORT_PAGES} from '../../explora/coaching.mjs';
import {buildReport} from '../../explora/report.mjs';
import {TYPES} from '../../explora/types.mjs';
import {FONT_DATA} from './fonts.mjs';
const ink='#213c43',gold='#8a6533',muted='#566c70';
function literal(s){return '('+String(s).replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/[’]/g,"'").replace(/→/g,'>').replace(/…/g,'...').split('').map(c=>{const n=c.charCodeAt(0);return c==='('||c===')'||c==='\\'?'\\'+c:n>126&&n<=255?'\\'+n.toString(8).padStart(3,'0'):n>255?'?':c}).join('')+')'}
const rgb=h=>[1,3,5].map(i=>(parseInt(h.slice(i,i+2),16)/255).toFixed(3)).join(' ');
class Page{constructor(n){this.c=[];this.rect(0,0,595,842,'#fbfaf6');this.text('COCO / ENEAGRAMA',44,35,11,ink,true);this.line(44,55,551,55,'#dcded6');this.text('Autoconocimiento · Cuestionario original no validado',44,809,9,muted);this.text(String(n).padStart(2,'0'),527,809,10,ink)}text(s,x,y,size=12,color=ink,bold=false){this.c.push(`${rgb(color)} rg BT /${bold==='serif'?'F3':bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x} ${842-y-size} Tm ${literal(s)} Tj ET`)}rect(x,y,w,h,color){this.c.push(`${rgb(color)} rg ${x} ${842-y-h} ${w} ${h} re f`)}line(x,y,x2,y2,color=gold){this.c.push(`${rgb(color)} RG 1 w ${x} ${842-y} m ${x2} ${842-y2} l S`)}para(s,x,y,w=507,size=11,color=ink){const width=t=>Array.from(t).reduce((sum,c)=>{const n=c.charCodeAt(0);return sum+(FONT_DATA[0].widths[(n>=32&&n<=255?n:63)-32]||600)*size/1000},0);let line='';const flush=()=>{if(line){this.text(line,x,y,size,color);y+=size*1.5;line=''}};for(const word of String(s).split(/\s+/)){const combined=(line?line+' ':'')+word;if(width(combined)<=w){line=combined;continue}flush();for(const c of word){if(width(line+c)>w)flush();line+=c}}flush();return y}heading(k,title){this.text(k.toUpperCase(),44,82,10,gold,true);this.text(title,44,104,30,ink,'serif')}poly(points,fill,stroke=gold){this.c.push(`${rgb(fill)} rg ${rgb(stroke)} RG 1.8 w ${points.map(([x,y],i)=>`${x.toFixed(2)} ${(842-y).toFixed(2)} ${i?'l':'m'}`).join(' ')} h B`)}circle(x,y,r,color){const k=.55228475*r;const Y=842-y;this.c.push(`${rgb(color)} rg ${x+r} ${Y} m ${x+r} ${Y+k} ${x+k} ${Y+r} ${x} ${Y+r} c ${x-k} ${Y+r} ${x-r} ${Y+k} ${x-r} ${Y} c ${x-r} ${Y-k} ${x-k} ${Y-r} ${x} ${Y-r} c ${x+k} ${Y-r} ${x+r} ${Y-k} ${x+r} ${Y} c f`)} }
export function makePDF(result,{alias='Mi exploración',age=result.age??18,date=new Date().toLocaleDateString('es-ES'),sample=false,notes='',provenance=''}={}){
 const r=buildReport({...result,age}),pages=[];
 const add=(k,title)=>{const p=new Page(pages.length+1);pages.push(p);p.heading(k,title);return p};
 const check=(y,label)=>{if(y>785)throw Error(`Report overflow: ${label} at ${y}`)};
 const section=(p,title,text,y,size=10.5)=>{p.text(title,44,y,11,gold,true);return p.para(text,44,y+22,507,size)+15};
 let p=add(sample?'MUESTRA FICTICIA · NO ES TU RESULTADO':'TU CUADERNO PERSONAL','Comprenderte para elegir');
 const aliasEnd=p.para(String(alias).slice(0,40),44,158,507,17);
 p.text(`${date}  /  ${age} años  /  ${result.answered} de 54 respuestas`,44,Math.max(192,aliasEnd+8),10,muted);
 const cx=177,cy=384,rad=108;
 const pts=TYPES.map(t=>{const a=(t.id*40-90)*Math.PI/180;return {x:cx+rad*Math.cos(a),y:cy+rad*Math.sin(a),a}}),point=n=>pts[n-1];
 for(const [a,b] of [[1,4],[4,2],[2,8],[8,5],[5,7],[7,1],[3,6],[6,9],[9,3]])p.line(point(a).x,point(a).y,point(b).x,point(b).y,'#d5dbd7');
 if(result.eligible)p.poly(result.rows.map((v,i)=>{const dist=14+(v.score-1)/4*82;return [cx+dist*Math.cos(pts[i].a),cy+dist*Math.sin(pts[i].a)]}),'#e5d7bc');
 TYPES.forEach((t,i)=>{p.circle(pts[i].x,pts[i].y,14,t.color);p.text(t.id,pts[i].x-3.5,pts[i].y-8,12,'#ffffff',true)});
 p.text('MEDIA / 5',466,244,9,muted,true);p.text('RESP.',526,246,7,muted);
 result.rows.forEach((v,i)=>{const y=269+i*29;p.text(`${v.id}  ${v.name}`,325,y,10,ink,true);p.text(v.score===null?'Sin dato':v.score.toFixed(2).replace('.',','),495,y,10);p.text(`${v.answered}/6`,526,y+3,7,muted);p.line(325,y+20,551,y+20,'#e2e5de')});
 p.para('Nueve medias de respuestas, en escala 1-5. No son porcentajes, probabilidades ni medidas de capacidad.',44,549,507,10,muted);
 p.rect(44,603,507,112,'#eaf0ec');p.text(r.title,60,617,15,ink,true);p.para(r.evidence,60,645,475,10.5);
 p.para('Lee una hipótesis, contrástala con tu experiencia y elige una práctica. Autoconocimiento: no es un diagnóstico ni una definición de quién eres.',44,736,507,10);
 p=add('01 / LECTURA PERSONAL',r.minor?'Una conversación abierta':'Lo que merece tu atención');
 let y=p.para(r.intro,44,153,507,11)+18;
 for(const v of r.readings){p.text(`${v.id} / ${v.name}`,44,y,12,v.color,true);y=p.para(v.pattern,44,y+24,507,10.5)+7;y=p.para(v.question,44,y,507,10.5,gold)+19}
 if(!r.readings.length)y=section(p,r.minor?'Tu experiencia lleva la voz':'Empezar por los hechos',r.minor?'Elige algo de casa, del colegio o de tus amistades que quieras comprender. No tienes que responder todo ni contar cosas privadas. Una persona adulta puede ayudarte a poner palabras sin decidir qué sientes.':'Antes de buscar una explicación, anota qué ocurrió, qué hiciste y qué efecto tuvo. Evita convertir un único episodio en una afirmación sobre toda tu vida.',y);
 y=section(p,r.minor?'Para quien acompaña':r.readings.length>1?'Cómo pueden convivir estas miradas':'Tu margen para elegir',r.synthesis,y);
 y=section(p,'Una comprobación importante',r.minor?'Busca también un día en que actuaste de otra manera. Las personas aprendemos y cambiamos según lo que vivimos.':'Elige qué parte te resulta útil y cuál no reconoces. Una carga real o un reparto desigual también pueden explicar el malestar, sin atribuirlo todo a tu forma de ser. Una media menor no significa que te falte ese recurso.',y);check(y,'reading');
 p=add('02 / CONCIENCIA Y ACCIÓN','De la reacción a la elección');y=153;
 y=p.para('Ejemplo ilustrativo, no un episodio declarado por ti. Utilízalo solo si te ayuda a reconocer una situación propia.',44,y,507,10,muted)+15;
 y=section(p,'La situación',r.episode.scene,y);
 y=section(p,'Una creencia posible para contrastar','«'+r.episode.belief+'»',y);
 y=section(p,'La reacción y su posible coste',r.episode.automatic,y);
 y=section(p,'La alternativa que puedes elegir',r.episode.choice,y);
 y=section(p,'Una frase para ensayar','«'+r.episode.phrase+'»',y);
 y=p.para(r.episode.question,44,y,507,10.5,gold)+13;
 p.text('PRÁCTICA BREVE',44,y,10,gold,true);y+=22;
 r.episode.practice.forEach((t,i)=>{y=p.para(`${i+1}. ${t}`,44,y,507,10)+6});check(y,'episode');
 for(let half=0;half<2;half++){
  p=add(`${half+3<10?'0':''}${half+3} / TU VIDA COTIDIANA`,half?'Espacio para tu propia vida':'Vínculos y responsabilidades');y=153;
  y=p.para(r.minor?'Escoge una actividad que quieras probar. No es una lista de deberes.':r.primaryId?'Propuestas vinculadas a la lectura principal. Elige solo la que responda a una situación real.':'Propuestas transversales para explorar: el mapa no permite asignar un motivo a cada ámbito.',44,y,507,10,muted)+17;
  for(const [i,a] of r.areas.slice(half*4,half*4+4).entries()){
   p.text(`${half*4+i+1}. ${a.name}`,44,y,12,ink,true);y+=24;
   y=p.para(a.tip,44,y,507,10.5)+6;
   if(a.example)y=p.para('Por ejemplo: '+a.example,44,y,507,10)+6;
   y=p.para('Observa: '+a.observe,44,y,507,10,muted)+16;
   p.line(44,y-5,551,y-5,'#dcded6');
  }check(y,'areas '+half);
 }
 p=add('05 / TU EXPERIMENTO','Siete días para probar');y=153;
 y=p.para('Elige una sola práctica de las páginas anteriores. Evalúa lo que hiciste y aprendiste; no necesitas controlar la reacción de otra persona.',44,y,507,10.5)+16;
 for(const d of r.plan){y=p.para(`Día ${d.day} · ${d.title}. ${d.text}`,44,y,507,10.5)+12}
 y=section(p,'Tu reflexión',String(notes).slice(0,350)||'La situación que quiero trabajar: __________. La acción que elijo: __________. Cuándo la probaré: __________.',y,10);
 y=section(p,'Qué contará como avance',r.minor?'Que puedas contar lo que necesitas y elegir qué te ayuda. Puedes repetir, cambiar o dejar la actividad.':'Notar antes la reacción y elegir con más claridad. Tu responsabilidad está en expresar lo que necesitas, cumplir los acuerdos y renegociarlos a tiempo; la reacción ajena no depende enteramente de ti. Si algo no funcionó, ajusta el paso sin convertirlo en un juicio sobre tu valor.',y,10);check(y,'plan');
 p=add('06 / GUÍA BREVE Y MÉTODO','Nueve miradas, sin etiquetas');y=153;
 for(const t of r.glossary){p.text(`${t.id} / ${t.name}`,44,y,10.5,t.color,true);y=p.para(t.drive,182,y,369,10.5)+12}
 y+=7;
 y=section(p,'Cómo leer las puntuaciones','Cada media resume hasta seis respuestas en escala 1-5; dos frases se puntúan en sentido inverso. Se requieren cuatro de seis por tendencia para mostrarla y las nueve medias para comparar. Las diferencias de hasta 0,25 se agrupan por una regla editorial, no estadística. No hay baremos ni comparación con otras personas.',y,9.5);
 y=section(p,'Alcance y referencias','Cuestionario original de autoconocimiento no validado. No mide inteligencia ni permite diagnosticar, asignar alas, subtipos o compatibilidad. En menores se propone una conversación acompañada, sin tipo dominante. Los ejercicios de coaching son propuestas originales de Coco.',y,9.5);
 y=p.para('Marco de consulta: Riso y Hudson, Helen Palmer, Daniels y Price; bibliografía y materiales públicos, sin reproducir sus tests ni atribuir acreditación. Hook y colaboradores (2021), DOI 10.1002/jclp.23097, encontraron evidencia mixta sobre el eneagrama.',44,y,507,9.5)+11;
 y=p.para('Método y fuentes: cocoenforma.com/explora/metodo.html',44,y,507,9.5,muted)+8;
 if(provenance)y=p.para(String(provenance).slice(0,400),44,y,507,9,muted)+5;
 check(y,'method');if(pages.length!==REPORT_PAGES)throw Error('Invalid report page count');
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','','','',''];
 FONT_DATA.forEach((f,i)=>{const descriptorId=objects.length+1,fileId=descriptorId+1;objects[i+2]=`<< /Type /Font /Subtype /TrueType /BaseFont /${f.name} /FirstChar 32 /LastChar 255 /Widths [${f.widths.join(' ')}] /Encoding /WinAnsiEncoding /FontDescriptor ${descriptorId} 0 R >>`;objects.push(`<< /Type /FontDescriptor /FontName /${f.name} /Flags 32 /FontBBox [${f.bbox.join(' ')}] /ItalicAngle 0 /Ascent ${f.ascent} /Descent ${f.descent} /CapHeight 730 /StemV 80 /FontFile2 ${fileId} 0 R >>`);objects.push(`<< /Length ${f.hex.length+1} /Length1 ${f.hex.length/2} /Filter /ASCIIHexDecode >>\nstream\n${f.hex}>\nendstream`)});
 const kids=[];
 pages.forEach(pg=>{const pageId=objects.length+1,streamId=pageId+1,stream=pg.c.join('\n');kids.push(`${pageId} 0 R`);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${streamId} 0 R >>`);objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)});objects[1]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
 let out='%PDF-1.4\n',offsets=[0];objects.forEach((obj,i)=>{offsets.push(out.length);out+=`${i+1} 0 obj\n${obj}\nendobj\n`});const start=out.length;out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;return new TextEncoder().encode(out);
}
