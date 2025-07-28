"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Search, Star, GitFork, Calendar, Key, RefreshCw } from "lucide-react"
import { LayoutWrapper } from "@/components/layout-wrapper"

interface Repository {
  id: number
  name: string
  description: string
  language: string
  stars: number
  forks: number
  updated_at: string
  private: boolean
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [githubToken, setGithubToken] = useState("")
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [tokenSaved, setTokenSaved] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    setUser(JSON.parse(userData))

    // Check if token is already saved in session
    const savedToken = sessionStorage.getItem("github_token")
    if (savedToken) {
      setGithubToken(savedToken)
      setTokenSaved(true)
      fetchRepositories(savedToken)
    }
  }, [router])

  useEffect(() => {
    if (searchTerm) {
      const filtered = repositories.filter(
        (repo) =>
          repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredRepos(filtered)
    } else {
      setFilteredRepos(repositories)
    }
  }, [searchTerm, repositories])

  const fetchRepositories = async (token: string) => {
    setIsLoading(true)
    setError("")

    // Simulate API call with mock data
    setTimeout(() => {
      const mockRepos: Repository[] = [
        {
          id: 1,
          name: "react-dashboard",
          description: "A modern React dashboard with TypeScript",
          language: "TypeScript",
          stars: 245,
          forks: 32,
          updated_at: "2024-01-15T10:30:00Z",
          private: false,
        },
        {
          id: 2,
          name: "python-api-server",
          description: "RESTful API server built with Flask and SQLAlchemy",
          language: "Python",
          stars: 89,
          forks: 15,
          updated_at: "2024-01-10T14:20:00Z",
          private: true,
        },
        {
          id: 3,
          name: "mobile-app",
          description: "Cross-platform mobile app using React Native",
          language: "JavaScript",
          stars: 156,
          forks: 28,
          updated_at: "2024-01-12T09:15:00Z",
          private: false,
        },
        {
          id: 4,
          name: "data-analysis-toolkit",
          description: "Python toolkit for data analysis and visualization",
          language: "Python",
          stars: 312,
          forks: 67,
          updated_at: "2024-01-14T16:45:00Z",
          private: false,
        },
        {
          id: 5,
          name: "microservices-demo",
          description: "Microservices architecture demo with Docker",
          language: "Go",
          stars: 78,
          forks: 12,
          updated_at: "2024-01-08T11:30:00Z",
          private: true,
        },
      ]

      setRepositories(mockRepos)
      setFilteredRepos(mockRepos)
      setIsLoading(false)
    }, 1500)
  }

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!githubToken.trim()) {
      setError("Please enter your GitHub Personal Access Token")
      return
    }

    // Save token to session storage (not permanent)
    sessionStorage.setItem("github_token", githubToken)
    setTokenSaved(true)
    fetchRepositories(githubToken)
  }

  const handleRepositorySelect = (repo: Repository) => {
    // Store selected repository in session storage
    sessionStorage.setItem("selected_repository", JSON.stringify(repo))
    router.push("/files")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      TypeScript: "bg-blue-500",
      JavaScript: "bg-yellow-500",
      Python: "bg-green-500",
      Go: "bg-cyan-500",
      Java: "bg-orange-500",
      "C++": "bg-purple-500",
    }
    return colors[language] || "bg-gray-500"
  }

  useEffect(() => {
    const handleTokenUpdate = (event: CustomEvent) => {
      const newToken = event.detail.token
      setGithubToken(newToken)
      setTokenSaved(true)
      fetchRepositories(newToken)
    }

    const handleTokenRemove = () => {
      setGithubToken("")
      setTokenSaved(false)
      setRepositories([])
      setFilteredRepos([])
    }

    window.addEventListener("github-token-updated", handleTokenUpdate as EventListener)
    window.addEventListener("github-token-removed", handleTokenRemove as EventListener)

    return () => {
      window.removeEventListener("github-token-updated", handleTokenUpdate as EventListener)
      window.removeEventListener("github-token-removed", handleTokenRemove as EventListener)
    }
  }, [])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <LayoutWrapper user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Connect your GitHub account and select repositories to generate documentation</p>
        </div>

        {!tokenSaved ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                GitHub Personal Access Token
              </CardTitle>
              <CardDescription>
                Enter your GitHub PAT to access your repositories. The token is only stored for this session and is not
                saved permanently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTokenSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Github className="h-4 w-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  <p className="mb-2">To create a Personal Access Token:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                    <li>Click "Generate new token (classic)"</li>
                    <li>Select "repo" scope for repository access</li>
                    <li>Copy and paste the token above</li>
                  </ol>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold text-gray-900">Your Repositories</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Connected to GitHub
                </Badge>
              </div>
              <Button variant="outline" onClick={() => fetchRepositories(githubToken)} disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

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
                        <h3 className="font-semibold text-lg text-gray-900 truncate">{repo.name}</h3>
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
                            <div className={`w-3 h-3 rounded-full ${getLanguageColor(repo.language)}`}></div>
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

            {!isLoading && filteredRepos.length === 0 && repositories.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No repositories found matching your search.</p>
              </div>
            )}

            {!isLoading && repositories.length === 0 && (
              <div className="text-center py-8">
                <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No repositories found. Make sure your token has the correct permissions.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutWrapper>
  )
}
