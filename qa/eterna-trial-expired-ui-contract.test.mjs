import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const client = readFileSync(new URL("../eterna-v159.js", import.meta.url), "utf8");
const experience = readFileSync(new URL("../eterna-experience-v160.js", import.meta.url), "utf8");
const productUx = readFileSync(new URL("../coco-release-v160903.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../eterna-v159.css", import.meta.url), "utf8");
const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");

assert.match(client, /160\.94\.1-mobile-fixed-viewport/);
assert.match(client, /function trialExpired\(\)/);
assert.match(client, /status==="expired"/);
assert.match(client, /status==="trialing"&&\(!Number\.isFinite\(end\)\|\|end<=Date\.now\(\)\)/);

const headline = "TUS 7 DÍAS DE PRUEBA DE ETERNA HAN TERMINADO";
assert.equal(client.split(headline).length - 1, 1, "el titular debe proceder de una única pieza reutilizable");
assert.match(client, /function expiredConversionMarkup\(showClose\)/);
assert.match(client, /chat\.innerHTML=expiredConversionMarkup\(true\)/);
assert.match(client, /plans=expiredConversionMarkup\(false\)/);
assert.match(client, /openExpiredPlans:function\(\)\{return open\(\{force:true\}\)\}/);

const runState = experience.slice(experience.indexOf("async function runState()"), experience.indexOf("function loginVisible()"));
assert.match(experience, /function expiredSubscription\(x\)/);
assert.match(experience, /async function showExpiredPlans\(\)/);
assert.match(experience, /await root\.CocoEternaV160\.openExpiredPlans\(\)/);
assert.ok(runState.indexOf("if(expiredSubscription(sub))") < runState.indexOf("pinRecord(s)"), "la suscripción vencida debe resolverse antes de consultar el PIN");
assert.doesNotMatch(experience, /function showPlansOnly\(/);
assert.doesNotMatch(experience, /Ir a Zona Familiar/);
assert.match(productUx, /160\.93\.10-canonical-expired-checkout/);
assert.match(productUx, /await root\.CocoEternaV160\.openExpiredPlans\(\)/);
assert.match(productUx, /overlay\.querySelector\("\.eternaV160ExpiredGate"\)/);
assert.doesNotMatch(productUx, /function expiredGateHtml\(/);
assert.doesNotMatch(productUx, /data-coco-expired-(?:month|year)/);
assert.doesNotMatch(productUx, /chat\.innerHTML=expiredGateHtml\(\)/);
assert.doesNotMatch(productUx, /root\.location\.href=data\.url/);
assert.match(experience, /#eternaOverlayV159 \[data-et-month\],#eternaOverlayV159 \[data-et-year\]/);
assert.match(experience, /if\(kind==="monthly"\|\|kind==="annual"\)\{purchaseModal\(kind,el\);return\}/);
assert.match(experience, /action:"purchase_ack",plan:plan/);
assert.match(experience, /modal\.remove\(\);replay\(sourceButton\)/);

assert.match(client, /No se ha realizado ningún cobro automático/);
assert.match(client, /Coco en Forma sigue siendo gratis y sin publicidad/);
assert.match(client, /7,99 € <small>\/mes<\/small>/);
assert.match(client, /79,99 € <small>\/año<\/small>/);
assert.match(client, /checkout\("monthly",b\)/);
assert.match(client, /checkout\("annual",b\)/);
assert.match(client, /r\.status===402\|\|data&&data\.error==="ETERNA_SUBSCRIPTION_REQUIRED"/);
assert.match(experience, /var expired=directChildren\(card,"eternaV160ExpiredGate"\)\[0\]\|\|null/);
assert.match(experience, /expiredWrap\.className="eternaV16061SubscriptionTop is-expired"/);
assert.match(experience, /expiredWrap\.appendChild\(expired\)/);
assert.match(experience, /eternaV16061SubscriptionTop\.is-expired/);

assert.match(client, /paidFamilyPlan\?'<option value="unlimited"/);
assert.match(client, />Ilimitadas<\/option>/);
assert.match(client, /selectedLimit==="unlimited"\?100/);

assert.match(css, /\.eternaV160ExpiredGate\{/);
assert.match(css, /\.eternaV160ExpiredHero\{/);
assert.match(css, /\.eternaV160ExpiredPlans \.eternaV160PaidPlan button\{width:100%;min-height:52px/);
assert.match(css, /@media\(max-width:760px\).*\.eternaV160ExpiredPlans\{grid-template-columns:1fr\}/s);

assert.match(index, /eterna-v159\.css\?v=160920/);
assert.match(index, /eterna-state-contract-v3\.js\?v=160920/);
assert.match(index, /eterna-v159\.js\?v=160941/);
assert.match(index, /coco-v153-fixes\.js\?v=15301/);
assert.match(sw, /coco-en-forma-v160\.94\.2-audit-1-3/);

console.log("Eterna trial-expired conversion contract: OK");
