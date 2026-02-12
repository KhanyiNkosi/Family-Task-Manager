"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabaseClient";

interface SupportTicket {
  id: string;
  ticket_number: number;
  name: string;
  email: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  admin_notes: string | null;
}

export default function SupportTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    checkAuthAndLoadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, filterStatus, filterCategory]);

  const checkAuthAndLoadTickets = async () => {
    const supabase = createClientSupabaseClient();
    
    // Check if user is authenticated and is a parent
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "parent") {
      router.push("/parent-dashboard");
      return;
    }

    await loadTickets();
  };

  const loadTickets = async () => {
    setIsLoading(true);
    const supabase = createClientSupabaseClient();

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading tickets:", error);
    } else {
      setTickets(data || []);
    }
    setIsLoading(false);
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (filterStatus !== "all") {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    setFilteredTickets(filtered);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    setIsUpdating(true);
    const supabase = createClientSupabaseClient();

    const { error } = await supabase
      .from("support_tickets")
      .update({ status: newStatus })
      .eq("id", ticketId);

    if (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket");
    } else {
      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        const updated = tickets.find(t => t.id === ticketId);
        if (updated) setSelectedTicket({ ...updated, status: newStatus });
      }
    }
    setIsUpdating(false);
  };

  const updateTicketPriority = async (ticketId: string, newPriority: string) => {
    setIsUpdating(true);
    const supabase = createClientSupabaseClient();

    const { error } = await supabase
      .from("support_tickets")
      .update({ priority: newPriority })
      .eq("id", ticketId);

    if (error) {
      console.error("Error updating priority:", error);
      alert("Failed to update priority");
    } else {
      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        const updated = tickets.find(t => t.id === ticketId);
        if (updated) setSelectedTicket({ ...updated, priority: newPriority });
      }
    }
    setIsUpdating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-700";
      case "in_progress": return "bg-yellow-100 text-yellow-700";
      case "resolved": return "bg-green-100 text-green-700";
      case "closed": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "normal": return "bg-blue-500 text-white";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/parent-dashboard" className="hover:opacity-80">
              <i className="fas fa-arrow-left text-xl"></i>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Support Tickets</h1>
              <p className="text-white/80 mt-1">Manage customer support requests</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings" className="hover:opacity-80">
              <i className="fas fa-cog text-2xl"></i>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">Total Tickets</div>
            <div className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">Open</div>
            <div className="text-3xl font-bold text-red-600 mt-1">{stats.open}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="text-3xl font-bold text-yellow-600 mt-1">{stats.inProgress}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">Resolved</div>
            <div className="text-3xl font-bold text-green-600 mt-1">{stats.resolved}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0]"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0]"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="account">Account</option>
                <option value="billing">Billing</option>
                <option value="feature">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-600 text-lg">No tickets found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        #{ticket.ticket_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{ticket.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{ticket.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                          {ticket.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="text-[#00C2E0] hover:underline font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Ticket #{selectedTicket.ticket_number}</h2>
                <p className="text-gray-600 mt-1">{selectedTicket.name} • {selectedTicket.email}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                    disabled={isUpdating}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0]"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => updateTicketPriority(selectedTicket.id, e.target.value)}
                    disabled={isUpdating}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C2E0]"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-lg capitalize">
                  {selectedTicket.category}
                </span>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 text-gray-800">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
                {selectedTicket.resolved_at && (
                  <div>
                    <span className="text-gray-600">Resolved:</span>
                    <span className="ml-2 text-gray-800">{new Date(selectedTicket.resolved_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <a
                  href={`mailto:${selectedTicket.email}?subject=Re: Support Ticket #${selectedTicket.ticket_number}`}
                  className="flex-1 bg-gradient-to-r from-[#006372] to-[#00C2E0] text-white py-3 rounded-xl font-bold hover:opacity-90 transition text-center"
                >
                  <i className="fas fa-envelope mr-2"></i>
                  Reply via Email
                </a>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
