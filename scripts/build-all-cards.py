"""Rebuild the 18 active catalogue thumbnails with their shared typography."""
from pathlib import Path
import subprocess
import sys
from card_typography import ROOT, render_svg

for script in ('build-colorful-cards.py', 'build-chess-card.py', 'build-city-card.py'):
    subprocess.run([sys.executable, str(Path(__file__).with_name(script))], check=True)
for relative in ('share/bank-v2', 'explora/cover'):
    render_svg((ROOT / f'{relative}.svg').read_text(), ROOT / f'{relative}.jpg')
print('Built all 18 catalogue thumbnails using the repository Montserrat font files.')
