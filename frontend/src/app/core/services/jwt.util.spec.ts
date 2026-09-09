import { decodeJwt, isExpired } from "./jwt.util";

describe("jwt.util", () => {
  function createToken(payload: object): string {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    const signature = "dummy_signature";
    return `${header}.${body}.${signature}`;
  }

  describe("decodeJwt", () => {
    it("should return decoded payload for a valid JWT token", () => {
      const token = createToken({ sub: "user-123", role: "SELLER" });
      const payload = decodeJwt(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe("user-123");
      expect(payload?.role).toBe("SELLER");
    });

    it("should return null for an invalid JWT string", () => {
      expect(decodeJwt("invalid.jwt.token!!!")).toBeNull();
      expect(decodeJwt("")).toBeNull();
    });
  });

  describe("isExpired", () => {
    it("should return false if token has no exp claim", () => {
      const token = createToken({ sub: "user-123" });
      expect(isExpired(token)).toBeFalse();
    });

    it("should return false if token exp is in the future", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = createToken({ exp: futureExp });
      expect(isExpired(token)).toBeFalse();
    });

    it("should return true if token exp is in the past", () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const token = createToken({ exp: pastExp });
      expect(isExpired(token)).toBeTrue();
    });
  });
});
