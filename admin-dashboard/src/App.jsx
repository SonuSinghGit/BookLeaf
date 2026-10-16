import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminLogin } from "./components/AdminLogin";
import { AdminPortal } from "./components/AdminPortal";
import { Toaster } from "react-hot-toast";

const AdminDashboardMain = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-purple-700"></div>
          <p className="mt-3 text-xs text-gray-500 font-medium">Loading BookLeaf Admin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <AdminPortal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <AdminDashboardMain />
    </AuthProvider>
  );
}

