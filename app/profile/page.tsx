"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Github,
} from "lucide-react";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { useAuth } from "@/contexts/auth-context";
import {
  apiRequest,
  type User as UserType,
  type ApiResponse,
} from "@/lib/auth";

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    github_username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isCheckingGithub, setIsCheckingGithub] = useState(false);
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();

  // Fetch user data from backend
  const fetchUserData = async () => {
    if (!authUser?.id) return;

    try {
      setIsLoading(true);
      const response = await apiRequest(`/api/users/${authUser.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const result: ApiResponse<UserType> = await response.json();

      if (result.success && result.data) {
        setUser(result.data);
        setFormData({
          name: result.data.name || "",
          email: result.data.email || "",
          github_username: result.data.github_username || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        throw new Error(result.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setNotification({
        type: "error",
        message: "Failed to load user data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      router.push("/");
      return;
    }

    fetchUserData();
  }, [router, isAuthenticated, authUser, authLoading]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Debounced GitHub username validation
  useEffect(() => {
    const validateGithubUsername = async () => {
      if (
        !formData.github_username.trim() ||
        formData.github_username.length < 3 ||
        !isEditingProfile ||
        formData.github_username === user?.github_username // Don't validate if it's the same as current
      ) {
        return;
      }

      setIsCheckingGithub(true);

      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
          }/api/register/validate-github`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              githubUsername: formData.github_username,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          setErrors((prev) => ({
            ...prev,
            github_username:
              result.message || "Error validating GitHub username",
          }));
        } else {
          // Username is valid, clear any existing error
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.github_username;
            return newErrors;
          });
        }
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          github_username: "Error validating GitHub username",
        }));
      } finally {
        setIsCheckingGithub(false);
      }
    };

    const timeoutId = setTimeout(validateGithubUsername, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.github_username, isEditingProfile, user?.github_username]);

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.github_username.trim()) {
      newErrors.github_username = "GitHub username is required";
    } else if (formData.github_username.length < 3) {
      newErrors.github_username =
        "GitHub username must be at least 3 characters";
    }

    setErrors(newErrors);

    // Check if there are any existing GitHub username errors from async validation
    const hasGithubError =
      errors.github_username && errors.github_username !== "";

    return Object.keys(newErrors).length === 0 && !hasGithubError;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])/.test(formData.newPassword)) {
      newErrors.newPassword =
        "Password must contain at least one lowercase letter";
    } else if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
      newErrors.newPassword =
        "Password must contain at least one uppercase letter";
    } else if (!/(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = "Password must contain at least one number";
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if GitHub validation is in progress or failed
    if (
      !validateProfileForm() ||
      !user?.id ||
      isCheckingGithub ||
      errors.github_username
    ) {
      if (errors.github_username) {
        setNotification({
          type: "error",
          message:
            "Please resolve GitHub username validation errors before proceeding.",
        });
      }
      return;
    }

    setIsLoading(true);
    setNotification(null);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        github_username: formData.github_username,
      };

      const response = await apiRequest(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const result: ApiResponse<UserType> = await response.json();

      if (result.success && result.data) {
        setUser(result.data);
        setFormData((prev) => ({
          ...prev,
          name: result.data!.name,
          email: result.data!.email,
          github_username: result.data!.github_username,
        }));
        setIsEditingProfile(false);
        setNotification({
          type: "success",
          message: result.message || "Profile updated successfully!",
        });

        // Update localStorage with new user data
        localStorage.setItem("user", JSON.stringify(result.data));
      } else {
        throw new Error(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm() || !user?.id) return;

    setIsLoading(true);
    setNotification(null);

    try {
      const passwordData = {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      };

      const response = await apiRequest(
        `/api/users/${user.id}/change-password`,
        {
          method: "POST",
          body: JSON.stringify(passwordData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to change password");
      }

      const result: ApiResponse<null> = await response.json();

      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setIsChangingPassword(false);
        setNotification({
          type: "success",
          message: result.message || "Password changed successfully!",
        });
      } else {
        throw new Error(result.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to change password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? "Loading..." : "Loading profile..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <LayoutWrapper user={user}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600">
            Manage your account information and security settings
          </p>
        </div>

        {notification && (
          <Alert
            className={`mb-6 ${
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
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isEditingProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Github className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.github_username}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full"
                  >
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github_username">GitHub Username</Label>
                    <div className="relative">
                      <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="github_username"
                        type="text"
                        value={formData.github_username}
                        onChange={(e) =>
                          handleInputChange("github_username", e.target.value)
                        }
                        className={`pl-10 pr-10 ${
                          errors.github_username ? "border-red-500" : ""
                        }`}
                      />
                      {isCheckingGithub &&
                        formData.github_username.length >= 3 && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          </div>
                        )}
                    </div>
                    {errors.github_username && (
                      <p className="text-sm text-red-500">
                        {errors.github_username}
                      </p>
                    )}
                    {!errors.github_username &&
                      !isCheckingGithub &&
                      formData.github_username.length >= 3 &&
                      formData.github_username !== user?.github_username && (
                        <p className="text-sm text-green-600">
                          ✓ GitHub username is valid
                        </p>
                      )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={
                        isLoading ||
                        isCheckingGithub ||
                        !!errors.github_username
                      }
                      className="flex-1"
                    >
                      {isLoading
                        ? "Updating..."
                        : isCheckingGithub
                        ? "Validating GitHub Username..."
                        : errors.github_username
                        ? "Fix GitHub Username First"
                        : "Update Profile"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setErrors({});
                        setIsCheckingGithub(false);
                        // Reset form data to current user data
                        if (user) {
                          setFormData((prev) => ({
                            ...prev,
                            name: user.name,
                            email: user.email,
                            github_username: user.github_username,
                          }));
                        }
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Change your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isChangingPassword ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Password Security
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Your password was last changed recently. For security, we
                      recommend changing your password regularly.
                    </p>
                    <Button
                      onClick={() => setIsChangingPassword(true)}
                      variant="outline"
                      className="w-full"
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) =>
                          handleInputChange("currentPassword", e.target.value)
                        }
                        className={
                          errors.currentPassword ? "border-red-500" : ""
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.currentPassword && (
                      <p className="text-sm text-red-500">
                        {errors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={(e) =>
                          handleInputChange("newPassword", e.target.value)
                        }
                        className={errors.newPassword ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-sm text-red-500">
                        {errors.newPassword}
                      </p>
                    )}
                    {!errors.newPassword && formData.newPassword && (
                      <div className="text-xs text-gray-500 space-y-1">
                        <p className="font-medium">Password requirements:</p>
                        <div className="grid grid-cols-1 gap-1">
                          <span
                            className={
                              formData.newPassword.length >= 8
                                ? "text-green-600"
                                : "text-gray-400"
                            }
                          >
                            {formData.newPassword.length >= 8 ? "✓" : "○"} At
                            least 8 characters
                          </span>
                          <span
                            className={
                              /(?=.*[a-z])/.test(formData.newPassword)
                                ? "text-green-600"
                                : "text-gray-400"
                            }
                          >
                            {/(?=.*[a-z])/.test(formData.newPassword)
                              ? "✓"
                              : "○"}{" "}
                            One lowercase letter
                          </span>
                          <span
                            className={
                              /(?=.*[A-Z])/.test(formData.newPassword)
                                ? "text-green-600"
                                : "text-gray-400"
                            }
                          >
                            {/(?=.*[A-Z])/.test(formData.newPassword)
                              ? "✓"
                              : "○"}{" "}
                            One uppercase letter
                          </span>
                          <span
                            className={
                              /(?=.*\d)/.test(formData.newPassword)
                                ? "text-green-600"
                                : "text-gray-400"
                            }
                          >
                            {/(?=.*\d)/.test(formData.newPassword) ? "✓" : "○"}{" "}
                            One number
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        className={
                          errors.confirmPassword ? "border-red-500" : ""
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Changing..." : "Change Password"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setFormData((prev) => ({
                          ...prev,
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        }));
                        setErrors({});
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  );
}
