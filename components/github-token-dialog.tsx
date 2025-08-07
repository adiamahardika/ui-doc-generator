"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Github,
  Key,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  X,
} from "lucide-react";

interface GitHubTokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GitHubTokenDialog({ isOpen, onClose }: GitHubTokenDialogProps) {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [expirationTime, setExpirationTime] = useState("logout"); // Default to logout only

  useEffect(() => {
    if (isOpen) {
      // Check if there's an existing token
      const existingTokenData = sessionStorage.getItem("github_token");
      if (existingTokenData) {
        try {
          const tokenData = JSON.parse(existingTokenData);
          // Check if it's the new format with expiration metadata
          if (tokenData.expiresAt !== undefined) {
            // Check if it's a logout-only token
            if (
              tokenData.expiresAt === null ||
              tokenData.expirationMode === "logout"
            ) {
              // Logout-only token, treat as existing and valid
              setHasExistingToken(true);
            } else {
              // Time-based expiration token, check if expired
              if (Date.now() > tokenData.expiresAt) {
                // Token has expired, remove it
                sessionStorage.removeItem("github_token");
                sessionStorage.removeItem("github_token_timeout");
                setHasExistingToken(false);
                window.dispatchEvent(new CustomEvent("github-token-expired"));
              } else {
                setHasExistingToken(true);
              }
            }
          } else {
            // Old format token (string), treat as existing but expired
            setHasExistingToken(true);
          }
        } catch (error) {
          // Invalid JSON, remove the token
          sessionStorage.removeItem("github_token");
          setHasExistingToken(false);
        }
      } else {
        setHasExistingToken(false);
      }

      setToken("");
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      setError("Please enter your GitHub Personal Access Token");
      return;
    }

    if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
      setError(
        "Invalid token format. GitHub tokens should start with 'ghp_' or 'github_pat_'"
      );
      return;
    }

    setIsLoading(true);
    setError("");

    // Simulate token validation
    setTimeout(() => {
      try {
        // Calculate expiration time
        let expirationTimestamp = null;
        let timeoutId = null;

        if (expirationTime !== "logout") {
          const expirationMinutes = parseInt(expirationTime);
          expirationTimestamp = Date.now() + expirationMinutes * 60 * 1000;

          // Set up automatic removal timer only if not "logout" option
          timeoutId = setTimeout(() => {
            sessionStorage.removeItem("github_token");
            window.dispatchEvent(new CustomEvent("github-token-expired"));
          }, expirationMinutes * 60 * 1000);

          // Store the timeout ID so we can clear it if needed
          sessionStorage.setItem("github_token_timeout", timeoutId.toString());
        } else {
          // Clear any existing timeout for logout-only tokens
          const existingTimeoutId = sessionStorage.getItem(
            "github_token_timeout"
          );
          if (existingTimeoutId) {
            clearTimeout(parseInt(existingTimeoutId));
            sessionStorage.removeItem("github_token_timeout");
          }
        }

        // Store the new token with expiration (or null for logout-only)
        const tokenData = {
          token: token,
          expiresAt: expirationTimestamp,
          createdAt: Date.now(),
          expirationMode: expirationTime,
        };

        sessionStorage.setItem("github_token", JSON.stringify(tokenData));

        // Dispatch a custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("github-token-updated", {
            detail: {
              token,
              expiresAt: expirationTimestamp,
              expirationMode: expirationTime,
              expirationMinutes:
                expirationTime !== "logout" ? parseInt(expirationTime) : null,
            },
          })
        );

        const successMessage =
          expirationTime === "logout"
            ? "GitHub token updated successfully! Will persist until logout."
            : `GitHub token updated successfully! Expires in ${expirationTime} minutes.`;

        setSuccess(successMessage);
        setIsLoading(false);

        // Close dialog after a short delay
        setTimeout(() => {
          onClose();
          setSuccess("");
        }, 2000);
      } catch (err) {
        setError("Failed to update token. Please try again.");
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleRemoveToken = () => {
    // Clear the token and timeout
    sessionStorage.removeItem("github_token");
    const timeoutId = sessionStorage.getItem("github_token_timeout");
    if (timeoutId) {
      clearTimeout(parseInt(timeoutId));
      sessionStorage.removeItem("github_token_timeout");
    }

    window.dispatchEvent(new CustomEvent("github-token-removed"));
    setHasExistingToken(false);
    setSuccess("GitHub token removed successfully!");

    setTimeout(() => {
      onClose();
      setSuccess("");
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            GitHub Personal Access Token
          </DialogTitle>
          <DialogDescription>
            {hasExistingToken
              ? "Update your GitHub PAT to refresh repository access or remove it to disconnect."
              : "Enter your GitHub PAT to access your repositories. The token is stored securely for this session only."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasExistingToken && (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  GitHub token is active
                </span>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                Connected
              </Badge>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">
                {hasExistingToken ? "New GitHub Token" : "GitHub Token"}
              </Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? "text" : "password"}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration">Token Expiration</Label>
              <Select value={expirationTime} onValueChange={setExpirationTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="logout">Only remove on logout</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {expirationTime === "logout"
                  ? "Token will only be removed when you log out"
                  : "Token will be automatically removed after the selected time"}
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {hasExistingToken ? "Updating..." : "Connecting..."}
                  </>
                ) : (
                  <>
                    <Github className="h-4 w-4 mr-2" />
                    {hasExistingToken ? "Update Token" : "Connect"}
                  </>
                )}
              </Button>

              {hasExistingToken && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveToken}
                  className="text-red-600 hover:text-red-700 bg-transparent"
                >
                  Remove
                </Button>
              )}
            </div>
          </form>

          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">To create a Personal Access Token:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
              <li>
                Go to GitHub Settings → Developer settings → Personal access
                tokens
              </li>
              <li>Click "Generate new token (classic)"</li>
              <li>Select "repo" scope for repository access</li>
              <li>Copy and paste the token above</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
