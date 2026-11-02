"""Coco Batalla Naval: generated scene with the existing native Montserrat title system."""
import base64,subprocess,os
from card_typography import ROOT,render_svg
art=ROOT/'share/premium-v160126/art/naval.webp'
encoded=base64.b64encode(art.read_bytes()).decode()
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630"><image xlink:href="data:image/webp;base64,{encoded}" width="1200" height="630"/><text x="61" y="174" font-family="Montserrat" font-weight="700" font-size="16" letter-spacing="2" fill="#d6c8ff">ESTRATEGIA · AMIGOS · OCÉANO</text><text x="58" y="270" font-family="Montserrat" font-weight="900" font-size="76" letter-spacing="-2" fill="white">Batalla</text><text x="58" y="356" font-family="Montserrat" font-weight="900" font-size="76" letter-spacing="-2" fill="#ffce3f">Naval</text><text x="61" y="433" font-family="Montserrat" font-weight="700" font-size="24" fill="#f2f6ff">Encuentra la flota rival.</text><path d="M61 510H138" stroke="#ffce3f" stroke-width="6" stroke-linecap="round"/></svg>'''
render_svg(svg,ROOT/'share/premium-v160126/naval.jpg',quality=85)
sharp=os.environ['CODEX_PRIMARY_RUNTIME_NODE_MODULES']+'/sharp'
subprocess.run(['node','-e',"require(process.argv[1])(process.argv[2]).resize(720,378).webp({quality:87}).toFile(process.argv[3])",sharp,str(ROOT/'share/premium-v160126/naval.jpg'),str(ROOT/'share/premium-v160126/naval-720.webp')],check=True)
