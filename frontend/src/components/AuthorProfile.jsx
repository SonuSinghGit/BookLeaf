import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { User, CreditCard, Save, CheckCircle2, AlertCircle, Info } from "lucide-react";

export const AuthorProfile = () => {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // React Hook Form initialized with current user profile values
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      phone: user?.phone || "",
      city: user?.city || "",
      accountHolder: user?.bankDetails?.accountHolder || user?.name || "",
      bankName: user?.bankDetails?.bankName || "",
      accountNumber: user?.bankDetails?.accountNumber || "",
      ifscCode: user?.bankDetails?.ifscCode || "",
    },
  });

  // TanStack Mutation for Profile Update
  const profileMutation = useMutation({
    mutationFn: async (data) => {
      return await updateProfile({
        phone: data.phone,
        city: data.city,
        bankDetails: {
          accountHolder: data.accountHolder,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode.toUpperCase(),
        },
      });
    },
    onSuccess: () => {
      toast.success("Profile and payout details updated successfully!");
      setSuccess(true);
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["my-books"] });
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      const msg = err.message || "Failed to update profile.";
      toast.error(msg);
      setFormError(msg);
    },
  });

  const onSubmit = (data) => {
    setFormError("");
    profileMutation.mutate(data);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-gray-700" />
          Author Profile & Payout Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal details and linked bank account for quarterly royalty disbursements.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile and bank payout details successfully updated!</span>
        </div>
      )}

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Info Callout */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Direct NEFT/RTGS Bank Transfers</p>
          <p>
            Royalties exceeding ₹1,000 are processed directly to this bank account within 45 days after the close of every quarter. Please verify your IFSC code and account number carefully.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Author Personal Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <User className="w-4 h-4 text-emerald-700" />
            Author Account Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Author Name</label>
              <input
                type="text"
                disabled
                value={user?.name || ""}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Author ID</label>
              <input
                type="text"
                disabled
                value={user?.authorId || "AUTH-NEW"}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 font-mono text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
              <input
                type="text"
                {...register("phone")}
                placeholder="+91-98765-43210"
                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">City / Region</label>
              <input
                type="text"
                {...register("city")}
                placeholder="e.g. Mumbai, Bangalore, Delhi"
                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            Bank Payout Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                {...register("accountHolder")}
                placeholder="Name as per Bank Passbook"
                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                {...register("bankName")}
                placeholder="e.g. HDFC Bank, SBI, ICICI"
                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                {...register("accountNumber")}
                placeholder="Bank Account Number"
                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                {...register("ifscCode")}
                placeholder="e.g. HDFC0001234"
                className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 font-mono uppercase text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs"
          >
            {profileMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
