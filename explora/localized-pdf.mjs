// Build the authorized on-screen report locally. Browser text shaping handles
// Arabic, Cyrillic and CJK, including names and the participant's own notes.
export function reportBlocks(root) {
  const blocks=[];
  function visit(el) {
    if(el.matches('[hidden],.no-print,button,a.btn,script,style,textarea,.printed-reflection,svg'))return;
    const tag=el.tagName.toLowerCase();
    if(tag==='table'){
      if(el.caption)blocks.push({kind:'small',text:el.caption.textContent.trim()});
      for(const row of el.rows)blocks.push({kind:'row',text:[...row.cells].map(c=>c.textContent.trim()).join('   ·   ')});
      return;
    }
    if(el.matches('.wheel')){
      const svg=el.querySelector('svg');if(svg)blocks.push({kind:'wheel',svg});
      const caption=el.querySelector('.wheel-caption');if(caption)blocks.push({kind:'small',text:caption.textContent});
      return;
    }
    if(el.matches('label.journal')){
      const note=el.querySelector('textarea')?.value;
      if(note){blocks.push({kind:'h3',text:el.firstChild?.textContent.trim()||''});blocks.push({kind:'p',text:note})}
      return;
    }
    if(el.matches('h1,h2,h3,h4,h5,p,li,summary,dt,dd,blockquote,.note,.eyebrow')){
      // Some lists contain large nested cards. Walk their block children once.
      if(tag==='li'&&el.querySelector('p,h2,h3,ul,ol')){for(const child of el.children)visit(child);return}
      const text=el.textContent.trim();if(text)blocks.push({kind:el.classList.contains('eyebrow')?'small':tag,text});return;
    }
    if(el.children.length)for(const child of el.children)visit(child);
    else if(el.textContent.trim())blocks.push({kind:'p',text:el.textContent.trim()});
  }
  visit(root);return blocks;
}
const utf8=new TextEncoder();
function imagePDF(images,w,h){
  const chunks=[],offsets=[0];let length=0;
  const write=b=>{if(typeof b==='string')b=utf8.encode(b);chunks.push(b);length+=b.length};
  function obj(n,body){offsets[n]=length;write(n+' 0 obj\n');for(const piece of body)write(piece);write('\nendobj\n')}
  write('%PDF-1.4\n');obj(1,['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2,['<< /Type /Pages /Count '+images.length+' /Kids ['+images.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>']);
  images.forEach((img,i)=>{
    const id=3+i*3,content='q 595 0 0 842 0 0 cm /PageImage Do Q';
    obj(id,['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /PageImage '+(id+1)+' 0 R >> >> /Contents '+(id+2)+' 0 R >>']);
    obj(id+1,['<< /Type /XObject /Subtype /Image /Width '+w+' /Height '+h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+img.length+' >>\nstream\n',img,'\nendstream']);
    obj(id+2,['<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream']);
  });
  const start=length;write('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');
  for(const off of offsets.slice(1))write(String(off).padStart(10,'0')+' 00000 n \n');
  write('trailer\n<< /Root 1 0 R /Size '+offsets.length+' >>\nstartxref\n'+start+'\n%%EOF');
  return new Blob(chunks,{type:'application/pdf'});
}
export async function localizedPDF(root,locale){
  if(document.fonts?.ready)await document.fonts.ready;
  const blocks=reportBlocks(root),rtl=locale==='ar',canvas=document.createElement('canvas');
  const w=1190,h=1684,margin=90,bottom=h-115;canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('PDF');
  const images=[],segment=new Intl.Segmenter(locale,{granularity:'word'}),graphemes=new Intl.Segmenter(locale,{granularity:'grapheme'});
  const x=rtl?w-margin:margin,maxWidth=w-2*margin;let y;
  function style(size,bold=false,color='#213c43'){ctx.font=(bold?'600 ':'400 ')+size+'px system-ui, sans-serif';ctx.fillStyle=color;ctx.textAlign=rtl?'right':'left';ctx.direction=rtl?'rtl':'ltr';ctx.textBaseline='top'}
  function begin(){ctx.fillStyle='#fbfaf6';ctx.fillRect(0,0,w,h);style(21,true,'#765b32');ctx.fillText(window.CocoLocale?.t('Coco Eneagrama')||'Coco Eneagrama',x,49);ctx.strokeStyle='#dbd8cc';ctx.beginPath();ctx.moveTo(margin,86);ctx.lineTo(w-margin,86);ctx.stroke();y=120}
  function finish(){ctx.save();style(19,false,'#53656c');ctx.fillText(new Intl.NumberFormat(locale).format(images.length+1),x,h-66);ctx.restore();
    const data=atob(canvas.toDataURL('image/jpeg',.91).split(',')[1]);images.push(Uint8Array.from(data,c=>c.charCodeAt(0)));}
  function room(n){if(y+n>bottom){finish();begin()}}
  begin();
  for(const block of blocks){
    if(block.kind==='wheel'){
      const svg=block.svg.cloneNode(true);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('color','#264852');svg.setAttribute('width','440');svg.setAttribute('height','440');
      const img=new Image(),url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
      try{await new Promise((ok,bad)=>{img.onload=ok;img.onerror=bad;img.src=url});room(325);ctx.drawImage(img,(w-300)/2,y,300,300);y+=315}finally{URL.revokeObjectURL(url)}
      continue;
    }
    const heading=/^h[1-5]$/.test(block.kind),small=block.kind==='small',size=block.kind==='h1'?52:block.kind==='h2'?37:heading?29:small?20:24;
    const lineHeight=Math.ceil(size*1.5);if(heading){room(3*lineHeight);y+=10}
    function lineStyle(){style(size,heading||small,small?'#80602f':'#213c43')}
    lineStyle();
    function emit(line){room(lineHeight);lineStyle();ctx.fillText(line.trim(),x,y);y+=lineHeight}
    for(const paragraph of block.text.split(/\r?\n/)){
      let line='';
      for(const {segment:word} of segment.segment(paragraph)){
        if(ctx.measureText(line+word).width>maxWidth&&line.trim()){emit(line);line=''}
        if(ctx.measureText(word).width>maxWidth){
          for(const {segment:ch} of graphemes.segment(word)){if(ctx.measureText(line+ch).width>maxWidth&&line){emit(line);line=''}line+=ch}
        }else line+=line?word:word.trimStart();
      }
      if(line.trim())emit(line);
    }
    y+=small||block.kind==='row'?4:13;
  }
  finish();canvas.width=canvas.height=1;return imagePDF(images,w,h);
}
