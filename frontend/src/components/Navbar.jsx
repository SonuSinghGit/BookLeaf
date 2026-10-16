import React from "react";
import { useAuth } from "../context/AuthContext";
import { BookOpen, LifeBuoy, FileText, User as UserIcon, LogOut, ShieldCheck } from "lucide-react";

export const Navbar = ({ activeTab, setActiveTab, openTicketsCount = 0, onViewAdmin }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 tracking-tight text-lg">BookLeaf</span>
                <span className="text-xs uppercase tracking-wider font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                  Author Portal
                </span>
              </div>
              <p className="text-xs text-gray-500">Self-Publishing Platform</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab("books")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "books" ? "bg-gray-100 text-gray-900 border border-gray-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-700" />
              My Books
            </button>
            <button
              onClick={() => setActiveTab("submit")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "submit" ? "bg-gray-100 text-gray-900 border border-gray-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <LifeBuoy className="w-4 h-4 text-blue-600" />
              Submit Query
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors relative ${
                activeTab === "tickets" ? "bg-gray-100 text-gray-900 border border-gray-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-4 h-4 text-purple-600" />
              My Tickets
              {openTicketsCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {openTicketsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "profile" ? "bg-gray-100 text-gray-900 border border-gray-200" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <UserIcon className="w-4 h-4 text-gray-600" />
              Profile & Payouts
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {onViewAdmin && (
              <button
                onClick={onViewAdmin}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                title="Switch to Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Dashboard
              </button>
            )}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500 font-mono">{user?.authorId || user?.email}</div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center justify-around py-2 border-t border-gray-100">
            <button
              onClick={() => setActiveTab("books")}
              className={`text-xs px-2.5 py-1.5 rounded font-medium ${activeTab === "books" ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600"}`}
            >
              My Books
            </button>
            <button
              onClick={() => setActiveTab("submit")}
              className={`text-xs px-2.5 py-1.5 rounded font-medium ${activeTab === "submit" ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600"}`}
            >
              Submit Query
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`text-xs px-2.5 py-1.5 rounded font-medium ${activeTab === "tickets" ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600"}`}
            >
              My Tickets ({openTicketsCount})
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`text-xs px-2.5 py-1.5 rounded font-medium ${activeTab === "profile" ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600"}`}
            >
              Profile
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
