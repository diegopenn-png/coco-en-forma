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
  await page.waitForFunction(() => document.documentElement.dataset.cocoFirstPaint === "ready", null, { timeout: 20_000 });
  const firstPaint = await page.evaluate(() => ({
    reason: document.documentElement.dataset.cocoFirstPaint,
    loading: document.documentElement.classList.contains("coco-starting"),
    inert: document.getElementById("cocoApp")?.inert,
    placeholder: Boolean(document.getElementById("coco-startup-status")),
  }));
  assert.deepEqual(firstPaint, { reason: "ready", loading: false, inert: false, placeholder: false }, `${profileName}: startup did not settle`);
  return { page, pageErrors };
}

const LAUNCHER_COPY = Object.freeze({
  trial: "⭐ 7 días gratis",
  noCard: "Sin tarjeta ni datos bancarios para empezar.",
  cta: "Probar Eterna gratis 7 días",
  heroTitle: "Juegos para la mente y apoyo escolar",
  heroSubtitle: "Con Coco y Eterna.",
  posterTitle: "Coco",
  posterSubtitle: "Tu primer gran paso",
});

function expectedLanguageCopy(locale) {
  const strings = locale === "es" ? {} : JSON.parse(fs.readFileSync(new URL(`../i18n/packs/${locale}.json`, import.meta.url), "utf8")).strings;
  const copy = Object.fromEntries(Object.entries(LAUNCHER_COPY).map(([key, source]) => [key, strings[source] || source]));
  copy.trial = `⭐ ${strings["7 días gratis"] || "7 días gratis"}`;
  return copy;
}

async function selectLauncherLanguage(page, locale) {
  const copy = expectedLanguageCopy(locale);
  await page.locator(".coco-language-bar select:visible").selectOption(locale);
  // The experience module loads lazily. Wait for its final copy, so an earlier
  // translated render cannot conceal a later Spanish overwrite.
  await page.waitForFunction(({ locale, copy }) => {
    const launcher = document.querySelector("#eternaLauncherV159");
    return document.documentElement.lang === locale
      && launcher?.querySelector(".eternaLauncherTrialFinal3 strong")?.textContent.trim() === copy.trial
      && launcher?.querySelector(".eternaLauncherTrialFinal3 span")?.textContent.trim() === copy.noCard
      && launcher?.querySelector(".eternaLauncherCtaFinal3")?.textContent.trim() === copy.cta;
  }, { locale, copy }, { timeout: 20_000 });
  if (locale !== "es") {
    await page.waitForFunction(() => {
      const images = [...document.querySelectorAll(".cocoLocalizedHeroArt,.cocoLocalizedPosterArt")].filter(image => image.getBoundingClientRect().width && image.getBoundingClientRect().height);
      return images.length >= 2 && images.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 15_000 });
  }
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return copy;
}

async function inspectLauncherLanguage(page) {
  return page.evaluate(() => {
    const visible = node => Boolean(node && node.getBoundingClientRect().width && node.getBoundingClientRect().height && getComputedStyle(node).visibility !== "hidden");
    const text = selector => [...document.querySelectorAll(selector)].find(visible)?.textContent.trim() || "";
    const hero = document.querySelector(".eternaLauncherVisualFinal3");
    return {
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      copy: {
        trial: text(".eternaLauncherTrialFinal3 strong"),
        noCard: text(".eternaLauncherTrialFinal3 span"),
        cta: text(".eternaLauncherCtaFinal3"),
        heroTitle: text('[data-coco-banner-caption="eterna"] b'),
        heroSubtitle: text('[data-coco-banner-caption="eterna"] span'),
        posterTitle: text('[data-coco-banner-caption="coco"] b'),
        posterSubtitle: text('[data-coco-banner-caption="coco"] span'),
      },
      heroBackground: hero ? getComputedStyle(hero).backgroundImage : "",
      originalPosterVisible: [...document.querySelectorAll(".loginDecorStage > .loginPoster")].some(visible),
      localizedImages: [...document.querySelectorAll(".cocoLocalizedHeroArt,.cocoLocalizedPosterArt")].filter(visible).map(image => ({
        src: new URL(image.currentSrc || image.src).pathname,
        loaded: image.complete && image.naturalWidth > 0,
        visible: visible(image),
      })),
    };
  });
}

async function verifyMobileLanguages(browser, results) {
  const profile = DEVICE_MATRIX.find(item => item.name === "phone-modern");
  const context = await browser.newContext({
    viewport: { width: profile.width, height: profile.height },
    screen: { width: profile.width, height: profile.height },
    userAgent: profile.ua, deviceScaleFactor: profile.dpr,
    isMobile: true, hasTouch: true, locale: "es-ES", serviceWorkers: "block",
  });
  let page;
  try {
    const prepared = await preparePage(context, "mobile-languages");
    page = prepared.page;
    for (const locale of ["zh-Hans", "ar", "de", "en", "es"]) {
      const copy = await selectLauncherLanguage(page, locale);
      const snapshot = await inspect(page);
      const language = await inspectLauncherLanguage(page);
      assertSnapshot(profile, snapshot);
      assert.equal(language.lang, locale);
      assert.equal(language.dir, locale === "ar" ? "rtl" : "ltr");
      if (locale === "es") {
        assert.deepEqual(language.localizedImages, [], "Spanish artwork must return after switching back");
        assert.ok(language.originalPosterVisible, "Spanish poster must remain visible");
        assert.notEqual(language.heroBackground, "none", "Spanish hero artwork must return");
        for (const key of ["trial", "noCard", "cta"]) assert.equal(language.copy[key], copy[key]);
      } else {
        assert.deepEqual(language.copy, copy, `${locale}: incomplete translated launcher or captions`);
        assert.equal(language.heroBackground, "none", `${locale}: embedded Spanish hero text is still visible`);
        assert.equal(language.originalPosterVisible, false, `${locale}: embedded Spanish poster text is still visible`);
        assert.equal(language.localizedImages.length, 2, `${locale}: missing localized artwork`);
        assert.ok(language.localizedImages.every(image => image.loaded && image.visible), `${locale}: artwork failed to load or is hidden`);
      }
      assert.deepEqual(prepared.pageErrors, [], `${locale}: JavaScript errors`);
      await page.screenshot({ path: path.join(evidenceDir, `mobile-language-${safeName(locale)}.png`), fullPage: true });
      results.push({ profile: `mobile-language-${locale}`, status: "PASS", snapshot, language });
      console.log(`PASS  mobile language ${locale} · 390x844`);
    }
    await selectLauncherLanguage(page, "zh-Hans");
    await page.locator(".eternaLauncherCtaFinal3:visible").click();
    for (const id of ["rNom", "rMail", "rPas", "rPas2"]) await page.locator(`#cocoApp #${id}`).waitFor({ state: "visible", timeout: 10_000 });
    const consent = page.locator("#rConsentText");
    for (const [age, introduction] of [["35", "我确认自己已成年"], ["12", "我确认自己是该未成年人的父母或监护人"]]) {
      await page.locator("#rEdad").fill(age);
      await page.waitForFunction(text => document.querySelector("#rConsentText")?.textContent.includes(text), introduction);
      assert.match(await consent.innerText(), /我已阅读/);
      assert.equal(await consent.locator("a").count(), 2);
      assert.equal(await consent.locator("a").first().innerText(), "隐私政策");
    }
    assert.match(await page.locator("#rIntro").innerText(), /未成年人须在父母或监护人陪同下注册/);
    assert.match(await page.locator("#rNom").getAttribute("placeholder"), /不能包含空格/);
    assert.match(await page.locator(".cocoLegalResumenRegistro").innerText(), /行使您的权利/);
    assertSnapshot(profile, await inspect(page));
    assert.deepEqual(prepared.pageErrors, [], "Chinese registration: JavaScript errors");
    await page.screenshot({ path: path.join(evidenceDir, "mobile-language-zh-hans-registration.png"), fullPage: true });
    results.push({ profile: "mobile-language-zh-Hans-registration", status: "PASS", submitted: false });
    console.log("PASS  Chinese Eterna CTA opens registration without submitting data");
  } catch (error) {
    if (page) await page.screenshot({ path: path.join(evidenceDir, "mobile-language-failure.png"), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await context.close();
  }
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
  await verifyMobileLanguages(browser, results);
} catch (error) {
  console.error(`FAIL  ${error.stack || error.message}`);
  process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(evidenceDir, "device-matrix.json"), `${JSON.stringify({ base, expectedCommit, results }, null, 2)}\n`);
  await browser.close();
}

if (!process.exitCode) console.log(`\n${DEVICE_MATRIX.length}/10 perfiles, rotación, 5 idiomas y acceso al registro superados.`);
