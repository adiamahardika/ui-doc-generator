// Authentication utility functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface User {
  id: number;
  name: string;
  email: string;
  github_username: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Get stored tokens
export const getTokens = () => {
  if (typeof window === "undefined") return null;

  return {
    accessToken: localStorage.getItem("access_token"),
    refreshToken: localStorage.getItem("refresh_token"),
  };
};

// Get stored user
export const getUser = (): User | null => {
  if (typeof window === "undefined") return null;

  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const tokens = getTokens();
  return !!tokens?.accessToken;
};

// Clear authentication data
export const clearAuth = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

// Refresh access token
export const refreshAccessToken = async (): Promise<string | null> => {
  const tokens = getTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.refreshToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      clearAuth();
      return null;
    }

    const result: ApiResponse<{ access_token: string }> = await response.json();

    if (result.success && result.data?.access_token) {
      localStorage.setItem("access_token", result.data.access_token);
      return result.data.access_token;
    }

    return null;
  } catch (error) {
    console.error("Token refresh failed:", error);
    clearAuth();
    return null;
  }
};

// Make authenticated API request
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Add authorization header if token exists
  if (tokens?.accessToken) {
    headers["Authorization"] = `Bearer ${tokens.accessToken}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If token expired, try to refresh
  if (response.status === 401 && tokens?.refreshToken) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry request with new token
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }

  return response;
};

// Logout user
export const logout = async (): Promise<void> => {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearAuth();
  }
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result: ApiResponse<LoginResponse> = await response.json();

    return result;
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Network error occurred. Please try again.",
    };
  }
};
