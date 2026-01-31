"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear session storage
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userName");
    
    // Optional: Clear localStorage if you used it
    localStorage.removeItem("familytask-user-role");
    localStorage.removeItem("familytask-created-tasks");
    localStorage.removeItem("familytask-saved-suggestions");
    
    // Show confirmation and redirect after 2 seconds
    const timer = setTimeout(() => {
      router.push("/login");
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-cyan-50 p-6">
      <div className="max-w-md w-full text-center">
        {/* Header with FamilyTask Logo */}
        <div className="inline-flex items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-[#006372] to-[#00C2E0] rounded-xl flex items-center justify-center">
            <i className="fas fa-smile text-3xl text-white"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-[#006372]">FamilyTask</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check-circle text-4xl text-green-500"></i>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Successfully Logged Out</h2>
          <p className="text-gray-600 mb-8">
            You have been securely logged out of your FamilyTask account.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Redirecting to login page...</span>
            </div>
            
            <div className="pt-6 border-t border-gray-200">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[#00C2E0] hover:underline font-medium"
              >
                <i className="fas fa-arrow-left"></i>
                Go to login immediately
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Thank you for using FamilyTask!</p>
        </div>
      </div>
    </div>
  );
}
