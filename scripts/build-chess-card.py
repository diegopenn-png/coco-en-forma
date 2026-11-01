"""Extend the clean Coco card family with a chess illustration."""
from pathlib import Path
import  subprocess, tempfile, json
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
c1,c2,cta=json.loads((ROOT/'share/card-themes-v1.json').read_text())['ajedrez']
# Same 1200x630 composition and palette source as build-colorful-cards.py.
board = ''.join(f'<rect x="{710+c*68}" y="{190+r*68}" width="68" height="68" fill="{ "#e7f7ff" if (r+c)%2==0 else "#39a4ce"}"/>' for r in range(4) for c in range(5))
knight = '''<g fill="#ffd64d" stroke="#123b58" stroke-width="8" stroke-linejoin="round">
<path d="M833 431L850 392L891 353L876 310L843 334L811 317L822 272L856 231L857 202L883 218L909 202L936 231Q974 274 962 341L947 392L966 431Z"/>
<path d="M841 430H970L989 465H823Z"/><path d="M856 389H948" fill="none"/>
<circle cx="861" cy="270" r="7" fill="#123b58" stroke="none"/><path d="M916 239Q947 274 932 333" fill="none" stroke="#fff3a9" stroke-width="10"/>
</g>'''
pawn = '''<g fill="#9d8cff" stroke="#123b58" stroke-width="7" stroke-linejoin="round"><circle cx="1016" cy="354" r="27"/><path d="M999 380L984 429H1048L1033 380Z"/><path d="M980 429H1052L1063 455H968Z"/></g>'''
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient><clipPath id="board"><rect x="710" y="190" width="340" height="272" rx="20"/></clipPath></defs>
<rect width="1200" height="630" fill="url(#bg)"/><circle cx="890" cy="315" r="280" fill="white" opacity=".045"/><circle cx="890" cy="315" r="255" fill="none" stroke="white" opacity=".12" stroke-width="2"/><path d="M0 590L1200 40M0 630L1200 80" stroke="white" opacity=".035" stroke-width="22"/>
<text x="66" y="125" font-family="DejaVu Sans,sans-serif" font-size="19" letter-spacing="3" fill="#bdefff">ESTRATEGIA · IMAGINACIÓN</text>
<text x="64" y="245" font-family="DejaVu Sans,sans-serif" font-size="76" font-weight="bold" fill="white">Coco</text>
<text x="64" y="333" font-family="DejaVu Sans,sans-serif" font-size="76" font-weight="bold" fill="#ffda43">Ajedrez</text>
<text x="68" y="412" font-family="DejaVu Sans,sans-serif" font-size="24" fill="white">Pensá tu próxima gran jugada.</text>
<rect x="66" y="461" width="235" height="64" rx="19" fill="#fff1c4"/><text x="184" y="503" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="24" font-weight="bold" fill="{c1}">{cta}</text>
<rect x="694" y="174" width="372" height="304" rx="30" fill="#fff" stroke="#123b58" stroke-width="8"/>
<g clip-path="url(#board)">{board}</g>{knight}{pawn}


</svg>'''
with tempfile.TemporaryDirectory(prefix='coco-chess-card-') as folder:
    source=Path(folder)/'card.svg'; render=Path(folder)/'card.png';source.write_text(svg)
    subprocess.run(['inkscape',str(source),'--export-type=png',f'--export-filename={render}'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    Image.open(render).convert('RGB').save(ROOT/'games/ajedrez/cover-coco-v2.jpg',quality=92,optimize=True)
print('Built games/ajedrez/cover-coco-v2.jpg')
