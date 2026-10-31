import {TYPES,CHILD_ITEMS} from './types.mjs';
export {TYPES};
export const VERSION='2.0.0-enneagram';
export function ageAt(dob,today=new Date()){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dob))throw Error('Introduce una fecha válida.');
 const [y,m,d]=dob.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));
 if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)throw Error('Esa fecha no existe.');
 const ty=today.getFullYear(),tm=today.getMonth()+1,td=today.getDate();
 if(y>ty||y===ty&&(m>tm||m===tm&&d>td))throw Error('La fecha está en el futuro.');
 const years=ty-y-Number(tm<m||tm===m&&td<d);
 if(years<6||years>99)throw Error('Este recorrido está disponible de 6 a 99 años.');
 return {years,minor:years<18,child:years<12};
}
export function buildItems(age){const items=[];for(let j=0;j<6;j++)for(let k=0;k<9;k++){const t=TYPES[(k+j*4)%9];items.push({id:`${t.id}-${j}`,type:t.id,reverse:j>=4,text:age<12?CHILD_ITEMS[t.id-1][j]:t.items[j]})}return items}
export function summarize(answers,age){
 const items=buildItems(age),rows=TYPES.map(t=>{const qs=items.filter(q=>q.type===t.id),values=qs.filter(q=>Number.isInteger(answers[q.id])&&answers[q.id]>=1&&answers[q.id]<=5).map(q=>q.reverse?6-answers[q.id]:answers[q.id]);return {...t,answered:values.length,score:values.length>=4?values.reduce((a,b)=>a+b,0)/values.length:null}});
 const eligible=rows.every(x=>x.score!==null),sorted=eligible?[...rows].sort((a,b)=>b.score-a.score):[],max=sorted[0]?.score;
 // Editorial comparison threshold, not a statistical confidence interval.
 const leaders=eligible?sorted.filter(x=>max-x.score<=.25).map(x=>x.id):[];
 return {rows,eligible,leaders,minor:age<18,answered:rows.reduce((n,x)=>n+x.answered,0),total:54,version:VERSION};
}
export function wheelSVG(rows=[],size=440){const pts=TYPES.map(t=>{const a=(t.id*40-90)*Math.PI/180;return {x:220+162*Math.cos(a),y:220+162*Math.sin(a),a}}),p=n=>pts[n-1],line=(a,b)=>`<line x1="${p(a).x}" y1="${p(a).y}" x2="${p(b).x}" y2="${p(b).y}"/>`;
 const path=[1,4,2,8,5,7,1].slice(1).map((n,i)=>line([1,4,2,8,5,7][i],n)).join('')+line(3,6)+line(6,9)+line(9,3);
 const poly=rows.length===9&&rows.every(r=>r.score!==null)?`<polygon points="${rows.map((r,i)=>{const rad=30+(r.score-1)/4*118;return `${220+rad*Math.cos(pts[i].a)},${220+rad*Math.sin(pts[i].a)}`}).join(' ')}" fill="#ba8b4b33" stroke="#bc8a42" stroke-width="3"/>`:'';
 return `<svg viewBox="0 0 440 440" width="${size}" height="${size}" role="img" aria-label="Rueda del eneagrama: nueve tendencias, ninguna superior a otra"><circle cx="220" cy="220" r="162" fill="none" stroke="currentColor" stroke-opacity=".2"/><g stroke="currentColor" stroke-opacity=".17">${path}</g>${poly}${TYPES.map((t,i)=>`<circle cx="${pts[i].x}" cy="${pts[i].y}" r="22" fill="${t.color}"/><text x="${pts[i].x}" y="${pts[i].y+6}" text-anchor="middle" fill="white" font-family="Helvetica,Arial,sans-serif" font-size="19">${t.id}</text>`).join('')}</svg>`;
}
