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
  user_id?: string;
}

export default function AdminSupportTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    checkAuthAndLoadTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, statusFilter, searchQuery, categoryFilter]);

  const checkAuthAndLoadTickets = async () => {
    try {
      const supabase = createClientSupabaseClient();
      
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Check if user is a parent (admins must be parents)
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (userProfile?.role !== "parent") {
        setError("Access denied. Admin privileges required.");
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);
      await loadTickets();
    } catch (err) {
      console.error("Auth error:", err);
      setError("Failed to verify access permissions");
      setIsLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const supabase = createClientSupabaseClient();
      
      const { data, error: fetchError } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setTickets(data || []);
    } catch (err) {
      console.error("Error loading tickets:", err);
      setError("Failed to load support tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query) ||
        t.message.toLowerCase().includes(query) ||
        t.ticket_number.toString().includes(query)
      );
    }

    setFilteredTickets(filtered);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const supabase = createClientSupabaseClient();
      
      const { error: updateError } = await supabase
        .from("support_tickets")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      if (updateError) throw updateError;

      // Update local state
      setTickets(tickets.map(t => 
        t.id === ticketId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
      ));
    } catch (err) {
      console.error("Error updating ticket:", err);
      alert("Failed to update ticket status");
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "general": return "fa-question-circle";
      case "technical": return "fa-tools";
      case "billing": return "fa-dollar-sign";
      case "feature": return "fa-lightbulb";
      default: return "fa-question";
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in-progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00C2E0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-cyan-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-lock text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error || "You don't have permission to access this page."}</p>
          <Link
            href="/parent-dashboard"
            className="inline-block bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#006372] mb-2">Support Tickets</h1>
              <p className="text-gray-600">Manage and respond to user support requests</p>
            </div>
            <Link
              href="/parent-dashboard"
              className="bg-white text-[#006372] px-6 py-3 rounded-xl font-bold hover:shadow-lg transition border-2 border-[#00C2E0]"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Dashboard
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-ticket-alt text-blue-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Open</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-envelope-open text-blue-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-green-600"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-search mr-2"></i>Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name, email, ticket #..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-filter mr-2"></i>Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-tag mr-2"></i>Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0] focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {error && !isAuthorized && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
          </div>
        )}

        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl p-12 shadow-md text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-inbox text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No tickets found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "No support tickets have been submitted yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">
                        #{ticket.ticket_number}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(ticket.status)}`}>
                        {ticket.status.replace("-", " ").toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
                        <i className={`fas ${getCategoryIcon(ticket.category)} mr-1`}></i>
                        {ticket.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{ticket.name}</h3>
                    <p className="text-sm text-gray-600">
                      <i className="fas fa-envelope mr-2"></i>
                      {ticket.email}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p className="mb-1">
                      <i className="fas fa-calendar mr-1"></i>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                    <p>
                      <i className="fas fa-clock mr-1"></i>
                      {new Date(ticket.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 mr-2">Update Status:</span>
                  <button
                    onClick={() => updateTicketStatus(ticket.id, "open")}
                    disabled={ticket.status === "open"}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      ticket.status === "open"
                        ? "bg-blue-100 text-blue-600 cursor-not-allowed"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => updateTicketStatus(ticket.id, "in-progress")}
                    disabled={ticket.status === "in-progress"}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      ticket.status === "in-progress"
                        ? "bg-yellow-100 text-yellow-600 cursor-not-allowed"
                        : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => updateTicketStatus(ticket.id, "resolved")}
                    disabled={ticket.status === "resolved"}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      ticket.status === "resolved"
                        ? "bg-green-100 text-green-600 cursor-not-allowed"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    Resolved
                  </button>
                  <button
                    onClick={() => updateTicketStatus(ticket.id, "closed")}
                    disabled={ticket.status === "closed"}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      ticket.status === "closed"
                        ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Closed
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
