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

function launchOptions() {
  return channel ? { channel, headless: true } : { headless: true };
}

function safeName(value) {
  return String(value).replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

async function inspect(page) {
  return page.evaluate(() => {
    const app = document.getElementById("cocoApp");
    const card = document.getElementById("cocoReto2026");
    const image = card && card.querySelector("img");
    const brand = app && app.querySelector(".marcaHeroe,.cocoHomeBrainFinal3");
    const games = app && app.querySelector(".cocoHomeGamesRowFinal3 .retosCard,.retosCard");
    const directIds = [
      "coco-product-ux-v160903",
      "coco-reto-2026-direct",
      "eterna-hotfix-v160902-direct",
      "eterna-desktop-compact-v160907-direct",
    ];
    const rect = (node) => {
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
    };
    const cardRect = rect(card);
    const imageRect = rect(image);
    const imageStyle = image ? getComputedStyle(image) : null;
    const brandRect = rect(brand);
    const gamesRect = rect(games);
    const overlap = cardRect && gamesRect
      ? Math.max(0, Math.min(cardRect.right, gamesRect.right) - Math.max(cardRect.left, gamesRect.left))
        * Math.max(0, Math.min(cardRect.bottom, gamesRect.bottom) - Math.max(cardRect.top, gamesRect.top))
      : null;
    let imagePixelSignal = null;
    if (image && image.complete && image.naturalWidth > 0) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let minimum = 255;
        let maximum = 0;
        let sum = 0;
        let sumSquares = 0;
        let chroma = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const luma = (red + green + blue) / 3;
          minimum = Math.min(minimum, luma);
          maximum = Math.max(maximum, luma);
          sum += luma;
          sumSquares += luma * luma;
          chroma += Math.max(red, green, blue) - Math.min(red, green, blue);
        }
        const samples = pixels.length / 4;
        const mean = sum / samples;
        imagePixelSignal = {
          range: maximum - minimum,
          variance: sumSquares / samples - mean * mean,
          chroma: chroma / samples,
        };
      } catch (error) {
        imagePixelSignal = { error: error instanceof Error ? error.message : String(error) };
      }
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      previewCommit: window.__COCO_PREVIEW_COMMIT__ || "",
      flags: {
        product: Boolean(window.__COCO_PRODUCT_UX_160903__),
        reto: Boolean(window.__COCO_RETO_2026_V160961__),
        eternaHotfix: Boolean(window.__ETERNA_HOTFIX_160902_HF1__),
        eternaCompact: Boolean(window.__ETERNA_DESKTOP_COMPACT_1609326__),
      },
      directCounts: Object.fromEntries(directIds.map((id) => [id, document.querySelectorAll(`#${id}`).length])),
      cardCount: document.querySelectorAll("#cocoReto2026").length,
      cardRect,
      imageRect,
      brandRect,
      gamesRect,
      imageComplete: Boolean(image && image.complete),
      naturalWidth: image ? image.naturalWidth : 0,
      naturalHeight: image ? image.naturalHeight : 0,
      imageAlt: image ? image.alt : "",
      imageCurrentSrc: image ? image.currentSrc : "",
      imageDisplay: imageStyle ? imageStyle.display : "",
      imageVisibility: imageStyle ? imageStyle.visibility : "",
      imageOpacity: imageStyle ? Number(imageStyle.opacity) : 0,
      imagePixelSignal,
      visible: Boolean(card && getComputedStyle(card).display !== "none" && getComputedStyle(card).visibility !== "hidden"),
      desktopPlacement: Boolean(card && brand && card.parentElement === brand && brand.firstElementChild === card),
      mobilePlacement: Boolean(card && games && brand && card.nextElementSibling === games && brand.previousElementSibling === games),
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      overlap,
    };
  });
}

function assertSnapshot(profile, snapshot) {
  const label = `${profile.name} (${profile.width}x${profile.height})`;
  assert.equal(snapshot.width, profile.width, `${label}: viewport incorrecto`);
  assert.equal(snapshot.height, profile.height, `${label}: altura incorrecta`);
  if (expectedCommit) assert.equal(snapshot.previewCommit, expectedCommit, `${label}: revisión obsoleta`);
  assert.deepEqual(snapshot.flags, { product: true, reto: true, eternaHotfix: true, eternaCompact: true }, `${label}: falta una capa funcional`);
  assert.deepEqual(snapshot.directCounts, {
    "coco-product-ux-v160903": 1,
    "coco-reto-2026-direct": 1,
    "eterna-hotfix-v160902-direct": 1,
    "eterna-desktop-compact-v160907-direct": 1,
  }, `${label}: scripts directos ausentes o duplicados`);
  assert.equal(snapshot.cardCount, 1, `${label}: Reto Coco debe existir exactamente una vez`);
  assert.equal(snapshot.visible, true, `${label}: Reto Coco no es visible`);
  assert.equal(snapshot.imageComplete, true, `${label}: imagen sin terminar de cargar`);
  assert.equal(snapshot.naturalWidth, 1200, `${label}: ancho de imagen inesperado`);
  assert.equal(snapshot.naturalHeight, 1600, `${label}: alto de imagen inesperado`);
  assert.match(snapshot.imageAlt, /Reto Coco en Forma 2026/, `${label}: texto alternativo incompleto`);
  assert.match(snapshot.imageCurrentSrc, /reto-coco-2026-v160958\.jpg/, `${label}: recurso visual incorrecto`);
  assert.notEqual(snapshot.imageDisplay, "none", `${label}: imagen fuera del flujo visual`);
  assert.equal(snapshot.imageVisibility, "visible", `${label}: imagen oculta por CSS`);
  assert.ok(snapshot.imageOpacity >= 0.99, `${label}: imagen transparente`);
  assert.ok(snapshot.imagePixelSignal && !snapshot.imagePixelSignal.error, `${label}: no se pudieron verificar los píxeles de la imagen`);
  assert.ok(snapshot.imagePixelSignal.range >= 40, `${label}: la imagen renderizada carece de contraste`);
  assert.ok(snapshot.imagePixelSignal.variance >= 100, `${label}: la imagen renderizada parece vacía`);
  assert.ok(snapshot.imagePixelSignal.chroma >= 5, `${label}: la imagen renderizada carece de color`);
  assert.ok(snapshot.cardRect && snapshot.cardRect.width >= 250, `${label}: tarjeta demasiado estrecha`);
  assert.ok(snapshot.imageRect && Math.abs(snapshot.imageRect.height / snapshot.imageRect.width - 4 / 3) < 0.025, `${label}: proporción de imagen deformada`);
  assert.ok(snapshot.htmlScrollWidth <= profile.width + 1, `${label}: desbordamiento horizontal en html (${snapshot.htmlScrollWidth}px)`);
  assert.ok(snapshot.bodyScrollWidth <= profile.width + 1, `${label}: desbordamiento horizontal en body (${snapshot.bodyScrollWidth}px)`);
  assert.equal(snapshot.overlap, 0, `${label}: Reto Coco se superpone con los juegos`);
  if (profile.width > 900) {
    assert.equal(snapshot.desktopPlacement, true, `${label}: posición de escritorio incorrecta`);
    assert.ok(snapshot.brandRect && snapshot.cardRect.width <= snapshot.brandRect.width + 1, `${label}: Reto Coco sale de su columna`);
  } else {
    assert.equal(snapshot.mobilePlacement, true, `${label}: posición móvil incorrecta`);
    assert.ok(snapshot.cardRect.width <= Math.min(430, profile.width - 28) + 1, `${label}: Reto Coco excede el ancho móvil`);
  }
}

async function preparePage(context, profileName) {
  await context.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, (route) => route.abort());
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const suffix = encodeURIComponent(expectedCommit || Date.now());
  await page.setExtraHTTPHeaders({ "Cache-Control": "no-cache", Pragma: "no-cache" });
  let observedCommit = "";
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const nonce = `${suffix}-${attempt}-${Date.now()}`;
    await page.goto(`${base}/?device-qa=${encodeURIComponent(profileName)}&verify=${nonce}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    observedCommit = await page.evaluate(() => window.__COCO_PREVIEW_COMMIT__ || "");
    if (!expectedCommit || observedCommit === expectedCommit) break;
    await page.waitForTimeout(1_500);
  }
  if (expectedCommit) assert.equal(observedCommit, expectedCommit, `${profileName}: el navegador no recibió la revisión actual después de 10 intentos`);
  pageErrors.length = 0;
  await page.waitForFunction(() => {
    const image = document.querySelector("#cocoReto2026 img");
    return Boolean(
      window.__COCO_PRODUCT_UX_160903__
      && window.__COCO_RETO_2026_V160961__
      && window.__ETERNA_HOTFIX_160902_HF1__
      && window.__ETERNA_DESKTOP_COMPACT_1609326__
      && image && image.complete && image.naturalWidth > 0
    );
  }, null, { timeout: 20_000 });
  await page.waitForTimeout(180);
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
      const card = page.locator("#cocoReto2026");
      await card.scrollIntoViewIfNeeded();
      await page.evaluate(async () => {
        const image = document.querySelector("#cocoReto2026 img");
        if (image && typeof image.decode === "function") await image.decode();
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      await page.waitForTimeout(300);
      const snapshot = await inspect(page);
      assertSnapshot(profile, snapshot);
      assert.deepEqual(pageErrors, [], `${profile.name}: errores JavaScript`);
      await card.screenshot({ path: path.join(evidenceDir, `${safeName(profile.name)}.png`) });
      results.push({ profile: profile.name, status: "PASS", snapshot });
      console.log(`PASS  ${profile.name} · ${profile.width}x${profile.height}`);
    } finally {
      await context.close();
    }
  }

  const rotationContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 844, height: 844 },
    userAgent: PHONE_UA,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: "es-ES",
    serviceWorkers: "block",
  });
  try {
    const { page } = await preparePage(rotationContext, "rotation");
    assert.equal((await inspect(page)).mobilePlacement, true, "rotación: posición vertical incorrecta");
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForFunction(() => {
      const card = document.getElementById("cocoReto2026");
      const app = document.getElementById("cocoApp");
      const games = app && app.querySelector(".cocoHomeGamesRowFinal3 .retosCard,.retosCard");
      const brand = app && app.querySelector(".marcaHeroe,.cocoHomeBrainFinal3");
      return Boolean(card && games && brand && card.nextElementSibling === games && brand.previousElementSibling === games);
    });
    assertSnapshot(DEVICE_MATRIX.find((profile) => profile.name === "phone-landscape"), await inspect(page));
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForFunction(() => {
      const card = document.getElementById("cocoReto2026");
      const app = document.getElementById("cocoApp");
      const brand = app && app.querySelector(".marcaHeroe,.cocoHomeBrainFinal3");
      return Boolean(card && brand && card.parentElement === brand && brand.firstElementChild === card);
    });
    assertSnapshot(DEVICE_MATRIX.find((profile) => profile.name === "tablet-landscape"), await inspect(page));
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForFunction(() => {
      const card = document.getElementById("cocoReto2026");
      const app = document.getElementById("cocoApp");
      const games = app && app.querySelector(".cocoHomeGamesRowFinal3 .retosCard,.retosCard");
      const brand = app && app.querySelector(".marcaHeroe,.cocoHomeBrainFinal3");
      return Boolean(card && games && brand && card.nextElementSibling === games && brand.previousElementSibling === games);
    });
    assertSnapshot(DEVICE_MATRIX.find((profile) => profile.name === "tablet-portrait"), await inspect(page));
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
