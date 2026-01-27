"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "parent", // "parent" or "child"
    familyCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.role === "child" && !formData.familyCode.trim()) {
      newErrors.familyCode = "Family code is required for child accounts";
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store user data (in a real app, this would be an API call)
      const userData = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        points: formData.role === "child" ? 0 : undefined,
        avatar: formData.name.charAt(0).toUpperCase(),
        joinedDate: new Date().toISOString(),
      };

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", "demo-token-" + Date.now());
      
      alert(`Registration successful! Welcome to FamilyTask, ${formData.name}!`);
      
      // Redirect based on role
      if (formData.role === "parent") {
        router.push("/parent-dashboard");
      } else {
        router.push("/child-dashboard");
      }
    } catch (error) {
      alert("Registration failed. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
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
            
            <h2 className="text-2xl font-bold mb-4">Join Our Family Community</h2>
            <p className="text-white/90">
              Create your account and start organizing family tasks, earning rewards, and building better habits together!
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-trophy text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">Earn Rewards</h3>
                <p className="text-white/80 text-sm">Complete tasks and earn points for fun rewards</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-users text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">Family Collaboration</h3>
                <p className="text-white/80 text-sm">Work together as a team to achieve family goals</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-chart-line text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">Track Progress</h3>
                <p className="text-white/80 text-sm">Monitor your family's achievements and growth</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/20">
            <p className="text-white/80">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-bold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="md:w-3/5 bg-white p-10">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-black text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600 mb-8">Join FamilyTask and organize your family life</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-gray-400">
                    <i className="fas fa-user"></i>
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

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

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <i className="fas fa-lock"></i>
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Create password"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <i className="fas fa-lock"></i>
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                        errors.confirmPassword ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Confirm password"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  I am a... <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, role: "parent" }));
                      if (errors.role) setErrors(prev => ({ ...prev, role: "" }));
                    }}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      formData.role === "parent"
                        ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                        : "border-gray-200 hover:border-cyan-300 text-gray-700"
                    }`}
                  >
                    <i className="fas fa-user-friends text-2xl"></i>
                    <span className="font-bold">Parent</span>
                    <span className="text-sm">Manage family tasks</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, role: "child" }));
                      if (errors.role) setErrors(prev => ({ ...prev, role: "" }));
                    }}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      formData.role === "child"
                        ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                        : "border-gray-200 hover:border-cyan-300 text-gray-700"
                    }`}
                  >
                    <i className="fas fa-child text-2xl"></i>
                    <span className="font-bold">Child</span>
                    <span className="text-sm">Complete tasks & earn rewards</span>
                  </button>
                </div>
                <input type="hidden" name="role" value={formData.role} />
              </div>

              {/* Family Code (only for children) */}
              {formData.role === "child" && (
                <div className="animate-fade-in">
                  <label className="block text-gray-700 font-medium mb-2">
                    Family Code <span className="text-red-500">*</span>
                    <span className="text-gray-500 text-sm font-normal ml-2">
                      (Get this from your parent)
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-gray-400">
                      <i className="fas fa-home"></i>
                    </div>
                    <input
                      type="text"
                      name="familyCode"
                      value={formData.familyCode}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                        errors.familyCode ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter family code (e.g., FAMILY123)"
                    />
                  </div>
                  {errors.familyCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.familyCode}</p>
                  )}
                  
                  <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-info-circle text-amber-600 text-lg mt-0.5"></i>
                      <div>
                        <p className="text-amber-800 text-sm">
                          Ask your parent for the family code. This connects your account to your family.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Terms Agreement */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-5 h-5 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                  required
                />
                <label htmlFor="terms" className="text-gray-700 text-sm">
                  I agree to the{" "}
                  <Link href="/terms" className="text-cyan-600 font-medium hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-cyan-600 font-medium hover:underline">
                    Privacy Policy
                  </Link>
                </label>
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    Create Account
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-gray-500 text-sm">Or continue with</span>
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
            </form>
          </div>
        </div>
      </div>

      {/* Add fade-in animation to CSS */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
