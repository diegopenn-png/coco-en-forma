import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(qaDir, "..");
const shareDir = path.join(root, "share");
const juegoDir = path.join(root, "juego");
const background = path.join(shareDir, "social-backdrop-v149.png");
const coco = path.join(root, "coco-v2-runner-v144.png");
const font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

const games = [
  { id: "numeros", slug: "numeros", title: "Une los números", description: "Conecta la secuencia y entrena atención, planificación y coordinación.", icon: "1·2·3", accent: "#35b6e8" },
  { id: "calculo", slug: "calculo", title: "Cálculo veloz", description: "Agilidad mental y operaciones breves adaptadas a tu nivel.", icon: "7+5", accent: "#ef7a18" },
  { id: "palabras", slug: "palabras", title: "Descifra la palabra", description: "Ordena letras, usa las pistas y entrena tu lenguaje.", icon: "ABC", accent: "#8c6de9" },
  { id: "series", slug: "series", title: "Series lógicas", description: "Descubre patrones y ejercita el razonamiento paso a paso.", icon: "2·4·?", accent: "#2fbe85" },
  { id: "memoria", slug: "memoria", title: "Memoria", description: "Encuentra parejas y fortalece la memoria visual.", icon: "◐ ◑", accent: "#e95f7d" },
  { id: "sudoku", slug: "sudoku", title: "Sudoku", description: "Completa el tablero sin repetir y entrena la lógica.", icon: "9×9", accent: "#e2a31a" },
  { id: "sopa", slug: "sopa", title: "Sopa de letras", description: "Busca palabras y mejora atención visual y vocabulario.", icon: "A·Z", accent: "#36a79d" },
  { id: "crucigrama", slug: "crucigrama", title: "Crucigrama", description: "Resuelve pistas y conecta conocimientos con palabras.", icon: "✚", accent: "#4f8bd8" },
  { id: "tiempo", slug: "tiempo", title: "Reto Tiempo", description: "Organiza secuencias temporales con rapidez y precisión.", icon: "12:30", accent: "#ec6d45" },
  { id: "verdadero", slug: "verdadero", title: "Verdadero o falso", description: "Piensa, decide y aprende con desafíos variados.", icon: "V / F", accent: "#5d79df" },
  { id: "diferencias", slug: "diferencias", title: "Encuentra las diferencias", description: "Compara dos escenas de Coco y encuentra cada cambio real.", icon: "≠", accent: "#ef7a18" },
  { id: "cococorre", slug: "coco-corre", title: "Coco Corre", description: "Atención, memoria y control mental en una misión breve.", icon: "→→", accent: "#2fa9dc" },
  { id: "cocomed", slug: "cocomed", title: "Coco Med", description: "Conocimiento, razonamiento y aprendizaje para toda la familia.", icon: "MED", accent: "#e8515c" },
  { id: "futbol", slug: "futbol", title: "Coco Fútbol", description: "Decisión, cálculo y precisión en desafíos de fútbol.", icon: "GOL", accent: "#42b66f" },
  { id: "padel", slug: "padel", title: "Coco Pádel", description: "Organiza mixings, campeonatos y rankings de jugadores.", icon: "PÁDEL", accent: "#e0b129" }
];

function esc(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function wrap(value, limit) {
  const lines = [], words = String(value).split(/\s+/); let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > limit) { lines.push(line); line = word; }
    else line += `${line ? " " : ""}${word}`;
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

function renderCard(game, output) {
  const title = wrap(game.title, game.title.length > 20 ? 18 : 26);
  const titleSize = game.title.length > 22 ? "52" : game.title.length > 16 ? "61" : "70";
  const description = wrap(game.description, 46);
  const iconSize = game.icon.length > 3 ? "30" : "46";
  const args = [
    background, "-resize", "1200x630^", "-gravity", "center", "-extent", "1200x630",
    "-fill", "rgba(3,18,31,0.30)", "-draw", "rectangle 0,0 1200,630",
    "-fill", "rgba(3,19,34,0.76)", "-draw", "rectangle 0,0 800,630",
    "(", coco, "-resize", "430x620", ")", "-gravity", "southeast", "-geometry", "+10-92", "-composite",
    "-gravity", "northwest", "-font", font,
    "-fill", "rgba(6,35,55,0.74)", "-stroke", "rgba(255,255,255,0.42)", "-strokewidth", "1", "-draw", "roundrectangle 58,42 340,92 24,24",
    "-stroke", "none", "-fill", game.accent, "-draw", "circle 82,67 90,67",
    "-fill", "white", "-pointsize", "19", "-annotate", "+104+75", "COCO EN FORMA",
    "-fill", game.accent, "-stroke", "white", "-strokewidth", "3", "-draw", "roundrectangle 58,135 190,267 28,28",
    "-stroke", "none", "-fill", "white", "-pointsize", iconSize, "-annotate", "+78+218", game.icon,
    "-fill", "white", "-pointsize", titleSize, "-annotate", "+220+175", title,
    "-fill", "#e9f8ff", "-pointsize", "25", "-annotate", "+60+362", description,
    "-fill", "rgba(255,255,255,0.16)", "-draw", "roundrectangle 58,520 676,568 13,13",
    "-fill", "white", "-pointsize", "15", "-annotate", "+75+551", "GRATUITO · SIN PUBLICIDAD · ENTRENAMIENTO SALUDABLE",
    "-fill", "rgba(255,255,255,0.80)", "-pointsize", "14", "-annotate", "+1080+48", "COCO V2",
    output
  ];
  execFileSync("convert", args, { stdio: "pipe" });
}

function sharePage(game) {
  const url = `https://cocoenforma.com/juego/${game.slug}/`;
  const image = `https://cocoenforma.com/share/${game.id}-v149.png`;
  const title = `${game.title} · Coco en Forma`;
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="theme-color" content="#0c1e33">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(game.description)}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="es_ES">
    <meta property="og:url" content="${url}">
    <meta property="og:site_name" content="Coco en Forma">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(game.description)}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:secure_url" content="${image}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Miniatura de ${esc(game.title)} con Coco V2">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(game.description)}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:image:alt" content="Miniatura de ${esc(game.title)} con Coco V2">
    <link rel="canonical" href="${url}">
    <link rel="icon" type="image/png" sizes="48x48" href="../../favicon.png?v=1490">
    <script>location.replace("../../?juego=${game.id}");</script>
  </head>
  <body><p><a href="../../?juego=${game.id}">Abrir ${esc(game.title)}</a></p></body>
</html>
`;
}

fs.mkdirSync(shareDir, { recursive: true });
fs.mkdirSync(juegoDir, { recursive: true });
renderCard({ title: "Coco en Forma", description: "Entrenamiento cerebral breve, gratuito y saludable para toda la familia.", icon: "COCO", accent: "#2fa9dc" }, path.join(shareDir, "coco-en-forma-v149.png"));

for (const game of games) {
  renderCard(game, path.join(shareDir, `${game.id}-v149.png`));
  const target = path.join(juegoDir, game.slug);
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, "index.html"), sharePage(game));
}

console.log(`Generadas ${games.length} miniaturas de juego, una miniatura general y ${games.length} páginas sociales.`);
