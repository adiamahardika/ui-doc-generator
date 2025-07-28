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
import { Eye, EyeOff, Zap, CheckCircle, Github } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    githubUsername: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isCheckingGithub, setIsCheckingGithub] = useState(false);
  const router = useRouter();

  // Debounced GitHub username validation
  useEffect(() => {
    const validateGithubUsername = async () => {
      if (
        !formData.githubUsername.trim() ||
        formData.githubUsername.length < 3
      ) {
        return;
      }

      setIsCheckingGithub(true);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_GITHUB_API_URL}/users/${formData.githubUsername}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setErrors((prev) => ({
              ...prev,
              githubUsername: "GitHub username does not exist",
            }));
          } else {
            setErrors((prev) => ({
              ...prev,
              githubUsername: "Error validating GitHub username",
            }));
          }
        } else {
          // Username exists, clear any existing error
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.githubUsername;
            return newErrors;
          });
        }
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          githubUsername: "Error validating GitHub username",
        }));
      } finally {
        setIsCheckingGithub(false);
      }
    };

    const timeoutId = setTimeout(validateGithubUsername, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.githubUsername]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.githubUsername.trim()) {
      newErrors.githubUsername = "GitHub username is required";
    } else if (formData.githubUsername.length < 3) {
      newErrors.githubUsername =
        "GitHub username must be at least 3 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isCheckingGithub) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setSuccess(true);
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Registration Successful!
              </h2>
              <p className="text-gray-600 mb-4">
                Your account has been created successfully. You will be
                redirected to the login page shortly.
              </p>
              <Button onClick={() => router.push("/")} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join AI Docs Generator today</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your account to start generating documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubUsername">GitHub Username</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="githubUsername"
                    type="text"
                    placeholder="Enter your GitHub username"
                    value={formData.githubUsername}
                    onChange={(e) =>
                      handleInputChange("githubUsername", e.target.value)
                    }
                    className={`pl-10 pr-10 ${
                      errors.githubUsername ? "border-red-500" : ""
                    }`}
                  />
                  {isCheckingGithub && formData.githubUsername.length >= 3 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {errors.githubUsername && (
                  <p className="text-sm text-red-500">
                    {errors.githubUsername}
                  </p>
                )}
                {!errors.githubUsername &&
                  !isCheckingGithub &&
                  formData.githubUsername.length >= 3 && (
                    <p className="text-sm text-green-600">
                      ✓ GitHub username is valid
                    </p>
                  )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={errors.password ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
                {!errors.password && formData.password && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-medium">Password requirements:</p>
                    <div className="grid grid-cols-1 gap-1">
                      <span
                        className={
                          formData.password.length >= 8
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      >
                        {formData.password.length >= 8 ? "✓" : "○"} At least 8
                        characters
                      </span>
                      <span
                        className={
                          /(?=.*[a-z])/.test(formData.password)
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      >
                        {/(?=.*[a-z])/.test(formData.password) ? "✓" : "○"} One
                        lowercase letter
                      </span>
                      <span
                        className={
                          /(?=.*[A-Z])/.test(formData.password)
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      >
                        {/(?=.*[A-Z])/.test(formData.password) ? "✓" : "○"} One
                        uppercase letter
                      </span>
                      <span
                        className={
                          /(?=.*\d)/.test(formData.password)
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      >
                        {/(?=.*\d)/.test(formData.password) ? "✓" : "○"} One
                        number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={errors.confirmPassword ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isCheckingGithub}
              >
                {isLoading
                  ? "Creating Account..."
                  : isCheckingGithub
                  ? "Validating GitHub Username..."
                  : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/" className="text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
