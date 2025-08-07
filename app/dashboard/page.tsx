"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  Search,
  Star,
  GitFork,
  Calendar,
  Key,
  RefreshCw,
  Check,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { GitHubTokenDialog } from "@/components/github-token-dialog";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/auth";

interface Repository {
  id: number;
  name: string;
  full_name?: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  updated_at: string;
  private: boolean;
  html_url?: string;
  clone_url?: string;
  default_branch?: string;
  owner?: {
    login: string;
    avatar_url?: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [githubToken, setGithubToken] = useState("");
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"updated_at" | "name">("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState<{
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);

  useEffect(() => {
    // Check if token is already saved in session
    const savedTokenData = sessionStorage.getItem("github_token");
    if (savedTokenData) {
      try {
        const tokenData = JSON.parse(savedTokenData);
        // Check if it's the new format with expiration
        if (tokenData.expiresAt !== undefined) {
          // Check if it's a logout-only token (expiresAt will be null)
          if (
            tokenData.expiresAt === null ||
            tokenData.expirationMode === "logout"
          ) {
            // Logout-only token, use it without expiration
            setGithubToken(tokenData.token);
            setTokenExpiresAt(null);
            setTokenExpired(false);
            fetchRepositories(
              tokenData.token,
              1,
              itemsPerPage,
              sortBy,
              sortOrder,
              ""
            );
          } else {
            // Check if token has expired
            if (Date.now() > tokenData.expiresAt) {
              // Token has expired, remove it
              sessionStorage.removeItem("github_token");
              sessionStorage.removeItem("github_token_timeout");
              setGithubToken("");
              setTokenExpiresAt(null);
              setTokenExpired(true);
              fetchRepositories("", 1, itemsPerPage, sortBy, sortOrder, "");
            } else {
              setGithubToken(tokenData.token);
              setTokenExpiresAt(tokenData.expiresAt);
              setTokenExpired(false);
              fetchRepositories(
                tokenData.token,
                1,
                itemsPerPage,
                sortBy,
                sortOrder,
                ""
              );
            }
          }
        } else {
          // Old format token (string), use it but treat as no expiration
          setGithubToken(savedTokenData);
          setTokenExpiresAt(null);
          setTokenExpired(false);
          fetchRepositories(
            savedTokenData,
            1,
            itemsPerPage,
            sortBy,
            sortOrder,
            ""
          );
        }
      } catch (error) {
        // Invalid JSON, remove the token
        sessionStorage.removeItem("github_token");
        setGithubToken("");
        setTokenExpiresAt(null);
        setTokenExpired(false);
        fetchRepositories("", 1, itemsPerPage, sortBy, sortOrder, "");
      }
    } else {
      // Fetch repositories without token
      setGithubToken("");
      setTokenExpiresAt(null);
      setTokenExpired(false);
      fetchRepositories("", 1, itemsPerPage, sortBy, sortOrder, "");
    }
  }, []);

  // Debounced search effect - calls API when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchRepositories(
        githubToken,
        1,
        itemsPerPage,
        sortBy,
        sortOrder,
        searchTerm
      );
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // Only depend on searchTerm

  const fetchRepositories = async (
    token: string,
    page: number = currentPage,
    perPage: number = itemsPerPage,
    sort: string = sortBy,
    order: string = sortOrder,
    search: string = ""
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Build API endpoint with query parameters
      const queryParams = new URLSearchParams();
      if (token) {
        queryParams.append("access_token", token);
      }
      if (search) {
        queryParams.append("search", search);
      }
      queryParams.append("page", page.toString());
      queryParams.append("per_page", perPage.toString());
      queryParams.append("sort", sort);
      queryParams.append("order", order);

      const endpoint = `/api/github/repositories${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await apiRequest(endpoint, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError(
            "User not found. Please check your GitHub username in your profile."
          );
        } else if (response.status === 429) {
          setError(
            "GitHub API rate limit exceeded. Please try again later or add a GitHub token."
          );
        } else if (response.status === 403) {
          setError(
            "Access forbidden. Please check your GitHub token permissions."
          );
        } else {
          setError(
            `Failed to fetch repositories (${response.status}). Please try again.`
          );
        }
        setRepositories([]);
        setFilteredRepos([]);
        return;
      }

      const result = await response.json();

      if (result.success) {
        // Map backend response to frontend Repository interface
        const repos: Repository[] = result.data.repositories.map(
          (repo: any) => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || "No description available",
            language: repo.language || "Unknown",
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            updated_at: repo.updated_at,
            private: repo.private || false,
            html_url: repo.html_url,
            clone_url: repo.clone_url,
            default_branch: repo.default_branch || "main",
            owner: repo.owner
              ? {
                  login: repo.owner.login,
                  avatar_url: repo.owner.avatar_url,
                }
              : undefined,
          })
        );

        setRepositories(repos);
        setFilteredRepos(repos); // Always use repos directly since search is handled by backend
        setError(null);

        // Store pagination info
        if (result.data.pagination) {
          setPagination({
            totalPages: result.data.pagination.total_pages,
            hasNextPage: result.data.pagination.has_next_page,
            hasPrevPage: result.data.pagination.has_prev_page,
          });
          setCurrentPage(result.data.pagination.page);
        }
      } else {
        console.error("API Error:", result.message);
        setError(result.message || "Failed to fetch repositories");
        setRepositories([]);
        setFilteredRepos([]);
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
      setError("Network error. Please check your connection and try again.");
      setRepositories([]);
      setFilteredRepos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepositorySelect = (repo: Repository) => {
    // Store selected repository in session storage
    sessionStorage.setItem("selected_repository", JSON.stringify(repo));
    router.push("/files");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      TypeScript: "bg-blue-500",
      JavaScript: "bg-yellow-500",
      Python: "bg-green-500",
      Go: "bg-cyan-500",
      Java: "bg-orange-500",
      "C++": "bg-purple-500",
      Vue: "bg-emerald-500",
    };
    return colors[language] || "bg-gray-500";
  };

  const getTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) return "Expired";

    const minutes = Math.floor(remaining / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  useEffect(() => {
    const handleTokenUpdate = (event: CustomEvent) => {
      const { token, expiresAt } = event.detail;
      setGithubToken(token);
      setTokenExpiresAt(expiresAt);
      setTokenExpired(false);
      setError(null); // Clear any previous errors
      setCurrentPage(1); // Reset to first page
      fetchRepositories(token, 1, itemsPerPage, sortBy, sortOrder, searchTerm);
    };

    const handleTokenRemove = () => {
      setGithubToken("");
      setTokenExpiresAt(null);
      setTokenExpired(false);
      setRepositories([]);
      setFilteredRepos([]);
      setError(null); // Clear any previous errors
      setCurrentPage(1); // Reset to first page
      setPagination(null);
      fetchRepositories("", 1, itemsPerPage, sortBy, sortOrder, searchTerm);
    };

    const handleTokenExpired = () => {
      setGithubToken("");
      setTokenExpiresAt(null);
      setTokenExpired(true);
      setRepositories([]);
      setFilteredRepos([]);
      setError(
        "GitHub token has expired. Please add a new token to continue accessing your repositories."
      );
      setCurrentPage(1); // Reset to first page
      setPagination(null);
      fetchRepositories("", 1, itemsPerPage, sortBy, sortOrder, searchTerm);
    };

    window.addEventListener(
      "github-token-updated",
      handleTokenUpdate as EventListener
    );
    window.addEventListener(
      "github-token-removed",
      handleTokenRemove as EventListener
    );
    window.addEventListener(
      "github-token-expired",
      handleTokenExpired as EventListener
    );

    return () => {
      window.removeEventListener(
        "github-token-updated",
        handleTokenUpdate as EventListener
      );
      window.removeEventListener(
        "github-token-removed",
        handleTokenRemove as EventListener
      );
      window.removeEventListener(
        "github-token-expired",
        handleTokenExpired as EventListener
      );
    };
  }, []);

  // Timer to update expiration countdown
  useEffect(() => {
    if (!tokenExpiresAt || tokenExpired) return;

    const interval = setInterval(() => {
      if (Date.now() > tokenExpiresAt) {
        // Token has expired
        sessionStorage.removeItem("github_token");
        sessionStorage.removeItem("github_token_timeout");
        setGithubToken("");
        setTokenExpiresAt(null);
        setTokenExpired(true);
        setError(
          "GitHub token has expired. Please add a new token to continue accessing your repositories."
        );
        clearInterval(interval);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [tokenExpiresAt, tokenExpired]);

  return (
    <ProtectedRoute>
      <LayoutWrapper user={user}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Connect your GitHub account and select repositories to generate
              documentation
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2">
                {githubToken && tokenExpiresAt && !tokenExpired && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-yellow-50 text-yellow-800 border-yellow-200"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Expires in {getTimeRemaining(tokenExpiresAt)}
                  </Badge>
                )}
                {githubToken && !tokenExpiresAt && !tokenExpired && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-800 border-blue-200"
                  >
                    <Key className="h-3 w-3 mr-1" />
                    Active until logout
                  </Badge>
                )}
                {tokenExpired && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-red-50 text-red-800 border-red-200"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Token Removed
                  </Badge>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsTokenDialogOpen(true)}
                  className={`flex items-center gap-2 ${
                    githubToken
                      ? "border-green-500 bg-green-50 text-green-700 hover:bg-green-100"
                      : ""
                  }`}
                >
                  {githubToken ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                  {githubToken ? "Token Connected" : "Add GitHub Token"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    fetchRepositories(
                      githubToken,
                      currentPage,
                      itemsPerPage,
                      sortBy,
                      sortOrder,
                      searchTerm
                    );
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search repositories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-700">
                    Sort by:
                  </span>
                  <Select
                    value={sortBy}
                    onValueChange={(value: "updated_at" | "name") => {
                      setSortBy(value);
                      setCurrentPage(1);
                      fetchRepositories(
                        githubToken,
                        1,
                        itemsPerPage,
                        value,
                        value === "updated_at" ? "desc" : "asc",
                        searchTerm
                      );
                      setSortOrder(value === "updated_at" ? "desc" : "asc");
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updated_at">Updated</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-700">
                    Order:
                  </span>
                  <Select
                    value={sortOrder}
                    onValueChange={(value: "asc" | "desc") => {
                      setSortOrder(value);
                      setCurrentPage(1);
                      fetchRepositories(
                        githubToken,
                        1,
                        itemsPerPage,
                        sortBy,
                        value,
                        searchTerm
                      );
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-700">
                    Per page:
                  </span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      const newItemsPerPage = parseInt(value);
                      setItemsPerPage(newItemsPerPage);
                      setCurrentPage(1);
                      // Use the new value directly instead of relying on state
                      fetchRepositories(
                        githubToken,
                        1,
                        newItemsPerPage,
                        sortBy,
                        sortOrder,
                        searchTerm
                      );
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRepos.map((repo) => (
                  <Card
                    key={repo.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleRepositorySelect(repo)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">
                          {repo.name}
                        </h3>
                        {repo.private && (
                          <Badge variant="secondary" className="ml-2">
                            Private
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {repo.description || "No description available"}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-3 h-3 rounded-full ${getLanguageColor(
                                repo.language
                              )}`}
                            ></div>
                            <span>{repo.language}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            <span>{repo.stars}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            <span>{repo.forks}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>Updated {formatDate(repo.updated_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading &&
              repositories.length > 0 &&
              pagination &&
              pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage - 1;
                        setCurrentPage(newPage);
                        fetchRepositories(
                          githubToken,
                          newPage,
                          itemsPerPage,
                          sortBy,
                          sortOrder,
                          searchTerm
                        );
                      }}
                      disabled={!pagination.hasPrevPage || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={
                                pageNum === currentPage ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                setCurrentPage(pageNum);
                                fetchRepositories(
                                  githubToken,
                                  pageNum,
                                  itemsPerPage,
                                  sortBy,
                                  sortOrder,
                                  searchTerm
                                );
                              }}
                              disabled={isLoading}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage + 1;
                        setCurrentPage(newPage);
                        fetchRepositories(
                          githubToken,
                          newPage,
                          itemsPerPage,
                          sortBy,
                          sortOrder,
                          searchTerm
                        );
                      }}
                      disabled={!pagination.hasNextPage || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

            {!isLoading &&
              filteredRepos.length === 0 &&
              repositories.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No repositories found matching your search.
                  </p>
                </div>
              )}

            {!isLoading && repositories.length === 0 && !error && (
              <div className="text-center py-8">
                <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">
                  {githubToken
                    ? "No repositories found in your GitHub account."
                    : "Connect your GitHub account to view your repositories."}
                </p>
                {!githubToken && (
                  <p className="text-sm text-gray-400">
                    You need to have a GitHub username set in your profile and
                    optionally add a GitHub token for private repositories.
                  </p>
                )}
              </div>
            )}
          </div>

          <GitHubTokenDialog
            isOpen={isTokenDialogOpen}
            onClose={() => setIsTokenDialogOpen(false)}
          />
        </div>
      </LayoutWrapper>
    </ProtectedRoute>
  );
}
