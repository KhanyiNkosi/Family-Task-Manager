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
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; message: string; onConfirm: () => void }>({ show: false, message: "", onConfirm: () => {} });

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        show: true,
        message,
        onConfirm: () => {
          setConfirmModal({ show: false, message: "", onConfirm: () => {} });
          resolve(true);
        }
      });
      setTimeout(() => {
        (window as any)._confirmCancelHandler = () => {
          resolve(false);
        };
      }, 0);
    });
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm("Are you sure you want to log out?");
    if (confirmed) {
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
    <>
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

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-yellow-600">⚠</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-gray-800">Confirm Action</h3>
            <p className="text-gray-700 text-center mb-6 whitespace-pre-line">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmModal({ show: false, message: "", onConfirm: () => {} });
                  if ((window as any)._confirmCancelHandler) {
                    (window as any)._confirmCancelHandler();
                  }
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
