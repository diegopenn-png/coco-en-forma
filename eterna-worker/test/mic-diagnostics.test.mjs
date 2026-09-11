import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../eterna-mic-only-v4.js', import.meta.url), 'utf8');
// Only the VM test copy exposes the function. No test hooks are shipped in the client.
function harness(responses, { token = 'test-token', endpoint = 'https://voice.invalid', refreshToken = token } = {}) {
  const calls = [], events = [], label = { textContent: '' }, dot = {}, send = { disabled: true, clicks: 0, click() { this.clicks++; } };
  const field = { value: '', dispatchEvent(e) { events.push(e.type); if(e.type === "input") send.disabled = !this.value.trim(); }, focus() {} };
  let refreshes = 0;
  const overlay = { classList: { contains: () => true }, querySelector(s) { return { '[data-et-status]': label, '[data-et-dot]': dot, '[data-et-input]': field, '[data-et-send]': send }[s] || null; } };
  const window = { COCO_CONFIG: { eternaEndpoint: endpoint }, addEventListener() {}, __COCO_SUPABASE_CLIENT: { auth: {
    async getSession() { return { data: { session: token ? { access_token: token } : null } }; },
    async refreshSession() { refreshes++; token = refreshToken; }
  } } };
  const document = { getElementById(id) { return id === 'eternaOverlayV159' ? overlay : id === 'eterna-mic-only-v4-css' ? {} : null; }, addEventListener() {}, documentElement: {} };
  const context = vm.createContext({ window, document, FormData, Blob, Event, Object,
    MutationObserver: class { observe() {} }, setTimeout() {},
    async fetch(url, init) {
      calls.push({ url, init });
      const response = responses[Math.min(calls.length - 1, responses.length - 1)];
      if (response instanceof Error) throw response;
      if (!response) throw new Error('Unexpected request');
      return response;
    }
  });
  assert.ok(source.includes('})(window);'));
  vm.runInContext(source.replace('})(window);', 'root.__testTranscribe=(blob,type)=>transcribe(blob,type,newTurn());})(window);'), context);
  return { calls, events, field, send, label, get refreshes() { return refreshes; },
    run: () => window.__testTranscribe(new Blob(['synthetic test audio'], { type: 'audio/mp4' }), 'audio/mp4') };
}
function response(status, data, malformed = false) {
  return { status, ok: status >= 200 && status < 300, async json() { if (malformed) throw new SyntaxError('bad JSON'); return data; } };
}

const cases = [
  [401, 'UNAUTHORIZED', /sesión/],
  [402, 'ETERNA_SUBSCRIPTION_REQUIRED', /suscripción/],
  [403, 'ETERNA_LEGAL_ACCEPTANCE_REQUIRED', /autorización legal/],
  [403, 'PARENTAL_AUTHORIZATION_REQUIRED', /autorización de un adulto/],
  [403, 'ADULT_EMAIL_VERIFICATION_REQUIRED', /correo del adulto/],
  [403, 'STUDENT_PROFILE_REQUIRED', /perfil escolar/],
  [403, 'ETERNA_AUDIO_DISABLED', /desactivada/],
  [400, 'AUDIO_REQUIRED', /archivo de audio/],
  [413, 'AUDIO_TOO_LARGE', /tamaño/],
  [415, 'AUDIO_TYPE_NOT_ALLOWED', /formato/],
  [403, 'ORIGIN_NOT_ALLOWED', /origen/],
  [404, 'NOT_FOUND', /servicio de transcripción/],
  [500, 'ETERNA_BACKEND_ERROR', /servidor de Eterna/]
];
for (const [http, code, message] of cases) {
  test(`microphone diagnostics: ${http} ${code} is identifiable without sending text`, async () => {
    const h = harness([response(http, { error: code, text: 'must not be written' })]);
    await h.run();
    assert.match(h.label.textContent, new RegExp(`MIC-DIAG-1 HTTP ${http} ${code}`));
    assert.match(h.label.textContent, message);
    assert.equal(h.field.value, ''); assert.equal(h.send.disabled, true);
    assert.equal(h.refreshes, http === 401 ? 1 : 0);
    assert.equal(h.calls.length, http === 401 ? 2 : 1);
  });
}
test('microphone diagnostics: fallback HTTP codes retain status without exposing raw payloads', async () => {
  for (const http of [400, 401, 402, 403, 404, 413, 415, 429, 500, 502, 503]) {
    const h = harness([response(http, { error: 'secret-token private transcript' })]); await h.run();
    assert.match(h.label.textContent, new RegExp(`HTTP ${http} HTTP_ERROR`));
    assert.doesNotMatch(h.label.textContent, /secret-token|private transcript/);
  }
});
test('microphone diagnostics: malformed JSON, unexpected schema and empty text are distinct', async () => {
  for (const [data, malformed, expected] of [[null, true, 'INVALID_JSON'], [null, false, 'INVALID_RESPONSE'], [{}, false, 'INVALID_RESPONSE'], [{ text: 17 }, false, 'INVALID_RESPONSE'], [{ text: '  ' }, false, 'EMPTY_TRANSCRIPT']]) {
    const h = harness([response(200, data, malformed)]); await h.run();
    assert.match(h.label.textContent, new RegExp(`HTTP 200 ${expected}`));
    assert.equal(h.field.value, ''); assert.equal(h.send.disabled, true);
  }
});
test('microphone diagnostics: non-JSON server errors preserve HTTP status', async () => {
  const h = harness([response(502, null, true)]); await h.run();
  assert.match(h.label.textContent, /HTTP 502 HTTP_ERROR/);
});
test('microphone diagnostics: network errors never expose exception content', async () => {
  const h = harness([new Error('secret-token private transcript')]); await h.run();
  assert.match(h.label.textContent, /REQUEST_FAILED/);
  assert.doesNotMatch(h.label.textContent, /secret-token|private transcript/);
});
test('microphone diagnostics: inherited and arbitrary error keys are not displayed', async () => {
  for (const error of ['__proto__', 'constructor', 'toString', { message: 'private content' }]) {
    const h = harness([response(400, { error })]); await h.run();
    assert.match(h.label.textContent, /HTTP 400 HTTP_ERROR/);
    assert.doesNotMatch(h.label.textContent, /__proto__|constructor|toString|private content/);
  }
});
test('microphone diagnostics: missing endpoint and session make no requests', async () => {
  for (const [options, expected] of [[{ endpoint: '' }, 'ENDPOINT_MISSING'], [{ token: '' }, 'SESSION_MISSING']]) {
    const h = harness([], options); await h.run();
    assert.match(h.label.textContent, new RegExp(expected)); assert.equal(h.calls.length, 0);
  }
});
test('microphone diagnostics: success preserves MP4 upload, input events and one automatic Send', async () => {
  const h = harness([response(200, { text: '  Explica los números primos.  ' })]); await h.run();
  assert.equal(h.field.value, 'Explica los números primos.'); assert.equal(h.send.disabled, false);
  assert.deepEqual(h.events, ['input', 'change']);
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].url, 'https://voice.invalid/v1/transcribe');
  assert.equal(h.calls[0].init.method, 'POST'); assert.equal(h.calls[0].init.headers.Authorization, 'Bearer test-token');
  assert.equal(h.calls[0].init.body.get('audio').name, 'pregunta.m4a');
  assert.equal(h.calls[0].init.body.get('audio').type, 'audio/mp4');
  assert.equal(h.send.clicks, 1); assert.match(h.label.textContent, /Enviando tu pregunta/);
});
test('microphone diagnostics: expired session refresh still retries once with refreshed token', async () => {
  const h = harness([response(401, { error: 'UNAUTHORIZED' }), response(200, { text: 'Números primos' })], { refreshToken: 'refreshed-test-token' });
  await h.run(); assert.equal(h.refreshes, 1); assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1].init.headers.Authorization, 'Bearer refreshed-test-token');
  assert.equal(h.field.value, 'Números primos');
});
test('microphone diagnostics: failed refresh retains authorization diagnostic without extra requests', async () => {
  const h = harness([response(401, { error: 'UNAUTHORIZED' })], { refreshToken: '' });
  await h.run(); assert.equal(h.refreshes, 1); assert.equal(h.calls.length, 1);
  assert.match(h.label.textContent, /HTTP 401 UNAUTHORIZED/);
});
