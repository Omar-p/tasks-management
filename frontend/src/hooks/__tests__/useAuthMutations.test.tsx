import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuthMutations } from "../useAuthMutations";
import { TestWrapper } from "@/test-utils";
import { toast } from "sonner";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

describe("useAuthMutations - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login mutation", () => {
    it("should login successfully and navigate to dashboard", async () => {
      const mockCredentials = {
        email: "test@email.com",
        password: "Test@12345",
      };

      const mockResponse = {
        accessToken: "test-access-token",
      };

      const mockUser = {
        uuid: "user-123",
        username: "testuser",
        email: "test@email.com",
      };

      // Mock successful signin
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      // Mock successful profile fetch
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
        headers: new Headers(),
      });

      const { result } = renderHook(() => useAuthMutations(), {
        wrapper: TestWrapper,
      });

      result.current.login.mutate(mockCredentials);

      await waitFor(() => {
        expect(result.current.login.isSuccess).toBe(true);
      });

      expect(toast.success).toHaveBeenCalledWith("Successfully signed in!");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      expect(localStorage.getItem("user_data")).toBeTruthy();
    });

    it("should handle login errors", async () => {
      const mockCredentials = {
        email: "test@email.com",
        password: "WrongPassword",
      };

      // Mock failed signin
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Invalid credentials" }),
        headers: new Headers(),
      });

      const { result } = renderHook(() => useAuthMutations(), {
        wrapper: TestWrapper,
      });

      result.current.login.mutate(mockCredentials);

      await waitFor(() => {
        expect(result.current.login.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("signup mutation", () => {
    it("should signup successfully and navigate to signin", async () => {
      const mockSignupData = {
        username: "newuser",
        email: "newuser@email.com",
        password: "Test@12345",
        confirmPassword: "Test@12345",
      };

      // Mock successful signup
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({}),
        headers: new Headers(),
      });

      const { result } = renderHook(() => useAuthMutations(), {
        wrapper: TestWrapper,
      });

      result.current.signup.mutate(mockSignupData);

      await waitFor(() => {
        expect(result.current.signup.isSuccess).toBe(true);
      });

      expect(toast.success).toHaveBeenCalledWith(
        "Account created successfully! Please sign in.",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/auth/signin");
    });

    it("should handle signup errors with field validation", async () => {
      const mockSignupData = {
        username: "u",
        email: "invalid-email",
        password: "weak",
        confirmPassword: "weak",
      };

      // Mock validation error
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: "Validation failed",
          fieldErrors: {
            username: "Username must be at least 3 characters",
            email: "Invalid email format",
          },
        }),
        headers: new Headers(),
      });

      const { result } = renderHook(() => useAuthMutations(), {
        wrapper: TestWrapper,
      });

      result.current.signup.mutate(mockSignupData);

      await waitFor(() => {
        expect(result.current.signup.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("logout mutation", () => {
    it("should logout successfully", async () => {
      // Setup: user is logged in
      localStorage.setItem(
        "user_data",
        JSON.stringify({ uuid: "user-123", username: "testuser" }),
      );

      // Mock successful logout
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Logged out successfully" }),
        headers: new Headers(),
      });

      const { result } = renderHook(() => useAuthMutations(), {
        wrapper: TestWrapper,
      });

      result.current.logout.mutate();

      await waitFor(() => {
        expect(result.current.logout.isSuccess).toBe(true);
      });

      expect(localStorage.getItem("user_data")).toBeNull();
    });
  });
});
