import {CONTEXT_FOCUS,contextOptions,normalizeContext} from './context.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options=(items,value)=>'<option value="">Prefiero omitirlo</option>'+items.map(o=>`<option value="${o.id}" ${o.id===value?'selected':''}>${esc(o.label)}</option>`).join('');
export function contextFormHTML(){return `<fieldset class="personal-context"><legend>Para hacerlo más a tu medida <small>(opcional)</small></legend><p>Elige qué quieres trabajar. Estas preguntas no cambian tu puntuación y puedes dejarlas en blanco.</p><label class="field">¿En qué parte de tu vida quieres centrarte?<select name="context_focus"></select></label><label class="field">¿Qué te gustaría mejorar?<select name="context_goal"></select></label><label class="field">¿Qué suele dificultarte ese paso?<select name="context_obstacle"></select></label><label class="field">Cuéntanos una situación reciente <small>(hasta 220 caracteres)</small><textarea name="context_scene" maxlength="220" rows="3" placeholder="Qué ocurrió y qué hiciste tú…"></textarea></label><label class="field">¿Qué cambio concreto te gustaría observar? <small>(hasta 140 caracteres)</small><textarea name="context_success" maxlength="140" rows="2" placeholder="Algo que puedas hacer y comprobar…"></textarea></label><label class="field">¿Qué rato podrías dedicar a una práctica?<select name="context_minutes"><option value="">Prefiero decidirlo después</option><option value="5">5 minutos</option><option value="10">10 minutos</option><option value="20">20 minutos</option></select></label><small>Tú decides qué contar. Evita nombres de centros, contactos, datos médicos o información privada de otras personas. Tu contexto se incluirá en el PDF y se procesa transitoriamente al generarlo, sin guardarse.</small></fieldset>`}
export function readContextForm(form,age){const value=n=>form.elements['context_'+n]?.value??'';return normalizeContext(Object.fromEntries(['focus','goal','obstacle','scene','success','minutes'].map(n=>[n,value(n)])),age)}
export function mountContextForm(form,getAge,initial={}){
 const age=()=>{try{return getAge()}catch{return 18}};
 const initialContext=normalizeContext(initial,age());
 const update=()=>{
  const years=age(),c=readContextForm(form,years);
  const focus=CONTEXT_FOCUS.filter(o=>years>=18||['general','school','university'].includes(o.id));
  form.elements.context_focus.innerHTML=options(focus,c.focus);
  const opts=contextOptions(years,c.focus);
  form.elements.context_goal.innerHTML=options(opts.goals,c.goal);
  form.elements.context_obstacle.innerHTML=options(opts.obstacles,c.obstacle);
 };
 const focus=CONTEXT_FOCUS.filter(o=>age()>=18||['general','school','university'].includes(o.id));
 form.elements.context_focus.innerHTML=options(focus,initialContext.focus);
 const opts=contextOptions(age(),initialContext.focus);
 form.elements.context_goal.innerHTML=options(opts.goals,initialContext.goal);
 form.elements.context_obstacle.innerHTML=options(opts.obstacles,initialContext.obstacle);
 for(const n of ['scene','success','minutes'])form.elements['context_'+n].value=initialContext[n];
 form.elements.context_focus.addEventListener('change',update);
 form.elements.dob.addEventListener('change',update);
 form.addEventListener('reset',()=>queueMicrotask(update));
}
