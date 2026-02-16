"use client";

import { useState } from "react";
import Link from "next/link";
import { createClientSupabaseClient } from "@/lib/supabaseClient";

export default function ContactSupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "general",
    message: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.message) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClientSupabaseClient();
      
      // Store support ticket in database
      const { data: newTicket, error: insertError } = await supabase
        .from('support_tickets')
        .insert({
          name: formData.name,
          email: formData.email,
          category: formData.category,
          message: formData.message,
          status: 'open',
          created_at: new Date().toISOString()
        })
        .select('ticket_number')
        .single();

      if (insertError) {
        console.error("Error submitting support ticket:", insertError);
        setError("Failed to submit your request. Please try again or email us directly.");
        setIsLoading(false);
        return;
      }

      setTicketNumber(newTicket?.ticket_number || null);
      setSuccess(true);
      setFormData({ name: "", email: "", category: "general", message: "" });
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-cyan-50 p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-green-600 text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Message Sent!</h2>
              {ticketNumber && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Your ticket number: <span className="font-bold">#{ticketNumber}</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Save this number for reference
                  </p>
                </div>
              )}
              <p className="text-gray-600 mb-6">
                We've received your message and will get back to you within 24 hours.
              </p>
              <div className="space-y-3">
                <Link
                  href="/my-support-tickets"
                  className="block w-full bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white py-3 rounded-xl font-bold hover:opacity-90 transition text-center"
                >
                  <i className="fas fa-ticket-alt mr-2"></i>
                  View My Tickets
                </Link>
                <Link
                  href="/login"
                  className="block w-full text-[#00C2E0] py-3 rounded-xl font-medium hover:bg-gray-50 transition text-center border border-[#00C2E0]"
                >
                  Back to Login
                </Link>
                <button
                  onClick={() => setSuccess(false)}
                  className="block w-full text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-cyan-50 p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[#006372] to-[#00C2E0] rounded-xl flex items-center justify-center">
              <i className="fas fa-smile text-2xl text-white"></i>
            </div>
            <h1 className="text-3xl font-extrabold text-[#006372]">FamilyTask</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Contact Support</h2>
          <p className="text-gray-600 mt-2">We're here to help! Send us a message and we'll respond soon.</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                <i className="fas fa-exclamation-circle mt-0.5"></i>
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
              >
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Issue</option>
                <option value="account">Account Problem</option>
                <option value="billing">Billing Question</option>
                <option value="feature">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent resize-none"
                placeholder="Please describe your issue or question..."
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
                  Sending...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-paper-plane"></i>
                  Send Message
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t pt-6">
            <p className="text-sm text-gray-600 mb-3">Need immediate help?</p>
            <div className="flex justify-center gap-4">
              <a
                href="mailto:support@familytask.co"
                className="text-sm text-[#00C2E0] hover:underline font-medium inline-flex items-center gap-2"
              >
                <i className="fas fa-envelope"></i>
                support@familytask.co
              </a>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-[#00C2E0] hover:underline font-medium inline-flex items-center gap-2"
            >
              <i className="fas fa-arrow-left"></i>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
