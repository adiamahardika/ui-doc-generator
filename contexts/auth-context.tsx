"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  getUser,
  getTokens,
  clearAuth,
  isAuthenticated,
  logout as logoutAPI,
} from "@/lib/auth";
import { removeGitHubToken } from "@/lib/github-token";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on mount
    const initAuth = () => {
      try {
        const storedUser = getUser();
        const tokens = getTokens();

        if (storedUser && tokens?.accessToken) {
          setUser(storedUser);
        } else {
          // Clear any partial auth data
          clearAuth();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (user: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    setUser(user);
  };

  const logout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear authentication data
      clearAuth();
      setUser(null);

      // Clear GitHub token using helper function
      removeGitHubToken();
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
