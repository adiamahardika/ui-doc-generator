"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Zap, CheckCircle, AlertCircle, Search } from "lucide-react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { FileTree } from "@/components/file-tree"
import { FileContentViewer } from "@/components/file-content-viewer"
import { BranchSelector } from "@/components/branch-selector"

interface FileNode {
  id: string
  name: string
  path: string
  type: "file" | "directory"
  children?: FileNode[]
  language?: string
  size?: number
  extension?: string
}

export default function FilesPage() {
  const [user, setUser] = useState<any>(null)
  const [repository, setRepository] = useState<any>(null)
  const [files, setFiles] = useState<FileNode[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileNode[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [currentBranch, setCurrentBranch] = useState("main")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const repoData = sessionStorage.getItem("selected_repository")

    if (!userData || !repoData) {
      router.push("/dashboard")
      return
    }

    setUser(JSON.parse(userData))
    setRepository(JSON.parse(repoData))

    loadFiles()
  }, [router, currentBranch])

  const loadFiles = () => {
    setIsLoading(true)
    setSelectedFile(null)
    // Simulate loading hierarchical file structure
    setTimeout(() => {
      const mockFiles: FileNode[] = [
        {
          id: "1",
          name: "src",
          path: "src",
          type: "directory",
          children: [
            {
              id: "2",
              name: "components",
              path: "src/components",
              type: "directory",
              children: [
                {
                  id: "3",
                  name: "App.tsx",
                  path: "src/components/App.tsx",
                  type: "file",
                  language: "TypeScript",
                  size: 2048,
                  extension: ".tsx",
                },
                {
                  id: "4",
                  name: "Button.tsx",
                  path: "src/components/Button.tsx",
                  type: "file",
                  language: "TypeScript",
                  size: 1024,
                  extension: ".tsx",
                },
                {
                  id: "5",
                  name: "Modal.tsx",
                  path: "src/components/Modal.tsx",
                  type: "file",
                  language: "TypeScript",
                  size: 1536,
                  extension: ".tsx",
                },
              ],
            },
            {
              id: "6",
              name: "utils",
              path: "src/utils",
              type: "directory",
              children: [
                {
                  id: "7",
                  name: "helpers.js",
                  path: "src/utils/helpers.js",
                  type: "file",
                  language: "JavaScript",
                  size: 1536,
                  extension: ".js",
                },
                {
                  id: "8",
                  name: "constants.ts",
                  path: "src/utils/constants.ts",
                  type: "file",
                  language: "TypeScript",
                  size: 512,
                  extension: ".ts",
                },
                {
                  id: "9",
                  name: "api.ts",
                  path: "src/utils/api.ts",
                  type: "file",
                  language: "TypeScript",
                  size: 2048,
                  extension: ".ts",
                },
              ],
            },
            {
              id: "10",
              name: "styles",
              path: "src/styles",
              type: "directory",
              children: [
                {
                  id: "11",
                  name: "globals.css",
                  path: "src/styles/globals.css",
                  type: "file",
                  language: "CSS",
                  size: 1024,
                  extension: ".css",
                },
                {
                  id: "12",
                  name: "components.css",
                  path: "src/styles/components.css",
                  type: "file",
                  language: "CSS",
                  size: 768,
                  extension: ".css",
                },
              ],
            },
            {
              id: "13",
              name: "index.ts",
              path: "src/index.ts",
              type: "file",
              language: "TypeScript",
              size: 256,
              extension: ".ts",
            },
          ],
        },
        {
          id: "14",
          name: "backend",
          path: "backend",
          type: "directory",
          children: [
            {
              id: "15",
              name: "api.py",
              path: "backend/api.py",
              type: "file",
              language: "Python",
              size: 3072,
              extension: ".py",
            },
            {
              id: "16",
              name: "models.py",
              path: "backend/models.py",
              type: "file",
              language: "Python",
              size: 1536,
              extension: ".py",
            },
            {
              id: "17",
              name: "database.py",
              path: "backend/database.py",
              type: "file",
              language: "Python",
              size: 2048,
              extension: ".py",
            },
          ],
        },
        {
          id: "18",
          name: "docs",
          path: "docs",
          type: "directory",
          children: [
            {
              id: "19",
              name: "README.md",
              path: "docs/README.md",
              type: "file",
              language: "Markdown",
              size: 2048,
              extension: ".md",
            },
            {
              id: "20",
              name: "API.md",
              path: "docs/API.md",
              type: "file",
              language: "Markdown",
              size: 1536,
              extension: ".md",
            },
          ],
        },
        {
          id: "21",
          name: "package.json",
          path: "package.json",
          type: "file",
          language: "JSON",
          size: 1024,
          extension: ".json",
        },
        {
          id: "22",
          name: "tsconfig.json",
          path: "tsconfig.json",
          type: "file",
          language: "JSON",
          size: 512,
          extension: ".json",
        },
        {
          id: "23",
          name: "README.md",
          path: "README.md",
          type: "file",
          language: "Markdown",
          size: 2048,
          extension: ".md",
        },
      ]

      setFiles(mockFiles)
      setFilteredFiles(mockFiles)
      // Auto-expand first level directories
      setExpandedFolders(new Set(["src", "backend", "docs"]))
      setIsLoading(false)
    }, 1000)
  }

  const handleBranchChange = (branch: string) => {
    setCurrentBranch(branch)
    setSelectedFiles(new Set())
    setExpandedFolders(new Set(["src", "backend", "docs"]))
  }

  const handleToggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const handleFileClick = (file: FileNode) => {
    setSelectedFile(file)
  }

  const getAllFiles = (nodes: FileNode[]): FileNode[] => {
    let allFiles: FileNode[] = []
    nodes.forEach((node) => {
      if (node.type === "file") {
        allFiles.push(node)
      } else if (node.children) {
        allFiles = allFiles.concat(getAllFiles(node.children))
      }
    })
    return allFiles
  }

  const searchFiles = (nodes: FileNode[], term: string): FileNode[] => {
    const results: FileNode[] = []

    nodes.forEach((node) => {
      if (node.type === "file") {
        if (
          node.name.toLowerCase().includes(term.toLowerCase()) ||
          node.path.toLowerCase().includes(term.toLowerCase())
        ) {
          results.push(node)
        }
      } else if (node.children) {
        const childResults = searchFiles(node.children, term)
        results.push(...childResults)
      }
    })

    return results
  }

  useEffect(() => {
    if (searchTerm) {
      const searchResults = searchFiles(files, searchTerm)
      setFilteredFiles(searchResults)
    } else {
      setFilteredFiles(files)
    }
  }, [searchTerm, files])

  const handleFileSelect = (filePath: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles)
    if (checked) {
      newSelected.add(filePath)
    } else {
      newSelected.delete(filePath)
    }
    setSelectedFiles(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFiles = getAllFiles(files)
      const allFilePaths = allFiles.map((file) => file.path)
      setSelectedFiles(new Set(allFilePaths))
    } else {
      setSelectedFiles(new Set())
    }
  }

  const generateDocumentation = async () => {
    if (selectedFiles.size === 0) {
      setNotification({
        type: "error",
        message: "Please select at least one file to generate documentation.",
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setNotification(null)

    // Simulate documentation generation with progress
    const totalFiles = selectedFiles.size

    for (let i = 0; i < totalFiles; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate processing time
      setProgress(((i + 1) / totalFiles) * 100)
    }

    // Simulate download
    setTimeout(() => {
      setIsGenerating(false)
      setNotification({
        type: "success",
        message: `Documentation generated successfully for ${totalFiles} files! Download started automatically.`,
      })

      // Create a mock download
      const link = document.createElement("a")
      link.href = "data:text/plain;charset=utf-8,Mock documentation files generated"
      link.download = `${repository.name}-${currentBranch}-documentation.zip`
      link.click()

      // Clear selection after successful generation
      setSelectedFiles(new Set())
    }, 500)
  }

  if (!user || !repository) {
    return <div>Loading...</div>
  }

  const allFiles = getAllFiles(files)
  const totalFiles = allFiles.length

  return (
    <LayoutWrapper user={user}>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{repository.name}</h1>
                    <Badge variant="secondary">{repository.language}</Badge>
                  </div>
                  <p className="text-gray-600 text-sm">{repository.description || "Repository file browser"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {selectedFiles.size} of {totalFiles} selected
                </span>
                <Button
                  onClick={generateDocumentation}
                  disabled={selectedFiles.size === 0 || isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-pulse" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Documentation
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Branch Selector */}
            <BranchSelector currentBranch={currentBranch} onBranchChange={handleBranchChange} repository={repository} />
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="container mx-auto px-4 pt-4">
            <Alert
              className={`${notification.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={notification.type === "success" ? "text-green-800" : "text-red-800"}>
                {notification.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Progress Bar */}
        {isGenerating && (
          <div className="container mx-auto px-4 pt-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Generating documentation for {selectedFiles.size} files...
                </span>
                <span className="text-sm text-blue-700">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-blue-600 mt-2">
                Using GPT-4 to analyze code and generate comprehensive documentation
              </p>
            </div>
          </div>
        )}

        {/* Main Content - Split Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane - File Tree */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Search and Controls */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={totalFiles > 0 && selectedFiles.size === totalFiles}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All
                  </label>
                </div>
                <Badge variant="outline" className="text-xs">
                  {totalFiles} files
                </Badge>
              </div>
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchTerm ? (
                // Search results view
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Found {filteredFiles.length} files matching "{searchTerm}"
                  </p>
                  <div className="space-y-1">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer ${
                          selectedFile?.path === file.path ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleFileClick(file)}
                      >
                        <Checkbox
                          checked={selectedFiles.has(file.path)}
                          onCheckedChange={(checked) => handleFileSelect(file.path, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm text-gray-700 truncate">{file.path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Tree view
                <div className="p-2">
                  <FileTree
                    files={files}
                    selectedFiles={selectedFiles}
                    onFileSelect={handleFileSelect}
                    expandedFolders={expandedFolders}
                    onToggleFolder={handleToggleFolder}
                    onFileClick={handleFileClick}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Pane - File Content */}
          <FileContentViewer file={selectedFile} />
        </div>
      </div>
    </LayoutWrapper>
  )
}
