# Catalogue thumbnail typography

The visual reference is the original `share/eterna.png` already in this repository
(“Juegos para la mente + apoyo escolar”). Its lettering is rasterized; it has no
editable typeface metadata. Montserrat was selected by visual comparison to match
that heavy geometric lettering. This is a visual match, not an identification of
the font used to create the original raster image.

All 18 active game thumbnails use these same bundled Montserrat files: Black (900)
for headings, Bold (700) for controls and illustrated labels, and Medium (500) for
supporting text. They are licensed under the included SIL Open Font License.
Source: Google Fonts, `https://github.com/google/fonts/tree/main/ofl/montserrat`.

Run `python scripts/build-all-cards.py` with Inkscape, Fontconfig and Pillow installed.
The renderer explicitly loads these repository files and rejects a fallback font;
it does not download fonts during a build. The original Coco/Eterna reference image
is preserved byte for byte. The application's existing UI font stack is unchanged.
