"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Zap,
  CheckCircle,
  AlertCircle,
  Search,
  Key,
  Clock,
  X,
  Check,
} from "lucide-react";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { FileTree } from "@/components/file-tree";
import { FileContentViewer } from "@/components/file-content-viewer";
import { BranchSelector } from "@/components/branch-selector";
import { GitHubTokenDialog } from "@/components/github-token-dialog";
import { apiRequest } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { getGitHubToken, getGitHubTokenData } from "@/lib/github-token";

// PDF and ZIP utilities
import { generateAdvancedPDF } from "@/lib/pdf-generator";

const generatePDFFromMarkdown = async (
  markdown: string,
  fileName: string
): Promise<Blob> => {
  try {
    return await generateAdvancedPDF(markdown, fileName);
  } catch (error) {
    console.error("Error generating advanced PDF:", error);
    // Fallback to simple jsPDF if advanced fails
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const lines = markdown.split("\n");
    let yPosition = 50;
    const lineHeight = 6;

    for (const line of lines) {
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }

      let processedLine = line;
      let fontSize = 10;
      let fontStyle: "normal" | "bold" = "normal";

      if (line.startsWith("# ")) {
        processedLine = line.substring(2);
        fontSize = 14;
        fontStyle = "bold";
      } else if (line.startsWith("## ")) {
        processedLine = line.substring(3);
        fontSize = 12;
        fontStyle = "bold";
      } else if (line.startsWith("### ")) {
        processedLine = line.substring(4);
        fontSize = 11;
        fontStyle = "bold";
      }

      doc.setFontSize(fontSize);
      doc.setFont("helvetica", fontStyle);

      const splitLines = doc.splitTextToSize(processedLine, maxWidth);
      for (const splitLine of splitLines) {
        if (yPosition > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(splitLine, margin, yPosition);
        yPosition += lineHeight;
      }

      yPosition += 2;
    }

    return new Blob([doc.output("blob")], { type: "application/pdf" });
  }
};

const createZipWithPDFs = async (
  pdfs: Array<{ fileName: string; pdf: Blob }>
): Promise<Blob> => {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  for (const { fileName, pdf } of pdfs) {
    const path = fileName.replace(".", "_").split("/");
    let name = `${path[path.length - 1]}`;
    if (path.length > 1) {
      name = `${path[path.length - 2]}_${path[path.length - 1]}`;
    }
    const pdfName = name + ".pdf";
    zip.file(pdfName, pdf);
  }

  return await zip.generateAsync({ type: "blob" });
};

const downloadFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  language?: string;
  size?: number;
  extension?: string;
  download_url?: string;
  html_url?: string;
  sha?: string;
  content?: string;
  encoding?: string;
}

interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file" | "dir";
  content?: string;
  encoding?: string;
}

export default function FilesPage() {
  const [user, setUser] = useState<any>(null);
  const [repository, setRepository] = useState<any>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileNode[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [currentBranch, setCurrentBranch] = useState("main");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // GitHub token state
  const [githubToken, setGithubToken] = useState("");
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);

  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Don't proceed if auth is still loading
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    const userData = localStorage.getItem("user");
    const repoData = sessionStorage.getItem("selected_repository");

    if (!userData || !repoData) {
      router.push("/dashboard");
      return;
    }

    const parsedUser = JSON.parse(userData);
    const parsedRepo = JSON.parse(repoData);

    setUser(parsedUser);
    setRepository(parsedRepo);
  }, [router, authLoading, isAuthenticated]);

  // Initialize GitHub token state
  useEffect(() => {
    const tokenData = getGitHubTokenData();
    const token = getGitHubToken();

    if (tokenData && token) {
      // Check if it's a logout-only token (expiresAt will be null)
      if (
        tokenData.expiresAt === null ||
        tokenData.expirationMode === "logout"
      ) {
        // Logout-only token, use it without expiration
        setGithubToken(token);
        setTokenExpiresAt(null);
        setTokenExpired(false);
      } else {
        // Check if token has expired
        if (Date.now() > tokenData.expiresAt) {
          // Token has expired, remove it
          sessionStorage.removeItem("github_token");
          sessionStorage.removeItem("github_token_timeout");
          setGithubToken("");
          setTokenExpiresAt(null);
          setTokenExpired(true);
        } else {
          setGithubToken(token);
          setTokenExpiresAt(tokenData.expiresAt);
          setTokenExpired(false);
        }
      }
    } else if (token) {
      // Old format token (string), use it but treat as no expiration
      setGithubToken(token);
      setTokenExpiresAt(null);
      setTokenExpired(false);
    } else {
      // No token
      setGithubToken("");
      setTokenExpiresAt(null);
      setTokenExpired(false);
    }
  }, []);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Separate effect for loading files when repository or branch changes
  useEffect(() => {
    if (repository) {
      loadFiles();
    }
  }, [repository, currentBranch]);

  // Helper function to get time remaining for token expiration
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

  // Event listeners for GitHub token updates
  useEffect(() => {
    const handleTokenUpdate = (event: CustomEvent) => {
      const { token, expiresAt } = event.detail;
      setGithubToken(token);
      setTokenExpiresAt(expiresAt);
      setTokenExpired(false);
    };

    const handleTokenRemove = () => {
      setGithubToken("");
      setTokenExpiresAt(null);
      setTokenExpired(false);
    };

    const handleTokenExpired = () => {
      setGithubToken("");
      setTokenExpiresAt(null);
      setTokenExpired(true);
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
        clearInterval(interval);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [tokenExpiresAt, tokenExpired]);

  const loadFiles = async (path: string = "") => {
    if (!repository) return;

    // setIsLoading(true);
    setSelectedFile(null);

    try {
      const queryParams = new URLSearchParams();
      if (path) queryParams.append("path", path);
      if (currentBranch && currentBranch !== "main")
        queryParams.append("branch", currentBranch);

      // Add access token if available
      const savedToken = getGitHubToken();
      if (savedToken) {
        queryParams.append("access_token", savedToken);
      }

      const endpoint = `/api/github/repository/${encodeURIComponent(
        repository.name
      )}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const response = await apiRequest(endpoint, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to fetch repository contents" }));
        throw new Error(
          errorData.message || "Failed to fetch repository contents"
        );
      }

      const result = await response.json();

      if (result.success && result.data) {
        const transformedFiles = transformGitHubResponse(result.data, path);

        if (path === "") {
          // Root directory - set as main files
          setFiles(transformedFiles);
          setFilteredFiles(transformedFiles);
          // Keep all folders collapsed by default
          setExpandedFolders(new Set());
        } else {
          // Subdirectory - update the files tree
          updateFilesWithSubdirectory(path, transformedFiles);
        }
      } else {
        throw new Error(result.message || "Failed to load repository contents");
      }
    } catch (error) {
      console.error("Error loading files:", error);
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load repository files",
      });
      // Fall back to empty state
      setFiles([]);
      setFilteredFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const transformGitHubResponse = (
    data: GitHubFileContent[],
    basePath: string = ""
  ): FileNode[] => {
    return data.map((item, index) => {
      const extension =
        item.type === "file" ? getFileExtension(item.name) : undefined;
      const language = extension
        ? getLanguageFromExtension(extension)
        : undefined;

      return {
        id: `${basePath}-${index}-${item.sha}`,
        name: item.name,
        path: item.path,
        type: item.type === "dir" ? "directory" : "file",
        size: item.size,
        extension,
        language,
        download_url: item.download_url || undefined,
        html_url: item.html_url,
        sha: item.sha,
        children: item.type === "dir" ? [] : undefined,
      };
    });
  };

  const getFileExtension = (filename: string): string => {
    const lastDot = filename.lastIndexOf(".");
    return lastDot > 0 ? filename.substring(lastDot) : "";
  };

  const getLanguageFromExtension = (extension: string): string => {
    const languageMap: Record<string, string> = {
      ".js": "JavaScript",
      ".jsx": "JavaScript",
      ".ts": "TypeScript",
      ".tsx": "TypeScript",
      ".py": "Python",
      ".java": "Java",
      ".cpp": "C++",
      ".c": "C",
      ".cs": "C#",
      ".php": "PHP",
      ".rb": "Ruby",
      ".go": "Go",
      ".rs": "Rust",
      ".swift": "Swift",
      ".kt": "Kotlin",
      ".html": "HTML",
      ".css": "CSS",
      ".scss": "SCSS",
      ".sass": "Sass",
      ".less": "Less",
      ".md": "Markdown",
      ".json": "JSON",
      ".xml": "XML",
      ".yaml": "YAML",
      ".yml": "YAML",
      ".sql": "SQL",
      ".sh": "Shell",
      ".bash": "Bash",
      ".dockerfile": "Dockerfile",
      ".vue": "Vue",
      ".svelte": "Svelte",
    };
    return languageMap[extension.toLowerCase()] || "Text";
  };

  const updateFilesWithSubdirectory = (
    path: string,
    subdirectoryFiles: FileNode[]
  ) => {
    const updateFileTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.type === "directory" && node.path === path) {
          return {
            ...node,
            children: subdirectoryFiles,
          };
        } else if (node.children) {
          return {
            ...node,
            children: updateFileTree(node.children),
          };
        }
        return node;
      });
    };

    const updatedFiles = updateFileTree(files);
    setFiles(updatedFiles);
    setFilteredFiles(updatedFiles);
  };

  const handleBranchChange = (branch: string) => {
    setCurrentBranch(branch);
    setSelectedFiles(new Set());
    setExpandedFolders(new Set());
    loadFiles(); // Reload files for the new branch
  };

  const handleToggleFolder = async (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);

      // Check if this directory's children are already loaded
      const findDirectory = (
        nodes: FileNode[],
        targetPath: string
      ): FileNode | null => {
        for (const node of nodes) {
          if (node.path === targetPath) return node;
          if (node.children) {
            const found = findDirectory(node.children, targetPath);
            if (found) return found;
          }
        }
        return null;
      };

      const directory = findDirectory(files, path);
      if (
        directory &&
        directory.type === "directory" &&
        (!directory.children || directory.children.length === 0)
      ) {
        // Load directory contents
        await loadFiles(path);
      }
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = async (file: FileNode) => {
    setSelectedFile(file);

    // If it's a file and we don't have content yet, fetch it
    if (file.type === "file" && !file.download_url) {
      try {
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

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Update the selected file with content
            setSelectedFile({
              ...file,
              download_url: result.data.download_url,
              content: result.data.content,
              encoding: result.data.encoding,
            });
          }
        }
      } catch (error) {
        console.error("Error loading file content:", error);
      }
    }
  };

  const getAllFiles = (nodes: FileNode[]): FileNode[] => {
    let allFiles: FileNode[] = [];
    nodes.forEach((node) => {
      if (node.type === "file") {
        allFiles.push(node);
      } else if (node.children) {
        allFiles = allFiles.concat(getAllFiles(node.children));
      }
    });
    return allFiles;
  };

  const searchFiles = (nodes: FileNode[], term: string): FileNode[] => {
    const results: FileNode[] = [];

    nodes.forEach((node) => {
      if (node.type === "file") {
        if (
          node.name.toLowerCase().includes(term.toLowerCase()) ||
          node.path.toLowerCase().includes(term.toLowerCase())
        ) {
          results.push(node);
        }
      } else if (node.children) {
        const childResults = searchFiles(node.children, term);
        results.push(...childResults);
      }
    });

    return results;
  };

  useEffect(() => {
    if (searchTerm) {
      const searchResults = searchFiles(files, searchTerm);
      setFilteredFiles(searchResults);
    } else {
      setFilteredFiles(files);
    }
  }, [searchTerm, files]);

  const handleFileSelect = (filePath: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      // Check if adding this file would exceed the limit
      if (newSelected.size >= 5) {
        setNotification({
          type: "error",
          message:
            "Maximum 5 files can be selected for documentation generation.",
        });
        return;
      }
      newSelected.add(filePath);
    } else {
      newSelected.delete(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const handleUnselectAll = () => {
    setSelectedFiles(new Set());
  };

  const generateDocumentation = async () => {
    if (selectedFiles.size === 0) {
      setNotification({
        type: "error",
        message: "Please select at least one file to generate documentation.",
      });
      return;
    }

    if (selectedFiles.size > 5) {
      setNotification({
        type: "error",
        message:
          "Maximum 5 files allowed per request. Please deselect some files.",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setNotification(null);

    try {
      // Step 1: Fetch file contents and prepare for API
      setProgress(10);
      const selectedFilePaths = Array.from(selectedFiles);
      const filesData = [];

      // Get all files data including content
      const allFiles = getAllFiles(files);

      for (let i = 0; i < selectedFilePaths.length; i++) {
        const filePath = selectedFilePaths[i];
        const fileNode = allFiles.find((f) => f.path === filePath);

        if (!fileNode) continue;

        try {
          // Fetch file content if not already loaded
          let fileContent = fileNode.content;
          let encoding = fileNode.encoding;

          if (!fileContent) {
            // Fetch file content from GitHub API
            const queryParams = new URLSearchParams();
            queryParams.append("path", filePath);
            if (currentBranch && currentBranch !== "main") {
              queryParams.append("branch", currentBranch);
            }

            const savedToken = getGitHubToken();
            if (savedToken) {
              queryParams.append("access_token", savedToken);
            }

            const endpoint = `/api/github/repository/${encodeURIComponent(
              repository.name
            )}?${queryParams.toString()}`;

            const response = await apiRequest(endpoint, { method: "GET" });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                fileContent = result.data.content;
                encoding = result.data.encoding;
              }
            }
          }

          if (fileContent && encoding === "base64") {
            filesData.push({
              file_name: fileNode.path,
              base64: fileContent, // Already base64 encoded from GitHub
            });
          }
        } catch (error) {
          console.error(`Error fetching content for ${filePath}:`, error);
        }

        setProgress(10 + ((i + 1) / selectedFilePaths.length) * 30);
      }

      if (filesData.length === 0) {
        throw new Error("No valid files found to process");
      }

      // Step 2: Call OpenAI documentation generation API
      setProgress(50);
      const docResponse = await apiRequest(
        "/api/openai/generate-documentation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            files: filesData,
          }),
        }
      );

      if (!docResponse.ok) {
        const errorData = await docResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to generate documentation"
        );
      }

      const docResult = await docResponse.json();
      setProgress(80);

      if (!docResult.success || !docResult.data?.results) {
        throw new Error(docResult.message || "Documentation generation failed");
      }

      // Step 3: Generate PDFs and handle download
      const results = docResult.data.results;
      const errors = docResult.data.errors || [];

      if (results.length === 0) {
        throw new Error("No documentation was generated");
      }

      // Generate PDFs for each successful result
      const pdfs = await Promise.all(
        results.map(async (result: any) => {
          const pdf = await generatePDFFromMarkdown(
            result.documentation,
            result.file
          );
          return { fileName: result.file, pdf };
        })
      );

      setProgress(95);

      // Step 4: Handle download
      if (pdfs.length === 1) {
        // Single file - direct PDF download
        const { fileName, pdf } = pdfs[0];
        const path = fileName.replace(".", "_").split("/");
        let name = `${path[path.length - 1]}`;
        if (path.length > 1) {
          name = `${path[path.length - 2]}_${path[path.length - 1]}`;
        }
        const pdfName = name + ".pdf";
        downloadFile(pdf, pdfName);
      } else {
        // Multiple files - create ZIP
        const zip = await createZipWithPDFs(pdfs);
        const zipName = `${repository.name}_${currentBranch}.zip`;
        downloadFile(zip, zipName);
      }

      setProgress(100);

      // Success notification
      const successMessage =
        errors.length > 0
          ? `Documentation generated for ${results.length} files successfully. ${errors.length} files failed.`
          : `Documentation generated successfully for ${results.length} files!`;

      setNotification({
        type: "success",
        message: successMessage,
      });

      // Clear selection after successful generation
      setSelectedFiles(new Set());
    } catch (error) {
      console.error("Error generating documentation:", error);
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate documentation",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  if (authLoading || !user || !repository) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? "Loading..." : "Loading repository data..."}
          </p>
        </div>
      </div>
    );
  }

  const allFiles = getAllFiles(files);
  const totalFiles = allFiles.length;

  return (
    <LayoutWrapper user={user}>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {repository.name}
                    </h1>
                    <Badge variant="secondary">{repository.language}</Badge>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {repository.description || "Repository file browser"}
                  </p>
                </div>
              </div>

              {/* GitHub Token Status */}
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
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Branch Selector */}
                <BranchSelector
                  currentBranch={currentBranch}
                  onBranchChange={handleBranchChange}
                  repository={repository}
                />
              </div>

              <div className="flex items-center gap-4">
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
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="container mx-auto px-4 pt-4">
            <Alert
              className={`${
                notification.type === "success"
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={
                  notification.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }
              >
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
                <span className="text-sm text-blue-700">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
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
                <div className="text-sm font-medium text-gray-700">
                  File Selection
                </div>
                <div className="flex items-center gap-2">
                  {selectedFiles.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUnselectAll}
                      className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
                    >
                      Unselect All
                    </Button>
                  )}
                  <div className="text-xs text-gray-500">
                    {selectedFiles.size}/5 selected
                  </div>
                </div>
              </div>
              {selectedFiles.size > 0 && (
                <div className="mt-2 text-xs text-blue-600">
                  Maximum 5 files per documentation request
                </div>
              )}
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-3 animate-pulse"
                    >
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
                          onCheckedChange={(checked) =>
                            handleFileSelect(file.path, checked as boolean)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm text-gray-700 truncate">
                          {file.path}
                        </span>
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
          <FileContentViewer
            file={selectedFile}
            repository={repository}
            currentBranch={currentBranch}
          />
        </div>
      </div>

      {/* GitHub Token Dialog */}
      <GitHubTokenDialog
        isOpen={isTokenDialogOpen}
        onClose={() => setIsTokenDialogOpen(false)}
      />
    </LayoutWrapper>
  );
}
