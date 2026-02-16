"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";

interface SupportTicket {
  id: string;
  ticket_number: number;
  name: string;
  email: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function MySupportTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    loadMyTickets();
  }, []);

  const loadMyTickets = async () => {
    try {
      const supabase = createClientSupabaseClient();
      
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      setUserEmail(session.user.email || "");

      // Load tickets for this user's email
      const { data, error: fetchError } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("email", session.user.email)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setTickets(data || []);
    } catch (err) {
      console.error("Error loading tickets:", err);
      setError("Failed to load your support tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800 border-blue-300";
      case "in-progress": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "resolved": return "bg-green-100 text-green-800 border-green-300";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return "fa-envelope-open";
      case "in-progress": return "fa-spinner fa-pulse";
      case "resolved": return "fa-check-circle";
      case "closed": return "fa-archive";
      default: return "fa-question";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "general": return "fa-question-circle";
      case "technical": return "fa-tools";
      case "billing": return "fa-dollar-sign";
      case "feature": return "fa-lightbulb";
      default: return "fa-question";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "open": return "Your ticket is waiting to be reviewed";
      case "in-progress": return "We're working on your request";
      case "resolved": return "Your issue has been resolved";
      case "closed": return "This ticket is closed";
      default: return "";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00C2E0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#006372] mb-2">My Support Tickets</h1>
              <p className="text-gray-600">Track your support requests and their status</p>
            </div>
            <Link
              href="/contact-support"
              className="bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
            >
              <i className="fas fa-plus mr-2"></i>
              New Ticket
            </Link>
          </div>

          {/* Summary Card */}
          {tickets.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{tickets.length}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {tickets.filter(t => t.status === "open").length}
                  </p>
                  <p className="text-sm text-gray-600">Open</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {tickets.filter(t => t.status === "in-progress").length}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {tickets.filter(t => t.status === "resolved").length}
                  </p>
                  <p className="text-sm text-gray-600">Resolved</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-md text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#006372] to-[#00C2E0] rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-ticket-alt text-white text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Support Tickets</h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted any support requests yet. Need help? Contact us!
            </p>
            <Link
              href="/contact-support"
              className="inline-block bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition"
            >
              <i className="fas fa-headset mr-2"></i>
              Contact Support
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition"
              >
                {/* Ticket Header */}
                <div className="bg-gradient-to-r from-[#006372] to-[#00C2E0] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <i className={`fas ${getStatusIcon(ticket.status)}`}></i>
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Ticket #{ticket.ticket_number}</p>
                        <p className="font-bold">{ticket.name}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border bg-white/10 backdrop-blur-sm border-white/30`}>
                      {ticket.status.replace("-", " ").toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Ticket Body */}
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <span>
                      <i className={`fas ${getCategoryIcon(ticket.category)} mr-2`}></i>
                      {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                    </span>
                    <span>
                      <i className="fas fa-calendar mr-2"></i>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    <span>
                      <i className="fas fa-clock mr-2"></i>
                      {new Date(ticket.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Status Message */}
                  <div className={`mb-4 p-3 rounded-lg border ${
                    ticket.status === "open" ? "bg-blue-50 border-blue-200" :
                    ticket.status === "in-progress" ? "bg-yellow-50 border-yellow-200" :
                    ticket.status === "resolved" ? "bg-green-50 border-green-200" :
                    "bg-gray-50 border-gray-200"
                  }`}>
                    <p className={`text-sm font-medium ${
                      ticket.status === "open" ? "text-blue-800" :
                      ticket.status === "in-progress" ? "text-yellow-800" :
                      ticket.status === "resolved" ? "text-green-800" :
                      "text-gray-800"
                    }`}>
                      <i className={`fas ${getStatusIcon(ticket.status)} mr-2`}></i>
                      {getStatusMessage(ticket.status)}
                    </p>
                  </div>

                  {/* Message */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Message:</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                  </div>

                  {/* Last Updated */}
                  {ticket.updated_at !== ticket.created_at && (
                    <p className="text-xs text-gray-500 mt-4">
                      <i className="fas fa-sync-alt mr-1"></i>
                      Last updated: {new Date(ticket.updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/parent-dashboard"
            className="inline-block text-[#006372] hover:text-[#00C2E0] font-medium transition"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
