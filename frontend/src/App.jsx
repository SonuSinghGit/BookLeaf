import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ticketsApi } from "./services/api";
import { AdminPortalView } from "./components/AdminPortalView";
import { AuthPage } from "./components/AuthPage";
import { AuthorProfile } from "./components/AuthorProfile";
import { MyBooks } from "./components/MyBooks";
import { MyTickets } from "./components/MyTickets";
import { Navbar } from "./components/Navbar";
import { SubmitTicket } from "./components/SubmitTicket";
import { Toaster } from "react-hot-toast";

const MainContent = () => {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState("books");
  const [preSelectedBook, setPreSelectedBook] = useState(null);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [isInAdminView, setIsInAdminView] = useState(false);

  // If logged in as admin directly, show admin view; if author or logged out, reset admin view
  useEffect(() => {
    if (isAdmin) {
      setIsInAdminView(true);
    } else {
      setIsInAdminView(false);
      setActiveTab("books");
      setPreSelectedBook(null);
    }
  }, [isAdmin, isAuthenticated]);

  // Fetch author's active tickets count for badge
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      const loadCount = async () => {
        try {
          const res = await ticketsApi.getMyTickets();
          if (res.success && res.tickets) {
            const open = res.tickets.filter(
              (t) => t.status === "Open" || t.status === "In Progress"
            ).length;
            setOpenTicketsCount(open);
          }
        } catch (err) {
          console.error("Count fetch error:", err);
        }
      };
      loadCount();
    }
  }, [isAuthenticated, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-emerald-700"></div>
          <p className="mt-3 text-sm text-gray-500 font-medium">Loading BookLeaf Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        onAdminLoginSuccess={() => {
          setIsInAdminView(true);
        }}
      />
    );
  }

  // If in Admin Mode (only accessible when user is actually an admin)
  if (isAdmin && isInAdminView) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <AdminPortalView
            onBackToAuthor={() => {
              setIsInAdminView(false);
            }}
          />
        </div>
      </div>
    );
  }

  // Render active tab content
  const renderContent = () => {
    switch (activeTab) {
      case "books":
        return (
          <MyBooks
            onRaiseQueryForBook={(book) => {
              setPreSelectedBook(book);
              setActiveTab("submit");
            }}
          />
        );
      case "submit":
        return (
          <SubmitTicket
            preSelectedBook={preSelectedBook}
            onTicketCreated={() => {
              setPreSelectedBook(null);
              setActiveTab("tickets");
            }}
          />
        );
      case "tickets":
        return <MyTickets />;
      case "profile":
        return <AuthorProfile />;
      default:
        return (
          <MyBooks
            onRaiseQueryForBook={(book) => {
              setPreSelectedBook(book);
              setActiveTab("submit");
            }}
          />
        );
    }
  };

  // Author Mode – tab-based navigation
  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openTicketsCount={openTicketsCount}
        onViewAdmin={isAdmin ? () => setIsInAdminView(true) : undefined}
      />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        <p>© 2026 BookLeaf Publishing. Author Support & Operations Communication Portal.</p>
        <p className="mt-1">Delhi In-House Print Facility • Repro India • Epitome Books</p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <MainContent />
    </AuthProvider>
  );
}
