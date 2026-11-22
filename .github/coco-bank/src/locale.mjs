// Serialized inside the authenticated sandbox. It needs no network access.
// Only the known interface text is localized. Form values belong to the player.
export function localizeBank(locale, strings) {
  document.documentElement.lang=locale;
  document.documentElement.dir=locale==='ar'?'rtl':'ltr';
  const marker='•••';
  const templates=Object.keys(strings).filter(key=>key.includes(marker)&&/[a-záéíóúñ]{3}/i.test(key))
    .map(key=>({parts:key.split(marker).map(s=>s.trim()),value:strings[key].split(marker)}))
    .sort((a,b)=>b.parts.join('').length-a.parts.join('').length);
  function message(source) {
    const key=source.trim().replace(/\s+/g,' ');
    if(!key)return source;
    if(Object.hasOwn(strings,key))return source.replace(/\S[\s\S]*\S|\S/,()=>strings[key]);
    for(const {parts,value} of templates){
      if(parts.length!==value.length||!key.startsWith(parts[0])||!key.endsWith(parts.at(-1)))continue;
      let pos=parts[0].length,output=value[0],valid=true;
      for(let i=1;i<parts.length;i++){
        const end=i===parts.length-1?key.length-parts[i].length:parts[i]?key.indexOf(parts[i],pos):-1;
        if(end<pos){valid=false;break}
        const arg=key.slice(pos,end).trim();
        output+=(strings[arg]||arg)+value[i];pos=end+parts[i].length;
      }
      if(valid)return source.replace(/\S[\s\S]*\S|\S/,()=>output);
    }
    return source;
  }
  function visit(el){
    if(el.nodeType!==1||el.closest('style,script,textarea,[data-bank-verbatim]'))return;
    if(el.tagName==='OPTION'&&!el.hasAttribute('value'))el.value=el.textContent;
    for(const node of el.childNodes){
      if(node.nodeType===1)visit(node);
      else if(node.nodeType===3){const out=message(node.data);if(out!==node.data)node.data=out}
    }
    for(const attr of ['aria-label','alt','title','placeholder']){
      const source=el.getAttribute(attr);if(source){const out=message(source);if(out!==source)el.setAttribute(attr,out)}
    }
  }
  const observer=new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes){
      if(node.nodeType===1)visit(node);
      else if(node.nodeType===3&&node.parentElement)visit(node.parentElement);
    }
  });
  const root=document.body;
  observer.observe(root,{subtree:true,childList:true});
  visit(root);
}
