import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const client = readFileSync(new URL("../../eterna-v159.js", import.meta.url), "utf8");

function replayHarness(payloads) {
  const start = client.indexOf("  async function requestChatWithReplay(requestOptions){");
  const end = client.indexOf("  function chatErrorPresentation(code){", start);
  assert.ok(start > 0 && end > start, "missing replay helper");
  const requests = [];
  const queue = payloads.slice();
  const context = vm.createContext({
    cleanText: value => String(value || "").trim(),
    safeJson: response => response.json().catch(() => ({})),
    api: async (path, options) => {
      requests.push({ path, options });
      const next = queue.shift() || {};
      return { ok: next.ok !== false, status: next.status || 200, json: async () => next.data || {} };
    },
    setTimeout: callback => callback()
  });
  vm.runInContext(`${client.slice(start, end)};this.requestChatWithReplay=requestChatWithReplay;`, context);
  return { requests, run: options => context.requestChatWithReplay(options) };
}

test("an incomplete successful response is replayed once with the identical request envelope", async () => {
  const harness = replayHarness([
    { data: {} },
    { data: { reply: "Los ríos llevan agua hacia otros ríos, lagos o el mar." } }
  ]);
  const options = { method: "POST", body: JSON.stringify({ request_id: "request:fixed", client_turn_id: "turn:fixed" }) };
  const result = await harness.run(options);

  assert.equal(result.replayed, true);
  assert.equal(result.data.reply, "Los ríos llevan agua hacia otros ríos, lagos o el mar.");
  assert.equal(harness.requests.length, 2);
  assert.equal(harness.requests[0].path, "/v1/chat");
  assert.strictEqual(harness.requests[0].options, harness.requests[1].options);
  assert.equal(harness.requests[1].options.body, options.body);
});

test("a complete response is never duplicated", async () => {
  const harness = replayHarness([{ data: { reply: "Respuesta completa" } }]);
  const result = await harness.run({ method: "POST", body: "{}" });

  assert.equal(result.replayed, false);
  assert.equal(result.data.reply, "Respuesta completa");
  assert.equal(harness.requests.length, 1);
});

test("an HTTP error is returned without a replay", async () => {
  const harness = replayHarness([{ ok: false, status: 500, data: { error: "ETERNA_BACKEND_ERROR" } }]);
  const result = await harness.run({ method: "POST", body: "{}" });

  assert.equal(result.replayed, false);
  assert.equal(result.response.status, 500);
  assert.equal(harness.requests.length, 1);
});

test("a second incomplete response returns control without polluting the conversation", async () => {
  const harness = replayHarness([{ data: {} }, { data: { reply: "   " } }]);
  const result = await harness.run({ method: "POST", body: "{}" });
  const send = client.slice(client.indexOf("  async function send(options){"), client.indexOf("  async function feedback(", client.indexOf("  async function send(options){")));

  assert.equal(result.replayed, true);
  assert.equal(harness.requests.length, 2);
  assert.match(send, /presentation\.showInConversation!==false/);
  assert.match(send, /if\(rawText\)\{input\.value=rawText/);
  assert.doesNotMatch(client, /respuesta técnica incompleta/i);
  assert.match(client, /No llegó la respuesta · pulsa enviar para volver a intentarlo/);
});
