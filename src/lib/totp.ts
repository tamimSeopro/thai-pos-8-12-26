import QRCode from 'qrcode';

// Base32 Alphabet according to RFC 4648
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generate a random Base32 TOTP secret string (16 chars = 80 bits)
 */
export function generateTotpSecret(length = 16): string {
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[randomBytes[i] % 32];
  }
  return secret;
}

/**
 * Decode Base32 string into Uint8Array
 */
export function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean[i]);
    if (val === -1) continue;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bytes.push((buffer >> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Generate TOTP Code for a given secret and timestamp
 */
export async function generateTotpCode(secret: string, timestampMs = Date.now()): Promise<string> {
  const keyBytes = base32ToBytes(secret);
  if (keyBytes.length === 0) return '000000';

  const timeStep = Math.floor(timestampMs / 1000 / 30);
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // Store 64-bit integer big-endian (high 32 bits 0, low 32 bits timeStep)
  counterView.setUint32(0, 0, false);
  counterView.setUint32(4, timeStep, false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const sigBytes = new Uint8Array(signature);

  const offset = sigBytes[sigBytes.length - 1] & 0x0f;
  const binary =
    ((sigBytes[offset] & 0x7f) << 24) |
    ((sigBytes[offset + 1] & 0xff) << 16) |
    ((sigBytes[offset + 2] & 0xff) << 8) |
    (sigBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verify TOTP Code against secret with a 1-step window (±30 seconds tolerance)
 */
export async function verifyTotpCode(secret: string, codeInput: string): Promise<boolean> {
  const cleanInput = codeInput.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanInput)) return false;

  const now = Date.now();
  const windows = [-30000, 0, 30000]; // Check current time, -30s, +30s for clock drift tolerance

  for (const offsetMs of windows) {
    const expected = await generateTotpCode(secret, now + offsetMs);
    if (expected === cleanInput) {
      return true;
    }
  }

  return false;
}

/**
 * Generate Google Authenticator standard otpauth URI
 */
export function generateOtpAuthUri(username: string, secret: string, issuer = 'Thai Glass POS'): string {
  const label = encodeURIComponent(`${issuer}:${username}`);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate QR Code Data URL from OTP Auth URI using `qrcode` library
 */
export async function generateQrCodeDataUrl(otpAuthUri: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(otpAuthUri, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}
