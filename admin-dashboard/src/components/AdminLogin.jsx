import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { ticketsApi } from "../services/api";
import toast from "react-hot-toast";
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";

export const AdminLogin = () => {
  const { login } = useAuth();
  const [formError, setFormError] = useState("");
  const [seedSuccess, setSeedSuccess] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "admin@bookleaf.com",
      password: "admin123",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      return await login(email, password);
    },
    onSuccess: (admin) => {
      toast.success(`Welcome, ${admin?.name || "Admin"}!`);
    },
    onError: (err) => {
      const msg = err.message || "Invalid admin credentials.";
      toast.error(msg);
      setFormError(msg);
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      return await ticketsApi.seedDatabase();
    },
    onSuccess: () => {
      toast.success("Database freshly seeded!");
      setSeedSuccess("Database freshly seeded with 10 authors, 18 books & 7 starter tickets!");
      setTimeout(() => setSeedSuccess(""), 4000);
    },
    onError: (err) => {
      const msg = err.message || "Failed to seed database.";
      toast.error(msg);
      setFormError(msg);
    },
  });

  const onSubmit = (data) => {
    setFormError("");
    loginMutation.mutate(data);
  };

  const isPending = loginMutation.isPending || seedMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-purple-700 text-white font-bold text-2xl shadow-sm mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          BookLeaf Operations Desk
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Admin Portal — Internal Author Support Queue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-2xl sm:px-10">
          {formError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {seedSuccess && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{seedSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-[11px] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  {...register("password", { required: "Password is required" })}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
              </div>
              {errors.password && (
                <p className="text-red-600 text-[11px] mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Pre-filled credentials: <strong className="text-gray-900">admin@bookleaf.com</strong></span>
            <button
              type="button"
              onClick={() => seedMutation.mutate()}
              disabled={isPending}
              className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-800 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              Seed DB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
