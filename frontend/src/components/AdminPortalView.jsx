import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketsApi, authApi, booksApi, getSocket } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  Search,
  Clock,
  UserCheck,
  Send,
  Sparkles,
  RefreshCw,
  Lock,
  LogOut,
} from "lucide-react";

export const AdminPortalView = ({ onBackToAuthor }) => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // Filters state
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("urgent");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [activeAdminTab, setActiveAdminTab] = useState("queue");

  const messagesEndRef = useRef(null);

  // TanStack Query for Ticket Queue
  const {
    data: ticketsData,
    isLoading: isTicketsLoading,
    refetch: refetchTickets,
    isFetching: isTicketsFetching,
  } = useQuery({
    queryKey: ["admin-tickets", { statusFilter, categoryFilter, priorityFilter, sortBy, searchTerm }],
    queryFn: () =>
      ticketsApi.getAllTickets({
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        sortBy,
        search: searchTerm,
      }),
    refetchInterval: 5000,
  });

  const tickets = ticketsData?.tickets || [];
  const selectedTicket = tickets.find((t) => t._id === selectedTicketId) || (tickets.length > 0 && !selectedTicketId ? tickets[0] : null);

  // TanStack Query for Admin Stats
  const { data: statsData } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: authApi.getAdminStats,
    refetchInterval: 5000,
  });
  const stats = statsData?.stats || null;

  // TanStack Query for Authors Catalog
  const { data: authorsData } = useQuery({
    queryKey: ["admin-authors"],
    queryFn: authApi.getAllAuthors,
    enabled: activeAdminTab === "catalog",
  });
  const allAuthors = authorsData?.authors || [];

  // React Hook Form for Admin Official Response
  const {
    register: registerResponse,
    handleSubmit: handleResponseSubmit,
    setValue: setResponseValue,
    reset: resetResponseForm,
  } = useForm({
    defaultValues: { response: "" },
  });

  // React Hook Form for Internal Note
  const {
    register: registerNote,
    handleSubmit: handleNoteSubmit,
    reset: resetNoteForm,
  } = useForm({
    defaultValues: { note: "" },
  });

  // TanStack Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => ticketsApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(`Ticket status updated to ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update ticket status");
    },
  });

  const classificationMutation = useMutation({
    mutationFn: ({ id, category, priority }) =>
      ticketsApi.overrideClassification(id, { category, priority }),
    onSuccess: () => {
      toast.success("Classification & priority updated");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update classification");
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, adminId, adminName }) =>
      ticketsApi.assignTicket(id, { adminId, adminName }),
    onSuccess: (_, variables) => {
      toast.success(`Ticket assigned to ${variables.adminName}`);
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to assign ticket");
    },
  });

  const noteMutation = useMutation({
    mutationFn: ({ id, note }) => ticketsApi.addInternalNote(id, note),
    onSuccess: () => {
      toast.success("Internal note added");
      resetNoteForm();
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add internal note");
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, content }) => ticketsApi.addMessage(id, content),
    onSuccess: () => {
      toast.success("Official response sent to author");
      resetResponseForm();
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send response");
    },
  });

  const regenerateDraftMutation = useMutation({
    mutationFn: (id) => ticketsApi.regenerateAiDraft(id),
    onSuccess: () => {
      toast.success("AI draft response regenerated");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to regenerate AI draft");
    },
  });

  // Socket.io Real-Time Synchronization with TanStack Query
  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    };

    socket.on("ticket_updated", handleUpdate);
    socket.on("new_ticket", handleUpdate);
    socket.on("ticket_message", handleUpdate);

    return () => {
      socket.off("ticket_updated", handleUpdate);
      socket.off("new_ticket", handleUpdate);
      socket.off("ticket_message", handleUpdate);
    };
  }, [queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages, selectedTicket?.internalNotes]);

  const onSendOfficialResponse = (formData) => {
    if (!formData.response.trim() || !selectedTicket) return;
    replyMutation.mutate({
      id: selectedTicket._id,
      content: formData.response.trim(),
    });
  };

  const onAddNote = (formData) => {
    if (!formData.note.trim() || !selectedTicket) return;
    noteMutation.mutate({
      id: selectedTicket._id,
      note: formData.note.trim(),
    });
  };

  const handleInsertAiDraft = () => {
    if (selectedTicket?.aiDraftResponse?.content) {
      setResponseValue("response", selectedTicket.aiDraftResponse.content, { shouldValidate: true });
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-50 text-red-700 border-red-200 font-bold";
      case "High":
        return "bg-amber-50 text-amber-700 border-amber-200 font-semibold";
      case "Medium":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Low":
        return "bg-gray-50 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "In Progress":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Resolved":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Closed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatCurrency = (val) => {
    if (!val) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                BookLeaf Operations & Support Center
              </h1>
              <span className="text-[11px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200 uppercase">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Operations & Support Queue Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setActiveAdminTab("queue")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeAdminTab === "queue"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Support Queue
            </button>
            <button
              onClick={() => setActiveAdminTab("catalog")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeAdminTab === "catalog"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Authors & Catalog ({allAuthors.length})
            </button>
          </div>

          <div className="text-right hidden sm:block text-xs">
            <div className="font-semibold text-gray-900">{user?.name}</div>
            <div className="text-gray-500 font-mono">{user?.email}</div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-xs"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5 text-gray-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Total Queue
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTickets}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              Open Tickets
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-1">{stats.openTickets}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              In Progress
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {stats.inProgressTickets}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Resolved
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {stats.resolvedTickets}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              Critical Tickets
            </div>
            <div className="text-2xl font-bold text-red-700 mt-1">{stats.criticalTickets}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              High Priority
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{stats.highTickets}</div>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      {activeAdminTab === "catalog" ? (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-3">All Authors & Royalty Balances</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-800 uppercase font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Author ID</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">City</th>
                    <th className="py-2.5 px-3">Books</th>
                    <th className="py-2.5 px-3">Copies Sold</th>
                    <th className="py-2.5 px-3">Total Royalty</th>
                    <th className="py-2.5 px-3">Paid</th>
                    <th className="py-2.5 px-3">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allAuthors.map((author) => (
                    <tr key={author._id} className="hover:bg-gray-50/80">
                      <td className="py-2.5 px-3 font-mono font-medium text-gray-900">
                        {author.authorId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{author.name}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-500">{author.email}</td>
                      <td className="py-2.5 px-3">{author.city}</td>
                      <td className="py-2.5 px-3 font-semibold">{author.booksCount}</td>
                      <td className="py-2.5 px-3 font-bold">{author.totalCopiesSold}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">
                        {formatCurrency(author.totalRoyaltyEarned)}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-semibold">
                        {formatCurrency(author.royaltyPaid)}
                      </td>
                      <td className="py-2.5 px-3 text-amber-700 font-bold">
                        {formatCurrency(author.royaltyPending)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ticket #, subject, author name, or book..."
                className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-700"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-2.5 py-1 text-xs font-semibold text-gray-800"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500 font-medium">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-2.5 py-1 text-xs font-semibold text-gray-800 max-w-[180px] truncate"
              >
                <option value="All">All Categories</option>
                <option value="Royalty & Payments">Royalty & Payments</option>
                <option value="ISBN & Metadata Issues">ISBN & Metadata</option>
                <option value="Printing & Quality">Printing & Quality</option>
                <option value="Distribution & Availability">Distribution & Availability</option>
                <option value="Book Status & Production Updates">Production Updates</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500 font-medium">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-2.5 py-1 text-xs font-semibold text-gray-800"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500 font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-purple-300 text-purple-900 rounded-md px-2.5 py-1 text-xs font-bold"
              >
                <option value="urgent">⚡ Most Urgent First</option>
                <option value="oldest">⏳ Oldest Unresolved</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            <button
              onClick={() => refetchTickets()}
              disabled={isTicketsFetching}
              className="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTicketsFetching ? "animate-spin text-purple-700" : ""}`} />
            </button>
          </div>

          {/* Ticket Queue Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Queue List (Left Column) */}
            <div className="lg:col-span-5 space-y-2.5 max-h-[850px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
                <span>Matching Tickets ({tickets.length})</span>
                <span className="text-emerald-700 font-semibold">● Live Sync</span>
              </div>

              {isTicketsLoading ? (
                <div className="py-12 text-center text-xs text-gray-400">Loading ticket queue...</div>
              ) : tickets.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
                  No tickets match the selected filters.
                </div>
              ) : (
                tickets.map((t) => {
                  const isSelected = selectedTicket?._id === t._id;
                  const isCritical = t.priority === "Critical" && t.status !== "Resolved" && t.status !== "Closed";

                  return (
                    <button
                      key={t._id}
                      onClick={() => setSelectedTicketId(t._id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all shadow-xs relative ${
                        isSelected
                          ? "bg-purple-50/50 border-purple-600 ring-1 ring-purple-600"
                          : isCritical
                          ? "bg-red-50/30 border-red-300 hover:border-red-400"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {isCritical && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                      )}

                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-gray-900">
                            {t.ticketNumber}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityStyle(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusStyle(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1">
                        {t.subject}
                      </h4>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span className="font-medium text-gray-700 truncate max-w-[60%]">
                          {t.authorName}
                        </span>
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded truncate max-w-[40%]">
                          {t.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-2">
                          {t.assignedToName && (
                            <span className="text-gray-500 font-medium">
                              👤 {t.assignedToName}
                            </span>
                          )}
                          {t.messages && t.messages.length > 0 && (
                            <span className="font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                              {t.messages.length} msgs
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Ticket Management & Response Desk (Right Column) */}
            <div className="lg:col-span-7">
              {selectedTicket ? (
                <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden flex flex-col space-y-4 p-5">
                  {/* Header & Author Snapshot */}
                  <div className="border-b border-gray-200 pb-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-base text-gray-900">
                          {selectedTicket.ticketNumber}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusStyle(
                            selectedTicket.status
                          )}`}
                        >
                          {selectedTicket.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Assign Button */}
                        <button
                          onClick={() =>
                            assignMutation.mutate({
                              id: selectedTicket._id,
                              adminId: user._id,
                              adminName: user.name,
                            })
                          }
                          disabled={assignMutation.isPending}
                          className="text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 transition-colors inline-flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                          {selectedTicket.assignedToName === user.name
                            ? "Assigned to You"
                            : `Assign to Me`}
                        </button>

                        {/* Status dropdown */}
                        <select
                          value={selectedTicket.status}
                          onChange={(e) =>
                            statusMutation.mutate({
                              id: selectedTicket._id,
                              status: e.target.value,
                            })
                          }
                          className="text-xs font-bold bg-white border border-gray-300 rounded-md px-2.5 py-1 text-gray-800"
                        >
                          <option value="Open">Status: Open</option>
                          <option value="In Progress">Status: In Progress</option>
                          <option value="Resolved">Status: Resolved</option>
                          <option value="Closed">Status: Closed</option>
                        </select>
                      </div>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900">
                      {selectedTicket.subject}
                    </h2>

                    {/* Author & Book Meta Card */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block">Author:</span>
                        <span className="font-bold text-gray-900">{selectedTicket.authorName}</span>
                        <span className="text-[11px] text-gray-500 font-mono block">
                          {selectedTicket.authorEmail}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-400 block">Author ID:</span>
                        <span className="font-mono font-medium text-gray-800">
                          {selectedTicket.authorId || "—"}
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-gray-400 block">Associated Book:</span>
                        <span className="font-medium text-gray-900">
                          {selectedTicket.bookTitle}
                        </span>
                      </div>
                    </div>

                    {/* Classification & Priority Override Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-purple-50/40 border border-purple-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="font-bold text-purple-900">
                          AI Auto-Classification & Score:
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Category Selector */}
                        <select
                          value={selectedTicket.category}
                          onChange={(e) =>
                            classificationMutation.mutate({
                              id: selectedTicket._id,
                              category: e.target.value,
                              priority: selectedTicket.priority,
                            })
                          }
                          className="text-xs font-medium bg-white border border-purple-300 rounded px-2 py-0.5 text-gray-800"
                        >
                          <option value="Royalty & Payments">Royalty & Payments</option>
                          <option value="ISBN & Metadata Issues">ISBN & Metadata</option>
                          <option value="Printing & Quality">Printing & Quality</option>
                          <option value="Distribution & Availability">
                            Distribution & Availability
                          </option>
                          <option value="Book Status & Production Updates">
                            Production Updates
                          </option>
                          <option value="General Inquiry">General Inquiry</option>
                        </select>

                        {/* Priority Selector */}
                        <select
                          value={selectedTicket.priority}
                          onChange={(e) =>
                            classificationMutation.mutate({
                              id: selectedTicket._id,
                              category: selectedTicket.category,
                              priority: e.target.value,
                            })
                          }
                          className={`text-xs font-bold rounded px-2 py-0.5 border ${getPriorityStyle(
                            selectedTicket.priority
                          )}`}
                        >
                          <option value="Critical">Critical Priority</option>
                          <option value="High">High Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="Low">Low Priority</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Original Author Query */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      <span>Original Author Submission</span>
                      <span className="text-gray-400">
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.description}
                    </p>

                    {selectedTicket.attachmentName && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-gray-200 text-xs text-gray-700">
                        <span>📎 Attached: {selectedTicket.attachmentName}</span>
                      </div>
                    )}
                  </div>

                  {/* AI Generated Draft Box */}
                  <div className="p-4 bg-emerald-50/50 border border-emerald-300 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                          AI-Drafted Response (BookLeaf Knowledge Base)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => regenerateDraftMutation.mutate(selectedTicket._id)}
                          disabled={regenerateDraftMutation.isPending}
                          className="text-[11px] text-emerald-800 hover:text-emerald-900 underline font-medium"
                        >
                          {regenerateDraftMutation.isPending ? "Generating..." : "Regenerate Draft"}
                        </button>
                        <button
                          type="button"
                          onClick={handleInsertAiDraft}
                          className="px-2.5 py-1 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 shadow-xs"
                        >
                          Insert into Response Box
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-emerald-200 rounded-lg text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                      {selectedTicket.aiDraftResponse?.content ||
                        "Click 'Regenerate Draft' to generate contextual response..."}
                    </div>
                  </div>

                  {/* Messages Thread */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/40 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Live Author Conversation ({selectedTicket.messages?.length || 0})
                    </h3>

                    <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                      {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                        selectedTicket.messages.map((msg, i) => {
                          const isAdmin = msg.senderRole === "admin";
                          return (
                            <div
                              key={msg._id || i}
                              className={`p-3 rounded-xl text-xs ${
                                isAdmin
                                  ? "bg-purple-50 border border-purple-200 text-purple-950 ml-4"
                                  : "bg-white border border-gray-200 text-gray-900 mr-4"
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold mb-1">
                                <span>{msg.senderName} ({msg.senderRole.toUpperCase()})</span>
                                <span className="text-gray-400 font-normal">
                                  {new Date(msg.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-2">
                          No messages sent yet. Use composer below to reply.
                        </p>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Internal Notes Section (React Hook Form) */}
                  <div className="p-4 bg-amber-50/60 border border-amber-300 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        Internal Ops Notes (Not Visible to Author)
                      </div>
                      <span className="text-[11px] text-amber-800">
                        {selectedTicket.internalNotes?.length || 0} notes
                      </span>
                    </div>

                    {selectedTicket.internalNotes && selectedTicket.internalNotes.length > 0 && (
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {selectedTicket.internalNotes.map((n, idx) => (
                          <div
                            key={n._id || idx}
                            className="p-2.5 bg-white border border-amber-200 rounded-lg text-xs"
                          >
                            <div className="flex items-center justify-between text-gray-500 mb-1">
                              <span className="font-semibold text-gray-800">{n.adminName}</span>
                              <span className="text-[10px]">
                                {new Date(n.createdAt).toLocaleDateString()}{" "}
                                {new Date(n.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-800">{n.note}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleNoteSubmit(onAddNote)} className="flex gap-2">
                      <input
                        type="text"
                        {...registerNote("note", { required: true })}
                        placeholder="Add private note for operations team..."
                        className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="submit"
                        disabled={noteMutation.isPending}
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        {noteMutation.isPending ? "Adding..." : "Add Note"}
                      </button>
                    </form>
                  </div>

                  {/* Admin Response Composer (React Hook Form) */}
                  <form onSubmit={handleResponseSubmit(onSendOfficialResponse)} className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-800">
                      Send Official Response to Author
                    </label>
                    <textarea
                      rows={5}
                      {...registerResponse("response", { required: true })}
                      placeholder="Write your response, or click 'Insert into Response Box' above to edit the AI-generated draft..."
                      className="w-full bg-white border border-gray-300 rounded-lg p-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-700"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">
                        Sending will notify author in real time and mark ticket 'In Progress'
                      </span>

                      <button
                        type="submit"
                        disabled={replyMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold disabled:opacity-50 shadow-xs transition-colors"
                      >
                        {replyMutation.isPending ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Send Response to Author
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-400">
                  Select a ticket from the queue on the left to review details, AI classification, draft responses, and internal notes.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
