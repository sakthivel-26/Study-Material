import test from 'node:test';
import assert from 'node:assert/strict';
import gemini from '../api/gemini.js';
import groq from '../api/groq.js';

for (const [name, handler] of [['gemini', gemini], ['groq', groq]]) {
  test(`${name} uses the admin supplied key and preserves the extraction budget`, async () => {
    const originalFetch = globalThis.fetch;
    let sent;
    globalThis.fetch = async (url, options) => {
      sent = options;
      return { status: 200, headers: new Headers(), json: async () => ({ ok: true }) };
    };
    const res = { setHeader() {}, status(status) { this.code = status; return this; }, json(body) { this.body = body; return this; } };
    try {
      await handler({ method: 'POST', headers: { authorization: 'Bearer test-admin-key' }, body: { contents: [{ parts: [{ text: 'extract' }] }], messages: [{ role: 'user', content: 'extract' }], max_tokens: 4096 } }, res);
      assert.equal(res.code, 200);
      assert.equal(name === 'gemini' ? sent.headers['x-goog-api-key'] : sent.headers.Authorization, name === 'gemini' ? 'test-admin-key' : 'Bearer test-admin-key');
      if (name === 'groq') assert.equal(JSON.parse(sent.body).max_tokens, 4096);
    } finally { globalThis.fetch = originalFetch; }
  });
}
