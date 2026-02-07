// app/register/success/page.tsx - Updated with resend functionality
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClientSupabaseClient } from '@/lib/supabaseClient';

export default function RegisterSuccessPage() {
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [alertModal, setAlertModal] = useState<{ show: boolean; message: string; type: "success" | "error" | "warning" | "info" }>({ show: false, message: "", type: "info" });

  const showAlert = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setAlertModal({ show: true, message, type });
  };

  useEffect(() => {
    // Get email from localStorage (set during registration)
    const storedEmail = localStorage.getItem("pendingRegistrationEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email || !canResend || resendCount >= 3) {
      showAlert("Too many attempts. Please wait or contact support.", "warning");
      return;
    }

    setResending(true);
    try {
      const supabase = createClientSupabaseClient();
      
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        showAlert(`Error: ${error.message}`, "error");
      } else {
        setResendCount(prev => prev + 1);
        showAlert("✅ Confirmation email resent! Please check your inbox.", "success");
        
        // Disable resend for 2 minutes after 3 attempts
        if (resendCount >= 2) {
          setCanResend(false);
          setTimeout(() => setCanResend(true), 120000); // 2 minutes
        }
      }
    } catch (err) {
      showAlert("Failed to resend email", "error");
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmail = () => {
    localStorage.removeItem("pendingRegistrationEmail");
    window.location.href = "/register";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900">Account Created Successfully!</h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-sm">
            <strong>📧 Check your email</strong> ({email || "your email"}) for a confirmation link.
            You must click it before logging in.
          </p>
        </div>

        <div className="space-y-4">
          {/* Resend Email Section */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-700 mb-3">
              Didn't receive the email? Check spam folder or:
            </p>
            
            <button
              onClick={handleResendEmail}
              disabled={resending || !canResend || resendCount >= 3}
              className={`w-full py-3 rounded-xl font-medium transition ${
                !canResend || resendCount >= 3
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-cyan-500 text-white hover:bg-cyan-600"
              }`}
            >
              {resending ? "Sending..." : "Resend Confirmation Email"}
              {resendCount > 0 && ` (${resendCount}/3)`}
            </button>
            
            {!canResend && (
              <p className="text-sm text-red-600 mt-2">
                Too many attempts. Please wait 2 minutes.
              </p>
            )}
            
            <button
              onClick={handleChangeEmail}
              className="w-full mt-2 py-2 text-cyan-600 hover:text-cyan-700"
            >
              Use different email address
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="space-y-3">
            <Link
              href="/confirm"
              className="block w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-bold hover:opacity-90"
            >
              I have a confirmation link
            </Link>
            
            <Link
              href="/"
              className="block w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {alertModal.show && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setAlertModal({ show: false, message: "", type: "info" })}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              alertModal.type === "success" ? "bg-green-100" :
              alertModal.type === "error" ? "bg-red-100" :
              alertModal.type === "warning" ? "bg-yellow-100" :
              "bg-blue-100"
            }`}>
              <span className={`text-3xl ${
                alertModal.type === "success" ? "text-green-600" :
                alertModal.type === "error" ? "text-red-600" :
                alertModal.type === "warning" ? "text-yellow-600" :
                "text-blue-600"
              }`}>
                {alertModal.type === "success" ? "✓" : alertModal.type === "error" ? "✕" : alertModal.type === "warning" ? "⚠" : "ℹ"}
              </span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-gray-800">
              {alertModal.type === "success" ? "Success" : alertModal.type === "error" ? "Error" : alertModal.type === "warning" ? "Warning" : "Info"}
            </h3>
            <p className="text-gray-700 text-center mb-6 whitespace-pre-line">{alertModal.message}</p>
            <button
              onClick={() => setAlertModal({ show: false, message: "", type: "info" })}
              className="w-full bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
