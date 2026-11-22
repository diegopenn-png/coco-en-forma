// Regenerate the public preview JPEGs with @napi-rs/canvas and system fonts.
const {createCanvas,loadImage} = require('@napi-rs/canvas');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const locales = require('../seo/locales/free-games.json');

function titleLines(ctx,text,width) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line+' '+word : word;
    if (line && ctx.measureText(next).width>width) { lines.push(line); line=word; }
    else line=next;
  }
  return [...lines,line];
}
(async()=>{
  const destination = path.join(root,'share','juegos-gratis');
  await fs.mkdir(destination,{recursive:true});
  const art = await loadImage(path.join(root,'share/premium-v160127/hero-explorer-clean.webp'));
  for (const [tag,copy] of Object.entries(locales)) {
    const canvas = createCanvas(1200,630), ctx = canvas.getContext('2d');
    ctx.drawImage(art,0,0,1200,630);
    const rtl = tag==='ar', x = rtl ? 568 : 54, width=514;
    const family = rtl ? '"DejaVu Sans",sans-serif' : tag==='zh-Hans' ? '"Noto Sans CJK SC",sans-serif' : '"DejaVu Sans",sans-serif';
    const font = size=>'bold '+size+'px '+family;
    ctx.direction = rtl?'rtl':'ltr'; ctx.textAlign = rtl?'right':'left';
    ctx.textBaseline = 'middle';
    let size=68, lines;
    while (size>=32) {
      ctx.font=font(size);
      lines=titleLines(ctx,copy.eyebrow,width);
      if (lines.length<=3 && lines.every(line=>ctx.measureText(line).width<=width)) break;
      size-=2;
    }
    if (size<32) throw Error('Preview headline does not fit: '+tag);
    const lineHeight=size*1.24, first=305-(lines.length-1)*lineHeight/2;
    ctx.fillStyle='#ffffff'; lines.forEach((line,i)=>ctx.fillText(line,x,first+i*lineHeight));
    ctx.font=font(24); ctx.fillStyle='#ffe2a5'; ctx.fillText('COCO EN FORMA',x,first-lineHeight*.94);
    ctx.fillStyle='#ffc759';ctx.fillRect(rtl?x-65:x,first+(lines.length-1)*lineHeight+lineHeight*.73,65,4);
    ctx.font=font(31);
    if (ctx.measureText(copy.labels.explore).width>width) ctx.font=font(Math.floor(30*width/ctx.measureText(copy.labels.explore).width));
    ctx.fillStyle='#ffffff';ctx.fillText(copy.labels.explore,x,first+(lines.length-1)*lineHeight+lineHeight*1.27);
    await fs.writeFile(path.join(destination,tag+'.jpg'),canvas.toBuffer('image/jpeg',86));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
