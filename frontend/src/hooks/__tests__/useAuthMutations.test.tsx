import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthMutations } from "../useAuthMutations";
import { TestWrapper } from "@/test-utils";
import { toast } from "sonner";
import { createEmptyResponse, createJsonResponse } from "@/test/fetch-helpers";

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

const fetchMock = vi.fn();

describe("useAuthMutations - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchMock.mockReset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = fetchMock;
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
      fetchMock.mockResolvedValueOnce(createJsonResponse(mockResponse));

      // Mock successful profile fetch
      fetchMock.mockResolvedValueOnce(createJsonResponse(mockUser));

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
      fetchMock.mockResolvedValueOnce(
        createJsonResponse({ message: "Invalid credentials" }, { status: 401 }),
      );

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
      fetchMock.mockResolvedValueOnce(createEmptyResponse({ status: 201 }));

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
      fetchMock.mockResolvedValueOnce(
        createJsonResponse(
          {
            message: "Validation failed",
            fieldErrors: {
              username: "Username must be at least 3 characters",
              email: "Invalid email format",
            },
          },
          { status: 400 },
        ),
      );

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
      fetchMock.mockResolvedValueOnce(createEmptyResponse({ status: 204 }));

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
