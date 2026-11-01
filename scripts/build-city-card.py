"""Coco card composition and an exact 40-square board motif."""
from pathlib import Path
import subprocess,tempfile,json
from PIL import Image
root=Path(__file__).resolve().parents[1]
c1,c2,cta=json.loads((root/'share/card-themes-v1.json').read_text())['ciudad']
coords=[(0,c) for c in range(11)]+[(r,10) for r in range(1,11)]+[(10,c) for c in range(9,-1,-1)]+[(r,0) for r in range(9,0,-1)]
colors=['#ffda67','#a9e9ff','#e4d4ff','#bdebc9']
board=''.join(f'<rect x="{696+c*33}" y="{145+r*33}" width="30" height="30" rx="5" fill="{colors[i%4]}"/>' for i,(r,c) in enumerate(coords))
pips=''.join(f'<circle cx="{x}" cy="{y}" r="10" fill="#153d51"/>' for x,y in [(827,282),(883,282),(855,310),(827,338),(883,338)])
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><circle cx="870" cy="315" r="290" fill="white" opacity=".055"/><circle cx="870" cy="315" r="265" stroke="white" fill="none" opacity=".12"/><text x="66" y="125" font-family="DejaVu Sans,sans-serif" font-size="19" letter-spacing="2.5" fill="#bcefff">UNA CIUDAD · SEIS HISTORIAS</text><text x="64" y="245" font-family="DejaVu Sans,sans-serif" font-size="78" font-weight="bold" fill="white">Coco</text><text x="64" y="335" font-family="DejaVu Sans,sans-serif" font-size="78" font-weight="bold" fill="#ffda43">Ciudad</text><text x="68" y="408" font-family="DejaVu Sans,sans-serif" font-size="23" fill="white">Tira el dado. Construye tu vida.</text><rect x="66" y="462" width="290" height="64" rx="19" fill="#f87918"/><text x="211" y="504" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="23" font-weight="bold" fill="white">2–6 jugadores</text><rect x="680" y="129" width="390" height="390" rx="26" fill="#fff" stroke="#123b58" stroke-width="8"/>{board}<rect x="735" y="184" width="285" height="285" rx="20" fill="#ecf8ff"/><g transform="rotate(-12 855 310)"><rect x="800" y="255" width="120" height="120" rx="24" fill="#c5dce6"/><rect x="793" y="248" width="120" height="120" rx="24" fill="#fff9e8" stroke="#153d51" stroke-width="5"/>{pips}</g><text x="876" y="433" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="19" font-weight="bold" fill="#153d51">40 casillas · 120 tarjetas</text></svg>'''
with tempfile.TemporaryDirectory() as tmp:
 src=Path(tmp)/'card.svg';dst=Path(tmp)/'card.png';src.write_text(svg)
 subprocess.run(['inkscape',str(src),'--export-type=png',f'--export-filename={dst}'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 Image.open(dst).convert('RGB').save(root/'games/ciudad/cover.jpg',quality=92,optimize=True)
print('Built Coco Ciudad card')
