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
  Github,
  Key,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
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

  useEffect(() => {
    if (isOpen) {
      // Check if there's an existing token
      const existingToken = sessionStorage.getItem("github_token");
      setHasExistingToken(!!existingToken);
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
        // Store the new token
        sessionStorage.setItem("github_token", token);

        // Dispatch a custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("github-token-updated", {
            detail: { token },
          })
        );

        setSuccess("GitHub token updated successfully!");
        setIsLoading(false);

        // Close dialog after a short delay
        setTimeout(() => {
          onClose();
          setSuccess("");
        }, 1500);
      } catch (err) {
        setError("Failed to update token. Please try again.");
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleRemoveToken = () => {
    sessionStorage.removeItem("github_token");
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
                  placeholder="github_pat_xxxxxxxxxxxxxxxxxxxx"
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
