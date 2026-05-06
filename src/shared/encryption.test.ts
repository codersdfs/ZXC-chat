import { describe, it, expect, vi } from "vitest";
import {
  encryptApiKey,
  decryptApiKey,
  encryptSearchApiKeys,
  decryptSearchApiKeys,
} from "./encryption";

describe("API Key Encryption", () => {
  it("should encrypt and decrypt API keys correctly", () => {
    const originalKey = "sk-test-api-key-123456789";
    const encrypted = encryptApiKey(originalKey);
    const decrypted = decryptApiKey(encrypted);

    expect(encrypted).not.toBe(originalKey);
    expect(decrypted).toBe(originalKey);
  });

  it("should encrypt and decrypt search API keys object correctly", () => {
    const apiKeys = {
      google: { apiKey: "google-key", cx: "cx-123" },
      bing: "bing-key",
      openRouter: "openrouter-key",
    };

    const encryptedKeys = encryptSearchApiKeys(apiKeys);
    const decryptedKeys = decryptSearchApiKeys(encryptedKeys);

    expect(decryptedKeys.google?.apiKey).toBe(apiKeys.google.apiKey);
    expect(decryptedKeys.google?.cx).toBe(apiKeys.google.cx);
    expect(decryptedKeys.bing).toBe(apiKeys.bing);
    expect(decryptedKeys.openRouter).toBe(apiKeys.openRouter);
  });

  it("should handle empty keys", () => {
    const encrypted = encryptApiKey("");
    const decrypted = decryptApiKey(encrypted);

    expect(decrypted).toBe("");
  });

  it("should handle decryption of invalid data gracefully", () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = decryptApiKey("invalid-base64-data");
    expect(result).toBe("invalid-base64-data"); // Should fallback to input
    consoleSpy.mockRestore();
  });
});
