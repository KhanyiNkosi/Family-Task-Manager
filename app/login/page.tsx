"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientSupabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Simple validation
    if (!email || !password) {
      setError("Please enter email and password");
      setIsLoading(false);
      return;
    }
    
    try {
      const supabase = createClientSupabaseClient();
      
      // Authenticate with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      
      if (signInError) {
        console.error("Login error:", signInError);
        setError(signInError.message);
        setIsLoading(false);
        return;
      }
      
      if (!data.user) {
        setError("Login failed - no user returned");
        setIsLoading(false);
        return;
      }
      
      console.log("Login successful, user:", data.user.email);
      
      // Get user's role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();
      
      if (profileError || !profile) {
        console.error("Error fetching profile:", profileError);
        setError("Account found but profile is missing. Please contact support.");
        setIsLoading(false);
        return;
      }
      
      const userRole = profile.role;
      
      // Store user info in sessionStorage
      sessionStorage.setItem("userRole", userRole);
      sessionStorage.setItem("userEmail", email);
      sessionStorage.setItem("userName", profile.full_name || email.split("@")[0]);
      
      // Redirect based on actual role from database
      if (userRole === "parent") {
        router.push("/parent-dashboard");
      } else {
        router.push("/child-dashboard");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
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
          <p className="text-gray-600 mt-2">Sign in with your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Return to Home Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleReturnHome}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-100 transition-all duration-300 font-medium border border-gray-200 hover:border-gray-300 shadow-sm"
              >
                <i className="fas fa-arrow-left text-gray-500"></i>
                Return to Home Page
              </button>
            </div>

            {error && (
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link 
                  href="/forgot-password"
                  className="text-xs text-[#00C2E0] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                placeholder="••••••••"
                required
              />
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

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Don't have an account?{" "}
              <Link href="/register" className="text-[#00C2E0] hover:underline font-medium">
                Sign up now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>
            Need help?{" "}
            <Link href="/contact-support" className="text-[#00C2E0] hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}





