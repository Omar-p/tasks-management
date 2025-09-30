import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "../AuthContext";
import { authApi } from "@/services/auth-api";
import { tasksApi } from "@/services/tasks-api";

// Mock the auth API
vi.mock("@/services/auth-api", () => ({
  authApi: {
    signin: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    setTokenGetter: vi.fn(),
    setTokenSetter: vi.fn(),
    setLogoutHandler: vi.fn(),
  },
  AuthApiError: class extends Error {
    status?: number;
    fieldErrors?: Record<string, string>;
    constructor(
      message: string,
      status?: number,
      fieldErrors?: Record<string, string>,
    ) {
      super(message);
      this.name = "AuthApiError";
      if (status !== undefined) {
        this.status = status;
      }
      if (fieldErrors !== undefined) {
        this.fieldErrors = fieldErrors;
      }
    }
  },
}));

// Mock the tasks API
vi.mock("@/services/tasks-api", () => ({
  tasksApi: {
    setTokenGetter: vi.fn(),
    getAllTasks: vi.fn(),
    getUserTasks: vi.fn(),
    getTaskByUuid: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
  TaskStatus: {
    PENDING: "PENDING",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
  },
  TaskPriority: {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    URGENT: "URGENT",
  },
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it("should throw error when useAuth is used outside AuthProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });

  it("should initialize with default unauthenticated state", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should restore user from localStorage on initialization and refresh token", async () => {
    const mockUser = {
      uuid: "123",
      username: "Test User",
      email: "test@email.com",
    };

    mockLocalStorage.setItem("user_data", JSON.stringify(mockUser));

    (authApi.refresh as ReturnType<typeof vi.fn>).mockResolvedValue({
      accessToken: "refreshed-token-123",
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(authApi.refresh).toHaveBeenCalled();
    expect(result.current.getAccessToken()).toBe("refreshed-token-123");
  });

  it("should clear auth state when refresh fails on initialization", async () => {
    const mockUser = {
      uuid: "123",
      username: "Test User",
      email: "test@email.com",
    };

    mockLocalStorage.setItem("user_data", JSON.stringify(mockUser));

    (authApi.refresh as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Refresh failed"),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockLocalStorage.getItem("user_data")).toBe(null);
  });

  it("should handle invalid JSON in localStorage", async () => {
    mockLocalStorage.setItem("user_data", "invalid-json");

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockLocalStorage.getItem("user_data")).toBe(null);
  });

  it("should login successfully", async () => {
    const mockCredentials = {
      email: "test@email.com",
      password: "Test@12345",
    };

    const mockTokens = {
      accessToken: "new-access-token",
    };

    (authApi.signin as ReturnType<typeof vi.fn>).mockResolvedValue(mockTokens);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login(mockCredentials);
    });

    expect(authApi.signin).toHaveBeenCalledWith(mockCredentials);
    expect(result.current.getAccessToken()).toBe("new-access-token");
  });

  it("should signup successfully", async () => {
    const mockRegistrationData = {
      username: "newuser",
      email: "newuser@email.com",
      password: "Test@12345",
      confirmPassword: "Test@12345",
    };

    (authApi.signup as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signup(mockRegistrationData);
    });

    expect(authApi.signup).toHaveBeenCalledWith(mockRegistrationData);
  });

  it("should logout and clear all data", async () => {
    const mockUser = {
      uuid: "123",
      username: "Test User",
      email: "test@email.com",
    };

    mockLocalStorage.setItem("user_data", JSON.stringify(mockUser));

    (authApi.refresh as ReturnType<typeof vi.fn>).mockResolvedValue({
      accessToken: "token-123",
    });

    (authApi.logout as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);

    await act(async () => {
      await result.current.logout();
    });

    expect(authApi.logout).toHaveBeenCalled();
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.getAccessToken()).toBe(null);
    expect(mockLocalStorage.getItem("user_data")).toBe(null);
  });

  it("should store tokens in memory correctly", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const tokens = {
      accessToken: "test-access-token",
    };

    act(() => {
      result.current.setTokens(tokens);
    });

    expect(result.current.getAccessToken()).toBe("test-access-token");
  });

  it("should set up token getters for both auth and tasks APIs", () => {
    renderHook(() => useAuth(), { wrapper });

    expect(authApi.setTokenGetter).toHaveBeenCalled();
    expect(authApi.setTokenSetter).toHaveBeenCalled();
    expect(authApi.setLogoutHandler).toHaveBeenCalled();
    expect(tasksApi.setTokenGetter).toHaveBeenCalled();
  });
});
