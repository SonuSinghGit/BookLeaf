import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketsApi, getSocket } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  FileText,
  Clock,
  MessageSquare,
  Send,
  Paperclip,
  BookOpen,
  ShieldCheck,
  RefreshCw,
  User,
} from "lucide-react";

export const MyTickets = ({ initialSelectedTicketId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState(initialSelectedTicketId || null);
  const messagesEndRef = useRef(null);

  // TanStack Query to fetch tickets with 5s background polling
  const {
    data,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: ticketsApi.getMyTickets,
    refetchInterval: 5000,
  });

  const tickets = data?.tickets || [];
  const selectedTicket = tickets.find((t) => t._id === selectedTicketId) || (tickets.length > 0 && !selectedTicketId ? tickets[0] : null);

  // React Hook Form for Reply Composer
  const {
    register,
    handleSubmit,
    reset: resetReplyForm,
    formState: { errors },
  } = useForm({
    defaultValues: {
      replyText: "",
    },
  });

  // TanStack Mutation for sending message
  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, content }) => {
      return await ticketsApi.addMessage(ticketId, content);
    },
    onSuccess: () => {
      toast.success("Reply sent successfully!");
      resetReplyForm();
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send reply");
    },
  });

  // Real-time Socket Listener invalidates TanStack Query cache
  useEffect(() => {
    const socket = getSocket();

    const handleTicketUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    };

    const handleTicketMessage = () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    };

    socket.on("ticket_updated", handleTicketUpdated);
    socket.on("ticket_message", handleTicketMessage);

    return () => {
      socket.off("ticket_updated", handleTicketUpdated);
      socket.off("ticket_message", handleTicketMessage);
    };
  }, [queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.messages]);

  const onSendReply = (formData) => {
    if (!formData.replyText.trim() || !selectedTicket) return;
    replyMutation.mutate({
      ticketId: selectedTicket._id,
      content: formData.replyText.trim(),
    });
  };

  const getStatusBadge = (status) => {
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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-50 text-red-700 border-red-200";
      case "High":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Medium":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Low":
        return "bg-gray-50 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-emerald-700"></div>
        <p className="mt-3 text-sm text-gray-500">Loading your support tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            My Support Tickets
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track real-time status and converse directly with the BookLeaf operations team.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time Live Sync
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-xs inline-flex items-center gap-1"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-emerald-700" : ""}`} />
          </button>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-xs">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800">No Support Tickets Yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            You haven't submitted any support requests yet. Use the "Submit Query" tab to raise a ticket.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tickets List (Left column) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
              All Tickets ({tickets.length})
            </div>

            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {tickets.map((t) => {
                const isSelected = selectedTicket?._id === t._id;
                const hasReplies = t.messages && t.messages.length > 0;

                return (
                  <button
                    key={t._id}
                    onClick={() => setSelectedTicketId(t._id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all shadow-xs ${
                      isSelected
                        ? "bg-emerald-50/50 border-emerald-600 ring-1 ring-emerald-600"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-gray-900">
                        {t.ticketNumber}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">
                      {t.subject}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{t.bookTitle}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>

                      {hasReplies && (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          <MessageSquare className="w-3 h-3" />
                          {t.messages.length} response{t.messages.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ticket Conversation Thread (Right column) */}
          <div className="lg:col-span-7">
            {selectedTicket ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[750px]">
                {/* Header of selected ticket */}
                <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-gray-900">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                          selectedTicket.status
                        )}`}
                      >
                        {selectedTicket.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full border font-medium ${getPriorityBadge(
                          selectedTicket.priority
                        )}`}
                      >
                        {selectedTicket.priority} Priority
                      </span>
                      <span className="px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-600 font-medium">
                        {selectedTicket.category}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-base font-bold text-gray-900 mb-1">
                    {selectedTicket.subject}
                  </h2>

                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                    <span>Associated: {selectedTicket.bookTitle}</span>
                    <span>•</span>
                    <span>Raised {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Conversation Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {/* Original Query */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        Original Query by You ({selectedTicket.authorName})
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(selectedTicket.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.description}
                    </p>

                    {selectedTicket.attachmentName && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-700">
                        <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                        <span>Attached file: {selectedTicket.attachmentName}</span>
                      </div>
                    )}
                  </div>

                  {/* Message Thread */}
                  {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map((msg, index) => {
                      const isAdmin = msg.senderRole === "admin";

                      return (
                        <div
                          key={msg._id || index}
                          className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl p-4 text-sm shadow-xs ${
                              isAdmin
                                ? "bg-white border border-gray-200 text-gray-800"
                                : "bg-emerald-700 text-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-1.5">
                              <span
                                className={`text-xs font-bold flex items-center gap-1.5 ${
                                  isAdmin ? "text-emerald-800" : "text-emerald-100"
                                }`}
                              >
                                {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />}
                                {msg.senderName} {isAdmin ? "(BookLeaf Team)" : "(You)"}
                              </span>
                              <span
                                className={`text-[10px] ${
                                  isAdmin ? "text-gray-400" : "text-emerald-200"
                                }`}
                              >
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-xs text-gray-400">
                      No responses yet. An operations specialist has been notified and will reply shortly.
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Composer with React Hook Form */}
                <form
                  onSubmit={handleSubmit(onSendReply)}
                  className="p-3 sm:p-4 border-t border-gray-200 bg-white"
                >
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <textarea
                        rows={2}
                        {...register("replyText", { required: true })}
                        placeholder="Type your reply to BookLeaf support team..."
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={replyMutation.isPending}
                      className="px-4 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 disabled:opacity-40 transition-colors inline-flex items-center gap-1.5 shrink-0"
                    >
                      {replyMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>Reply</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                Select a ticket from the left column to view the message thread and updates.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
