import React from "react";
import { useQuery } from "@tanstack/react-query";
import { booksApi } from "../services/api";
import {
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Info,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export const MyBooks = ({ onRaiseQueryForBook }) => {
  // TanStack Query for author books and royalty summary
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["my-books"],
    queryFn: booksApi.getMyBooks,
  });

  const books = data?.books || [];
  const summary = data?.summary || null;

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-emerald-700"></div>
        <p className="mt-3 text-sm text-gray-500">Loading your catalog and royalty ledger...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Error Loading Books
        </div>
        <p className="mt-1">{error?.message || "Failed to load author books."}</p>
        <button
          onClick={() => refetch()}
          className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Published Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor your published titles, production progress, lifetime copies sold, and quarterly royalty earnings.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-xs inline-flex items-center gap-1.5 shadow-xs"
          title="Refresh Catalog Cache"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-emerald-700" : ""}`} />
          <span className="hidden sm:inline">Refresh Data</span>
        </button>
      </div>

      {/* KPI Financial Overview Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Copies Sold</span>
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {summary.totalCopiesSold.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Across all retail channels</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Royalty Earned</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.totalRoyaltyEarned)}
            </div>
            <p className="text-xs text-gray-500 mt-1">80% net author profit share</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Royalty Paid Out</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {formatCurrency(summary.royaltyPaid)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Transferred to linked bank</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Royalty Pending</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700">
              {formatCurrency(summary.royaltyPending)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.royaltyPending < 1000 && summary.royaltyPending > 0
                ? "Below ₹1,000 threshold (rolls over)"
                : "Scheduled for next 45-day cycle"}
            </p>
          </div>
        </div>
      )}

      {/* BookLeaf Royalty Policy Callout */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-gray-800">BookLeaf Royalty & Payout Policy:</p>
          <p>
            BookLeaf operates on an 80/20 royalty split (80% net profit to the author). Net profit = MRP minus printing cost, platform fees, and shipping. Royalties are calculated quarterly and disbursed within 45 days. The minimum payout threshold is ₹1,000.
          </p>
        </div>
      </div>

      {/* Books List / Table */}
      {books.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800">No Books Found</h3>
          <p className="text-sm text-gray-500 mt-1">
            You don't have any books associated with this author account yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              Your Books ({books.length})
            </h2>
            <span className="text-xs text-gray-500">Live sales data</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {books.map((book) => {
              const isLive = book.status === "Published & Live";

              return (
                <div
                  key={book._id || book.bookId}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left: Book Details */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isLive
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {isLive ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Layers className="w-3 h-3 text-amber-600" />
                          )}
                          {book.status}
                        </span>

                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {book.bookId}
                        </span>

                        <span className="text-xs text-gray-600 font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          {book.genre}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900">{book.title}</h3>

                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs text-gray-600">
                        <div>
                          <span className="text-gray-400 block">ISBN</span>
                          <span className="font-mono font-medium text-gray-800">
                            {book.isbn || "Pending Assignment"}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-400 block">Publication Date</span>
                          <span className="font-medium text-gray-800">
                            {book.publicationDate ? book.publicationDate : "In Production"}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-400 block">Retail Price (MRP)</span>
                          <span className="font-medium text-gray-800">
                            {book.mrp ? formatCurrency(book.mrp) : "TBD"}
                          </span>
                        </div>

                        {book.authorRoyaltyPerCopy !== null && (
                          <div>
                            <span className="text-gray-400 block">Royalty / Copy</span>
                            <span className="font-medium text-gray-800">
                              {formatCurrency(book.authorRoyaltyPerCopy)}
                            </span>
                          </div>
                        )}

                        {book.printPartner && (
                          <div>
                            <span className="text-gray-400 block">Print Partner</span>
                            <span className="font-medium text-gray-800">{book.printPartner}</span>
                          </div>
                        )}

                        {book.lastRoyaltyPayoutDate && (
                          <div>
                            <span className="text-gray-400 block">Last Payout Date</span>
                            <span className="font-medium text-gray-800">
                              {book.lastRoyaltyPayoutDate}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Platforms availability */}
                      {book.availableOn && book.availableOn.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-gray-400">Available On:</span>
                          {book.availableOn.map((platform) => (
                            <span
                              key={platform}
                              className="inline-flex items-center text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Sales & Royalty Box */}
                    <div className="lg:w-80 bg-gray-50 border border-gray-200 rounded-lg p-3.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs pb-1 border-b border-gray-200">
                          <span className="text-gray-500">Copies Sold:</span>
                          <span className="font-bold text-gray-900">
                            {book.totalCopiesSold.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Total Royalty Earned:</span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(book.totalRoyaltyEarned)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Royalty Paid:</span>
                          <span className="font-semibold text-emerald-700">
                            {formatCurrency(book.royaltyPaid)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200">
                          <span className="font-medium text-gray-700">Royalty Pending:</span>
                          <span className="font-bold text-amber-700">
                            {formatCurrency(book.royaltyPending)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onRaiseQueryForBook(book)}
                        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Raise Query for this Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
