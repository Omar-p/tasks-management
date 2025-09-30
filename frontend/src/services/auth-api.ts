import {
  LoginRequest,
  SignupRequest,
  User,
  AuthTokens,
} from "@/contexts/auth.types";
import { getApiBaseUrl } from "@/config/env";

const API_BASE_URL = getApiBaseUrl();

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: Record<string, string>;
}

class AuthApiError extends Error {
  public status?: number;
  public fieldErrors?: Record<string, string>;

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
}

// Token management functions
let tokenGetter: (() => string | null) | null = null;
let tokenSetter: ((token: string) => void) | null = null;
let logoutHandler: (() => void) | null = null;

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    try {
      const errorData: ProblemDetails = await response.json();

      // Handle ProblemDetails format
      if (errorData.errors && Object.keys(errorData.errors).length > 0) {
        // Field validation errors
        const fieldErrors = errorData.errors;
        const firstFieldError = Object.values(fieldErrors)[0];
        throw new AuthApiError(firstFieldError, response.status, fieldErrors);
      } else {
        // General error
        throw new AuthApiError(
          errorData.detail || errorData.title || "Request failed",
          response.status,
        );
      }
    } catch (parseError) {
      // Fallback if JSON parsing fails - check if parseError is from JSON.parse
      if (parseError instanceof SyntaxError) {
        // JSON parsing failed, use response status text
        throw new AuthApiError(
          response.statusText || "Request failed",
          response.status,
        );
      }
      // If it's the AuthApiError we threw above, re-throw it
      throw parseError;
    }
  }
  return response.json();
};

const getAuthHeaders = () => {
  const token = tokenGetter?.();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const authApi = {
  // Token management methods
  setTokenGetter(getter: () => string | null): void {
    tokenGetter = getter;
  },

  setTokenSetter(setter: (token: string) => void): void {
    tokenSetter = setter;
  },

  setLogoutHandler(handler: () => void): void {
    logoutHandler = handler;
  },

  async signin(credentials: LoginRequest): Promise<AuthTokens> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      const result = await handleResponse(response);

      // Set the access token and fetch user profile
      if (tokenSetter) {
        tokenSetter(result.accessToken);
      }

      // Fetch user profile with the new token
      try {
        const userProfile = await fetch(`${API_BASE_URL}/users/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${result.accessToken}`,
          },
        });

        const userData = await handleResponse(userProfile);
        localStorage.setItem("user_data", JSON.stringify(userData));
      } catch (error) {
        console.error("Failed to fetch user profile after signin:", error);
      }

      return { accessToken: result.accessToken };
    } catch (error) {
      if (error instanceof TypeError) {
        throw new AuthApiError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      }
      throw error;
    }
  },

  async signup(userData: SignupRequest): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      await handleResponse(response);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new AuthApiError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      }
      throw error;
    }
  },

  async refresh(): Promise<AuthTokens> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      const result = await handleResponse(response);

      // Update the access token
      if (tokenSetter) {
        tokenSetter(result.accessToken);
      }

      return { accessToken: result.accessToken };
    } catch (error) {
      if (error instanceof TypeError) {
        throw new AuthApiError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      await handleResponse(response);
    } catch (error) {
      // Ignore logout errors - we still want to clear local state
      console.warn("Logout API call failed:", error);
    } finally {
      // Always clear local state
      if (logoutHandler) {
        logoutHandler();
      }
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      return handleResponse(response);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new AuthApiError(
          "Unable to connect to the server. Please check your internet connection and try again.",
        );
      }
      throw error;
    }
  },
};

// Export the error class for type checking
export { AuthApiError };
