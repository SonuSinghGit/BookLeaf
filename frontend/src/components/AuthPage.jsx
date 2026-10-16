import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { ticketsApi } from "../services/api";
import toast from "react-hot-toast";
import {
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

export const AuthPage = ({ defaultTab = "signin", onAdminLoginSuccess }) => {
  const { login, register: registerUser } = useAuth();
  const [tab, setTab] = useState(defaultTab);
  const [formError, setFormError] = useState("");
  const [seedSuccess, setSeedSuccess] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // React Hook Form for Sign In
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    formState: { errors: loginErrors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // React Hook Form for Registration
  const {
    register: signupRegister,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    reset: resetSignupForm,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      city: "",
    },
  });

  // TanStack Mutation for Login
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      return await login(email, password);
    },
    onSuccess: (user) => {
      toast.success(`Welcome back, ${user?.name || "Author"}!`);
      setFormError("");
      if (user?.role === "admin" && onAdminLoginSuccess) {
        onAdminLoginSuccess();
      }
    },
    onError: (err) => {
      const msg = err.message || "Invalid email or password.";
      toast.error(msg);
      setFormError(msg);
    },
  });

  // TanStack Mutation for Register
  const registerMutation = useMutation({
    mutationFn: async (data) => {
      return await registerUser({
        ...data,
        role: "author",
      });
    },
    onSuccess: () => {
      toast.success("Account created successfully! You can now sign in.");
      setFormError("");
      resetSignupForm();
      setTab("signin");
    },
    onError: (err) => {
      const msg = err.message || "Failed to register author account.";
      toast.error(msg);
      setFormError(msg);
    },
  });

  // TanStack Mutation for DB Seeder
  const seedMutation = useMutation({
    mutationFn: async () => {
      return await ticketsApi.seedDatabase();
    },
    onSuccess: () => {
      toast.success("Database seeded with sample authors, books & tickets!");
      setSeedSuccess("Database successfully seeded with 10 authors, 18 books & 7 starter tickets!");
      setTimeout(() => setSeedSuccess(""), 5000);
    },
    onError: (err) => {
      const msg = err.message || "Failed to seed database.";
      toast.error(msg);
      setFormError(msg);
    },
  });

  const onSignIn = (data) => {
    setFormError("");
    loginMutation.mutate(data);
  };

  const onRegister = (data) => {
    setFormError("");
    registerMutation.mutate(data);
  };

  const fillQuickLogin = (demoEmail, demoPass) => {
    setLoginValue("email", demoEmail, { shouldValidate: true });
    setLoginValue("password", demoPass, { shouldValidate: true });
    setFormError("");
  };

  const isSubmitting = loginMutation.isPending || registerMutation.isPending || seedMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-700 text-white font-bold text-2xl shadow-sm mb-3">
          B
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          BookLeaf Publishing
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Author Support & Operations Communication Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-2xl sm:px-10">
          {/* Tab Selector */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => {
                setTab("signin");
                setFormError("");
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors ${
                tab === "signin"
                  ? "border-emerald-700 text-emerald-800"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab("register");
                setFormError("");
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors ${
                tab === "register"
                  ? "border-emerald-700 text-emerald-800"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Author Registration
            </button>
          </div>

          {/* Feedback Alerts */}
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

          {/* Sign In Form with React Hook Form */}
          {tab === "signin" ? (
            <form onSubmit={handleLoginSubmit(onSignIn)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    {...loginRegister("email", {
                      required: "Email is required",
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: "Please enter a valid email address",
                      },
                    })}
                    placeholder="e.g. priya.sharma@email.com"
                    className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                  />
                </div>
                {loginErrors.email && (
                  <p className="text-red-600 text-[11px] mt-1">{loginErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    {...loginRegister("password", {
                      required: "Password is required",
                    })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-10 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="text-red-600 text-[11px] mt-1">{loginErrors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Registration Form with React Hook Form */
            <form onSubmit={handleSignupSubmit(onRegister)} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Author Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    {...signupRegister("name", { required: "Name is required" })}
                    placeholder="e.g. Vikram Seth"
                    className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                  />
                </div>
                {signupErrors.name && (
                  <p className="text-red-600 text-[11px] mt-1">{signupErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    {...signupRegister("email", {
                      required: "Email is required",
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: "Invalid email address",
                      },
                    })}
                    placeholder="author@example.com"
                    className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                  />
                </div>
                {signupErrors.email && (
                  <p className="text-red-600 text-[11px] mt-1">{signupErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    {...signupRegister("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    placeholder="At least 6 characters"
                    className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-10 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showSignupPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {signupErrors.password && (
                  <p className="text-red-600 text-[11px] mt-1">{signupErrors.password.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      {...signupRegister("phone")}
                      placeholder="+91-987..."
                      className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-2 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    City
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      {...signupRegister("city")}
                      placeholder="e.g. Pune"
                      className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-2 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Author Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick 1-Click Test Credentials */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              1-Click Demo Logins (Sample Dataset)
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fillQuickLogin("priya.sharma@email.com", "password123")}
                className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-xs text-gray-700 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-gray-900">Priya Sharma</span> (Author)
                  <div className="text-[11px] text-gray-400">priya.sharma@email.com • 2 books</div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">Autofill</span>
              </button>

           

              <button
                type="button"
                onClick={() => fillQuickLogin("admin@bookleaf.com", "admin123")}
                className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 text-xs text-gray-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="font-semibold text-gray-900">BookLeaf Admin</span>
                    <div className="text-[11px] text-gray-400">admin@bookleaf.com</div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-purple-700">Autofill</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
