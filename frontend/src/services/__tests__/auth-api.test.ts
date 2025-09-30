import { describe, it, expect, vi, beforeEach } from "vitest";
import { authApi, AuthApiError } from "../auth-api";
import type { LoginRequest, SignupRequest } from "@/contexts/auth.types";
import { DEFAULT_API_BASE_URL } from "@/config/env";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("AuthAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();

    // Set up token getter/setter for tests
    authApi.setTokenGetter(() => null);
    authApi.setTokenSetter(() => {});
    authApi.setLogoutHandler(() => {});
  });

  describe("signin", () => {
    it("should signin successfully and fetch user profile", async () => {
      const mockCredentials: LoginRequest = {
        email: "test@email.com",
        password: "Test@12345",
      };

      const mockApiResponse = {
        accessToken: "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature",
      };

      const mockUserProfile = {
        uuid: "123",
        username: "Test User",
        email: "test@email.com",
      };

      // Mock successful signin
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      // Mock successful user profile fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserProfile),
      });

      const result = await authApi.signin(mockCredentials);

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/auth/signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(mockCredentials),
        },
      );

      expect(result).toEqual({
        accessToken: mockApiResponse.accessToken,
      });
    });

    it("should handle signin API error with field errors", async () => {
      const mockCredentials: LoginRequest = {
        email: "invalid",
        password: "short",
      };

      const errorResponse = {
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Validation failed",
        instance: "/api/auth/signin",
        errors: {
          email: "Invalid email format",
          password: "Password must be at least 8 characters",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      try {
        await authApi.signin(mockCredentials);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(AuthApiError);
        if (error instanceof AuthApiError) {
          expect(error.status).toBe(400);
          expect(error.fieldErrors).toEqual(errorResponse.errors);
          expect(error.message).toBe("Invalid email format");
        }
      }
    });

    it("should handle signin with general error", async () => {
      const mockCredentials: LoginRequest = {
        email: "test@email.com",
        password: "wrongpassword",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            type: "about:blank",
            title: "Unauthorized",
            status: 401,
            detail: "Invalid credentials",
            instance: "/api/auth/signin",
          }),
      });

      await expect(authApi.signin(mockCredentials)).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });

  describe("signup", () => {
    it("should register successfully", async () => {
      const mockRegistrationData: SignupRequest = {
        username: "johndoe",
        email: "john@example.com",
        password: "Test@12345",
        confirmPassword: "Test@12345",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await authApi.signup(mockRegistrationData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mockRegistrationData),
        },
      );
    });

    it("should handle signup with validation errors", async () => {
      const mockRegistrationData: SignupRequest = {
        username: "ab",
        email: "invalid-email",
        password: "weak",
        confirmPassword: "different",
      };

      const errorResponse = {
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "Validation failed",
        instance: "/api/auth/signup",
        errors: {
          username: "Username must be at least 3 characters",
          email: "Invalid email format",
          password:
            "Password must contain uppercase, lowercase, number and special character",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      try {
        await authApi.signup(mockRegistrationData);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthApiError);
        if (error instanceof AuthApiError) {
          expect(error.fieldErrors).toBeDefined();
        }
      }
    });
  });

  describe("refresh", () => {
    it("should refresh token successfully", async () => {
      const mockApiResponse = {
        accessToken: "new-access-token-123",
      };

      const mockTokenSetter = vi.fn();
      authApi.setTokenSetter(mockTokenSetter);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await authApi.refresh();

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      expect(mockTokenSetter).toHaveBeenCalledWith("new-access-token-123");
      expect(result).toEqual({
        accessToken: "new-access-token-123",
      });
    });

    it("should handle refresh token error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            type: "about:blank",
            title: "Unauthorized",
            status: 401,
            detail: "Invalid refresh token",
            instance: "/api/auth/refresh",
          }),
      });

      await expect(authApi.refresh()).rejects.toThrow("Invalid refresh token");
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      const mockLogoutHandler = vi.fn();
      authApi.setLogoutHandler(mockLogoutHandler);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await authApi.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      expect(mockLogoutHandler).toHaveBeenCalled();
    });

    it("should call logout handler even if API call fails", async () => {
      const mockLogoutHandler = vi.fn();
      authApi.setLogoutHandler(mockLogoutHandler);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            type: "about:blank",
            title: "Unauthorized",
            status: 401,
            detail: "Unauthorized",
            instance: "/api/auth/logout",
          }),
      });

      // Logout should not throw even if API fails
      await authApi.logout();

      expect(mockLogoutHandler).toHaveBeenCalled();
    });
  });

  describe("getProfile", () => {
    it("should fetch user profile successfully", async () => {
      const mockUserProfile = {
        uuid: "123",
        username: "Test User",
        email: "test@email.com",
      };

      const mockToken = "test-token-123";
      authApi.setTokenGetter(() => mockToken);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserProfile),
      });

      const result = await authApi.getProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/users/me`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockToken}`,
          },
        },
      );

      expect(result).toEqual(mockUserProfile);
    });

    it("should handle profile fetch error", async () => {
      authApi.setTokenGetter(() => "invalid-token");

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: "Unauthorized" }),
      });

      await expect(authApi.getProfile()).rejects.toThrow("Unauthorized");
    });
  });
});
