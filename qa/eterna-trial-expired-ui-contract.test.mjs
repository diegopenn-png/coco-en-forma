import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const client = readFileSync(new URL("../eterna-v159.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../eterna-v159.css", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");

assert.match(client, /160\.93\.4-excellence-pass/);
assert.match(client, /function trialExpired\(\)/);
assert.match(client, /status==="expired"/);
assert.match(client, /status==="trialing"&&\(!Number\.isFinite\(end\)\|\|end<=Date\.now\(\)\)/);

const headline = "TUS 7 DÍAS DE PRUEBA DE ETERNA HAN TERMINADO";
assert.equal(client.split(headline).length - 1, 1, "el titular debe proceder de una única pieza reutilizable");
assert.match(client, /function expiredConversionMarkup\(showClose\)/);
assert.match(client, /chat\.innerHTML=expiredConversionMarkup\(true\)/);
assert.match(client, /plans=expiredConversionMarkup\(false\)/);

assert.match(client, /No se ha realizado ningún cobro automático/);
assert.match(client, /Coco en Forma sigue siendo gratis y sin publicidad/);
assert.match(client, /7,99 € <small>\/mes<\/small>/);
assert.match(client, /79,99 € <small>\/año<\/small>/);
assert.match(client, /checkout\("monthly",b\)/);
assert.match(client, /checkout\("annual",b\)/);
assert.match(client, /r\.status===402\|\|data&&data\.error==="ETERNA_SUBSCRIPTION_REQUIRED"/);

assert.match(css, /\.eternaV160ExpiredGate\{/);
assert.match(css, /\.eternaV160ExpiredHero\{/);
assert.match(css, /\.eternaV160ExpiredPlans \.eternaV160PaidPlan button\{width:100%;min-height:52px/);
assert.match(css, /@media\(max-width:760px\).*\.eternaV160ExpiredPlans\{grid-template-columns:1fr\}/s);

assert.match(index, /eterna-v159\.css\?v=160920/);
assert.match(index, /eterna-state-contract-v3\.js\?v=160920/);
assert.match(index, /eterna-v159\.js\?v=160934/);
assert.match(sw, /coco-en-forma-v160\.93\.4-excellence-pass/);

console.log("Eterna trial-expired conversion contract: OK");
