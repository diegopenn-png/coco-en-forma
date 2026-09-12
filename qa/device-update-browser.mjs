import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = String(process.env.COCO_QA_URL || "http://127.0.0.1:4173").replace(/\/+$/, "");
const expectedCommit = String(process.env.COCO_QA_EXPECTED_COMMIT || "").trim();
const channel = String(process.env.COCO_QA_BROWSER_CHANNEL || "").trim();
const evidenceDir = path.resolve(process.env.COCO_QA_EVIDENCE_DIR || "qa/.device-evidence");

const PHONE_UA = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36";
const TABLET_UA = "Mozilla/5.0 (Linux; Android 15; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36";
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36";

export const DEVICE_MATRIX = Object.freeze([
  Object.freeze({ name: "phone-compact", width: 320, height: 568, mobile: true, touch: true, dpr: 2, ua: PHONE_UA }),
  Object.freeze({ name: "phone-android", width: 360, height: 800, mobile: true, touch: true, dpr: 3, ua: PHONE_UA }),
  Object.freeze({ name: "phone-modern", width: 390, height: 844, mobile: true, touch: true, dpr: 3, ua: PHONE_UA }),
  Object.freeze({ name: "phone-large", width: 430, height: 932, mobile: true, touch: true, dpr: 3, ua: PHONE_UA }),
  Object.freeze({ name: "phone-landscape", width: 844, height: 390, mobile: true, touch: true, dpr: 3, ua: PHONE_UA }),
  Object.freeze({ name: "tablet-portrait", width: 768, height: 1024, mobile: true, touch: true, dpr: 2, ua: TABLET_UA }),
  Object.freeze({ name: "tablet-landscape", width: 1024, height: 768, mobile: true, touch: true, dpr: 2, ua: TABLET_UA }),
  Object.freeze({ name: "laptop", width: 1280, height: 720, mobile: false, touch: false, dpr: 1, ua: DESKTOP_UA }),
  Object.freeze({ name: "desktop", width: 1440, height: 900, mobile: false, touch: false, dpr: 1, ua: DESKTOP_UA }),
  Object.freeze({ name: "desktop-full-hd", width: 1920, height: 1080, mobile: false, touch: false, dpr: 1, ua: DESKTOP_UA }),
]);

const directIds = [
  "coco-product-ux-v160903",
  "coco-reto-2026-direct",
  "coco-family-friendly-v160100",
  "eterna-hotfix-v160902-direct",
  "eterna-desktop-compact-v160907-direct",
];

function launchOptions() {
  return channel ? { channel, headless: true } : { headless: true };
}

function safeName(value) {
  return String(value).replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

async function inspect(page) {
  return page.evaluate((ids) => ({
    width: window.innerWidth,
    height: window.innerHeight,
    previewCommit: window.__COCO_PREVIEW_COMMIT__ || "",
    flags: {
      product: Boolean(window.__COCO_PRODUCT_UX_160903__),
      familyProfile: window.CocoFamilyFriendlyV160100?.version || "",
      reportKit: window.CocoFamilyReportKitV16084?.version || "",
      eternaHotfix: Boolean(window.__ETERNA_HOTFIX_160902_HF1__),
      eternaCompact: Boolean(window.__ETERNA_DESKTOP_COMPACT_1609326__),
    },
    directCounts: Object.fromEntries(ids.map((id) => [id, document.querySelectorAll(`#${id}`).length])),
    cardCount: document.querySelectorAll("#cocoReto2026").length,
    visibleLevelLabels: Array.from(document.querySelectorAll(".eternaV160ModeProgress"))
      .filter((node) => getComputedStyle(node).display !== "none")
      .map((node) => String(node.textContent || "").trim())
      .filter((text) => /Nivel\s*\d/i.test(text)),
    htmlScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }), directIds);
}

function assertSnapshot(profile, snapshot) {
  const label = `${profile.name} (${profile.width}x${profile.height})`;
  assert.equal(snapshot.width, profile.width, `${label}: viewport incorrecto`);
  assert.equal(snapshot.height, profile.height, `${label}: altura incorrecta`);
  if (expectedCommit) assert.equal(snapshot.previewCommit, expectedCommit, `${label}: revisión obsoleta`);
  assert.deepEqual(snapshot.flags, {
    product: true,
    familyProfile: "160.100.0-account-birth-date",
    reportKit: "160.100-family-profile-reports",
    eternaHotfix: true,
    eternaCompact: true,
  }, `${label}: falta una capa funcional`);
  assert.deepEqual(snapshot.directCounts, Object.fromEntries(directIds.map((id) => [id, 1])), `${label}: scripts directos ausentes o duplicados`);
  assert.equal(snapshot.cardCount, 0, `${label}: Reto Coco debe seguir eliminado`);
  assert.deepEqual(snapshot.visibleLevelLabels, [], `${label}: el nivel interno no debe mostrarse al menor`);
  assert.ok(snapshot.htmlScrollWidth <= profile.width + 1, `${label}: desbordamiento horizontal en html (${snapshot.htmlScrollWidth}px)`);
  assert.ok(snapshot.bodyScrollWidth <= profile.width + 1, `${label}: desbordamiento horizontal en body (${snapshot.bodyScrollWidth}px)`);
}

async function preparePage(context, profileName) {
  await context.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, (route) => route.abort());
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const suffix = encodeURIComponent(expectedCommit || Date.now());
  let observedCommit = "";
  await page.setExtraHTTPHeaders({ "Cache-Control": "no-cache", Pragma: "no-cache" });
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const nonce = `${suffix}-${attempt}-${Date.now()}`;
    await page.goto(`${base}/?device-qa=${encodeURIComponent(profileName)}&verify=${nonce}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    observedCommit = await page.evaluate(() => window.__COCO_PREVIEW_COMMIT__ || "");
    if (!expectedCommit || observedCommit === expectedCommit) break;
    await page.waitForTimeout(1_500);
  }
  if (expectedCommit) assert.equal(observedCommit, expectedCommit, `${profileName}: did not receive the exact preview revision after 10 attempts`);
  pageErrors.length = 0;
  await page.waitForFunction(() => Boolean(
    window.__COCO_PRODUCT_UX_160903__
    && window.CocoFamilyFriendlyV160100?.version === "160.100.0-account-birth-date"
    && window.CocoFamilyReportKitV16084?.version === "160.100-family-profile-reports"
    && window.__ETERNA_HOTFIX_160902_HF1__
    && window.__ETERNA_DESKTOP_COMPACT_1609326__
  ), null, { timeout: 20_000 });
  await page.waitForTimeout(250);
  return { page, pageErrors };
}

fs.mkdirSync(evidenceDir, { recursive: true });
const browser = await chromium.launch(launchOptions());
const results = [];

try {
  for (const profile of DEVICE_MATRIX) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      screen: { width: profile.width, height: profile.height },
      userAgent: profile.ua,
      deviceScaleFactor: profile.dpr,
      isMobile: profile.mobile,
      hasTouch: profile.touch,
      locale: "es-ES",
      serviceWorkers: "block",
    });
    try {
      const { page, pageErrors } = await preparePage(context, profile.name);
      const snapshot = await inspect(page);
      assertSnapshot(profile, snapshot);
      assert.deepEqual(pageErrors, [], `${profile.name}: errores JavaScript`);
      await page.screenshot({ path: path.join(evidenceDir, `${safeName(profile.name)}.png`), fullPage: true });
      results.push({ profile: profile.name, status: "PASS", snapshot });
      console.log(`PASS  ${profile.name} · ${profile.width}x${profile.height}`);
    } finally {
      await context.close();
    }
  }

  const rotationContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 1024, height: 1024 },
    userAgent: PHONE_UA,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: "es-ES",
    serviceWorkers: "block",
  });
  try {
    const { page } = await preparePage(rotationContext, "rotation");
    for (const profile of [
      DEVICE_MATRIX.find((item) => item.name === "phone-modern"),
      DEVICE_MATRIX.find((item) => item.name === "phone-landscape"),
      DEVICE_MATRIX.find((item) => item.name === "tablet-landscape"),
      DEVICE_MATRIX.find((item) => item.name === "tablet-portrait"),
    ]) {
      await page.setViewportSize({ width: profile.width, height: profile.height });
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assertSnapshot(profile, await inspect(page));
    }
    console.log("PASS  orientación y breakpoint 390x844 → 844x390 → 1024x768 → 768x1024");
  } finally {
    await rotationContext.close();
  }
} catch (error) {
  console.error(`FAIL  ${error.stack || error.message}`);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(evidenceDir, "device-matrix.json"), `${JSON.stringify({ base, expectedCommit, results }, null, 2)}\n`);
  await browser.close();
}

if (!process.exitCode) console.log(`\n${DEVICE_MATRIX.length}/10 perfiles y la rotación superados.`);
