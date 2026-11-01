"""Use the same repository-owned font files for every catalogue thumbnail."""
from pathlib import Path
import base64
import io
import os
import re
import subprocess
import tempfile
from xml.sax.saxutils import escape
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
_config = tempfile.TemporaryDirectory(prefix='coco-card-fonts-')
config = Path(_config.name) / 'fonts.conf'
config.write_text('<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">'
                  '<fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include>'
                  f'<dir>{escape(str(ROOT / "assets/fonts"))}</dir></fontconfig>')
FONT_ENV = {**os.environ, 'FONTCONFIG_FILE': str(config)}
matched = subprocess.check_output(['fc-match', '-f', '%{family}', 'Montserrat'], env=FONT_ENV, text=True)
if 'Montserrat' not in matched.split(','):
    raise RuntimeError('The repository Montserrat fonts must be available; refusing a fallback font.')


def render_svg(svg, destination, quality=92):
    """Rasterize from the bundled fonts, independent of the machine's defaults."""
    # Some Inkscape builds cannot decode embedded WebP (Bank's original mascot).
    # Convert only its encoding for rendering; preserve the repository artwork.
    def png_data(match):
        image = Image.open(io.BytesIO(base64.b64decode(match[1])))
        output = io.BytesIO()
        image.save(output, format='PNG')
        return 'data:image/png;base64,' + base64.b64encode(output.getvalue()).decode()
    svg = re.sub(r'data:image/webp;base64,([A-Za-z0-9+/=]+)', png_data, svg)
    with tempfile.TemporaryDirectory(prefix='coco-card-render-') as folder:
        source = Path(folder) / 'card.svg'
        output = Path(folder) / 'card.png'
        source.write_text(svg)
        subprocess.run(['inkscape', str(source), '--export-type=png', f'--export-filename={output}'],
                       check=True, env=FONT_ENV, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        Image.open(output).convert('RGB').save(destination, quality=quality, optimize=True)
