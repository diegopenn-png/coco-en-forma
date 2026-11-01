"""Compose the existing thumbnail system with generated scene assets and exact repo fonts.
Raster artwork is produced by imagegen; titles remain editable native SVG typography.
"""
from pathlib import Path
import json,base64,html,subprocess,os
from card_typography import render_svg
ROOT=Path(__file__).resolve().parents[1]
SPECS=json.loads((ROOT/'seo/thumbnail-sources.json').read_text())
OUT=ROOT/'share/premium-v160126';ART=OUT/'art';ART.mkdir(parents=True,exist_ok=True)
# Encoding/resizing only. The generated artwork itself is not repainted or redrawn.
runtime_modules=os.environ.get('COCO_NODE_MODULES') or os.environ.get('CODEX_PRIMARY_RUNTIME_NODE_MODULES')
sharp=str(Path(runtime_modules)/'sharp') if runtime_modules else 'sharp'
for s in SPECS:
 src=Path(s['source']);art=ART/(s['id']+'.webp')
 if src.exists():
  subprocess.run(['node','-e',"const sharp=require(process.argv[1]);sharp(process.argv[2]).resize(1200,630,{fit:'fill'}).webp({quality:94}).toFile(process.argv[3]);",str(sharp),str(src),str(art)],check=True)
 if not art.exists():raise RuntimeError(f'Missing source art for {s["id"]}')
 image='data:image/webp;base64,'+base64.b64encode(art.read_bytes()).decode()
 lines=s['title'].replace('\\n','\n').splitlines()
 longest=max(map(len,lines));size=78 if longest<=10 else 68 if longest<=12 else 60
 y=270 if len(lines)>1 else 310
 text=''.join(f'<text x="58" y="{y+i*86}" font-family="Montserrat" font-weight="900" font-size="{size}" letter-spacing="-2" fill="{"#ffce3f" if i else "#fff"}">{html.escape(line)}</text>' for i,line in enumerate(lines))
 # Wrap supporting text to preserve the same left-column safe area on every card.
 words=s['sub'].split();sub=[];line=''
 for word in words:
  if len(line+' '+word)>31 and line:sub.append(line);line=word
  else:line=(line+' '+word).strip()
 if line:sub.append(line)
 subtext=''.join(f'<text x="61" y="{433+i*34}" font-family="Montserrat" font-weight="700" font-size="24" fill="#f2f6ff">{html.escape(t)}</text>' for i,t in enumerate(sub))
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="readability"><stop stop-color="#04122d" stop-opacity=".22"/><stop offset=".45" stop-color="#04122d" stop-opacity=".12"/><stop offset=".61" stop-color="#04122d" stop-opacity="0"/></linearGradient></defs><image xlink:href="{image}" width="1200" height="630"/><rect width="1200" height="630" fill="url(#readability)"/><text x="61" y="174" font-family="Montserrat" font-weight="700" font-size="16" letter-spacing="2" fill="#bceaff">{html.escape(s["tag"])}</text>{text}{subtext}<path d="M61 510H138" stroke="#ffce3f" stroke-width="6" stroke-linecap="round"/></svg>'
 render_svg(svg,OUT/(s['id']+'.jpg'),quality=92)
 subprocess.run(['node','-e',"const sharp=require(process.argv[1]);sharp(process.argv[2]).resize(720,378).webp({quality:87}).toFile(process.argv[3]);",str(sharp),str(OUT/(s['id']+'.jpg')),str(OUT/(s['id']+'-720.webp'))],check=True)
 print(s['id'],(OUT/(s['id']+'.jpg')).stat().st_size)
