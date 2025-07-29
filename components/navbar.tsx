"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  User,
  Settings,
  LogOut,
  Activity,
  Home,
  Key,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface SidebarProps {
  user: {
    name: string;
    email: string;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUpdateToken?: () => void;
}

export function Sidebar({
  user,
  isCollapsed,
  onToggleCollapse,
  onUpdateToken,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/activity", label: "Activity Log", icon: Activity },
    { href: "/profile", label: "Profile", icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div
      className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">AI Docs</span>
            </Link>
          )}
          {isCollapsed && (
            <div className="bg-blue-600 p-2 rounded-lg mx-auto">
              <Zap className="h-5 w-5 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={`${isCollapsed ? "mx-auto mt-2" : ""}`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive(item.href)
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </Link>
        ))}

        {/* GitHub Token Update */}
        <Button
          variant="ghost"
          onClick={onUpdateToken}
          className={`w-full justify-start gap-3 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 ${
            isCollapsed ? "px-2" : ""
          }`}
        >
          <Key className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="font-medium">Update GitHub Token</span>
          )}
        </Button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-600 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                User
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
