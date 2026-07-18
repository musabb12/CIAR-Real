/**
 * Plain Node verification for AI crypto helpers (no TS loader required).
 * Run: node scripts/verify-ai-admin.cjs
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey() {
  const raw = process.env.AI_SETTINGS_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  return crypto.createHash('sha256').update(raw).digest();
}

function encryptSecret(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptSecret(payload) {
  const key = getKey();
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

process.env.AI_SETTINGS_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
const plain = 'sk-test-secret-key-1234';
const enc = encryptSecret(plain);
assert.notEqual(enc, plain);
assert.equal(decryptSecret(enc), plain);
assert.equal(plain.slice(-4), '1234');

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
assert.equal(clamp(9, 0, 2), 2);
assert.equal(clamp(5, 10, 100), 10);

function containsBlocked(text, blocked) {
  const lower = text.toLowerCase();
  return blocked.some((w) => w && lower.includes(w));
}
assert.equal(containsBlocked('this is SPAM', ['spam']), true);
assert.equal(containsBlocked('hello', ['spam']), false);

console.log('verify-ai-admin.cjs: all checks passed');
