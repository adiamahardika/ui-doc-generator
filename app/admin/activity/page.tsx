"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity, Search, Eye, Calendar, User, Download, LogIn, FileText, Settings, RefreshCw } from "lucide-react"
import { LayoutWrapper } from "@/components/layout-wrapper"

interface ActivityLog {
  id: string
  userId: string
  userName: string
  userEmail: string
  action: string
  actionType: "login" | "logout" | "generate" | "download" | "profile_update" | "user_management"
  details: string
  timestamp: string
  ipAddress: string
  userAgent: string
  status: "success" | "failed"
}

export default function ActivityLogPage() {
  const [user, setUser] = useState<any>(null)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
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

    // Load mock activity logs
    setTimeout(() => {
      const mockActivities: ActivityLog[] = [
        {
          id: "1",
          userId: "1",
          userName: "Admin User",
          userEmail: "admin@example.com",
          action: "User Login",
          actionType: "login",
          details: "Successful login from Chrome browser",
          timestamp: "2024-01-15T10:30:00Z",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          status: "success",
        },
        {
          id: "2",
          userId: "2",
          userName: "John Doe",
          userEmail: "user@example.com",
          action: "Documentation Generated",
          actionType: "generate",
          details: "Generated documentation for 3 files in react-dashboard repository",
          timestamp: "2024-01-15T09:45:00Z",
          ipAddress: "192.168.1.101",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          status: "success",
        },
        {
          id: "3",
          userId: "2",
          userName: "John Doe",
          userEmail: "user@example.com",
          action: "Documentation Downloaded",
          actionType: "download",
          details: "Downloaded documentation ZIP file (react-dashboard-documentation.zip)",
          timestamp: "2024-01-15T09:46:00Z",
          ipAddress: "192.168.1.101",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          status: "success",
        },
        {
          id: "4",
          userId: "3",
          userName: "Jane Smith",
          userEmail: "jane.smith@example.com",
          action: "Failed Login Attempt",
          actionType: "login",
          details: "Invalid password entered",
          timestamp: "2024-01-15T08:20:00Z",
          ipAddress: "192.168.1.102",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          status: "failed",
        },
        {
          id: "5",
          userId: "1",
          userName: "Admin User",
          userEmail: "admin@example.com",
          action: "User Created",
          actionType: "user_management",
          details: "Created new user account for Bob Wilson (bob.wilson@example.com)",
          timestamp: "2024-01-14T16:30:00Z",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          status: "success",
        },
        {
          id: "6",
          userId: "2",
          userName: "John Doe",
          userEmail: "user@example.com",
          action: "Profile Updated",
          actionType: "profile_update",
          details: "Updated profile information (name and email)",
          timestamp: "2024-01-14T14:15:00Z",
          ipAddress: "192.168.1.101",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          status: "success",
        },
        {
          id: "7",
          userId: "3",
          userName: "Jane Smith",
          userEmail: "jane.smith@example.com",
          action: "Documentation Generated",
          actionType: "generate",
          details: "Generated documentation for 1 file in python-api-server repository",
          timestamp: "2024-01-14T11:30:00Z",
          ipAddress: "192.168.1.102",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          status: "success",
        },
        {
          id: "8",
          userId: "1",
          userName: "Admin User",
          userEmail: "admin@example.com",
          action: "User Role Updated",
          actionType: "user_management",
          details: "Changed Jane Smith role from user to admin",
          timestamp: "2024-01-13T13:45:00Z",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          status: "success",
        },
      ]

      setActivities(mockActivities)
      setFilteredActivities(mockActivities)
      setIsLoading(false)
    }, 1000)
  }, [router])

  useEffect(() => {
    let filtered = activities

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.details.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply action type filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((activity) => activity.actionType === actionFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((activity) => activity.status === statusFilter)
    }

    setFilteredActivities(filtered)
  }, [searchTerm, actionFilter, statusFilter, activities])

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "login":
        return <LogIn className="h-4 w-4" />
      case "logout":
        return <LogIn className="h-4 w-4 rotate-180" />
      case "generate":
        return <FileText className="h-4 w-4" />
      case "download":
        return <Download className="h-4 w-4" />
      case "profile_update":
        return <Settings className="h-4 w-4" />
      case "user_management":
        return <User className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "login":
        return "bg-green-100 text-green-800"
      case "logout":
        return "bg-gray-100 text-gray-800"
      case "generate":
        return "bg-blue-100 text-blue-800"
      case "download":
        return "bg-purple-100 text-purple-800"
      case "profile_update":
        return "bg-orange-100 text-orange-800"
      case "user_management":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const openDetailDialog = (activity: ActivityLog) => {
    setSelectedActivity(activity)
    setIsDetailDialogOpen(true)
  }

  const refreshActivities = () => {
    setIsLoading(true)
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <LayoutWrapper user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Log</h1>
          <p className="text-gray-600">Monitor user activities and system events</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Log ({filteredActivities.length})
                </CardTitle>
                <CardDescription>View detailed logs of all user activities and system events</CardDescription>
              </div>
              <Button variant="outline" onClick={refreshActivities} disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="generate">Generate</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="profile_update">Profile Update</SelectItem>
                  <SelectItem value="user_management">User Management</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
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
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{activity.userName}</p>
                              <p className="text-sm text-gray-600">{activity.userEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-full ${getActionColor(activity.actionType)}`}>
                              {getActionIcon(activity.actionType)}
                            </div>
                            <span className="font-medium">{activity.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={activity.status === "success" ? "default" : "destructive"}>
                            {activity.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(activity.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 font-mono">{activity.ipAddress}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openDetailDialog(activity)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoading && filteredActivities.length === 0 && activities.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No activities found matching your filters.</p>
              </div>
            )}

            {!isLoading && activities.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activity logs found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Activity Details</DialogTitle>
              <DialogDescription>Detailed information about this activity log entry</DialogDescription>
            </DialogHeader>
            {selectedActivity && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User</Label>
                    <p className="text-sm text-gray-900">{selectedActivity.userName}</p>
                    <p className="text-xs text-gray-600">{selectedActivity.userEmail}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Action</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`p-1 rounded-full ${getActionColor(selectedActivity.actionType)}`}>
                        {getActionIcon(selectedActivity.actionType)}
                      </div>
                      <span className="text-sm font-medium">{selectedActivity.action}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="mt-1">
                      <Badge variant={selectedActivity.status === "success" ? "default" : "destructive"}>
                        {selectedActivity.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Timestamp</Label>
                    <p className="text-sm text-gray-900">{formatDate(selectedActivity.timestamp)}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Details</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedActivity.details}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">IP Address</Label>
                    <p className="text-sm text-gray-900 font-mono">{selectedActivity.ipAddress}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User Agent</Label>
                    <p className="text-xs text-gray-900 break-all">{selectedActivity.userAgent}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  )
}
