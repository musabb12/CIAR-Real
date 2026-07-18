import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getEncryptionKey(): Buffer | null {
  const raw =
    process.env.AI_SETTINGS_ENCRYPTION_KEY?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();
  if (!raw) return null;
  // Derive a stable 32-byte key from whatever secret is provided.
  return crypto.createHash('sha256').update(raw).digest();
}

export function isAiEncryptionKeyConfigured(): boolean {
  return Boolean(
    process.env.AI_SETTINGS_ENCRYPTION_KEY?.trim() ||
      process.env.AUTH_SECRET?.trim() ||
      process.env.NEXTAUTH_SECRET?.trim(),
  );
}

/**
 * Encrypt a plaintext API key. Returns base64(iv|tag|ciphertext).
 * Throws if no encryption root key is available.
 */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error(
      'AI_SETTINGS_ENCRYPTION_KEY (or AUTH_SECRET) is required to store API keys',
    );
  }
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/** Decrypt a previously encrypted secret. Returns null on failure. */
export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const key = getEncryptionKey();
  if (!key) return null;
  try {
    const buf = Buffer.from(payload, 'base64');
    if (buf.length < IV_LEN + TAG_LEN + 1) return null;
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

export function secretLast4(plaintext: string): string {
  const trimmed = plaintext.trim();
  if (trimmed.length <= 4) return trimmed;
  return trimmed.slice(-4);
}

/** Mask a key for UI: ••••abcd */
export function maskSecretLast4(last4: string | null): string {
  if (!last4) return '';
  return `••••${last4}`;
}
