"use client"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from "lucide-react"

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

interface FileTreeProps {
  files: FileNode[]
  selectedFiles: Set<string>
  onFileSelect: (filePath: string, checked: boolean) => void
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
  onFileClick?: (file: FileNode) => void
}

export function FileTree({
  files,
  selectedFiles,
  onFileSelect,
  expandedFolders,
  onToggleFolder,
  onFileClick,
}: FileTreeProps) {
  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      TypeScript: "bg-blue-500",
      JavaScript: "bg-yellow-500",
      Python: "bg-green-500",
      SQL: "bg-purple-500",
      Markdown: "bg-gray-500",
      JSON: "bg-orange-500",
      CSS: "bg-pink-500",
      HTML: "bg-red-500",
      Go: "bg-cyan-500",
      Rust: "bg-orange-600",
    }
    return colors[language] || "bg-gray-500"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const renderFileNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFiles.has(node.path)

    if (node.type === "directory") {
      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer group"
            style={{ paddingLeft: `${depth * 20 + 8}px` }}
          >
            <button
              onClick={() => onToggleFolder(node.path)}
              className="flex items-center justify-center w-4 h-4 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-gray-600" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-600" />
              )}
            </button>
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
            )}
            <span className="text-sm font-medium text-gray-900 truncate">{node.name}</span>
            {node.children && (
              <span className="text-xs text-gray-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                {node.children.length} items
              </span>
            )}
          </div>
          {isExpanded && node.children && <div>{node.children.map((child) => renderFileNode(child, depth + 1))}</div>}
        </div>
      )
    }

    return (
      <div
        key={node.id}
        className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer group ${
          isSelected ? "bg-blue-50" : ""
        }`}
        style={{ paddingLeft: `${depth * 20 + 28}px` }}
        onClick={() => onFileClick?.(node)}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onFileSelect(node.path, checked as boolean)}
          onClick={(e) => e.stopPropagation()}
        />
        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="text-sm text-gray-900 truncate flex-1">{node.name}</span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.language && (
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${getLanguageColor(node.language)}`}></div>
              <span className="text-xs text-gray-600">{node.language}</span>
            </div>
          )}
          {node.size && <span className="text-xs text-gray-500">{formatFileSize(node.size)}</span>}
        </div>
      </div>
    )
  }

  return <div className="space-y-1">{files.map((file) => renderFileNode(file))}</div>
}
