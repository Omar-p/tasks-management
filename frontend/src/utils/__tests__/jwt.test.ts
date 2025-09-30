import { describe, it, expect, vi } from "vitest";
import { decodeJWT, isTokenExpired } from "../jwt";

// Mock console.error to avoid noise in tests
vi.spyOn(console, "error").mockImplementation(() => {});

describe("JWT utility functions", () => {
  describe("decodeJWT", () => {
    it("should decode a valid JWT token", () => {
      // Sample JWT with payload: {"sub":"01234567-89ab-cdef-0123-456789abcdef","email":"test@email.com","iat":1640995200,"exp":1640998800}
      const validToken =
        "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIwMTIzNDU2Ny04OWFiLWNkZWYtMDEyMy00NTY3ODlhYmNkZWYiLCJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.signature";

      const payload = decodeJWT(validToken);

      expect(payload).toEqual({
        sub: "01234567-89ab-cdef-0123-456789abcdef",
        email: "test@email.com",
        iat: 1640995200,
        exp: 1640998800,
      });
    });

    it("should handle tokens with authorities claim", () => {
      // JWT with authorities: {"sub":"123","email":"user@example.com","authorities":["ROLE_USER"],"iat":1640995200,"exp":1640998800}
      const tokenWithAuthorities =
        "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJhdXRob3JpdGllcyI6WyJST0xFX1VTRVIiXSwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE2NDA5OTg4MDB9.signature";

      const payload = decodeJWT(tokenWithAuthorities);

      expect(payload).toEqual({
        sub: "123",
        email: "user@example.com",
        authorities: ["ROLE_USER"],
        iat: 1640995200,
        exp: 1640998800,
      });
    });

    it("should return null for invalid token format", () => {
      const invalidToken = "invalid.token";

      const payload = decodeJWT(invalidToken);

      expect(payload).toBe(null);
      expect(console.error).toHaveBeenCalledWith(
        "Error decoding JWT:",
        expect.any(Error),
      );
    });

    it("should return null for token with invalid base64", () => {
      const invalidBase64Token = "header.invalid-base64!.signature";

      const payload = decodeJWT(invalidBase64Token);

      expect(payload).toBe(null);
      expect(console.error).toHaveBeenCalledWith(
        "Error decoding JWT:",
        expect.any(Error),
      );
    });

    it("should return null for empty token", () => {
      const payload = decodeJWT("");

      expect(payload).toBe(null);
      expect(console.error).toHaveBeenCalledWith(
        "Error decoding JWT:",
        expect.any(Error),
      );
    });
  });

  describe("isTokenExpired", () => {
    it("should return false for valid unexpired token", () => {
      // Create a token that expires far in the future
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = {
        sub: "123",
        email: "test@email.com",
        iat: Math.floor(Date.now() / 1000),
        exp: futureExp,
      };

      // Manually create JWT-like token with future expiry
      const base64Payload = btoa(JSON.stringify(payload));
      const validToken = `header.${base64Payload}.signature`;

      expect(isTokenExpired(validToken)).toBe(false);
    });

    it("should return true for expired token", () => {
      // Create a token that expired in the past
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = {
        sub: "123",
        email: "test@email.com",
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: pastExp,
      };

      // Manually create JWT-like token with past expiry
      const base64Payload = btoa(JSON.stringify(payload));
      const expiredToken = `header.${base64Payload}.signature`;

      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it("should return true for invalid token", () => {
      const invalidToken = "invalid.token";

      expect(isTokenExpired(invalidToken)).toBe(true);
    });

    it("should return true for token without exp claim", () => {
      const payload = {
        sub: "123",
        email: "test@email.com",
        iat: Math.floor(Date.now() / 1000),
        // No exp claim
      };

      const base64Payload = btoa(JSON.stringify(payload));
      const tokenWithoutExp = `header.${base64Payload}.signature`;

      expect(isTokenExpired(tokenWithoutExp)).toBe(true);
    });
  });
});
