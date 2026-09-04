import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function storage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    get length() { return values.size; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(String(key)); },
    setItem(key, value) { values.set(String(key), String(value)); }
  };
}

function runtimeWithSession(sessionSeed) {
  const listeners = new Map();
  const window = {
    addEventListener(name, callback) { listeners.set(name, callback); },
    dispatchEvent() {},
    COCO_CONFIG: {}
  };
  const context = {
    window,
    document: {
      readyState: "loading",
      addEventListener() {},
      documentElement: {},
      getElementById() { return null; },
      querySelector() { return null; }
    },
    localStorage: storage(),
    sessionStorage: storage(sessionSeed),
    navigator: {},
    CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    MutationObserver: class MutationObserver { observe() {} },
    setTimeout() { return 0; },
    clearTimeout() {},
    console,
    Date,
    Intl,
    JSON,
    Math,
    Object,
    String,
    Number,
    Boolean,
    Array,
    RegExp
  };
  vm.runInNewContext(fs.readFileSync("coco-v142-runtime.js", "utf8"), context);
  return { daily: window.CocoDailyV134, localStorage: context.localStorage };
}

test("a server-confirmed tester stays unlimited while a returning page revalidates access", () => {
  const userId = "francesco-test-id";
  const { daily, localStorage } = runtimeWithSession({
    [`coco_v160_unlimited_testing_${userId}`]: "1"
  });
  daily.setUser(userId, "");
  localStorage.setItem(`coco_v135_complete_${userId}_memoria_${daily.today()}`, "1");
  assert.equal(daily.isUnlimited(userId), true);
  assert.equal(daily.localUsed("memoria", userId), false);
});

test("the cached permission is scoped to the exact authenticated account", () => {
  const { daily } = runtimeWithSession({ coco_v160_unlimited_testing_francesco: "1" });
  daily.setUser("another-account", "");
  assert.equal(daily.isUnlimited("another-account"), false);
});
