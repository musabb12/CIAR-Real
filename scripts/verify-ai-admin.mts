/**
 * Lightweight verification for AI admin crypto + settings normalization.
 * Run: node --experimental-strip-types scripts/verify-ai-admin.mts
 * or via tsx if available.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.AI_SETTINGS_ENCRYPTION_KEY =
  process.env.AI_SETTINGS_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
process.env.AI_ADMIN_MODE = process.env.AI_ADMIN_MODE || 'demo';

const { encryptSecret, decryptSecret, secretLast4, maskSecretLast4 } = await import(
  '../src/lib/ai/secrets.ts'
);
const {
  normalizeAiAdminSettings,
  toPublicAiSettings,
  containsBlockedWord,
  getDefaultAiAdminSettings,
} = await import('../src/lib/ai/settings.ts');

const plain = 'sk-test-secret-key-1234';
const enc = encryptSecret(plain);
assert.notEqual(enc, plain);
assert.equal(decryptSecret(enc), plain);
assert.equal(secretLast4(plain), '1234');
assert.equal(maskSecretLast4('1234'), '••••1234');
assert.equal(decryptSecret('not-valid'), null);

const defaults = getDefaultAiAdminSettings();
const normalized = normalizeAiAdminSettings({
  provider: { activeProvider: 'openai', model: 'gpt-test', temperature: 9 },
  safety: { blockedWords: ['spam', ' BAD '], fallbackToHeuristic: false },
  budget: { dailyRequestLimit: 5 },
  capabilities: [{ key: 'ai_chatbot', enabled: false, engine: 'llm' }],
});

assert.equal(normalized.provider.activeProvider, 'openai');
assert.equal(normalized.provider.model, 'gpt-test');
assert.equal(normalized.provider.temperature, 2); // clamped
assert.equal(normalized.safety.fallbackToHeuristic, false);
assert.deepEqual(normalized.safety.blockedWords, ['spam', 'bad']);
assert.equal(normalized.budget.dailyRequestLimit, 10); // clamped to min 10
assert.equal(normalized.capabilities.find((c) => c.key === 'ai_chatbot')?.enabled, false);
assert.equal(normalized.capabilities.find((c) => c.key === 'ai_chatbot')?.engine, 'llm');
assert.equal(normalized.capabilities.length, defaults.capabilities.length);

const pub = toPublicAiSettings({
  ...normalized,
  provider: { ...normalized.provider, apiKeyEncrypted: enc, apiKeyLast4: '1234' },
});
assert.equal('apiKeyEncrypted' in pub.provider, false);
assert.equal(pub.provider.hasApiKey, true);
assert.equal(pub.adminMode, 'demo');

assert.equal(containsBlockedWord('this is SPAM mail', ['spam']), true);
assert.equal(containsBlockedWord('hello', ['spam']), false);

console.log('verify-ai-admin: all checks passed');
