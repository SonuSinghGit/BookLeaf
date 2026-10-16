import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { booksApi, ticketsApi } from "../services/api";
import toast from "react-hot-toast";
import {
  LifeBuoy,
  Paperclip,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export const SubmitTicket = ({ preSelectedBook, onTicketCreated }) => {
  const queryClient = useQueryClient();
  const [attachment, setAttachment] = useState(null);
  const [successTicket, setSuccessTicket] = useState(null);
  const [formError, setFormError] = useState("");

  // TanStack Query to fetch author books for dropdown
  const { data: booksData } = useQuery({
    queryKey: ["my-books-dropdown"],
    queryFn: booksApi.getMyBooks,
  });

  const books = booksData?.books || [];

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bookId: preSelectedBook ? preSelectedBook.bookId : "",
      subject: "",
      description: "",
    },
  });

  const descriptionValue = watch("description") || "";

  useEffect(() => {
    if (preSelectedBook) {
      setValue("bookId", preSelectedBook.bookId);
    }
  }, [preSelectedBook, setValue]);

  // TanStack Mutation for ticket creation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketPayload) => {
      return await ticketsApi.createTicket(ticketPayload);
    },
    onSuccess: (res) => {
      if (res.success && res.ticket) {
        toast.success(`Ticket #${res.ticket.ticketNumber || ""} created successfully!`);
        setSuccessTicket(res.ticket);
        reset({
          bookId: "",
          subject: "",
          description: "",
        });
        setAttachment(null);
        // Invalidate author and admin ticket queries
        queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
        queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
        queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      }
    },
    onError: (err) => {
      const msg = err.message || "Failed to submit ticket. Please try again.";
      toast.error(msg);
      setFormError(msg);
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const loadTemplate = (templateSubject, templateDesc) => {
    setValue("subject", templateSubject, { shouldValidate: true });
    setValue("description", templateDesc, { shouldValidate: true });
    setFormError("");
  };

  const onSubmit = (data) => {
    setFormError("");
    const chosenBook = books.find((b) => b.bookId === data.bookId);
    const bookTitle = chosenBook ? chosenBook.title : "General / Account Level";

    createTicketMutation.mutate({
      bookId: data.bookId || null,
      bookTitle,
      subject: data.subject.trim(),
      description: data.description.trim(),
      attachmentName: attachment ? attachment.name : null,
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-blue-600" />
          Submit a Support Query
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Have a question about your royalties, ISBN, distribution, or print quality? Our dedicated operations team is here to assist.
        </p>
      </div>

      {/* Success Notification */}
      {successTicket && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-emerald-900">
                Ticket Created: {successTicket.ticketNumber}
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                Your query has been logged and assigned to our operations team. It has been classified under{" "}
                <span className="font-semibold">{successTicket.category}</span> with{" "}
                <span className="font-semibold">{successTicket.priority}</span> priority.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onTicketCreated && onTicketCreated(successTicket)}
                  className="px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800"
                >
                  View in My Tickets
                </button>
                <button
                  onClick={() => setSuccessTicket(null)}
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded text-xs font-medium hover:bg-emerald-50"
                >
                  Submit Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Quick sample prompt templates */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Quick Test Templates (From BookLeaf Scenarios)
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              loadTemplate(
                "I published my book 4 months ago and still haven't received any royalty. What's going on?",
                "My sales numbers show active copies sold, but I have not received any payout or notification in my bank account. Please investigate the overdue amount."
              )
            }
            className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1.5 rounded transition-colors"
          >
            Royalty Overdue
          </button>
          <button
            type="button"
            onClick={() =>
              loadTemplate(
                "My book is showing a different ISBN on Amazon than what's on the physical copy.",
                "When I check my title on Amazon India, the ISBN listed is completely different from the imprint barcode printed on my physical author copies."
              )
            }
            className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1.5 rounded transition-colors"
          >
            ISBN Discrepancy
          </button>
          <button
            type="button"
            onClick={() =>
              loadTemplate(
                "I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.",
                "The shipment of copies arrived yesterday. The chapter headers are partially cut off and colors are faded. Please advise on obtaining a free replacement reprint."
              )
            }
            className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1.5 rounded transition-colors"
          >
            Printing Quality Issue
          </button>
          <button
            type="button"
            onClick={() =>
              loadTemplate(
                "My book is published but it's showing as 'Currently Unavailable' on Amazon.",
                "Readers have complained that my book listing shows as Currently Unavailable on Amazon India today. Can you trigger an inventory re-sync?"
              )
            }
            className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1.5 rounded transition-colors"
          >
            Amazon Availability
          </button>
        </div>
      </div>

      {/* Main Ticket Form using React Hook Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-5"
      >
        {/* Book Dropdown */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Select Related Book
          </label>
          <div className="relative">
            <select
              {...register("bookId")}
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
            >
              <option value="">General / Account Level</option>
              {books.map((b) => (
                <option key={b.bookId} value={b.bookId}>
                  {b.title} ({b.bookId} • {b.status})
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Choose a specific title or select "General / Account Level" for royalty, banking, or platform inquiries.
          </p>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Subject Line <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("subject", {
              required: "Subject line is required",
              minLength: { value: 5, message: "Subject must be at least 5 characters" },
            })}
            placeholder="e.g. Royalty payout enquiry for Q3, or ISBN mismatch on Amazon"
            className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
          />
          {errors.subject && (
            <p className="text-red-600 text-[11px] mt-1">{errors.subject.message}</p>
          )}
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            {...register("description", {
              required: "Description is required",
              minLength: { value: 10, message: "Please provide at least 10 characters" },
            })}
            placeholder="Please be as specific as possible. Include order numbers, dates, error messages, or copies count so we can resolve your query faster..."
            className="w-full bg-white border border-gray-300 rounded-lg p-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
          />
          <div className="flex justify-between items-center text-[11px] mt-1">
            {errors.description ? (
              <span className="text-red-600">{errors.description.message}</span>
            ) : (
              <span className="text-gray-400">Minimum 10 characters</span>
            )}
            <span className="text-gray-400">{descriptionValue.length} characters</span>
          </div>
        </div>

        {/* File Attachment Support */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Attachment <span className="text-gray-400 font-normal">(Optional — Photos of print copies, screenshots)</span>
          </label>

          {attachment ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{attachment.name}</span>
                <span className="text-gray-400">({attachment.size})</span>
              </div>
              <button
                type="button"
                onClick={removeAttachment}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg cursor-pointer text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors w-full sm:w-auto inline-flex justify-center">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <span>Click to attach photo or document (PNG, JPG, PDF)</span>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              reset();
              setAttachment(null);
            }}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={createTicketMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 shadow-xs transition-colors"
          >
            {createTicketMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Support Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
