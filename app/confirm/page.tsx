// app/confirm/page.tsx - Simple resend page
"use client";
import { useState } from "react";
import Link from "next/link";
export default function ConfirmPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const handleResend = () => {
    if (!email) return alert("Enter email");
    setMessage(`✅ Confirmation sent to ${email}`);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Resend Confirmation</h2>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
          className="w-full p-2 border rounded mb-4" placeholder="your@email.com" />
        <button onClick={handleResend} className="w-full bg-blue-500 text-white p-2 rounded mb-4">
          Resend Email
        </button>
        {message && <p className="text-green-600 mb-4">{message}</p>}
        <Link href="/login" className="text-blue-500 hover:underline">Go to Login →</Link>
      </div>
    </div>
  );
}
