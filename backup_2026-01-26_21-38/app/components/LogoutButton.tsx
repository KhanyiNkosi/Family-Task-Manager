"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutButtonProps {
  variant?: 'sidebar' | 'header' | 'icon';
  className?: string;
}

export default function LogoutButton({ variant = 'sidebar', className = '' }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      setIsLoggingOut(true);
      
      // Clear session storage
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("userEmail");
      sessionStorage.removeItem("userName");
      
      // Optional: Clear specific localStorage items
      localStorage.removeItem("familytask-user-role");
      
      // Redirect to logout page for smooth transition
      router.push("/logout");
    }
  };

  // Sidebar variant (for your dashboard sidebars)
  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-all font-medium border border-red-400/20 ${className}`}
      >
        {isLoggingOut ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            <span>Logging out...</span>
          </>
        ) : (
          <>
            <i className="fas fa-sign-out-alt"></i>
            <span>Log Out</span>
          </>
        )}
      </button>
    );
  }

  // Header variant (compact for headers)
  if (variant === 'header') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-2 text-sm font-medium ${className}`}
      >
        <i className="fas fa-sign-out-alt"></i>
        {isLoggingOut ? 'Logging out...' : 'Log Out'}
      </button>
    );
  }

  // Icon variant (just the icon)
  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`p-2 text-red-500 hover:bg-red-50 rounded-lg transition ${className}`}
      title="Log out"
    >
      {isLoggingOut ? (
        <i className="fas fa-spinner fa-spin"></i>
      ) : (
        <i className="fas fa-sign-out-alt"></i>
      )}
    </button>
  );
}
