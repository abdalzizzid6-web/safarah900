import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// Get encryption key from env, or derive a stable key from process.env.GEMINI_API_KEY / applet ID
function getEncryptionKey(): Buffer {
  const keySource = process.env.SOCIAL_ENCRYPTION_KEY || process.env.GEMINI_API_KEY || 'safara-90-secret-fallback-key-32b';
  return crypto.createHash('sha256').update(keySource).digest();
}

/**
 * Encrypt sensitive plain text using AES-256-GCM
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Combine IV, AuthTag, and Encrypted Text
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt cipher text back to plain text
 */
export function decrypt(cipherText: string): string {
  try {
    if (!cipherText || !cipherText.includes(':')) {
      return cipherText; // Return as is if not encrypted
    }
    
    const [ivHex, authTagHex, encryptedHex] = cipherText.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) {
      return cipherText;
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return original text if decryption fails to avoid breaking existing data
    return cipherText;
  }
}
