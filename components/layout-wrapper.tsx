"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { GitHubTokenDialog } from "@/components/github-token-dialog"

interface LayoutWrapperProps {
  children: React.ReactNode
  user: any
}

export function LayoutWrapper({ children, user }: LayoutWrapperProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false)

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState) {
      setIsSidebarCollapsed(JSON.parse(savedState))
    }
  }, [])

  const handleToggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState))
  }

  const handleUpdateToken = () => {
    setIsTokenDialogOpen(true)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={user}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onUpdateToken={handleUpdateToken}
      />

      <main className={`flex-1 overflow-auto transition-all duration-300`}>{children}</main>

      <GitHubTokenDialog isOpen={isTokenDialogOpen} onClose={() => setIsTokenDialogOpen(false)} />
    </div>
  )
}
