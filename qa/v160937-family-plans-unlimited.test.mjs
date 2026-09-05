import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

function sourceBetween(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert.notEqual(from, -1);
  assert.notEqual(to, -1);
  return source.slice(from, to);
}

test("an expired trial moves the real checkout block to the first family section", () => {
  const experience = read("eterna-experience-v160.js");
  assert.match(experience, /var expired=directChildren\(card,"eternaV160ExpiredGate"\)\[0\]\|\|null/);
  assert.match(experience, /if\(existing\)existing\.remove\(\)/);
  assert.match(experience, /expiredWrap\.className="eternaV16061SubscriptionTop is-expired"/);
  assert.match(experience, /card\.insertBefore\(expiredWrap,card\.firstChild\)/);
  assert.match(experience, /expiredWrap\.appendChild\(expired\)/);
  assert.doesNotMatch(experience, /expiredWrap\.innerHTML=.*Acceso y planes/);
});

test("the expired checkout block is moved intact ahead of the report", () => {
  const experience = read("eterna-experience-v160.js");
  class FakeNode {
    constructor(className = "") {
      this.className = className;
      this.children = [];
      this.dataset = {};
      this.parentNode = null;
      this.classList = { contains: (name) => this.className.split(/\s+/).includes(name) };
    }
    get firstChild() { return this.children[0] || null; }
    setAttribute() {}
    querySelector() { return null; }
    insertBefore(node, before) {
      if (node.parentNode) node.parentNode.children.splice(node.parentNode.children.indexOf(node), 1);
      const index = before ? this.children.indexOf(before) : -1;
      this.children.splice(index < 0 ? this.children.length : index, 0, node);
      node.parentNode = this;
    }
    appendChild(node) {
      if (node.parentNode) node.parentNode.children.splice(node.parentNode.children.indexOf(node), 1);
      this.children.push(node);
      node.parentNode = this;
    }
    remove() {
      if (!this.parentNode) return;
      this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1);
      this.parentNode = null;
    }
  }

  const context = vm.createContext({
    Array,
    document: { createElement: () => new FakeNode() },
    bindCreatedPlanButtons() {},
    syncSubscriptionUi() {},
    clean: (value) => String(value || ""),
    createTesterPlans: () => new FakeNode()
  });
  const directChildren = sourceBetween(experience, "function directChildren", "async function checkout");
  const moveSubscriptionFirst = sourceBetween(experience, "function moveSubscriptionFirst", "function enhanceFamily");
  vm.runInContext(`${directChildren}\n${moveSubscriptionFirst}`, context);

  const card = new FakeNode("eternaV159FamilyCard");
  const emptyTitle = new FakeNode("eternaV16061SubscriptionTop");
  const report = new FakeNode("eternaV160ReportKit");
  const expiredCheckout = new FakeNode("eternaV160ExpiredGate");
  card.appendChild(emptyTitle);
  card.appendChild(report);
  card.appendChild(expiredCheckout);

  assert.equal(context.moveSubscriptionFirst(card), true);
  assert.equal(card.children.length, 2);
  assert.equal(card.children[0].className, "eternaV16061SubscriptionTop is-expired");
  assert.equal(card.children[0].children[0], expiredCheckout);
  assert.equal(card.children[1], report);
  assert.equal(emptyTitle.parentNode, null);
});

test("the paid family selector exposes and persists the unlimited choice", () => {
  const client = read("eterna-v159.js");
  assert.match(client, /\["monthly","annual"\]\.indexOf/);
  assert.match(client, /<option value="unlimited"/);
  assert.match(client, />Ilimitadas<\/option>/);
  assert.match(client, /selectedLimit==="unlimited"\?100/);
  assert.match(client, /max_sessions_per_day:selectedLimit==="unlimited"\?"unlimited":expectedLimit/);
});

test("the Worker authorizes unlimited only for active monthly or annual plans", () => {
  const worker = read("eterna-worker/src/index.js");
  assert.match(worker, /const PARENT_UNLIMITED_SENTINEL=100/);
  assert.match(worker, /normalized\.status==="active"&&\["monthly","annual"\]\.includes\(plan\)/);
  assert.match(worker, /ETERNA_PAID_SUBSCRIPTION_REQUIRED_FOR_UNLIMITED/);
  assert.match(worker, /parentUnlimitedEnabled\(settings,subscription\)/);
  assert.match(worker, /daily_limit:parentUnlimited\?null:dailyLimit/);
  assert.match(worker, /weekly_limit:parentUnlimited\?null:weeklyLimit/);
});

test("the release invalidates both frontend assets and has verified rollback", () => {
  const index = read("index.html");
  const bootstrap = read("coco-v153-fixes.js");
  const sw = read("sw.js");
  const workflow = read(".github/workflows/eterna-worker-production-160937.yml");
  assert.match(index, /eterna-v159\.js\?v=160941/);
  assert.match(bootstrap, /eterna-experience-v160\.js\?v=160940/);
  assert.match(sw, /coco-en-forma-v160\.94\.1-eterna-mobile-fixed-viewport-r1/);
  assert.match(workflow, /EXPECTED_VERSION: 160\.93\.7-family-plans-unlimited/);
  assert.match(workflow, /wrangler versions upload/);
  assert.match(workflow, /\^\(Worker \)\?Version ID:/);
  assert.match(workflow, /wrangler versions deploy/);
  assert.match(workflow, /wrangler rollback/);
});
