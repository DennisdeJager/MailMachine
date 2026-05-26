import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

describe("credential encryption", () => {
  it("round-trips secrets without storing plaintext", () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = "test-key-with-enough-length-for-aes";

    const encrypted = encryptSecret("super-secret-value");

    expect(encrypted).not.toContain("super-secret-value");
    expect(decryptSecret(encrypted)).toBe("super-secret-value");
  });
});
