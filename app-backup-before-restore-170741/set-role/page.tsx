"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SetRolePage() {
  const router = useRouter();
  
  useEffect(() => {
    console.log("SetRolePage: This page should not be used anymore.");
    console.log("Redirecting to login instead.");
    
    // Redirect to login immediately
    router.push("/login");
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-exclamation-triangle text-yellow-600 text-2xl"></i>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Deprecated Page</h1>
        <p className="text-gray-600">This page is no longer used.</p>
        <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
      </div>
    </div>
  );
}
