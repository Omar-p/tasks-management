import React, { useState, useEffect, useRef, useCallback } from "react";
import type { User, AuthTokens, AuthContextType } from "./auth.types";
import { AuthContext } from "./auth.types";
import { authApi } from "@/services/auth-api";
import { tasksApi } from "@/services/tasks-api";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;
  const hasInitializedRef = useRef(false);

  const clearAuthState = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem("user_data");
    setUser(null);
  }, []);

  useEffect(() => {
    authApi.setTokenGetter(() => accessTokenRef.current);
    authApi.setTokenSetter(setAccessToken);
    authApi.setLogoutHandler(clearAuthState);
    tasksApi.setTokenGetter(() => accessTokenRef.current);
  }, [clearAuthState]);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    const initializeAuth = async () => {
      const userData = localStorage.getItem("user_data");

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Try to refresh access token on app load
          try {
            const refreshResponse = await authApi.refresh();
            setAccessToken(refreshResponse.accessToken);
            console.log("Token refresh successful on app load");
          } catch (error) {
            console.error("Token refresh failed on app load:", error);
            // Clear user state if refresh fails during initialization
            clearAuthState();
          }
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error);
          localStorage.removeItem("user_data");
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [clearAuthState]);

  const setTokens = (tokens: AuthTokens) => {
    setAccessToken(tokens.accessToken);
    accessTokenRef.current = tokens.accessToken;
    // Get user data from localStorage that was set during login
    const userData = localStorage.getItem("user_data");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data during setTokens:", error);
      }
    }
  };

  const getAccessToken = (): string | null => {
    return accessToken;
  };

  const login = async (credentials: import("./auth.types").LoginRequest) => {
    const tokens = await authApi.signin(credentials);
    setTokens(tokens);

    // Fetch user profile after successful signin
    try {
      const userProfile = await authApi.getProfile();
      localStorage.setItem("user_data", JSON.stringify(userProfile));
      setUser(userProfile);
    } catch (error) {
      console.error("Failed to fetch user profile after signin:", error);
      // Clear tokens if profile fetch fails
      clearAuthState();
      throw error;
    }

    return tokens;
  };

  const signup = async (userData: import("./auth.types").SignupRequest) => {
    await authApi.signup(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuthState();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    setTokens,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
