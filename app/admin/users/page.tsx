"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Plus, Edit, Trash2, Search, CheckCircle, AlertCircle, Shield, User } from "lucide-react"
import { LayoutWrapper } from "@/components/layout-wrapper"

interface UserData {
  id: string
  name: string
  email: string
  username: string
  role: "user" | "admin"
  createdAt: string
  lastLogin: string
  status: "active" | "inactive"
}

export default function UserManagementPage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    role: "user" as "user" | "admin",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)

    // Load mock users
    setTimeout(() => {
      const mockUsers: UserData[] = [
        {
          id: "1",
          name: "Admin User",
          email: "admin@example.com",
          username: "admin",
          role: "admin",
          createdAt: "2024-01-01T00:00:00Z",
          lastLogin: "2024-01-15T10:30:00Z",
          status: "active",
        },
        {
          id: "2",
          name: "John Doe",
          email: "user@example.com",
          username: "johndoe",
          role: "user",
          createdAt: "2024-01-05T00:00:00Z",
          lastLogin: "2024-01-14T14:20:00Z",
          status: "active",
        },
        {
          id: "3",
          name: "Jane Smith",
          email: "jane.smith@example.com",
          username: "janesmith",
          role: "user",
          createdAt: "2024-01-10T00:00:00Z",
          lastLogin: "2024-01-13T09:15:00Z",
          status: "active",
        },
        {
          id: "4",
          name: "Bob Wilson",
          email: "bob.wilson@example.com",
          username: "bobwilson",
          role: "user",
          createdAt: "2024-01-12T00:00:00Z",
          lastLogin: "2024-01-12T16:45:00Z",
          status: "inactive",
        },
      ]

      setUsers(mockUsers)
      setFilteredUsers(mockUsers)
      setIsLoading(false)
    }, 1000)
  }, [router])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    }

    // Check for duplicate email/username (excluding current user when editing)
    const existingUser = users.find(
      (u) => (u.email === formData.email || u.username === formData.username) && u.id !== editingUser?.id,
    )

    if (existingUser) {
      if (existingUser.email === formData.email) {
        newErrors.email = "Email already exists"
      }
      if (existingUser.username === formData.username) {
        newErrors.username = "Username already exists"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const newUser: UserData = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        username: formData.username,
        role: formData.role,
        createdAt: new Date().toISOString(),
        lastLogin: "Never",
        status: "active",
      }

      const updatedUsers = [...users, newUser]
      setUsers(updatedUsers)
      setFilteredUsers(updatedUsers)
      setIsAddDialogOpen(false)
      setFormData({ name: "", email: "", username: "", role: "user" })
      setErrors({})
      setIsLoading(false)
      setNotification({
        type: "success",
        message: "User added successfully!",
      })
    }, 1000)
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !editingUser) return

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const updatedUsers = users.map((u) =>
        u.id === editingUser.id
          ? { ...u, name: formData.name, email: formData.email, username: formData.username, role: formData.role }
          : u,
      )

      setUsers(updatedUsers)
      setFilteredUsers(updatedUsers)
      setIsEditDialogOpen(false)
      setEditingUser(null)
      setFormData({ name: "", email: "", username: "", role: "user" })
      setErrors({})
      setIsLoading(false)
      setNotification({
        type: "success",
        message: "User updated successfully!",
      })
    }, 1000)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const updatedUsers = users.filter((u) => u.id !== userId)
      setUsers(updatedUsers)
      setFilteredUsers(updatedUsers)
      setIsLoading(false)
      setNotification({
        type: "success",
        message: "User deleted successfully!",
      })
    }, 1000)
  }

  const openEditDialog = (userData: UserData) => {
    setEditingUser(userData)
    setFormData({
      name: userData.name,
      email: userData.email,
      username: userData.username,
      role: userData.role,
    })
    setIsEditDialogOpen(true)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const formatDate = (dateString: string) => {
    if (dateString === "Never") return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <LayoutWrapper user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>

        {notification && (
          <Alert
            className={`mb-6 ${notification.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
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
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Users ({filteredUsers.length})
                </CardTitle>
                <CardDescription>View and manage all user accounts</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account with the specified details.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="add-name">Full Name</Label>
                      <Input
                        id="add-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="add-email">Email</Label>
                      <Input
                        id="add-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="add-username">Username</Label>
                      <Input
                        id="add-username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className={errors.username ? "border-red-500" : ""}
                      />
                      {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="add-role">Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: "user" | "admin") => handleInputChange("role", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={isLoading} className="flex-1">
                        {isLoading ? "Adding..." : "Add User"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false)
                          setFormData({ name: "", email: "", username: "", role: "user" })
                          setErrors({})
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userData) => (
                      <TableRow key={userData.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{userData.name}</p>
                              <p className="text-sm text-gray-600">{userData.email}</p>
                              <p className="text-xs text-gray-500">@{userData.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={userData.role === "admin" ? "default" : "secondary"}>
                            {userData.role === "admin" ? (
                              <>
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </>
                            ) : (
                              <>
                                <User className="h-3 w-3 mr-1" />
                                User
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={userData.status === "active" ? "default" : "secondary"}>
                            {userData.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDate(userData.createdAt)}</TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDate(userData.lastLogin)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(userData)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(userData.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoading && filteredUsers.length === 0 && users.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found matching your search.</p>
              </div>
            )}

            {!isLoading && users.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No users found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user account information and role.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className={errors.username ? "border-red-500" : ""}
                />
                {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "user" | "admin") => handleInputChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Updating..." : "Update User"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false)
                    setEditingUser(null)
                    setFormData({ name: "", email: "", username: "", role: "user" })
                    setErrors({})
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  )
}
