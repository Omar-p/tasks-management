import { describe, it, expect, vi, beforeEach } from "vitest";
import { authApi } from "../auth-api";
import type { LoginRequest, SignupRequest } from "@/contexts/auth.types";
import { DEFAULT_API_BASE_URL } from "@/config/env";
import { createEmptyResponse, createJsonResponse } from "@/test/fetch-helpers";

const mockFetch = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = mockFetch;

describe("AuthAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();

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

      const mockApiResponse = { accessToken: "access-token-123" };
      const tokenSetter = vi.fn();
      authApi.setTokenSetter(tokenSetter);

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockApiResponse));

      const result = await authApi.signin(mockCredentials);

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
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

      expect(result).toEqual({ accessToken: mockApiResponse.accessToken });
      expect(tokenSetter).toHaveBeenCalledWith("access-token-123");
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

      mockFetch.mockResolvedValueOnce(
        createJsonResponse(errorResponse, {
          status: 400,
          statusText: "Bad Request",
        }),
      );

      await expect(authApi.signin(mockCredentials)).rejects.toMatchObject({
        message: "Invalid email format",
        status: 400,
        fieldErrors: errorResponse.errors,
      });
    });

    it("should handle signin with general error", async () => {
      const mockCredentials: LoginRequest = {
        email: "test@email.com",
        password: "wrongpassword",
      };

      mockFetch.mockResolvedValueOnce(
        createJsonResponse(
          {
            type: "about:blank",
            title: "Unauthorized",
            status: 401,
            detail: "Invalid credentials",
            instance: "/api/auth/signin",
          },
          { status: 401, statusText: "Unauthorized" },
        ),
      );

      await expect(authApi.signin(mockCredentials)).rejects.toThrow(
        "Invalid credentials",
      );
    });

    it("should surface network errors", async () => {
      const mockCredentials: LoginRequest = {
        email: "test@email.com",
        password: "Test@12345",
      };

      mockFetch.mockRejectedValueOnce(new TypeError("network down"));

      await expect(authApi.signin(mockCredentials)).rejects.toThrow(
        "Unable to connect to the server",
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

      mockFetch.mockResolvedValueOnce(createEmptyResponse({ status: 201 }));

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

      mockFetch.mockResolvedValueOnce(
        createJsonResponse(errorResponse, {
          status: 400,
          statusText: "Bad Request",
        }),
      );

      await expect(authApi.signup(mockRegistrationData)).rejects.toMatchObject({
        status: 400,
        fieldErrors: errorResponse.errors,
      });
    });
  });

  describe("refresh", () => {
    it("should refresh token successfully", async () => {
      const mockApiResponse = {
        accessToken: "new-access-token-123",
      };

      const mockTokenSetter = vi.fn();
      authApi.setTokenSetter(mockTokenSetter);

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockApiResponse));

      const result = await authApi.refresh();

      expect(mockFetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      expect(mockTokenSetter).toHaveBeenCalledWith("new-access-token-123");
      expect(result).toEqual({ accessToken: "new-access-token-123" });
    });

    it("should handle refresh token error", async () => {
      mockFetch.mockResolvedValueOnce(
        createJsonResponse(
          {
            type: "about:blank",
            title: "Unauthorized",
            status: 401,
            detail: "Invalid refresh token",
            instance: "/api/auth/refresh",
          },
          { status: 401 },
        ),
      );

      await expect(authApi.refresh()).rejects.toThrow("Invalid refresh token");
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      const mockLogoutHandler = vi.fn();
      authApi.setLogoutHandler(mockLogoutHandler);

      mockFetch.mockResolvedValueOnce(createEmptyResponse({ status: 204 }));

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

      mockFetch.mockResolvedValueOnce(
        createJsonResponse(
          {
            type: "about:blank",
            title: "Unauthorized",
            status: 401,
            detail: "Unauthorized",
            instance: "/api/auth/logout",
          },
          { status: 401 },
        ),
      );

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

      mockFetch.mockResolvedValueOnce(createJsonResponse(mockUserProfile));

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

      mockFetch.mockResolvedValueOnce(
        createJsonResponse({ detail: "Unauthorized" }, { status: 401 }),
      );

      await expect(authApi.getProfile()).rejects.toThrow("Unauthorized");
    });
  });
});
