"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, GitBranch, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/auth";
import { getGitHubToken } from "@/lib/github-token";

interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  } | null;
  protected: boolean;
}

interface BranchSelectorProps {
  currentBranch: string;
  onBranchChange: (branch: string) => void;
  repository: any;
}

export function BranchSelector({
  currentBranch,
  onBranchChange,
  repository,
}: BranchSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = async () => {
    if (!repository) return;

    setIsLoading(true);
    setError(null);

    try {
      // Add access token if available
      const savedToken = getGitHubToken();
      const queryParams = new URLSearchParams();
      if (savedToken) {
        queryParams.append("access_token", savedToken);
      }

      const endpoint = `/api/github/repository/${encodeURIComponent(
        repository.name
      )}/branches${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const response = await apiRequest(endpoint, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to fetch branches" }));
        throw new Error(errorData.message || "Failed to fetch branches");
      }

      const result = await response.json();

      if (result.success && result.data && result.data.branches) {
        setBranches(result.data.branches);
      } else {
        throw new Error(result.message || "Failed to load branches");
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch branches"
      );
      // Fallback to main branch
      setBranches([{ name: "main", commit: null, protected: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [repository]);

  const handleRefresh = () => {
    fetchBranches();
  };

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <GitBranch className="h-4 w-4" />
            <span className="font-medium">{currentBranch}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start">
          <div className="p-2 border-b">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Switch branches/tags</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {error ? (
              <div className="p-3 text-sm text-red-600">{error}</div>
            ) : branches.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">
                {isLoading ? "Loading branches..." : "No branches found"}
              </div>
            ) : (
              branches.map((branch) => (
                <DropdownMenuItem
                  key={branch.name}
                  onClick={() => onBranchChange(branch.name)}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <GitBranch className="h-3 w-3 text-gray-500" />
                    <span className="font-medium text-sm">{branch.name}</span>
                    {branch.name === "main" && (
                      <Badge variant="secondary" className="text-xs">
                        default
                      </Badge>
                    )}
                    {branch.name === currentBranch && (
                      <Badge variant="default" className="text-xs">
                        current
                      </Badge>
                    )}
                    {branch.protected && (
                      <Badge variant="outline" className="text-xs">
                        protected
                      </Badge>
                    )}
                  </div>
                  {branch.commit && (
                    <div className="text-xs text-gray-600 ml-5">
                      <div className="flex items-center gap-2 mt-1">
                        <span>Latest commit:</span>
                        <code className="bg-gray-100 px-1 rounded text-xs">
                          {branch.commit.sha.substring(0, 7)}
                        </code>
                      </div>
                    </div>
                  )}
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
