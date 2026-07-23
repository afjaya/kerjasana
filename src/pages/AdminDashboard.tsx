/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, Check, X, AlertTriangle, Trash2, Calendar, MapPin, 
  DollarSign, Briefcase, UserCheck, Inbox, ArrowUpRight, BarChart3, Mail, RefreshCw,
  Flag, Ban, ShieldX, CheckCircle, AlertCircle, AlertOctagon, UserX
} from "lucide-react";
import { User, Job, Stats, EmailNotification, JobReport, JobReportStatus } from "../types";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import { Helmet } from "react-helmet-async";

interface AdminDashboardProps {
  user: User | null;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Tab navigasi
  const [activeTab, setActiveTab] = useState<"MODERATION" | "REPORTS" | "ALL_JOBS" | "EMAILS">("MODERATION");

  // State untuk Laporan Lowongan (Job Report System)
  const [reports, setReports] = useState<JobReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [confirmBanModal, setConfirmBanModal] = useState<{
    userId: string;
    userName: string;
    userEmail: string;
    companyName: string;
  } | null>(null);

  // State untuk dialog konfirmasi kustom
  const [confirmModal, setConfirmModal] = useState<{
    type: "REJECT" | "DELETE";
    jobId: string;
    jobTitle: string;
    company: string;
  } | null>(null);

  // State untuk sistem email otomatis
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await fetch("/api/admin/reports", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error("Gagal mengambil data laporan lowongan:", e);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const fetchEmails = async () => {
    setIsLoadingEmails(true);
    try {
      const res = await fetch("/api/admin/emails", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setEmails(data.emails || []);
      }
    } catch (e) {
      console.error("Gagal mengambil data log email:", e);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const fetchAdminJobs = async () => {
    if (!user || user.role !== "ADMIN") return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/jobs", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setJobs(data.jobs);
        setStats(data.stats);
        // Tarik data riwayat email & laporan
        fetchEmails();
        fetchReports();
      } else {
        setErrorMsg(data.error || "Gagal memuat data moderasi admin.");
      }
    } catch (e) {
      setErrorMsg("Gagal menghubungi server untuk verifikasi admin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminJobs();

    // Berlangganan ke perubahan agar otomatis refresh
    const handleRefresh = () => {
      fetchAdminJobs();
      fetchReports();
    };
    window.addEventListener("refresh-jobs", handleRefresh);
    return () => window.removeEventListener("refresh-jobs", handleRefresh);
  }, [user]);

  // Aksi 1: Abaikan Laporan (Tandai RESOLVED_REJECTED)
  const handleIgnoreReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status: "RESOLVED_REJECTED" })
      });
      const data = await res.json();
      if (res.ok) {
        toast.info("Laporan telah diabaikan dan ditandai sebagai RESOLVED_REJECTED.", "Laporan Diabaikan");
        fetchReports();
      } else {
        toast.error(data.error || "Gagal mengabaikan laporan.", "Gagal");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi.", "Koneksi Error");
    }
  };

  // Aksi 2: Take Down Loker yang dilaporkan (Ubah status job -> REJECTED)
  const handleTakeDownReportedJob = async (jobId: string, jobTitle: string) => {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/take-down`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Lowongan "${jobTitle}" telah di-take down & status laporan diperbarui!`, "Loker Di-Take Down");
        fetchAdminJobs();
        fetchReports();
        window.dispatchEvent(new Event("refresh-jobs"));
      } else {
        toast.error(data.error || "Gagal me-take down lowongan.", "Gagal Take Down");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi.", "Koneksi Error");
    }
  };

  // Aksi 3: Banned HRD Bodong (Konfirmasi + Blokir user + Hapus semua lokernya)
  const executeBanUser = async (userId: string) => {
    setConfirmBanModal(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message, "HRD Bodong Diblokir");
        fetchAdminJobs();
        fetchReports();
        window.dispatchEvent(new Event("refresh-jobs"));
      } else {
        toast.error(data.error || "Gagal memblokir HRD.", "Gagal Ban");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi saat memblokir HRD.", "Koneksi Error");
    }
  };

  // Setujui lowongan kerja (Approve)
  const handleApprove = async (id: string, title: string) => {
    setMessage("");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/jobs/${id}/approve`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        toast.success(`Lowongan "${title}" disetujui & email notifikasi dikirim ke HRD!`, "Lowongan Disetujui");
        // Refresh daftar lowongan di halaman utama & dashboard ini
        window.dispatchEvent(new Event("refresh-jobs"));
      } else {
        setErrorMsg(data.error || "Gagal menyetujui lowongan.");
        toast.error(data.error || "Gagal menyetujui lowongan.", "Gagal Approve");
      }
    } catch (e) {
      setErrorMsg("Koneksi gagal saat menyetujui lowongan.");
      toast.error("Koneksi gagal saat menyetujui lowongan.", "Koneksi Error");
    }
  };

  // Kirim Ulang / Simulasi Email Notifikasi
  const handleResendEmail = async (id: string, title: string) => {
    setMessage("");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/jobs/${id}/resend-email`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Simulasi email notifikasi untuk "${title}" berhasil dipicu!`, "Simulasi Email Berhasil");
        fetchAdminJobs();
      } else {
        toast.error(data.error || "Gagal memicu email.", "Gagal Email");
      }
    } catch (e) {
      toast.error("Gagal terhubung ke server.", "Koneksi Error");
    }
  };

  // Trigger modal penolakan
  const triggerRejectConfirm = (id: string, title: string, company: string) => {
    setConfirmModal({
      type: "REJECT",
      jobId: id,
      jobTitle: title,
      company: company,
    });
  };

  // Proses Penolakan Nyata setelah dikonfirmasi
  const executeReject = async (id: string) => {
    setConfirmModal(null);
    setMessage("");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/jobs/${id}/reject`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        toast.info(`Lowongan "${data.job?.title || 'tersebut'}" telah ditolak.`, "Lowongan Ditolak");
        window.dispatchEvent(new Event("refresh-jobs"));
      } else {
        setErrorMsg(data.error || "Gagal menolak lowongan.");
        toast.error(data.error || "Gagal menolak lowongan.", "Gagal Reject");
      }
    } catch (e) {
      setErrorMsg("Koneksi gagal saat menolak lowongan.");
      toast.error("Koneksi gagal saat menolak lowongan.", "Koneksi Error");
    }
  };

  // Trigger modal penghapusan
  const triggerDeleteConfirm = (id: string, title: string, company: string) => {
    setConfirmModal({
      type: "DELETE",
      jobId: id,
      jobTitle: title,
      company: company,
    });
  };

  // Proses Penghapusan Nyata setelah dikonfirmasi
  const executeDelete = async (id: string) => {
    setConfirmModal(null);
    setMessage("");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        toast.success("Lowongan kerja berhasil dihapus secara permanen.", "Hapus Berhasil");
        window.dispatchEvent(new Event("refresh-jobs"));
      } else {
        setErrorMsg(data.error || "Gagal menghapus lowongan.");
        toast.error(data.error || "Gagal menghapus lowongan.", "Gagal Hapus");
      }
    } catch (e) {
      setErrorMsg("Koneksi gagal saat menghapus lowongan.");
      toast.error("Koneksi gagal saat menghapus lowongan.", "Koneksi Error");
    }
  };

  // Proteksi hak akses Admin
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-100 rounded-3xl shadow-xl text-center space-y-6">
        <Helmet>
          <title>Akses Ditolak — Panel Admin Kerjasana</title>
          <meta name="description" content="Halaman moderasi khusus administrator Kerjasana." />
        </Helmet>
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Akses Ditolak</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Halaman ini dilindungi secara ketat di sisi server. Hanya akun dengan peran (role) <strong className="text-amber-600">ADMINISTRATOR</strong> yang diizinkan mengakses panel ini.
          </p>
        </div>
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 text-left space-y-1">
          <span className="font-bold text-slate-700">Cara masuk sebagai Admin:</span>
          <p>
            Gunakan <strong>System Simulator</strong> di bagian bawah layar untuk beralih peran ke <strong>Administrator</strong> secara instan dengan satu klik!
          </p>
        </div>
      </div>
    );
  }

  const pendingJobs = jobs.filter((j) => j.status === "PENDING");
  const otherJobs = jobs.filter((j) => j.status !== "PENDING");

  return (
    <div className="space-y-8 animate-fade-in">
      <Helmet>
        <title>Dasbor Moderasi Admin — Kerjasana</title>
        <meta name="description" content="Panel administrasi moderasi lowongan kerja, pengelolaan akun, dan log notifikasi email Kerjasana." />
      </Helmet>
      {/* 1. Header & Statistik Ringkas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600 animate-pulse" />
            Dasbor Moderasi Admin
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Verifikasi pengajuan loker, kelola status penayangan iklan, dan pantau masa berlaku 30 hari secara real-time.
          </p>
        </div>
        <button
          onClick={fetchAdminJobs}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Segarkan Data
        </button>
      </div>

      {/* Pesan Sukses / Error */}
      {message && (
        <div className="flex items-center gap-2 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl text-indigo-800 text-xs font-semibold shadow-xs">
          <Check className="w-4 h-4 shrink-0 text-indigo-600" />
          <span>{message}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl text-rose-800 text-xs font-semibold shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Statistik Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Loker</span>
            <span className="block text-2xl font-black text-slate-800 mt-1">{stats.totalJobs}</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl shadow-xs">
            <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">PENDING (Antrean)</span>
            <span className="block text-2xl font-black text-amber-800 mt-1">{stats.pendingJobs}</span>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl shadow-xs">
            <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">ACTIVE (Tayang)</span>
            <span className="block text-2xl font-black text-indigo-800 mt-1">{stats.activeJobs}</span>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-xs">
            <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider">REJECTED (Ditolak)</span>
            <span className="block text-2xl font-black text-rose-800 mt-1">{stats.rejectedJobs}</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-xs col-span-2 md:col-span-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">EXPIRED (Usang)</span>
            <span className="block text-2xl font-black text-slate-700 mt-1">{stats.expiredJobs}</span>
          </div>
        </div>
      )}

      {/* Tab Navigasi Admin */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-0 scrollbar-none">
        <button
          onClick={() => setActiveTab("MODERATION")}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "MODERATION"
              ? "border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Inbox className="w-4 h-4 text-amber-500" />
          Antrean Pengajuan Loker
          {pendingJobs.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
              {pendingJobs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("REPORTS")}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "REPORTS"
              ? "border-rose-500 text-rose-700 bg-rose-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          🚨 Laporan Masuk
          {reports.filter((r) => r.status === "PENDING" || r.status === "INVESTIGATING").length > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full font-mono animate-pulse">
              {reports.filter((r) => r.status === "PENDING" || r.status === "INVESTIGATING").length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ALL_JOBS")}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "ALL_JOBS"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          Semua Lowongan ({otherJobs.length})
        </button>

        <button
          onClick={() => setActiveTab("EMAILS")}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "EMAILS"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Mail className="w-4 h-4 text-indigo-600" />
          Log Email ({emails.length})
        </button>
      </div>

      {/* TAB 1: ANTREAN MODERASI (PENDING) */}
      {activeTab === "MODERATION" && (
        <div className="space-y-4 animate-fade-in">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <Inbox className="w-5 h-5 text-amber-500" />
              Antrean Pengajuan Lowongan Baru ({pendingJobs.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Lowongan berikut berstatus PENDING dan tidak tayang di halaman utama sebelum Anda menyetujuinya.
            </p>
          </div>

          {pendingJobs.length === 0 ? (
            <EmptyState
              icon={Inbox}
              badge="Moderasi Selesai"
              title="Antrean Pengajuan Bersih"
              description="Tidak ada pengajuan lowongan kerja baru yang menunggu persetujuan saat ini. Seluruh lowongan yang masuk telah dimoderasi dengan baik!"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="bg-white border-2 border-amber-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4 relative overflow-hidden"
                >
                  {/* Pita status pending */}
                  <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 px-3.5 py-1 text-[10px] font-extrabold tracking-widest uppercase font-mono rounded-bl-xl">
                    PENDING
                  </div>

                  {/* Info Utama */}
                  <div className="space-y-2">
                    <span className="inline-block text-[10px] text-slate-400 font-mono">ID Lowongan: {job.id}</span>
                    <h4 className="font-black text-lg text-slate-800">{job.title}</h4>
                    <p className="text-sm font-bold text-slate-500">{job.company}</p>
                  </div>

                  {/* Atribut Detail */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-semibold text-slate-700">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                      {job.salary}
                    </span>
                    {(job.salaryMin !== undefined || job.salaryMax !== undefined) && (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-bold text-xs" title="Loker Transparan">
                        Rentang: {job.salaryMin ? `Rp ${job.salaryMin.toLocaleString('id-ID')}` : '0'} - {job.salaryMax ? `Rp ${job.salaryMax.toLocaleString('id-ID')}` : 'Nego'} {job.salaryPeriod ? `/${job.salaryPeriod}` : ''}
                      </span>
                    )}
                    <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      Batas Exp: {new Date(job.expiresAt).toLocaleDateString("id-ID")}
                    </span>
                  </div>

                  {/* Deskripsi & Persyaratan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100/60 text-xs leading-relaxed">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Tanggung Jawab Pekerjaan:</span>
                      <p className="text-slate-600 whitespace-pre-wrap">{job.description}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Persyaratan & Kualifikasi:</span>
                      <p className="text-slate-600 whitespace-pre-wrap">{job.requirements}</p>
                    </div>
                  </div>

                  {/* Footer Loker */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-3 border-t border-slate-100">
                    <div className="text-[11px] text-slate-400">
                      Diajukan oleh: <strong className="text-slate-600">{job.postedByName}</strong> | Kontak: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-bold">{job.contact}</span>
                    </div>

                    {/* Tombol Keputusan */}
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => triggerRejectConfirm(job.id, job.title, job.company)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        Tolak (REJECT)
                      </button>
                      <button
                        onClick={() => handleApprove(job.id, job.title)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        Setujui (APPROVE)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 🚨 LAPORAN MASUK (JOB REPORT SYSTEM) */}
      {activeTab === "REPORTS" && (
        <div className="space-y-4 animate-fade-in">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Tabel Moderasi Laporan Masuk ({reports.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Laporan kecurigaan dari pelamar mengenai indikasi pungli, data palsu, atau penipuan. Ambil tindakan tegas untuk menjaga integritas Kerjasana.com.
            </p>
          </div>

          {isLoadingReports ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Memuat data laporan masuk...
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              badge="Komunitas Aman"
              title="Belum Ada Laporan Masuk"
              description="Sistem belum menerima laporan indikasi kecurangan atau pungli dari pelamar. Seluruh lowongan berstatus bersih!"
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Waktu Laporan</th>
                      <th className="px-5 py-3.5">Nama Loker & Perusahaan</th>
                      <th className="px-5 py-3.5">Pemberi Kerja / HRD</th>
                      <th className="px-5 py-3.5">Pelapor</th>
                      <th className="px-5 py-3.5">Kategori & Detail Alasan</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi Cepat Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(report.createdAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800 text-xs">{report.jobTitle}</div>
                          <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{report.company}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Job ID: {report.jobId}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800">{report.employerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{report.employerEmail}</div>
                          {report.isEmployerBanned && (
                            <span className="inline-block mt-1 bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                              🚫 BANNED
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-800">{report.reporterName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{report.reporterEmail}</div>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider mb-1 ${
                            report.reasonCategory === "PUNGLI_BIAYA"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : report.reasonCategory === "INDIKASI_PENIPUAN"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                          }`}>
                            {report.reasonCategory === "PUNGLI_BIAYA" && "🚨 Pungli Biaya"}
                            {report.reasonCategory === "INDIKASI_PENIPUAN" && "⚠️ Indikasi Penipuan"}
                            {report.reasonCategory === "DATA_PALSU" && "🚫 Data Palsu"}
                            {report.reasonCategory === "DISKRIMINASI" && "⚖️ Diskriminasi"}
                            {report.reasonCategory === "LAINNYA" && "📝 Lainnya"}
                          </span>
                          <p className="text-slate-600 text-[11px] leading-snug whitespace-pre-wrap bg-slate-50 p-2 rounded-xl border border-slate-100 mt-1">
                            {report.description}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black font-mono tracking-wider ${
                              report.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                                : report.status === "INVESTIGATING"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : report.status === "RESOLVED_ACTIONED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-y-1.5 whitespace-nowrap">
                          {/* Tombol 1: Abaikan Laporan */}
                          <button
                            onClick={() => handleIgnoreReport(report.id)}
                            disabled={report.status === "RESOLVED_REJECTED"}
                            className="w-full px-2.5 py-1.5 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                            title="Tandai laporan tidak terbukti / diabaikan"
                          >
                            <X className="w-3 h-3 text-slate-400" /> Abaikan Laporan
                          </button>

                          {/* Tombol 2: Take Down Loker */}
                          <button
                            onClick={() => handleTakeDownReportedJob(report.jobId, report.jobTitle)}
                            className="w-full px-2.5 py-1.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            title="Tutup / Take Down lowongan kerja ini"
                          >
                            <ShieldX className="w-3 h-3 text-amber-600" /> Take Down Loker
                          </button>

                          {/* Tombol 3: BANNED HRD BODONG */}
                          <button
                            onClick={() => setConfirmBanModal({
                              userId: report.employerId,
                              userName: report.employerName,
                              userEmail: report.employerEmail,
                              companyName: report.company
                            })}
                            disabled={report.isEmployerBanned}
                            className="w-full px-2.5 py-1.5 text-[10px] font-extrabold bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                            title="Blokir permanen akun HRD bodong & hapus seluruh lokernya"
                          >
                            <Ban className="w-3 h-3" />
                            {report.isEmployerBanned ? "HRD SUDAH BANNED" : "BANNED HRD BODONG"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEMUA DAFTAR LOWONGAN */}
      {activeTab === "ALL_JOBS" && (
        <div className="space-y-4 animate-fade-in">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Manajemen Semua Lowongan Kerja ({otherJobs.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daftar seluruh lowongan yang sudah dimoderasi (ACTIVE, REJECTED, EXPIRED). Anda dapat memantau status atau menghapusnya secara permanen.
            </p>
          </div>

          {otherJobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Belum Ada Data Lowongan"
              description="Belum ada data lowongan kerja berstatus Tayang (Active), Ditolak (Rejected), maupun Usang (Expired) untuk dikelola."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">Perusahaan & Posisi</th>
                      <th className="px-6 py-3.5">Wilayah</th>
                      <th className="px-6 py-3.5">Tanggal Post</th>
                      <th className="px-6 py-3.5">Tanggal Exp</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {otherJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm">{job.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{job.company}</div>
                        </td>
                        <td className="px-6 py-4">{job.location}</td>
                        <td className="px-6 py-4 font-mono text-slate-500">
                          {new Date(job.createdAt).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500">
                          {new Date(job.expiresAt).toLocaleDateString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wider ${
                              job.status === "ACTIVE"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                : job.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border border-rose-100"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1">
                          <button
                            onClick={() => handleResendEmail(job.id, job.title)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Simulasi / Kirim Ulang Email Notifikasi"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => triggerDeleteConfirm(job.id, job.title, job.company)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="Hapus Lowongan Permanen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RIWAYAT EMAIL NOTIFIKASI OTOMATIS */}
      {activeTab === "EMAILS" && (
        <div className="space-y-4 animate-fade-in">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <Mail className="w-5 h-5 text-indigo-600" />
              Log Notifikasi Email Otomatis (HRD) ({emails.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Daftar email otomatis yang dikirimkan ke HRD saat lowongan kerja disetujui (APPROVED) oleh admin agar mereka segera mengetahui bahwa iklan sudah tayang.
            </p>
          </div>

          {isLoadingEmails ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Memuat data log email...
            </div>
          ) : emails.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="Belum Ada Notifikasi Email Terkirim"
              description="Log email masih kosong. Notifikasi email otomatis ke HRD akan tercatat di sini segera setelah Anda menyetujui (APPROVE) lowongan kerja."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">Penerima & Lowongan</th>
                      <th className="px-6 py-3.5">Judul Email (Subject)</th>
                      <th className="px-6 py-3.5">Waktu Kirim</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-right">Aksi & Simulasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {emails.map((email) => (
                      <tr key={email.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{email.recipientName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{email.recipientEmail}</div>
                          <div className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 inline-block mt-1 font-semibold">
                            Loker: {email.jobTitle} ({email.company})
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-slate-600 font-normal">
                          {email.subject}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(email.sentAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold font-mono tracking-wider ${
                              email.status === "SENT"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-rose-50 text-rose-700 border border-rose-100"
                            }`}
                          >
                            {email.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedEmail(email)}
                            className="px-2.5 py-1.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            Pratinjau HTML
                          </button>
                          {email.etherealUrl && (
                            <a
                              href={email.etherealUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              Buka Email Nyata <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Detail Pratinjau Email */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-800">Pratinjau Email Notifikasi</h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono">ID Log: {selectedEmail.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Metadata */}
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 text-xs space-y-1.5 text-slate-600">
              <div>
                <span className="font-bold inline-block w-20">Kepada:</span>
                <span className="font-semibold text-slate-800">{selectedEmail.recipientName}</span>{" "}
                <span className="font-mono text-slate-400">&lt;{selectedEmail.recipientEmail}&gt;</span>
              </div>
              <div>
                <span className="font-bold inline-block w-20">Subjek:</span>
                <span className="font-bold text-slate-800">{selectedEmail.subject}</span>
              </div>
              <div>
                <span className="font-bold inline-block w-20">Status:</span>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                  selectedEmail.status === "SENT" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}>
                  {selectedEmail.status}
                </span>
                {selectedEmail.etherealUrl && (
                  <a
                    href={selectedEmail.etherealUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-3 font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    Buka Kotak Masuk Virtual <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Email Body HTML rendered safely */}
            <div className="p-6 overflow-y-auto bg-slate-100 flex-1">
              <div 
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Kustom untuk Reject / Delete */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl overflow-hidden relative p-6 space-y-6">
            {/* Header / Icon */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                confirmModal.type === "DELETE" 
                  ? "bg-rose-50 border-rose-100 text-rose-600" 
                  : "bg-amber-50 border-amber-100 text-amber-600"
              }`}>
                {confirmModal.type === "DELETE" ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  {confirmModal.type === "DELETE" 
                    ? "Konfirmasi Hapus" 
                    : "Konfirmasi Penolakan"}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Tindakan ini memerlukan keputusan Anda</p>
              </div>
            </div>

            {/* Informasi Detail Lowongan */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lowongan Kerja:</div>
              <div>
                <div className="font-extrabold text-sm text-slate-800">{confirmModal.jobTitle}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">{confirmModal.company}</div>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                ID: <span className="font-mono bg-slate-200/50 px-1 py-0.5 rounded text-slate-600">{confirmModal.jobId}</span>
              </div>
            </div>

            {/* Warning Text */}
            <p className="text-xs text-slate-500 leading-relaxed">
              {confirmModal.type === "DELETE"
                ? "Apakah Anda yakin ingin menghapus lowongan kerja ini secara permanen dari basis data? Tindakan ini tidak dapat dipulihkan."
                : "Apakah Anda yakin ingin menolak lowongan kerja ini? Status lowongan akan ditandai sebagai Ditolak (REJECTED) dan tidak akan ditayangkan."}
            </p>

            {/* Tombol Aksi */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-800 font-bold text-xs rounded-xl transition-colors bg-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === "DELETE") {
                    executeDelete(confirmModal.jobId);
                  } else {
                    executeReject(confirmModal.jobId);
                  }
                }}
                className={`flex-1 py-3 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer ${
                  confirmModal.type === "DELETE"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10"
                    : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/10"
                }`}
              >
                {confirmModal.type === "DELETE" ? "Ya, Hapus Permanen" : "Ya, Tolak Loker"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Banned HRD Bodong */}
      {confirmBanModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl overflow-hidden relative p-6 space-y-6">
            {/* Header / Icon */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Konfirmasi Blokir Akun (Banned)
                </h3>
                <p className="text-xs text-rose-600 font-bold">Tindakan Keamanan Moderasi</p>
              </div>
            </div>

            {/* Informasi Detail User HRD */}
            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-2 text-xs">
              <div className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Identitas Akun Pemberi Kerja / HRD:</div>
              <div>
                <div className="font-extrabold text-sm text-slate-800">{confirmBanModal.userName}</div>
                <div className="text-xs font-semibold text-slate-500">{confirmBanModal.userEmail}</div>
                <div className="text-xs font-bold text-slate-700 mt-1">Perusahaan: {confirmBanModal.companyName}</div>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-rose-200/60">
                User ID: <span className="font-mono bg-white px-1 py-0.5 rounded text-slate-600">{confirmBanModal.userId}</span>
              </div>
            </div>

            {/* Warning Text */}
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin memblokir akun HRD ini secara permanen (<strong className="text-rose-600">isBanned = true</strong>)? Akun ini tidak akan bisa login kembali, dan <strong className="text-rose-600">seluruh lowongan kerja miliknya akan ditutup / di-take down secara otomatis</strong>.
            </p>

            {/* Tombol Aksi */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmBanModal(null)}
                className="flex-1 py-3 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-800 font-bold text-xs rounded-xl transition-colors bg-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeBanUser(confirmBanModal.userId)}
                className="flex-1 py-3 text-white font-bold text-xs rounded-xl bg-rose-600 hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-4 h-4" />
                Ya, BANNED HRD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
