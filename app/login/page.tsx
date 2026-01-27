"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("child");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = (userRole: string) => {
    if (userRole === "parent") {
      sessionStorage.setItem("userRole", "parent");
      sessionStorage.setItem("userEmail", "parent@family.com");
      sessionStorage.setItem("userName", "Family Parent");
      router.push("/parent-dashboard");
    } else {
      sessionStorage.setItem("userRole", "child");
      sessionStorage.setItem("userEmail", "child@family.com");
      sessionStorage.setItem("userName", "Family Child");
      router.push("/child-dashboard");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simple validation
    if (!email || !password) {
      setError("Please enter email and password");
      setIsLoading(false);
      return;
    }
    
    // For now, use sessionStorage (same as your current system)
    sessionStorage.setItem("userRole", role);
    sessionStorage.setItem("userEmail", email);
    sessionStorage.setItem("userName", email.split("@")[0]);
    
    // Redirect based on role
    if (role === "parent") {
      router.push("/parent-dashboard");
    } else {
      router.push("/child-dashboard");
    }
    
    setIsLoading(false);
  };


  const handleReturnHome = () => {
    router.push("/");
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-cyan-50 p-6">
      <div className="max-w-md w-full">
        {/* Header with FamilyTask Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#006372] to-[#00C2E0] rounded-xl flex items-center justify-center">
              <i className="fas fa-smile text-2xl text-white"></i>
            </div>
            <h1 className="text-3xl font-extrabold text-[#006372]">FamilyTask</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back!</h2>
          <p className="text-gray-600 mt-2">Sign in to manage your family tasks</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Return to Home Button - Above Login Form */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleReturnHome}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-100 transition-all duration-300 font-medium border border-gray-200 hover:border-gray-300 shadow-sm"
          >
            <i className="fas fa-arrow-left text-gray-500"></i>
            Return to Home Page
          </button>
          
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with login</span>
            </div>
          </div>
        </div>{error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("parent")}
                  className={`p-4 rounded-xl border-2 text-center font-medium transition ${
                    role === "parent"
                      ? "border-[#00C2E0] bg-cyan-50 text-[#006372]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <i className="fas fa-user-shield text-xl mb-2 block"></i>
                  Parent
                </button>
                <button
                  type="button"
                  onClick={() => setRole("child")}
                  className={`p-4 rounded-xl border-2 text-center font-medium transition ${
                    role === "child"
                      ? "border-[#00C2E0] bg-cyan-50 text-[#006372]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <i className="fas fa-child text-xl mb-2 block"></i>
                  Child
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo Login Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-600 mb-4">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDemoLogin("parent")}
                className="p-3.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-700 rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-user-shield"></i>
                Demo Parent
              </button>
              <button
                onClick={() => handleDemoLogin("child")}
                className="p-3.5 bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200 text-cyan-700 rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-child"></i>
                Demo Child
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              For now, any email/password works. Real auth coming soon!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>
            Need help?{" "}
            <Link href="/" className="text-[#00C2E0] hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}




