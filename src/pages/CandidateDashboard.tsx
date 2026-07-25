/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import {
  User as UserIcon,
  FileText,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  Phone,
  Globe,
  Award,
  Calendar,
  Building2,
  MapPin,
  ExternalLink,
  Plus,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Bell,
  Mail,
  Send,
  Sliders,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon
} from "lucide-react";
import { User, Application, CandidateProfile } from "../types";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import AvatarPickerModal from "../components/AvatarPickerModal";
import { generateInitialsAvatar } from "../utils/avatarUtils";

interface CandidateDashboardProps {
  user: User | null;
}

export default function CandidateDashboard({ user }: CandidateDashboardProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"applications" | "profile">("applications");

  // Form State Profil & Job Alerts
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [currentJobTitle, setCurrentJobTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [dailyEmailAlerts, setDailyEmailAlerts] = useState(false);
  const [alertCategory, setAlertCategory] = useState("");
  const [alertLocation, setAlertLocation] = useState("");
  const [alertKeywords, setAlertKeywords] = useState("");
  const [isTestingAlert, setIsTestingAlert] = useState(false);

  // 1. Query Data Profil
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ["candidateProfile", user?.id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/candidate/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Gagal memuat profil.");
      return res.json() as Promise<{ profile: CandidateProfile }>;
    },
    enabled: !!user && user.role === "CANDIDATE"
  });

  // Load profil ke form state ketika data datang
  useEffect(() => {
    if (profileData?.profile) {
      const p = profileData.profile;
      setAvatarUrl(p.avatarUrl || user?.avatarUrl || "");
      setPhone(p.phone || "");
      setBio(p.bio || "");
      setCurrentJobTitle(p.currentJobTitle || "");
      setSkills(p.skills || "");
      setResumeUrl(p.resumeUrl || "");
      setPortfolioUrl(p.portfolioUrl || "");
      setDailyEmailAlerts(p.dailyEmailAlerts ?? false);
      setAlertCategory(p.alertCategory || "");
      setAlertLocation(p.alertLocation || "");
      setAlertKeywords(p.alertKeywords || "");
    } else if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [profileData, user]);

  // Handler simpan avatar baru langsung ke backend
  const handleSelectAvatar = async (selectedUrl: string) => {
    setAvatarUrl(selectedUrl);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/candidate/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          avatarUrl: selectedUrl,
          phone,
          bio,
          currentJobTitle,
          skills,
          resumeUrl,
          portfolioUrl,
          dailyEmailAlerts,
          alertCategory,
          alertLocation,
          alertKeywords
        })
      });
      if (res.ok) {
        toast.success(
          selectedUrl ? "Foto avatar profil berhasil diperbarui!" : "Foto avatar dikembalikan ke default.",
          "Foto Profil Disimpan"
        );
        queryClient.invalidateQueries({ queryKey: ["candidateProfile"] });
      }
    } catch (err) {
      console.error("Gagal menyimpan foto avatar", err);
    }
  };

  // 2. Query Data Daftar Lamaran Candidate
  const { data: appsData, isLoading: isAppsLoading } = useQuery({
    queryKey: ["candidateApplications", user?.id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/candidate/applications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Gagal memuat daftar lamaran.");
      return res.json() as Promise<{ applications: Application[] }>;
    },
    enabled: !!user && user.role === "CANDIDATE"
  });

  // 3. Mutation Simpan Profil & Preferences
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/candidate/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          avatarUrl,
          phone,
          bio,
          currentJobTitle,
          skills,
          resumeUrl,
          portfolioUrl,
          dailyEmailAlerts,
          alertCategory,
          alertLocation,
          alertKeywords
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan profil.");
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        dailyEmailAlerts
          ? "Profil & pengaturan notifikasi email harian Anda berhasil diperbarui!"
          : "Profil Anda berhasil diperbarui!",
        "Profil Disimpan"
      );
      queryClient.invalidateQueries({ queryKey: ["candidateProfile"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menyimpan.", "Error");
    }
  });

  // 4. Handler untuk Simulasi / Test Pengiriman Email Job Alert
  const handleTestJobAlert = async () => {
    setIsTestingAlert(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/candidate/test-job-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirimkan email sampel.");

      toast.success(data.message, "Email Alert Terkirim!");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat test alert.", "Gagal Test Alert");
    } finally {
      setIsTestingAlert(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-100 rounded-3xl shadow-xl text-center space-y-6">
        <Helmet>
          <title>Dasbor Pelamar — Kerjasana</title>
        </Helmet>
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
          <UserIcon className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">Akses Masuk Diperlukan</h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            Silakan masuk ke akun Pelamar Anda untuk melihat daftar lamaran, melacak status rekrutmen, dan mengelola CV.
          </p>
        </div>
        <button
          onClick={() => navigate("/auth")}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
        >
          Masuk / Daftar Akun Pelamar
        </button>
      </div>
    );
  }

  if (user.role !== "CANDIDATE" && user.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-100 rounded-3xl shadow-xl text-center space-y-6">
        <Helmet>
          <title>Dasbor Pelamar — Kerjasana</title>
        </Helmet>
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">Akun Anda: Pemberi Kerja (HRD)</h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            Halaman ini khusus untuk Pelamar Kerja. Sebagai Pemberi Kerja, Anda dapat memasang lowongan baru atau mengelola lamaran masuk.
          </p>
        </div>
        <div className="space-y-2 pt-2">
          <Link
            to="/submit"
            className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition-all"
          >
            Pasang Lowongan Baru
          </Link>
          <Link
            to="/"
            className="block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all"
          >
            Lihat Beranda
          </Link>
        </div>
      </div>
    );
  }

  const applications = appsData?.applications || [];

  // Statistik Ringkas
  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === "APPLIED").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED" || a.status === "INTERVIEW").length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPLIED":
        return { label: "Terkirim", bg: "bg-blue-100 text-blue-800 border-blue-200" };
      case "SHORTLISTED":
        return { label: "Lolos Berkas", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" };
      case "INTERVIEW":
        return { label: "Tahap Wawancara", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "ACCEPTED":
        return { label: "Diterima 🎉", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "REJECTED":
        return { label: "Belum Sesuai", bg: "bg-rose-100 text-rose-800 border-rose-200" };
      default:
        return { label: status, bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <Helmet>
        <title>Dasbor Pelamar & Kelola CV — Kerjasana</title>
        <meta name="description" content="Lacak status lamaran kerja, kelola profil profesional, dan tingkatkan peluang karir Anda di Kerjasana." />
      </Helmet>

      {/* Header Utama & Profil Singkat */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Profile Picture Frame */}
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-white/20 shadow-xl bg-indigo-800 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <img
                  src={generateInitialsAvatar(user.name, "indigo")}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {/* Quick Camera Trigger Overlay Button */}
            <button
              onClick={() => setIsAvatarPickerOpen(true)}
              className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border-2 border-indigo-900 transition-transform group-hover:scale-110 cursor-pointer"
              title="Ubah Foto Avatar"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200 border border-white/10">
              <UserIcon className="w-3.5 h-3.5" /> Portal Pelamar Kerjasana
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl">
              {currentJobTitle || "Pencari Kerja Aktif"} • {user.email}
            </p>
          </div>
        </div>

        <Link
          to="/"
          className="px-5 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          Cari Lowongan Baru
        </Link>
      </div>

      {/* Statistik Ringkas Pelamar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Lamaran</span>
          <p className="text-2xl font-black text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Menunggu Review</span>
          <p className="text-2xl font-black text-blue-600">{stats.applied}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lolos / Interview</span>
          <p className="text-2xl font-black text-amber-600">{stats.shortlisted}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Diterima Kerja</span>
          <p className="text-2xl font-black text-emerald-600">{stats.accepted}</p>
        </div>
      </div>

      {/* Tab Navigasi */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("applications")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "applications"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Daftar Lamaran Saya ({stats.total})
          </div>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "profile"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Kelola Profil & CV
          </div>
        </button>
      </div>

      {/* TAB 1: Daftar Lamaran Kerja */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {isAppsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              title="Belum Ada Lamaran Kerja"
              description="Anda belum pernah mengirimkan lamaran pekerjaan. Cari lowongan kerja lokal terverifikasi di beranda dan lamar sekarang!"
              primaryAction={{
                label: "Jelajahi Lowongan Kerja",
                onClick: () => navigate("/")
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {applications.map((app) => {
                const badge = getStatusBadge(app.status);
                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Dilamar: {new Date(app.appliedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        <Link to={`/jobs/${app.jobId}`} className="hover:text-indigo-600 transition-colors">
                          {app.jobTitle || "Posisi Pekerjaan"}
                        </Link>
                      </h3>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1 text-slate-800 font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                          {app.company || "Perusahaan"}
                        </span>
                        {app.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {app.location}
                          </span>
                        )}
                        {app.salary && (
                          <span className="text-emerald-600 font-bold">
                            {app.salary}
                          </span>
                        )}
                      </div>

                      {app.coverLetter && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 mt-2 line-clamp-2">
                          "{app.coverLetter}"
                        </p>
                      )}
                    </div>

                    <Link
                      to={`/jobs/${app.jobId}`}
                      className="px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                    >
                      Lihat Loker <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Kelola Profil & CV */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Profil & Curriculum Vitae (CV)</h3>
            <p className="text-xs text-slate-500">
              Lengkapi informasi berikut agar profil Anda tampak profesional dan dilirik oleh perusahaan / HRD.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveProfileMutation.mutate();
            }}
            className="space-y-6"
          >
            {/* Section Foto Profil & Personal Avatar */}
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-white shadow-md bg-white flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={generateInitialsAvatar(user.name, "indigo")}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-900">Foto Profil & Personal Avatar</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Foto avatar akan ditampilkan pada aplikasi lamaran kerja Anda dan dapat diambil via kamera, unggahan file, atau generator inisial.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Atur Foto / Avatar
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => handleSelectAvatar("")}
                    className="px-3 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Lengkap (Read-only) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Nama Lengkap</label>
                <input
                  type="text"
                  value={user.name}
                  disabled
                  className="w-full text-xs p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Email Utama</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full text-xs p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              {/* Nomor Telepon / WhatsApp */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Nomor Telepon / WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Jabatan / Posisis Saat Ini */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Judul Pekerjaan / Keahlian Utama</label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={currentJobTitle}
                    onChange={(e) => setCurrentJobTitle(e.target.value)}
                    placeholder="Contoh: Frontend Developer / Barista / Digital Marketer"
                    className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Keahlian & Skills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Daftar Skill & Keahlian (Pisahkan dengan Koma)</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Contoh: React, TypeScript, Tailwind CSS, Node.js, Communication"
                className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Tautan CV / Resume (PDF URL atau Google Drive) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Tautan Resume / CV (Google Drive, Dropbox, atau PDF Online)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/your-resume-pdf"
                  className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Pastikan akses tautan Google Drive / PDF Anda disetel ke "Siapa saja yang memiliki link dapat melihat".
              </p>
            </div>

            {/* Tautan Portofolio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Tautan Portofolio / Website Pribadi (Opsional)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/username atau https://myportfolio.com"
                  className="w-full text-xs pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Ringkasan Bio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Ringkasan Diri / Bio Singkat</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tuliskan gambaran singkat tentang latar belakang pendidikan, pengalaman, dan minat karir Anda..."
                className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-28 resize-none"
              />
            </div>

            {/* SEKSI BANTUAN / PENGATURAN NOTIFIKASI EMAIL HARIAN (JOB ALERTS) */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Bell className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Notifikasi Email Harian Lowongan Baru</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Dapatkan ringkasan loker terbaru yang sesuai dengan kriteria pekerjaan impian Anda setiap hari.
                  </p>
                </div>

                {/* Switch Toggle */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={dailyEmailAlerts}
                    onChange={(e) => setDailyEmailAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Form Kriteria Notifikasi jika Toggle Aktif */}
              {dailyEmailAlerts && (
                <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4">
                  <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Kriteria Pekerjaan Impian Anda
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Filter Kategori */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Kategori Industri</label>
                      <select
                        value={alertCategory}
                        onChange={(e) => setAlertCategory(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Semua Kategori</option>
                        <option value="Teknologi & IT">Teknologi & IT</option>
                        <option value="Keuangan & Akuntansi">Keuangan & Akuntansi</option>
                        <option value="Pemasaran & Penjualan">Pemasaran & Penjualan</option>
                        <option value="Pendidikan & Pelatihan">Pendidikan & Pelatihan</option>
                        <option value="Pelayanan Pelanggan">Pelayanan Pelanggan</option>
                        <option value="Desain & Kreatif">Desain & Kreatif</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    {/* Filter Lokasi Kota */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Lokasi / Kota Target</label>
                      <input
                        type="text"
                        value={alertLocation}
                        onChange={(e) => setAlertLocation(e.target.value)}
                        placeholder="Contoh: Jakarta, Bali, Surabaya"
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Filter Kata Kunci */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Kata Kunci / Skill</label>
                      <input
                        type="text"
                        value={alertKeywords}
                        onChange={(e) => setAlertKeywords(e.target.value)}
                        placeholder="Contoh: React, Manager, Remote"
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-indigo-100/60">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>
                        Email ringkasan harian akan dikirimkan otomatis ke: <strong className="text-slate-800">{user.email}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestJobAlert}
                      disabled={isTestingAlert}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {isTestingAlert ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          Kirim Sampel Alert
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Simpan */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saveProfileMutation.isPending}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {saveProfileMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Simpan Profil & CV
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Selection / Camera / Initials Avatar */}
      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        currentAvatarUrl={avatarUrl}
        userName={user.name}
        onSelectAvatar={handleSelectAvatar}
      />
    </div>
  );
}
