import { readFileSync, writeFileSync } from 'node:fs';

// Bank runs in an isolated srcdoc. Embed local fonts so it needs no network access.
const root = new URL('../', import.meta.url);
const shared = readFileSync(new URL('assets/styles/coco-unified-v160127.css', root), 'utf8');
const theme = shared.replace(/url\('\.\.\/fonts\/([^']+)'\)/g, (_, name) =>
  `url('data:font/ttf;base64,${readFileSync(new URL('assets/fonts/' + name, root)).toString('base64')}')`);
writeFileSync(new URL('assets/styles/coco-bank-premium-v160127.css', root), theme + `
/* Isolated Coco Bank surface. */
html body .app>.top{background:linear-gradient(135deg,#091c3d,#174264)!important;color:#fff!important;border-color:#b7944b!important}
html body .app>.top :is(h1,p,b,span){color:#fff!important}
html body .btn:not(.light){background:linear-gradient(#ffe195,#ffca4b)!important;color:#102543!important;border-color:#dcb155!important;font-weight:900!important}
html body .card{border-color:#cbddea!important;border-radius:22px!important}
`);
