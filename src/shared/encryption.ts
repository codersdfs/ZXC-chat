/**
 * Simple encryption utilities for API keys in local storage
 * Note: This provides basic obfuscation for local-only Electron app.
 * For production applications, consider using proper key derivation and secure storage.
 */

const ENCRYPTION_KEY = "aichat-local-key-v1"; // Fixed key for local app

/**
 * Simple XOR-based encryption for API keys
 */
export function encryptApiKey(key: string): string {
  if (!key) return "";

  try {
    const keyBytes = new TextEncoder().encode(key);
    const keyKeyBytes = new TextEncoder().encode(ENCRYPTION_KEY);

    const encrypted = new Uint8Array(keyBytes.length);
    for (let i = 0; i < keyBytes.length; i++) {
      encrypted[i] = keyBytes[i] ^ keyKeyBytes[i % keyKeyBytes.length];
    }

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...encrypted));
  } catch (error) {
    console.error("Encryption failed:", error);
    return key; // Fallback to plain text
  }
}

/**
 * Decrypt API key
 */
export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return "";

  try {
    // Convert from base64
    const encrypted = new Uint8Array(
      atob(encryptedKey)
        .split("")
        .map((c) => c.charCodeAt(0)),
    );

    const keyKeyBytes = new TextEncoder().encode(ENCRYPTION_KEY);

    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyKeyBytes[i % keyKeyBytes.length];
    }

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return encryptedKey; // Fallback to encrypted value
  }
}

/**
 * Encrypt search API keys object
 */
export function encryptSearchApiKeys(apiKeys: {
  google?: { apiKey: string; cx: string };
  bing?: string;
  openRouter?: string;
}): {
  google?: { apiKey: string; cx: string };
  bing?: string;
  openRouter?: string;
} {
  return {
    google: apiKeys.google
      ? {
          apiKey: encryptApiKey(apiKeys.google.apiKey),
          cx: apiKeys.google.cx, // CX is not sensitive
        }
      : undefined,
    bing: apiKeys.bing ? encryptApiKey(apiKeys.bing) : undefined,
    openRouter: apiKeys.openRouter ? encryptApiKey(apiKeys.openRouter) : undefined,
  };
}

/**
 * Decrypt search API keys object
 */
export function decryptSearchApiKeys(encryptedKeys: {
  google?: { apiKey: string; cx: string };
  bing?: string;
  openRouter?: string;
}): {
  google?: { apiKey: string; cx: string };
  bing?: string;
  openRouter?: string;
} {
  return {
    google: encryptedKeys.google
      ? {
          apiKey: decryptApiKey(encryptedKeys.google.apiKey),
          cx: encryptedKeys.google.cx,
        }
      : undefined,
    bing: encryptedKeys.bing ? decryptApiKey(encryptedKeys.bing) : undefined,
    openRouter: encryptedKeys.openRouter
      ? decryptApiKey(encryptedKeys.openRouter)
      : undefined,
  };
}
