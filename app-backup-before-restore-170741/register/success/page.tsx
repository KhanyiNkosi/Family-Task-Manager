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

  useEffect(() => {
    // Get email from localStorage (set during registration)
    const storedEmail = localStorage.getItem("pendingRegistrationEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleResendEmail = async () => {
    if (!email || !canResend || resendCount >= 3) {
      alert("Too many attempts. Please wait or contact support.");
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
        alert(`Error: ${error.message}`);
      } else {
        setResendCount(prev => prev + 1);
        alert("✅ Confirmation email resent! Please check your inbox.");
        
        // Disable resend for 2 minutes after 3 attempts
        if (resendCount >= 2) {
          setCanResend(false);
          setTimeout(() => setCanResend(true), 120000); // 2 minutes
        }
      }
    } catch (err) {
      alert("Failed to resend email");
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
    </div>
  );
}
