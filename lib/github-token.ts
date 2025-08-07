/**
 * GitHub Token Helper Utilities
 *
 * Provides centralized methods for managing GitHub Personal Access Tokens
 * stored in sessionStorage with support for both new JSON format and legacy string format.
 */

export interface GitHubTokenData {
  token: string;
  expiresAt: number | null;
  createdAt: number;
  expirationMode: string;
}

/**
 * Retrieves the GitHub token from sessionStorage
 * Handles both new JSON format and legacy string format
 *
 * @returns The token string or null if not found/invalid
 */
export const getGitHubToken = (): string | null => {
  const savedTokenData = sessionStorage.getItem("github_token");
  if (!savedTokenData) return null;

  try {
    const tokenData = JSON.parse(savedTokenData);
    // Check if it's the new format with token property
    if (tokenData.token) {
      return tokenData.token;
    }
    // Fallback for old format (direct string)
    return savedTokenData;
  } catch (error) {
    // If parsing fails, treat as old format
    return savedTokenData;
  }
};

/**
 * Retrieves the full GitHub token data from sessionStorage
 * Only works with new JSON format
 *
 * @returns The token data object or null if not found/invalid
 */
export const getGitHubTokenData = (): GitHubTokenData | null => {
  const savedTokenData = sessionStorage.getItem("github_token");
  if (!savedTokenData) return null;

  try {
    const tokenData = JSON.parse(savedTokenData);
    // Check if it's the new format with required properties
    if (tokenData.token && tokenData.expiresAt !== undefined) {
      return tokenData;
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Checks if the GitHub token exists and is valid (not expired)
 *
 * @returns True if token exists and is valid, false otherwise
 */
export const isGitHubTokenValid = (): boolean => {
  const tokenData = getGitHubTokenData();
  if (!tokenData) {
    // Check for legacy format
    const legacyToken = getGitHubToken();
    return !!legacyToken;
  }

  // Check if it's logout-only token (never expires)
  if (tokenData.expiresAt === null || tokenData.expirationMode === "logout") {
    return true;
  }

  // Check if time-based token has expired
  return Date.now() <= tokenData.expiresAt;
};

/**
 * Removes the GitHub token and any associated timeouts
 */
export const removeGitHubToken = (): void => {
  // Clear the token
  sessionStorage.removeItem("github_token");

  // Clear any existing timeout
  const timeoutId = sessionStorage.getItem("github_token_timeout");
  if (timeoutId) {
    clearTimeout(parseInt(timeoutId));
    sessionStorage.removeItem("github_token_timeout");
  }

  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent("github-token-removed"));
};

/**
 * Sets a new GitHub token with optional expiration
 *
 * @param token - The GitHub token string
 * @param expirationMode - Either "logout" or time in minutes as string
 */
export const setGitHubToken = (
  token: string,
  expirationMode: string = "logout"
): void => {
  // Calculate expiration time
  let expirationTimestamp = null;
  let timeoutId = null;

  if (expirationMode !== "logout") {
    const expirationMinutes = parseInt(expirationMode);
    expirationTimestamp = Date.now() + expirationMinutes * 60 * 1000;

    // Set up automatic removal timer
    timeoutId = setTimeout(() => {
      sessionStorage.removeItem("github_token");
      window.dispatchEvent(new CustomEvent("github-token-expired"));
    }, expirationMinutes * 60 * 1000);

    // Store the timeout ID
    sessionStorage.setItem("github_token_timeout", timeoutId.toString());
  } else {
    // Clear any existing timeout for logout-only tokens
    const existingTimeoutId = sessionStorage.getItem("github_token_timeout");
    if (existingTimeoutId) {
      clearTimeout(parseInt(existingTimeoutId));
      sessionStorage.removeItem("github_token_timeout");
    }
  }

  // Store the new token
  const tokenData: GitHubTokenData = {
    token: token,
    expiresAt: expirationTimestamp,
    createdAt: Date.now(),
    expirationMode: expirationMode,
  };

  sessionStorage.setItem("github_token", JSON.stringify(tokenData));

  // Dispatch event to notify components
  window.dispatchEvent(
    new CustomEvent("github-token-updated", {
      detail: {
        token,
        expiresAt: expirationTimestamp,
        expirationMode: expirationMode,
        expirationMinutes:
          expirationMode !== "logout" ? parseInt(expirationMode) : null,
      },
    })
  );
};
