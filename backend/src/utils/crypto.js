/**
 * Application-level AES-256-GCM encryption for sensitive columns.
 * Used for signature_image in revue_signature table.
 *
 * Requires ENCRYPTION_KEY in .env — 64 hex chars (32 bytes).
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
const crypto = require('crypto')

const ALGO   = 'aes-256-gcm'
const IV_LEN = 12 // 96-bit IV recommended for GCM

function getKey() {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be set in .env as a 64-character hex string (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Encrypts a plaintext string.
 * Returns a colon-separated string: "<iv_hex>:<tag_hex>:<ciphertext_hex>"
 * Returns null if input is null/empty.
 */
function encrypt(plaintext) {
  if (!plaintext) return null
  const key    = getKey()
  const iv     = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag    = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

/**
 * Decrypts a value produced by encrypt().
 * Returns null if input is null/empty or not in the expected format.
 */
function decrypt(stored) {
  if (!stored) return null
  const parts = stored.split(':')
  // If it doesn't look like an encrypted value (e.g. legacy plain data), return as-is
  if (parts.length !== 3) return stored
  const [ivHex, tagHex, dataHex] = parts
  try {
    const key      = getKey()
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    const dec = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()])
    return dec.toString('utf8')
  } catch {
    // Auth tag mismatch or corrupted data — return null rather than crash
    return null
  }
}

module.exports = { encrypt, decrypt }
