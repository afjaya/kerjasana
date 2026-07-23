import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { 
  Receipt, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Sparkles, 
  CreditCard, 
  Building2, 
  Copy, 
  Check, 
  Printer, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { User, Transaction, PaymentType, PaymentStatus } from "../types";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";

interface EmployerTransactionsProps {
  user: User | null;
}

export default function EmployerTransactions({ user }: EmployerTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toast = useToast();
  const navigate = useNavigate();

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/payments/history", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      } else {
        toast.error("Gagal mengambil riwayat transaksi.", "Error");
      }
    } catch (error) {
      console.error("Fetch transactions error:", error);
      toast.error("Terjadi kesalahan koneksi ke server.", "Error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("ID Referensi berhasil disalin!", "Salin Teks");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.jobTitle && tx.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.company && tx.company.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || tx.status === statusFilter;
    const matchesType = typeFilter === "ALL" || tx.paymentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate stats
  const totalPaid = transactions
    .filter((t) => t.status === "PAID")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const paidCount = transactions.filter((t) => t.status === "PAID").length;
  const pendingCount = transactions.filter((t) => t.status === "PENDING").length;
  const featuredUpgradesCount = transactions.filter((t) => t.paymentType === "FEATURED_JOB" && t.status === "PAID").length;

  if (!user) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xs my-8">
        <Helmet>
          <title>Riwayat Transaksi — Kerjasana</title>
        </Helmet>
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
          <Receipt className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800">Akses Terbatas HRD</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Silakan masuk dengan akun Pemberi Kerja / HRD Anda untuk mengakses dan mengelola seluruh bukti pembayaran serta paket langganan.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
          >
            Masuk ke Akun HRD
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Helmet>
        <title>Riwayat Transaksi & Invoice Pembayaran — Kerjasana</title>
        <meta name="description" content="Riwayat transaksi pembayaran upgrade Loker Prioritas dan paket langganan HRD Kerjasana." />
      </Helmet>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-mono font-bold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Portal Keuangan HRD
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Riwayat Transaksi & Invoice</h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Pantau seluruh invoice pembayaran upgrade <strong className="text-amber-300 font-bold">Loker Prioritas (Featured Job)</strong> dan langganan paket HRD perusahaan Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" /> Pasang / Upgrade Loker
            </Link>
            <button
              onClick={fetchTransactions}
              disabled={isLoading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pembayaran</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            Rp {totalPaid.toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-slate-400">Total nominal transaksi berstatus LUNAS</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Status Transaksi</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{paidCount}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Lunas</span>
            {pendingCount > 0 && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{pendingCount} Menunggu</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Jumlah transaksi berhasil dikonfirmasi</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Loker Prioritas</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {featuredUpgradesCount} <span className="text-xs text-slate-400 font-semibold">Iklan</span>
          </div>
          <p className="text-[11px] text-slate-400">Proses upgrade ke sorotan utama</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Paket Saat Ini</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="inline-block px-2.5 py-1 bg-indigo-600 text-white font-extrabold text-xs rounded-lg uppercase tracking-wider shadow-xs">
              {user.subscriptionPlan || "FREE"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Kuota Posting: <strong className="text-slate-700">{user.jobPostingQuota ?? 2} Loker</strong>
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID, Ref ID, Judul Loker..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" /> Filter:
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="PAID">PAID (Lunas)</option>
              <option value="PENDING">PENDING (Menunggu)</option>
              <option value="FAILED">FAILED (Gagal)</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Semua Layanan</option>
              <option value="FEATURED_JOB">Loker Prioritas (Featured)</option>
              <option value="SUBSCRIPTION_PRO">Paket PRO</option>
              <option value="SUBSCRIPTION_ENTERPRISE">Paket ENTERPRISE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Memuat data riwayat transaksi...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8">
          <EmptyState
            icon={Receipt}
            title={transactions.length === 0 ? "Belum Ada Transaksi" : "Tidak Ada Hasil"}
            description={
              transactions.length === 0
                ? "Perusahaan Anda belum memiliki riwayat pembelian upgrade Loker Prioritas maupun paket langganan."
                : "Tidak ditemukan transaksi yang cocok dengan kriteria pencarian atau filter Anda."
            }
            primaryAction={{
              label: transactions.length === 0 ? "Upgrade Loker Sekarang" : "Reset Filter",
              onClick: () => {
                if (transactions.length === 0) {
                  navigate("/submit");
                } else {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setTypeFilter("ALL");
                }
              }
            }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">ID & Referensi</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Layanan / Item</th>
                  <th className="py-3.5 px-4">Metode Bayar</th>
                  <th className="py-3.5 px-4">Nominal</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* ID & Ref */}
                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{tx.referenceId || tx.id}</span>
                        <button
                          onClick={() => handleCopy(tx.referenceId || tx.id, tx.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Salin Ref ID"
                        >
                          {copiedId === tx.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.id}</div>
                    </td>

                    {/* Tanggal */}
                    <td className="py-4 px-4 font-medium whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })} WIB
                      </div>
                    </td>

                    {/* Item */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        {tx.paymentType === "FEATURED_JOB" ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Loker Prioritas (14 Hari)</span>
                          </>
                        ) : tx.paymentType === "SUBSCRIPTION_PRO" ? (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Paket HRD PRO (1 Bulan)</span>
                          </>
                        ) : (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>Paket ENTERPRISE</span>
                          </>
                        )}
                      </div>
                      {tx.jobTitle && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          Loker: <strong className="text-slate-700">{tx.jobTitle}</strong>
                        </div>
                      )}
                    </td>

                    {/* Metode */}
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                        {tx.paymentMethod || "DEMO_BYPASS"}
                      </span>
                    </td>

                    {/* Nominal */}
                    <td className="py-4 px-4 font-bold text-slate-800 whitespace-nowrap">
                      Rp {Number(tx.amount).toLocaleString("id-ID")}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {tx.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          PAID (Lunas)
                        </span>
                      ) : tx.status === "PENDING" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                          <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                          PENDING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          FAILED
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedInvoice(tx)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Invoice / Bukti Pembayaran */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden relative space-y-6 p-6 sm:p-8">
            {/* Header Stamp */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                    K
                  </div>
                  <span className="text-lg font-bold text-slate-800">
                    kerjasana<span className="text-indigo-600">.com</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Bukti Pembayaran Resmi Layanan Portal Karir
                </p>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-full uppercase tracking-widest border border-emerald-200 inline-block">
                  {selectedInvoice.status}
                </span>
                <p className="text-[10px] font-mono text-slate-400 mt-1">
                  OFFICIAL RECEIPT
                </p>
              </div>
            </div>

            {/* Invoice Info Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ref Transaksi</span>
                <span className="font-mono font-bold text-slate-800">{selectedInvoice.referenceId}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal & Waktu</span>
                <span className="font-medium text-slate-700">
                  {new Date(selectedInvoice.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pembayar (HRD)</span>
                <span className="font-semibold text-slate-800">{selectedInvoice.userName || user.name}</span>
                <span className="text-[10px] text-slate-500 block">{selectedInvoice.userEmail || user.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Metode Pembayaran</span>
                <span className="font-mono text-indigo-700 font-bold">{selectedInvoice.paymentMethod}</span>
              </div>
            </div>

            {/* Item Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Rincian Pembelian
              </h4>

              <div className="border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">
                      {selectedInvoice.paymentType === "FEATURED_JOB"
                        ? "Upgrade Loker Prioritas (Featured Job)"
                        : selectedInvoice.paymentType === "SUBSCRIPTION_PRO"
                        ? "Langganan Paket HRD PRO"
                        : "Langganan Paket HRD ENTERPRISE"}
                    </div>
                    {selectedInvoice.jobTitle && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Target Lowongan: <strong>{selectedInvoice.jobTitle}</strong> ({selectedInvoice.company})
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">
                      {selectedInvoice.paymentType === "FEATURED_JOB"
                        ? "Masa Penayangan Sorotan Prioritas 14 Hari di Halaman Utama"
                        : "Akses Fitur Premium HRD, Kuota Posting Loker & Analitik"}
                    </p>
                  </div>
                  <div className="font-extrabold text-slate-800 text-sm whitespace-nowrap">
                    Rp {Number(selectedInvoice.amount).toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm font-extrabold text-indigo-900">
                  <span>Total Pembayaran (Nett)</span>
                  <span className="text-base text-indigo-600">
                    Rp {Number(selectedInvoice.amount).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Transaksi Terverifikasi Otomatis
              </div>
              <p className="text-indigo-700/80 leading-snug">
                Iklan lowongan kerja atau paket langganan Anda telah diaktifkan secara langsung tanpa memerlukan konfirmasi manual.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak / Save PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Tutup Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
