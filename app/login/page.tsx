"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo users for testing
      const demoUsers = {
        parent: {
          id: "1",
          name: "John Parent",
          email: "parent@example.com",
          password: "password123",
          role: "parent",
          points: 0,
          avatar: "J",
        },
        child: {
          id: "2",
          name: "Alex Child",
          email: "child@example.com",
          password: "password123",
          role: "child",
          points: 125,
          avatar: "A",
        }
      };

      // Check for demo users or use form data
      let userData;
      if (formData.email === "parent@example.com" && formData.password === "password123") {
        userData = demoUsers.parent;
      } else if (formData.email === "child@example.com" && formData.password === "password123") {
        userData = demoUsers.child;
      } else {
        // For demo purposes, create a mock user
        userData = {
          id: Date.now().toString(),
          name: formData.email.split("@")[0],
          email: formData.email,
          role: formData.email.includes("parent") ? "parent" : "child",
          points: formData.email.includes("parent") ? 0 : 100,
          avatar: formData.email.charAt(0).toUpperCase(),
        };
      }

      // Store user data
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", "demo-token-" + Date.now());
      
      // Store remember me preference
      if (formData.rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }
      
      alert(`Welcome back, ${userData.name}!`);
      
      // Redirect based on role
      if (userData.role === "parent") {
        router.push("/parent-dashboard");
      } else {
        router.push("/child-dashboard");
      }
    } catch (error) {
      alert("Login failed. Please check your credentials and try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!formData.email) {
      alert("Please enter your email address first.");
      return;
    }
    alert(`Password reset link sent to ${formData.email}`);
  };

  const handleDemoLogin = (role: "parent" | "child") => {
    setFormData({
      email: role === "parent" ? "parent@example.com" : "child@example.com",
      password: "password123",
      rememberMe: false,
    });
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl">
        {/* Left Side - Illustration/Info */}
        <div className="md:w-2/5 bg-gradient-to-br from-cyan-500 to-teal-600 text-white p-10 flex flex-col justify-center">
          <div className="mb-10">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back to Home</span>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <i className="fas fa-smile text-3xl"></i>
              </div>
              <h1 className="text-3xl font-black">FamilyTask</h1>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Welcome Back!</h2>
            <p className="text-white/90">
              Sign in to manage your family tasks, track rewards, and continue your family's journey together.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-chart-line text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">Track Progress</h3>
                <p className="text-white/80 text-sm">See how your family is doing with tasks and rewards</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-tasks text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">Manage Tasks</h3>
                <p className="text-white/80 text-sm">Assign, complete, and approve family tasks</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-gift text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">Earn Rewards</h3>
                <p className="text-white/80 text-sm">Redeem points for exciting family rewards</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/20">
            <p className="text-white/80">
              New to FamilyTask?{" "}
              <Link href="/register" className="text-white font-bold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-3/5 bg-white p-10">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-black text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600 mb-8">Sign in to your FamilyTask account</p>

            {/* Demo Login Buttons */}
            <div className="mb-8">
              <p className="text-gray-700 font-medium mb-3">Try demo accounts:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDemoLogin("parent")}
                  className="p-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <i className="fas fa-user-friends"></i>
                  Parent Demo
                </button>
                <button
                  onClick={() => handleDemoLogin("child")}
                  className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <i className="fas fa-child"></i>
                  Child Demo
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-8">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">Or sign in with email</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-700 font-medium">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-cyan-600 text-sm font-medium hover:text-cyan-700 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <i className="fas fa-lock"></i>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <i className={`fas fa-${showPassword ? "eye-slash" : "eye"}`}></i>
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                  />
                  <label htmlFor="rememberMe" className="text-gray-700">
                    Remember me
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Signing In...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    Sign In
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-gray-500 text-sm">Or sign in with</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Social Login Options */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-3"
                >
                  <i className="fab fa-google text-red-500"></i>
                  <span className="font-medium">Google</span>
                </button>
                <button
                  type="button"
                  className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-3"
                >
                  <i className="fab fa-apple"></i>
                  <span className="font-medium">Apple</span>
                </button>
              </div>

              {/* Create Account Link */}
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-cyan-600 font-bold hover:underline">
                    Create one now
                  </Link>
                </p>
              </div>
            </form>

            {/* Demo Credentials Info */}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <i className="fas fa-info-circle text-cyan-600"></i>
                Demo Credentials
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Parent:</span> parent@example.com / password123</p>
                <p><span className="font-medium">Child:</span> child@example.com / password123</p>
                <p className="mt-2 text-gray-500">Click the demo buttons above to auto-fill credentials.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
