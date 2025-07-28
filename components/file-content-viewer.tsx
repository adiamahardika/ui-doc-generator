"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Download, Edit, Eye, FileText, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface FileNode {
  id: string
  name: string
  path: string
  type: "file" | "directory"
  language?: string
  size?: number
  extension?: string
}

interface FileContentViewerProps {
  file: FileNode | null
  onClose?: () => void
}

export function FileContentViewer({ file, onClose }: FileContentViewerProps) {
  const [viewMode, setViewMode] = useState<"code" | "blame">("code")

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 border-l border-gray-200">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a file to view</h3>
          <p className="text-gray-600">Choose a file from the tree to see its contents here</p>
        </div>
      </div>
    )
  }

  const getFileContent = (file: FileNode) => {
    // Mock file content based on file type
    const contents: Record<string, string> = {
      ".tsx": `import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AppProps {
  title: string
  children: React.ReactNode
}

export default function App({ title, children }: AppProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleClick = () => {
    setIsLoading(true)
    // Simulate async operation
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleClick} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Click me'}
          </Button>
          {children}
        </CardContent>
      </Card>
    </div>
  )
}`,
      ".ts": `export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'moderator'
  createdAt: Date
  updatedAt: Date
}

export interface Repository {
  id: string
  name: string
  description?: string
  language: string
  isPrivate: boolean
  owner: User
  collaborators: User[]
}

export const API_ENDPOINTS = {
  USERS: '/api/users',
  REPOSITORIES: '/api/repositories',
  AUTH: '/api/auth',
} as const

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export async function fetchUser(id: string): Promise<User | null> {
  try {
    const response = await fetch(\`\${API_ENDPOINTS.USERS}/\${id}\`)
    if (!response.ok) throw new Error('User not found')
    return await response.json()
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}`,
      ".js": `const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.get('/api/users', async (req, res) => {
  try {
    // Mock user data
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ]
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`)
})`,
      ".py": `import os
import json
from datetime import datetime
from typing import List, Optional, Dict, Any

class DatabaseManager:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.connection = None
    
    def connect(self) -> bool:
        """Establish database connection"""
        try:
            # Mock connection logic
            print(f"Connecting to database: {self.connection_string}")
            self.connection = True
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False
    
    def execute_query(self, query: str, params: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Execute SQL query and return results"""
        if not self.connection:
            raise Exception("No database connection")
        
        # Mock query execution
        print(f"Executing query: {query}")
        if params:
            print(f"Parameters: {params}")
        
        # Return mock results
        return [
            {"id": 1, "name": "Sample Record", "created_at": datetime.now()},
            {"id": 2, "name": "Another Record", "created_at": datetime.now()},
        ]
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection = None
            print("Database connection closed")

def main():
    db = DatabaseManager("postgresql://localhost:5432/mydb")
    if db.connect():
        results = db.execute_query("SELECT * FROM users WHERE active = %(active)s", {"active": True})
        print(json.dumps(results, indent=2, default=str))
        db.close()

if __name__ == "__main__":
    main()`,
      ".css": `/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

/* Layout Components */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #007bff;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-links {
    flex-direction: column;
    gap: 1rem;
  }
}`,
      ".md": `# Project Documentation

## Overview

This project is a comprehensive web application built with modern technologies to provide automated code documentation generation using Large Language Models (LLMs).

## Features

- **GitHub Integration**: Connect your GitHub repositories seamlessly
- **Multi-file Selection**: Choose specific files for documentation generation
- **Branch Support**: Work with different branches of your repository
- **User Management**: Complete user authentication and authorization system
- **Admin Dashboard**: Comprehensive admin panel for user and activity management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- GitHub Personal Access Token

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/ai-docs-generator.git
cd ai-docs-generator
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## Usage

1. **Sign up** for a new account or **log in** to your existing account
2. **Connect your GitHub** account by providing a Personal Access Token
3. **Select a repository** from your GitHub account
4. **Choose files** you want to generate documentation for
5. **Generate documentation** using AI-powered analysis
6. **Download** the generated documentation files

## API Reference

### Authentication

All API endpoints require authentication via JWT tokens.

### Endpoints

- \`GET /api/repositories\` - Get user repositories
- \`POST /api/generate\` - Generate documentation
- \`GET /api/files/:repo/:branch\` - Get repository files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.`,
      ".json": `{
  "name": "ai-docs-generator",
  "version": "1.0.0",
  "description": "Automated code documentation generation using LLMs",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.263.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.0.0",
    "@tailwindcss/typography": "^0.5.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  },
  "keywords": [
    "documentation",
    "ai",
    "llm",
    "github",
    "automation",
    "nextjs",
    "react",
    "typescript"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/ai-docs-generator.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/ai-docs-generator/issues"
  },
  "homepage": "https://github.com/your-username/ai-docs-generator#readme"
}`,
    }

    return contents[file.extension || ".txt"] || "// File content not available for preview"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getLineCount = (content: string) => {
    return content.split("\n").length
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getFileContent(file))
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy content:", err)
    }
  }

  const downloadFile = () => {
    const content = getFileContent(file)
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const content = getFileContent(file)
  const lineCount = getLineCount(content)

  return (
    <div className="flex-1 flex flex-col bg-white border-l border-gray-200">
      {/* File Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">{file.name}</h2>
            {file.language && <Badge variant="secondary">{file.language}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadFile}>
              <Download className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadFile}>
                  <Download className="h-4 w-4 mr-2" />
                  Download file
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 mt-3">
          <Button variant={viewMode === "code" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("code")}>
            <Eye className="h-4 w-4 mr-1" />
            Code
          </Button>
          <Button variant={viewMode === "blame" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("blame")}>
            <Edit className="h-4 w-4 mr-1" />
            Blame
          </Button>
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
            <p className="text-sm mt-2">This would show commit information for each line</p>
          </div>
        )}
      </div>
    </div>
  )
}
