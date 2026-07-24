/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  PlusCircle, Building2, MapPin, DollarSign, FileText, CheckSquare, 
  Mail, ClipboardCheck, ArrowRight, CheckCircle2, AlertCircle, Loader2, ListOrdered,
  Briefcase, Trash2, AlertTriangle, X, Sparkles, CreditCard, Receipt, Award, Star,
  Users, Search, Filter, Phone, ExternalLink, Download, UserCheck, UserX, Clock
} from "lucide-react";
import { User, Job, Transaction, Application, ApplicationStatus } from "../types";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/getErrorMessage";
import EmptyState from "../components/EmptyState";
import { Helmet } from "react-helmet-async";
import UpgradeFeaturedModal from "../components/UpgradeFeaturedModal";
import PricingPlans from "../components/PricingPlans";

interface SubmitJobProps {
  user: User | null;
}

export default function SubmitJob({ user }: SubmitJobProps) {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Tab Navigation for HRD Dashboard
  const [activeTab, setActiveTab] = useState<"POST_JOB" | "APPLICANTS" | "PRICING" | "TRANSACTIONS">("POST_JOB");

  // State Input Form
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("IT / Teknologi");
  const [salary, setSalary] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState("Bulan");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [contact, setContact] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedJob, setSubmittedJob] = useState<Job | null>(null);

  // State untuk daftar lowongan buatan saya sendiri
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [isLoadingMyJobs, setIsLoadingMyJobs] = useState(false);

  // State untuk data pelamar kerja HRD
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [searchApplicant, setSearchApplicant] = useState<string>("");
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [expandedCoverLetters, setExpandedCoverLetters] = useState<Record<string, boolean>>({});

  // State untuk riwayat transaksi
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  // Modal Upgrade Featured Job
  const [featuredModalJob, setFeaturedModalJob] = useState<Job | null>(null);

  // Modal Konfirmasi Pembatalan Lowongan
  const [cancelModal, setCancelModal] = useState<{
    jobId: string;
    jobTitle: string;
    company: string;
  } | null>(null);

  const fetchTransactions = async () => {
    if (!user) return;
    setIsLoadingTx(true);
    try {
      const res = await fetch("/api/payments/history", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error("Gagal mengambil riwayat transaksi", e);
    } finally {
      setIsLoadingTx(false);
    }
  };

  const executeCancelJob = async (jobId: string) => {
    setCancelModal(null);
    try {
      const res = await fetch(`/api/jobs/my/${jobId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Lowongan berhasil dibatalkan.", "Pembatalan Berhasil");
        fetchMyJobs();
        window.dispatchEvent(new Event("refresh-jobs"));
      } else {
        toast.error(data.error || "Gagal membatalkan lowongan.", "Gagal Membatalkan");
      }
    } catch (e) {
      toast.error("Koneksi gagal saat membatalkan lowongan.", "Koneksi Error");
    }
  };

  const fetchMyJobs = async () => {
    if (!user) return;
    setIsLoadingMyJobs(true);
    try {
      const res = await fetch("/api/jobs/my", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setMyJobs(data.jobs);
      }
    } catch (e) {
      console.error("Gagal mengambil daftar loker saya", e);
    } finally {
      setIsLoadingMyJobs(false);
    }
  };

  const fetchApplications = async () => {
    if (!user) return;
    setIsLoadingApps(true);
    try {
      const res = await fetch("/api/employer/applications", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setApplications(data.applications || []);
      }
    } catch (e) {
      console.error("Gagal mengambil data pelamar HRD", e);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleUpdateApplicantStatus = async (appId: string, newStatus: ApplicationStatus) => {
    setUpdatingAppId(appId);
    try {
      const res = await fetch(`/api/employer/applications/${appId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Status pelamar berhasil diperbarui menjadi "${newStatus}"!`, "Status Diperbarui");
        fetchApplications();
      } else {
        toast.error(data.error || "Gagal memperbarui status pelamar.", "Gagal Update");
      }
    } catch (e) {
      toast.error("Koneksi gagal saat memperbarui status pelamar.", "Koneksi Error");
    } finally {
      setUpdatingAppId(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyJobs();
      fetchTransactions();
      fetchApplications();
    }
    const handleRefresh = () => {
      fetchMyJobs();
      fetchTransactions();
      fetchApplications();
    };
    window.addEventListener("refresh-jobs", handleRefresh);
    return () => window.removeEventListener("refresh-jobs", handleRefresh);
  }, [user]);

  // Logika filter pelamar
  const filteredApplications = applications.filter((app) => {
    if (selectedJobFilter !== "ALL" && app.jobId !== selectedJobFilter) {
      return false;
    }
    if (selectedStatusFilter !== "ALL" && app.status !== selectedStatusFilter) {
      return false;
    }
    if (searchApplicant.trim()) {
      const q = searchApplicant.toLowerCase();
      const candidateName = (app.candidateName || "").toLowerCase();
      const candidateEmail = (app.candidateEmail || "").toLowerCase();
      const jobTitle = (app.jobTitle || "").toLowerCase();
      const skills = (app.candidateProfile?.skills || "").toLowerCase();
      
      if (
        !candidateName.includes(q) &&
        !candidateEmail.includes(q) &&
        !jobTitle.includes(q) &&
        !skills.includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  // Handle pengiriman form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!title || !company || !location || !salary || !description || !requirements || !contact) {
      setError("Silakan lengkapi seluruh kolom input lowongan kerja.");
      toast.warning("Silakan lengkapi seluruh kolom input lowongan kerja.", "Form Belum Lengkap");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          title,
          company,
          location,
          salary,
          salaryMin: salaryMin ? Number(salaryMin) : undefined,
          salaryMax: salaryMax ? Number(salaryMax) : undefined,
          salaryPeriod,
          description,
          requirements,
          contact,
          category
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengajukan lowongan kerja.");
      }

      setSubmittedJob(data.job);
      toast.success(`Lowongan "${data.job.title}" berhasil diajukan dan dalam peninjauan admin!`, "Pengajuan Berhasil");

      // Pemicu refresh daftar lowongan di halaman utama & panel simulator
      window.dispatchEvent(new Event("refresh-jobs"));
      
      // Kosongkan form
      setTitle("");
      setCompany("");
      setLocation("");
      setCategory("IT / Teknologi");
      setSalary("");
      setDescription("");
      setRequirements("");
      setContact("");

    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Gagal melakukan registrasi.");
      setError(msg);
      toast.error(getErrorMessage(err, "Gagal mengajukan lowongan kerja."), "Pengajuan Gagal");
    } finally {
      setIsLoading(false);
    }
  };

  // Jika belum masuk/login, tampilkan panduan login
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto my-12 px-4 text-center space-y-6">
        <Helmet>
          <title>Pasang Lowongan Kerja — Kerjasana</title>
          <meta name="description" content="Pasang iklan lowongan kerja perusahaan Anda di kerjasana.com untuk menjangkau talenta berkualitas dengan verifikasi terpercaya." />
        </Helmet>
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
          <PlusCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pasang Lowongan Kerja Baru</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Anda harus masuk sebagai <strong>Pemberi Kerja</strong> terlebih dahulu untuk dapat mengajukan iklan lowongan kerja di platform kami.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/10 transition-all hover:translate-y-[-1px]"
          >
            Masuk / Daftar Akun Sekarang
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Pasang & Kelola Lowongan Kerja — Kerjasana</title>
        <meta name="description" content="Formulir pendaftaran iklan lowongan kerja baru perusahaan Anda di kerjasana.com. Proses verifikasi cepat dan transparan." />
      </Helmet>

      {/* Tab Navigation Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 flex flex-wrap gap-2 shadow-xs">
        <button
          onClick={() => setActiveTab("POST_JOB")}
          className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "POST_JOB"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-transparent text-slate-600 hover:bg-slate-100"
          }`}
        >
          <PlusCircle className="w-4 h-4" /> Pasang & Kelola Loker
        </button>

        <button
          onClick={() => setActiveTab("APPLICANTS")}
          className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "APPLICANTS"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-transparent text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          Daftar Pelamar Masuk
          <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
            activeTab === "APPLICANTS" ? "bg-white text-indigo-700" : "bg-indigo-100 text-indigo-700"
          }`}>
            {applications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("PRICING")}
          className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "PRICING"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-transparent text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CreditCard className="w-4 h-4" /> Paket Langganan HRD
        </button>

        <button
          onClick={() => setActiveTab("TRANSACTIONS")}
          className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "TRANSACTIONS"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-transparent text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Receipt className="w-4 h-4" /> Riwayat Transaksi ({transactions.length})
        </button>
      </div>

      {/* TAB 1: PASANG & KELOLA LOKER */}
      {activeTab === "POST_JOB" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
          {/* Kolom Kiri: Form Input atau Banner Sukses */}
          <div className="space-y-6">
            {submittedJob ? (
              // Layar sukses setelah submit
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8 text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 animate-bounce">
                  <ClipboardCheck className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">Lowongan Berhasil Diajukan!</h3>
                  <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
                    Terima kasih, lowongan <strong className="text-slate-700 font-bold">"{submittedJob.title}"</strong> di <strong className="text-slate-700 font-bold">{submittedJob.company}</strong> berhasil masuk ke sistem kami.
                  </p>
                </div>

                {/* Kotak Alur Kerja */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Alur Persetujuan (Status: PENDING)
                  </h4>
                  <p className="text-[11px] text-amber-800/95 leading-relaxed">
                    Sesuai kebijakan perlindungan pelamar kerja lokal, iklan Anda tidak langsung ditayangkan secara instan.
                  </p>
                  <ul className="list-disc pl-4 text-[10px] text-amber-800/90 space-y-1">
                    <li>Iklan akan ditinjau oleh Administrator kami dalam waktu maks 1x24 jam.</li>
                    <li>Setelah Admin mengklik <strong className="text-amber-900 font-bold">"APPROVE"</strong>, status akan berubah menjadi <strong className="text-indigo-800 font-bold">"ACTIVE"</strong> dan otomatis tayang di Halaman Utama.</li>
                    <li>Jika iklan melanggar aturan, status diubah menjadi <strong className="text-rose-800 font-bold">"REJECTED"</strong>.</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    onClick={() => setSubmittedJob(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Buat Loker Lainnya
                  </button>
                  
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10"
                  >
                    Lihat Halaman Utama
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              // Form Pengisian Loker
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Form Pengajuan Lowongan Kerja</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Lengkapi seluruh informasi pekerjaan di bawah ini. Pastikan kontak dan kualifikasi tertulis jelas.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3.5 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg text-rose-700 text-xs font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Baris 1: Nama Jabatan & Nama Perusahaan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Nama Lowongan / Jabatan *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <PlusCircle className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all"
                          placeholder="Contoh: Barista Full-Time"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Nama Perusahaan / Outlet *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all"
                          placeholder="Contoh: Kopi Kenangan"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Baris Kategori Pekerjaan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Kategori Pekerjaan *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                      </div>
                      <select
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all appearance-none cursor-pointer font-medium"
                      >
                        <option value="IT / Teknologi">IT / Teknologi</option>
                        <option value="Keuangan & Akuntansi">Keuangan & Akuntansi</option>
                        <option value="Pendidikan & Pelatihan">Pendidikan & Pelatihan</option>
                        <option value="Kesehatan & Farmasi">Kesehatan & Farmasi</option>
                        <option value="Sales & Marketing">Sales & Marketing</option>
                        <option value="Administrasi & Umum">Administrasi & Umum</option>
                        <option value="F&B / Pelayanan">F&B / Pelayanan</option>
                        <option value="Desain & Media">Desain & Media</option>
                        <option value="Konstruksi & Teknik">Konstruksi & Teknik</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  {/* Baris 2: Lokasi & Estimasi Gaji */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Lokasi Wilayah Penempatan *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all"
                          placeholder="Contoh: Denpasar, Bali"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Ringkasan Gaji / Upah *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <DollarSign className="w-4 h-4 text-indigo-600" />
                        </div>
                        <input
                          type="text"
                          required
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all"
                          placeholder="Contoh: Rp 4.500.000 - Rp 6.000.000 / Bulan"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seksi Transparansi Rentang Gaji */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        Transparansi Rentang Gaji — <span className="text-emerald-700 font-bold lowercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/80">Opsional</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Gaji Minimal (Rp)
                        </label>
                        <input
                          type="number"
                          value={salaryMin}
                          onChange={(e) => setSalaryMin(e.target.value)}
                          placeholder="Contoh: 4000000"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Gaji Maksimal (Rp)
                        </label>
                        <input
                          type="number"
                          value={salaryMax}
                          onChange={(e) => setSalaryMax(e.target.value)}
                          placeholder="Contoh: 6000000"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Satuan Periode
                        </label>
                        <select
                          value={salaryPeriod}
                          onChange={(e) => setSalaryPeriod(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 font-medium"
                        >
                          <option value="Bulan">Per Bulan</option>
                          <option value="Jam">Per Jam</option>
                          <option value="Hari">Per Hari</option>
                          <option value="Proyek">Per Proyek</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Deskripsi Pekerjaan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Deskripsi Pekerjaan *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 transition-all"
                      placeholder="Tuliskan detail tugas harian pekerjaan..."
                    />
                  </div>

                  {/* Syarat & Kualifikasi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Syarat & Kualifikasi Pelamar *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 transition-all"
                      placeholder="Contoh:&#13;• Usia maks 28 tahun&#13;• Min lulusan SMA/SMK"
                    />
                  </div>

                  {/* Kontak Pengiriman */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Email / Kontak Pengiriman CV *
                    </label>
                    <input
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800 transition-all"
                      placeholder="recruitment@perusahaan.com atau WA 08123456789"
                    />
                  </div>

                  {/* Tombol Pasang Loker */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sedang Mengirimkan Lowongan...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        Kirim Lowongan untuk Moderasi Admin
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Lowongan Kerja Saya (My Postings) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-fit space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-indigo-600" />
                Riwayat Lowongan Saya
              </h3>
              <button 
                onClick={fetchMyJobs}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded cursor-pointer"
              >
                Segarkan
              </button>
            </div>

            {isLoadingMyJobs ? (
              <div className="space-y-2 py-4">
                <div className="h-10 bg-slate-100 rounded animate-pulse" />
                <div className="h-10 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : myJobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="Belum Ada Pengajuan"
                description="Anda belum pernah mempublikasikan iklan lowongan kerja. Isi formulir di sebelah kiri untuk mengajukan loker pertama Anda!"
                className="py-8 px-4"
              />
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {myJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className={`p-3 rounded-xl border space-y-2 transition-all ${
                      job.isFeatured
                        ? "bg-amber-50/60 border-amber-200 shadow-xs"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {job.isFeatured && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-900 font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> Featured
                            </span>
                          )}
                          <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{job.title}</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{job.company}</p>
                      </div>

                      {/* Badge status */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider shrink-0 ${
                          job.status === "ACTIVE"
                            ? "bg-indigo-100 text-indigo-800"
                            : job.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : job.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                      <span>Dibuat: {new Date(job.createdAt).toLocaleDateString("id-ID")}</span>
                      
                      <div className="flex items-center gap-2">
                        {/* Tombol Lihat Pelamar */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJobFilter(job.id);
                            setActiveTab("APPLICANTS");
                          }}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[9px] rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          title="Lihat kandidat pelamar untuk lowongan ini"
                        >
                          <Users className="w-2.5 h-2.5" /> Pelamar ({applications.filter((a) => a.jobId === job.id).length})
                        </button>

                        {/* Tombol Upgrade Featured jika belum featured */}
                        {!job.isFeatured && job.status === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() => setFeaturedModalJob(job)}
                            className="px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black text-[9px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-2.5 h-2.5" /> Upgrade
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setCancelModal({ jobId: job.id, jobTitle: job.title, company: job.company })}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Batalkan / Hapus Kiriman Lowongan Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB APPLICANTS: DAFTAR PELAMAR MASUK */}
      {activeTab === "APPLICANTS" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Daftar Pelamar Kerja Masuk
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola berkas lamaran, tinjau CV & profil kandidat, dan perbarui status seleksi HRD.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchApplications}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <Loader2 className={`w-3.5 h-3.5 ${isLoadingApps ? "animate-spin" : ""}`} /> Segarkan Data Pelamar
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {/* Filter Lowongan Kerja */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Loker:</label>
              <select
                value={selectedJobFilter}
                onChange={(e) => setSelectedJobFilter(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="ALL">Semua Lowongan Saya ({myJobs.length})</option>
                {myJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({applications.filter((a) => a.jobId === j.id).length} Pelamar)
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status Seleksi */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Status Seleksi:</label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="APPLIED">APPLIED (Baru Masuk)</option>
                <option value="SHORTLISTED">SHORTLISTED (Lolos Berkas)</option>
                <option value="INTERVIEW">INTERVIEW (Wawancara)</option>
                <option value="ACCEPTED">ACCEPTED (Diterima / Hire)</option>
                <option value="REJECTED">REJECTED (Ditolak)</option>
              </select>
            </div>

            {/* Cari Nama / Email / Skill */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari Pelamar / Skill:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchApplicant}
                  onChange={(e) => setSearchApplicant(e.target.value)}
                  placeholder="Ketik nama, email, atau skill..."
                  className="w-full text-xs pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* List Pelamar */}
          {isLoadingApps ? (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Memuat daftar pelamar masuk...
            </div>
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum Ada Pelamar Sesuai Filter"
              description={
                applications.length === 0
                  ? "Belum ada kandidat yang mengajukan lamaran ke lowongan kerja Anda saat ini. Pastikan lowongan kerja Anda dalam status ACTIVE."
                  : "Tidak ada data pelamar yang cocok dengan filter lowongan atau pencarian yang Anda pilih."
              }
              className="py-12"
            />
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-500 font-medium">
                Menampilkan <strong className="text-slate-800">{filteredApplications.length}</strong> dari total{" "}
                <strong className="text-slate-800">{applications.length}</strong> pelamar masuk.
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredApplications.map((app) => {
                  const isExpanded = !!expandedCoverLetters[app.id];
                  const profile = app.candidateProfile;

                  return (
                    <div
                      key={app.id}
                      className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4 hover:border-indigo-200 transition-all shadow-2xs"
                    >
                      {/* Header Pelamar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm shrink-0 border border-indigo-200">
                            {(app.candidateName || "K")[0].toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{app.candidateName || "Kandidat"}</h4>
                            <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {app.candidateEmail}
                              </span>
                              {profile?.phone && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {profile.phone}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge & Applied Date */}
                        <div className="flex flex-col sm:items-end gap-1">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider w-fit ${
                              app.status === "APPLIED"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : app.status === "SHORTLISTED"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : app.status === "INTERVIEW"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : app.status === "ACCEPTED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {app.status === "APPLIED" ? "BARU MASUK" : app.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Melamar: {new Date(app.appliedAt).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>

                      {/* Job Title Info */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Melamar Posisi:</span>
                          <div className="font-extrabold text-slate-800 text-xs mt-0.5">{app.jobTitle || "Lowongan Kerja"}</div>
                        </div>
                        {app.company && <div className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">{app.company}</div>}
                      </div>

                      {/* Candidate Skills & Bio */}
                      {(profile?.bio || profile?.skills || profile?.currentJobTitle) && (
                        <div className="space-y-2 text-xs">
                          {profile.currentJobTitle && (
                            <p className="text-slate-600 font-medium">
                              <strong>Posisi Sekarang:</strong> {profile.currentJobTitle}
                            </p>
                          )}
                          {profile.bio && <p className="text-slate-600 italic leading-relaxed">"{profile.bio}"</p>}
                          {profile.skills && (
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-[11px] font-bold text-slate-500">Skill:</span>
                              {profile.skills.split(",").map((sk, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-md border border-indigo-100"
                                >
                                  {sk.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cover Letter / Surat Lamaran */}
                      {app.coverLetter && (
                        <div className="bg-amber-50/70 border border-amber-200/70 p-3.5 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                            <span>Surat Lamaran / Cover Letter:</span>
                            {app.coverLetter.length > 120 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedCoverLetters((prev) => ({ ...prev, [app.id]: !prev[app.id] }))
                                }
                                className="text-[10px] text-amber-700 underline font-semibold cursor-pointer"
                              >
                                {isExpanded ? "Sembunyikan" : "Baca Selengkapnya"}
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-amber-900/90 leading-relaxed font-sans">
                            {isExpanded || app.coverLetter.length <= 120
                              ? app.coverLetter
                              : `${app.coverLetter.substring(0, 120)}...`}
                          </p>
                        </div>
                      )}

                      {/* Resume PDF & Portfolio Link & Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                        {/* Links */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {profile?.resumeUrl ? (
                            <a
                              href={profile.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" /> Lihat CV / Resume
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Belum melampirkan CV</span>
                          )}

                          {profile?.portfolioUrl && (
                            <a
                              href={profile.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Portfolio
                            </a>
                          )}
                        </div>

                        {/* Tombol Aksi Ubah Status */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                            Ubah Status:
                          </span>

                          <button
                            type="button"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateApplicantStatus(app.id, "SHORTLISTED")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              app.status === "SHORTLISTED"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                            }`}
                          >
                            Shortlist
                          </button>

                          <button
                            type="button"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateApplicantStatus(app.id, "INTERVIEW")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              app.status === "INTERVIEW"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                            }`}
                          >
                            Wawancara
                          </button>

                          <button
                            type="button"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateApplicantStatus(app.id, "ACCEPTED")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              app.status === "ACCEPTED"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            Diterima
                          </button>

                          <button
                            type="button"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateApplicantStatus(app.id, "REJECTED")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              app.status === "REJECTED"
                                ? "bg-rose-600 text-white shadow-xs"
                                : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                            }`}
                          >
                            Tolak
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
      )}

      {/* TAB 2: PAKET LANGGANAN HRD */}
      {activeTab === "PRICING" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <PricingPlans user={user} onPlanUpdated={fetchMyJobs} />
        </div>
      )}

      {/* TAB 3: RIWAYAT TRANSAKSI */}
      {activeTab === "TRANSACTIONS" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" /> Riwayat Transaksi Pembayaran
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Daftar transaksi upgrade Featured Job dan paket langganan Anda.</p>
            </div>
            <button
              onClick={fetchTransactions}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Segarkan Data
            </button>
          </div>

          {isLoadingTx ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Memuat data transaksi...
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Belum Ada Transaksi"
              description="Anda belum pernah melakukan transaksi pembayaran upgrade Featured Job atau paket langganan."
              className="py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Ref ID / Waktu</th>
                    <th className="py-3 px-4">Jenis Transaksi</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">Metode</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{tx.referenceId}</div>
                        <div className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleString("id-ID")}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">
                          {tx.paymentType === "FEATURED_JOB" ? "Upgrade Featured Job (14 Hari)" :
                           tx.paymentType === "SUBSCRIPTION_PRO" ? "Paket Langganan PRO (10 Kuota)" :
                           tx.paymentType === "SUBSCRIPTION_ENTERPRISE" ? "Paket Langganan ENTERPRISE (50 Kuota)" : tx.paymentType}
                        </span>
                        {tx.jobTitle && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]">Loker: {tx.jobTitle}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        Rp {tx.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                          tx.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : tx.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Upgrade Featured Job */}
      <UpgradeFeaturedModal
        job={featuredModalJob}
        isOpen={!!featuredModalJob}
        onClose={() => setFeaturedModalJob(null)}
        onSuccess={() => {
          fetchMyJobs();
          fetchTransactions();
        }}
      />

      {/* Modal Konfirmasi Pembatalan Lowongan HRD */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl overflow-hidden relative p-6 space-y-6">
            {/* Header / Icon */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Batalkan Kiriman Lowongan?</h3>
                <p className="text-xs text-slate-400 font-medium">Konfirmasi pembatalan pengajuan</p>
              </div>
            </div>

            {/* Detail Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lowongan Kerja:</div>
              <div>
                <div className="font-extrabold text-sm text-slate-800">{cancelModal.jobTitle}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">{cancelModal.company}</div>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                ID: <span className="font-mono bg-slate-200/50 px-1 py-0.5 rounded text-slate-600">{cancelModal.jobId}</span>
              </div>
            </div>

            {/* Alert Text */}
            <p className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pengajuan lowongan kerja ini? Iklan lowongan akan dihapus secara permanen dari sistem.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                className="flex-1 py-3 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors bg-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeCancelJob(cancelModal.jobId)}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer"
              >
                Ya, Batalkan Lowongan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
