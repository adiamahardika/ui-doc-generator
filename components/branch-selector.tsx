"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, GitBranch, RefreshCw } from "lucide-react"

interface Branch {
  name: string
  isDefault: boolean
  lastCommit: {
    message: string
    author: string
    date: string
    sha: string
  }
}

interface BranchSelectorProps {
  currentBranch: string
  onBranchChange: (branch: string) => void
  repository: any
}

export function BranchSelector({ currentBranch, onBranchChange, repository }: BranchSelectorProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Mock branches data
  const branches: Branch[] = [
    {
      name: "main",
      isDefault: true,
      lastCommit: {
        message: "Add new authentication system",
        author: "John Doe",
        date: "2 hours ago",
        sha: "abc123f",
      },
    },
    {
      name: "develop",
      isDefault: false,
      lastCommit: {
        message: "Update API endpoints",
        author: "Jane Smith",
        date: "1 day ago",
        sha: "def456a",
      },
    },
    {
      name: "feature/user-management",
      isDefault: false,
      lastCommit: {
        message: "Implement user roles",
        author: "Bob Wilson",
        date: "3 days ago",
        sha: "ghi789b",
      },
    },
    {
      name: "hotfix/security-patch",
      isDefault: false,
      lastCommit: {
        message: "Fix security vulnerability",
        author: "Alice Brown",
        date: "1 week ago",
        sha: "jkl012c",
      },
    },
  ]

  const handleRefresh = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const currentBranchData = branches.find((b) => b.name === currentBranch) || branches[0]

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <GitBranch className="h-4 w-4" />
            <span className="font-medium">{currentBranch}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="start">
          <div className="p-2 border-b">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Switch branches/tags</h4>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {branches.map((branch) => (
              <DropdownMenuItem
                key={branch.name}
                onClick={() => onBranchChange(branch.name)}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <GitBranch className="h-3 w-3 text-gray-500" />
                  <span className="font-medium text-sm">{branch.name}</span>
                  {branch.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      default
                    </Badge>
                  )}
                  {branch.name === currentBranch && (
                    <Badge variant="default" className="text-xs">
                      current
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-600 ml-5">
                  <div className="truncate max-w-60">{branch.lastCommit.message}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span>{branch.lastCommit.author}</span>
                    <span>•</span>
                    <span>{branch.lastCommit.date}</span>
                    <span>•</span>
                    <code className="bg-gray-100 px-1 rounded text-xs">{branch.lastCommit.sha}</code>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="text-sm text-gray-600">
        <span className="font-medium">{currentBranchData.lastCommit.author}</span>
        <span className="mx-2">•</span>
        <span>{currentBranchData.lastCommit.date}</span>
      </div>
    </div>
  )
}
