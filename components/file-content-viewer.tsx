"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileText, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/auth";
import { getGitHubToken } from "@/lib/github-token";

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  language?: string;
  size?: number;
  extension?: string;
  download_url?: string;
  html_url?: string;
  sha?: string;
  content?: string;
  encoding?: string;
}

interface FileContentViewerProps {
  file: FileNode | null;
  repository?: any;
  currentBranch?: string;
  onClose?: () => void;
}

export function FileContentViewer({
  file,
  repository,
  currentBranch = "main",
}: FileContentViewerProps) {
  const [viewMode, setViewMode] = useState<"code" | "blame">("code");
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load file content when file changes
  useEffect(() => {
    if (file && file.type === "file" && repository) {
      loadFileContent();
    } else {
      setContent("");
      setError(null);
    }
  }, [file, repository, currentBranch]);

  const loadFileContent = async () => {
    if (!file || !repository || file.type !== "file") return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if file is too large (GitHub API limit is 1MB for file contents)
      if (file.size && file.size > 1024 * 1024) {
        setError(
          "File is too large to display (> 1MB). Use the download button to view the file."
        );
        setIsLoading(false);
        return;
      }

      // Check if file is binary based on extension
      const binaryExtensions = [
        ".exe",
        ".dll",
        ".so",
        ".dylib",
        ".bin",
        ".img",
        ".iso",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".bmp",
        ".svg",
        ".ico",
        ".mp3",
        ".mp4",
        ".avi",
        ".mov",
        ".wav",
        ".flac",
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".ppt",
        ".pptx",
        ".zip",
        ".tar",
        ".gz",
        ".rar",
        ".7z",
      ];

      const fileExtension = file.extension?.toLowerCase() || "";
      if (binaryExtensions.includes(fileExtension)) {
        setError(
          "Binary file cannot be displayed. Use the download button to view the file."
        );
        setIsLoading(false);
        return;
      }

      // If we already have content, use it
      if (file.content) {
        const decodedContent =
          file.encoding === "base64" ? atob(file.content) : file.content;
        setContent(decodedContent);
        setIsLoading(false);
        return;
      }

      // If we have a download_url, fetch directly from GitHub
      if (file.download_url) {
        const response = await fetch(file.download_url);
        if (response.ok) {
          const textContent = await response.text();
          setContent(textContent);
          setIsLoading(false);
          return;
        }
      }

      // Otherwise, use our API
      const queryParams = new URLSearchParams();
      queryParams.append("path", file.path);
      if (currentBranch && currentBranch !== "main") {
        queryParams.append("branch", currentBranch);
      }

      // Add access token if available
      const savedToken = getGitHubToken();
      if (savedToken) {
        queryParams.append("access_token", savedToken);
      }

      const endpoint = `/api/github/repository/${encodeURIComponent(
        repository.name
      )}?${queryParams.toString()}`;

      const response = await apiRequest(endpoint, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to fetch file content" }));
        throw new Error(errorData.message || "Failed to fetch file content");
      }

      const result = await response.json();

      if (result.success && result.data) {
        let fileContent = "";

        if (result.data.content) {
          // Decode base64 content if present
          fileContent =
            result.data.encoding === "base64"
              ? atob(result.data.content)
              : result.data.content;
        } else if (result.data.download_url) {
          // Fetch content from download URL
          const contentResponse = await fetch(result.data.download_url);
          if (contentResponse.ok) {
            fileContent = await contentResponse.text();
          } else {
            throw new Error("Failed to fetch file content from GitHub");
          }
        } else {
          throw new Error("No content available for this file");
        }

        setContent(fileContent);
      } else {
        throw new Error(result.message || "Failed to load file content");
      }
    } catch (error) {
      console.error("Error loading file content:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load file content"
      );
      setContent("");
    } finally {
      setIsLoading(false);
    }
  };

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 border-l border-gray-200">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a file to view
          </h3>
          <p className="text-gray-600">
            Choose a file from the tree to see its contents here
          </p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 border-l border-gray-200">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a file to view
          </h3>
          <p className="text-gray-600">
            Choose a file from the tree to see its contents here
          </p>
        </div>
      </div>
    );
  }

  // Show loading state for files
  if (file.type === "file" && isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white border-l border-gray-200">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading file content...
          </h3>
          <p className="text-gray-600">Fetching {file.name} from GitHub</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (file.type === "file" && error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white border-l border-gray-200">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load file
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadFileContent} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show message for directories
  if (file.type === "directory") {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 border-l border-gray-200">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Directory selected
          </h3>
          <p className="text-gray-600">
            {file.name} is a directory. Select a file to view its contents.
          </p>
        </div>
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
    );
  };

  const getLineCount = (content: string) => {
    return content.split("\n").length;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy content:", err);
    }
  };

  const downloadFile = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = getLineCount(content);

  return (
    <div className="flex-1 flex flex-col bg-white border-l border-gray-200">
      {/* File Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">{file.name}</h2>
            {file.language && (
              <Badge variant="secondary">{file.language}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadFile}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-mono">{file.path}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{lineCount} lines</span>
            {file.size && <span>{formatFileSize(file.size)}</span>}
          </div>
        </div>
      </div>

      {/* File Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === "code" ? (
          <div className="font-mono text-sm">
            <div className="flex">
              {/* Line Numbers */}
              <div className="bg-gray-50 border-r border-gray-200 px-3 py-4 text-gray-500 select-none min-w-[60px]">
                {content.split("\n").map((_, index) => (
                  <div key={index} className="text-right leading-6">
                    {index + 1}
                  </div>
                ))}
              </div>

              {/* Code Content */}
              <div className="flex-1 p-4 overflow-x-auto">
                <pre className="leading-6 whitespace-pre">
                  <code className="text-gray-900">{content}</code>
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>Blame view is not available in this demo</p>
            <p className="text-sm mt-2">
              This would show commit information for each line
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
