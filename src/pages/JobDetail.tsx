/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import {
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  ArrowLeft,
  Share2,
  Clock,
  ExternalLink,
  Sparkles,
  Phone,
  Globe,
  Award,
  ChevronRight,
  Edit3,
  Save,
  User as UserIcon,
  Link2,
  Flag,
  ShieldAlert
} from "lucide-react";
import { Job, User, JobReportReason } from "../types";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/getErrorMessage";

interface JobDetailProps {
  user: User | null;
}

export default function JobDetail({ user }: JobDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  // Report Job state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<JobReportReason>("PUNGLI_BIAYA");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Profil Pelamar state untuk form "Lengkapi CV"
  const [phone, setPhone] = useState("");
  const [currentJobTitle, setCurrentJobTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 1. Fetching Job Data via TanStack Query
  const {
    data: jobData,
    isLoading: isJobLoading,
    isError: isJobError,
    error: jobError
  } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) {
        throw new Error("Gagal memuat detail lowongan kerja.");
      }
      return res.json() as Promise<{ job: Job }>;
    },
    enabled: !!id
  });

  // 2. Fetching Candidate Status (Cek apakah sudah melamar) via TanStack Query
  const { data: applyStatusData, isLoading: isCheckLoading } = useQuery({
    queryKey: ["applyStatus", id, user?.id],
    queryFn: async () => {
      if (!user || user.role !== "CANDIDATE") return null;
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/candidate/check-applied/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!id && !!user && user.role === "CANDIDATE"
  });

  // 3. Fetching Candidate Profile
  const { data: profileData } = useQuery({
    queryKey: ["candidateProfile", user?.id],
    queryFn: async () => {
      if (!user || user.role !== "CANDIDATE") return null;
      const token = localStorage.getItem("token");
      const res = await fetch("/api/candidate/profile", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user && user.role === "CANDIDATE"
  });

  // Sinkronkan data profil kandidat ke form
  useEffect(() => {
    if (profileData?.profile) {
      const p = profileData.profile;
      setPhone(p.phone || "");
      setCurrentJobTitle(p.currentJobTitle || "");
      setSkills(p.skills || "");
      setResumeUrl(p.resumeUrl || "");
      setPortfolioUrl(p.portfolioUrl || "");
      setBio(p.bio || "");
    }
  }, [profileData]);

  // 4. Mutation untuk melamar pekerjaan
  const applyMutation = useMutation({
    mutationFn: async (letterContent: string) => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/jobs/${id}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ coverLetter: letterContent })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengajukan lamaran.");
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        data.message || "Lamaran kerja Anda berhasil dikirimkan!",
        "Lamaran Dikirim"
      );

      const noticeMsg = data?.emailNotice || `Notifikasi email riwayat pendaftaran telah dikirim ke alamat email Anda (${user?.email}).`;
      toast.info(noticeMsg, "Notifikasi Email Terkirim");

      setShowApplyModal(false);
      setCoverLetter("");
      queryClient.invalidateQueries({ queryKey: ["applyStatus", id] });
      queryClient.invalidateQueries({ queryKey: ["candidateApplications"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Terjadi kesalahan."), "Gagal Melamar");
    }
  });

  const job = jobData?.job;
  const hasApplied = applyStatusData?.hasApplied;
  const existingApp = applyStatusData?.application;
  const candidateProfile = profileData?.profile;

  // Penentuan apakah profil/CV sudah lengkap (minimal No HP & Tautan Resume)
  const isProfileComplete = Boolean(
    candidateProfile &&
    candidateProfile.phone &&
    candidateProfile.phone.trim().length > 0 &&
    candidateProfile.resumeUrl &&
    candidateProfile.resumeUrl.trim().length > 0
  );

  const handleApplyClick = () => {
    const jobId = id || "";

    // A. Pengguna BELUM LOGIN -> Redirect ke login dengan query parameter
    if (!user) {
      toast.info("Silakan masuk atau daftar sebagai Pelamar terlebih dahulu.", "Autentikasi Diperlukan");
      navigate(`/login?redirectTo=/jobs/${jobId}&apply=true`);
      return;
    }

    // B. Pengguna terdaftar bukan sebagai CANDIDATE
    if (user.role !== "CANDIDATE") {
      toast.warning(
        "Akun Anda terdaftar sebagai Pemberi Kerja / Admin. Gunakan akun Pelamar (CANDIDATE) untuk melamar pekerjaan.",
        "Role Tidak Sesuai"
      );
      return;
    }

    // C. Jika Profil / CV BELUM LENGKAP -> Buka Modal Lengkapi CV
    if (!isProfileComplete) {
      toast.info("Silakan lengkapi nomor telepon dan tautan CV/Resume Anda terlebih dahulu.", "Lengkapi CV Pelamar");
      setShowProfileModal(true);
    } else {
      // D. Jika Profil / CV SUDAH LENGKAP -> Buka Modal Konfirmasi Kirim Lamaran
      setShowApplyModal(true);
    }
  };

  // Handler Buka Modal Laporan
  const handleOpenReportModal = () => {
    if (!user) {
      toast.info("Silakan masuk atau daftar terlebih dahulu untuk melaporkan lowongan ini.", "Autentikasi Diperlukan");
      navigate(`/login?redirectTo=/jobs/${id}`);
      return;
    }
    setShowReportModal(true);
  };

  // Handler Kirim Laporan Pekerjaan
  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) {
      toast.error("Penjelasan kronologi laporan wajib diisi.", "Laporan Belum Lengkap");
      return;
    }

    setIsSubmittingReport(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/reports/jobs/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reasonCategory: reportReason,
          description: reportDescription.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirimkan laporan.");
      }

      toast.success(
        "Laporan Anda telah dikirim ke Tim Moderasi KERJASANA. Terima kasih telah menjaga keamanan komunitas!",
        "Laporan Terkirim"
      );
      setShowReportModal(false);
      setReportDescription("");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirimkan laporan.", "Gagal Melaporkan");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // OTO-TRIGGER jika kembali dari Login dengan query ?apply=true
  useEffect(() => {
    if (searchParams.get("apply") === "true" && user && job && !hasApplied && !isJobLoading) {
      if (user.role === "CANDIDATE") {
        if (!isProfileComplete) {
          setShowProfileModal(true);
        } else {
          setShowApplyModal(true);
        }
      }
    }
  }, [searchParams, user, job, hasApplied, isJobLoading, isProfileComplete]);

  // Handler simpan profil kandidat
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Nomor HP / WhatsApp wajib diisi.", "Profil Belum Lengkap");
      return;
    }
    if (!resumeUrl.trim()) {
      toast.error("Tautan CV / Resume (URL Google Drive/PDF) wajib diisi.", "Profil Belum Lengkap");
      return;
    }

    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/candidate/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: phone.trim(),
          currentJobTitle: currentJobTitle.trim(),
          skills: skills.trim(),
          resumeUrl: resumeUrl.trim(),
          portfolioUrl: portfolioUrl.trim(),
          bio: bio.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan profil pelamar.");
      }

      toast.success("Profil & Data CV Anda berhasil disimpan!", "Profil Diperbarui");
      await queryClient.invalidateQueries({ queryKey: ["candidateProfile", user?.id] });
      setShowProfileModal(false);
      setShowApplyModal(true);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan profil.", "Gagal Menyimpan");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Tautan lowongan telah disalin ke papan klip!", "Tautan Disalin");
  };

  if (isJobLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6">
        <div className="h-8 bg-slate-200 rounded-lg w-1/3 animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
        <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isJobError || !job) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-6">
        <Helmet>
          <title>Lowongan Tidak Ditemukan — Kerjasana</title>
        </Helmet>
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Lowongan Kerja Tidak Ditemukan</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Lowongan yang Anda cari mungkin telah kedaluwarsa, ditarik oleh perusahaan, atau tautan tidak valid.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-600/10 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPLIED":
        return { label: "Lamaran Terkirim", bg: "bg-blue-100 text-blue-800 border-blue-200" };
      case "SHORTLISTED":
        return { label: "Lolos Seleksi Berkas", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" };
      case "INTERVIEW":
        return { label: "Tahap Wawancara", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "ACCEPTED":
        return { label: "Diterima Kerja 🎉", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "REJECTED":
        return { label: "Belum Sesuai", bg: "bg-rose-100 text-rose-800 border-rose-200" };
      default:
        return { label: "Sudah Dilamar", bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <Helmet>
        <title>{`${job.title} - ${job.company} (${job.location}) | Kerjasana`}</title>
        <meta
          name="description"
          content={`Lowongan kerja ${job.title} di ${job.company}, ${job.location}. Gaji: ${job.salary}. Kirim lamaran instan sekarang.`}
        />
      </Helmet>

      {/* Navigasi Kembali */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Lowongan
        </button>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          Bagikan Loker
        </button>
      </div>

      {/* 1. Header Hero Loker */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-100/80">
                {job.category || "Lainnya"}
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-100 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Terverifikasi Kerjasana
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <Building2 className="w-4 h-4 text-indigo-600" />
                {job.company}
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="w-4 h-4 text-slate-400" />
                {job.location}
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                {job.salary}
              </div>
            </div>
          </div>

          {/* Akses Melamar */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
            {hasApplied ? (
              <div className="w-full md:w-auto text-center space-y-2">
                <div className={`px-6 py-3 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 shadow-xs ${getStatusBadge(existingApp?.status || "").bg}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {getStatusBadge(existingApp?.status || "").label}
                </div>
                <p className="text-xs text-slate-400">
                  Dilamar pada {new Date(existingApp?.appliedAt || "").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ) : (
              <button
                onClick={handleApplyClick}
                className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                Lamar Sekarang (One-Click)
              </button>
            )}
          </div>
        </div>

        {/* Highlight Metadata Informasi */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Tanggal Tayang</span>
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(job.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Batas Akhir</span>
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {new Date(job.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Pengunggah</span>
            <p className="font-semibold text-slate-700 truncate">
              {job.postedByName || "HRD Resmi"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Kontak Resmi</span>
            <p className="font-semibold text-indigo-600 truncate">
              {job.contact}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Isi Detail Pekerjaan & Sidebar Perusahaan */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Kolom Kiri: Deskripsi & Kualifikasi */}
        <div className="space-y-6">
          {/* Deskripsi Pekerjaan */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Deskripsi Pekerjaan</h3>
            </div>
            <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-line space-y-2">
              {job.description}
            </div>
          </div>

          {/* Persyaratan & Kualifikasi */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Kualifikasi & Persyaratan</h3>
            </div>
            <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-line">
              {job.requirements}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Card Info Perusahaan & Keamanan */}
        <div className="space-y-6">
          {/* Card Profil Perusahaan */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-xl flex items-center justify-center shadow-md">
                {job.company.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 leading-tight">{job.company}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {job.location}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Perusahaan terverifikasi resmi yang menawarkan lingkungan kerja profesional dan berkembang.
            </p>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Status Verifikasi</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Kontak Rekrutmen</span>
                <span className="font-semibold text-slate-700 truncate max-w-[160px]">
                  {job.contact}
                </span>
              </div>
            </div>
          </div>

          {/* Card Peringatan Keamanan Pelamar */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Himbauan Bebas Pungli
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Kerjasana.com melarang keras segala bentuk pemungutan biaya dalam proses rekrutmen. Jangan pernah mentransfer uang atau membayar travel kepada siapa pun.
            </p>
          </div>

          {/* Tombol Laporkan Lowongan */}
          <button
            onClick={handleOpenReportModal}
            className="w-full py-3 px-4 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 hover:text-rose-800 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer group"
          >
            <Flag className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
            🚩 Laporkan Lowongan Ini
          </button>
        </div>
      </div>

      {/* 3. Modal Lengkapi CV & Data Pelamar */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Langkah 1 dari 2: Data Pelamar
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  Lengkapi CV & Data Pelamar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi informasi kontak & CV Anda agar HRD {job?.company} dapat meninjau lamaran Anda.
                </p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor HP / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tautan CV / Resume (Google Drive / Link PDF) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    required
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/cv-anda..."
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pastikan izin akses dokumen di Google Drive sudah diatur ke "Siapa saja dengan link bisa melihat".
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Posisi / Pekerjaan Saat Ini
                </label>
                <input
                  type="text"
                  value={currentJobTitle}
                  onChange={(e) => setCurrentJobTitle(e.target.value)}
                  placeholder="Contoh: Frontend Developer / Fresh Graduate"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keahlian Utama (Skills)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Contoh: React, TypeScript, Graphic Design, Customer Service"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tautan Portofolio / LinkedIn (Opsional)
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Simpan & Lanjutkan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Konfirmasi / Pengisian Cover Letter Lamaran */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Profil Lengkap — Langkah 2 dari 2
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  Melamar: {job?.title}
                </h3>
                <p className="text-xs text-slate-500">{job?.company} • {job?.location}</p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Ringkasan Profil Pelamar */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-600" /> Identitas Pelamar
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyModal(false);
                    setShowProfileModal(true);
                  }}
                  className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Edit Data CV
                </button>
              </div>
              <div className="text-slate-600 space-y-1">
                <p><span className="font-semibold text-slate-800">Nama:</span> {user?.name}</p>
                <p><span className="font-semibold text-slate-800">Email:</span> {user?.email}</p>
                {candidateProfile?.phone && (
                  <p><span className="font-semibold text-slate-800">No. HP:</span> {candidateProfile.phone}</p>
                )}
                {candidateProfile?.resumeUrl ? (
                  <p className="text-emerald-700 font-semibold flex items-center gap-1 pt-1 truncate">
                    <FileText className="w-3.5 h-3.5 shrink-0" /> CV: <a href={candidateProfile.resumeUrl} target="_blank" rel="noreferrer" className="underline truncate">{candidateProfile.resumeUrl}</a>
                  </p>
                ) : (
                  <p className="text-amber-600 italic pt-1">
                    ⚠️ Belum mengunggah link CV/Resume di profil.
                  </p>
                )}
              </div>
            </div>

            {/* Input Cover Letter / Surat Lamaran Singkat */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Surat Pengantar / Cover Letter (Opsional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Ceritakan secara singkat keahlian dan alasan Anda tertarik dengan posisi ini..."
                className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-28 resize-none"
              />
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => applyMutation.mutate(coverLetter)}
                disabled={applyMutation.isPending}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {applyMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Kirim Lamaran Pekerjaan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Laporkan Lowongan (ReportJobModal) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
                  <ShieldAlert className="w-3 h-3 text-rose-600" /> Fitur Keamanan Komunitas
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  Laporkan Lowongan Kerja
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Laporan Anda akan ditinjau secara rahasia oleh Tim Moderasi KERJASANA.
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Ringkasan Job */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
              <div className="font-bold text-slate-800">{job?.title}</div>
              <div className="text-slate-500 font-semibold">{job?.company} • {job?.location}</div>
            </div>

            <form onSubmit={handleSendReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Kategori Alasan Laporan <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { id: "PUNGLI_BIAYA", label: "Pemungutan Biaya / Pungli Rekrutmen", desc: "Diminta membayarkan uang seragam, travel, tes kesehatan, atau administrasi." },
                    { id: "INDIKASI_PENIPUAN", label: "Indikasi Penipuan / Investasi Bodong", desc: "Tawaran kerja tidak masuk akal, skema ponzi, atau pemerasan." },
                    { id: "DATA_PALSU", label: "Informasi / Data Perusahaan Palsu", desc: "Nama perusahaan, alamat, atau kontak rekrutmen fiktif/palsu." },
                    { id: "DISKRIMINASI", label: "Diskriminasi / Syarat Tidak Wajar", desc: "Syarat perekrutan melanggar hukum atau bersifat diskriminatif melampaui batas." },
                    { id: "LAINNYA", label: "Alasan Lainnya", desc: "Pelanggaran lain terhadap ketentuan layanan Kerjasana." }
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        reportReason === item.id
                          ? "bg-rose-50/50 border-rose-300 ring-2 ring-rose-500/20"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reasonCategory"
                        value={item.id}
                        checked={reportReason === item.id}
                        onChange={() => setReportReason(item.id as JobReportReason)}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">{item.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penjelasan Detail Kronologi Laporan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Ceritakan kronologi singkat, bukti pesan WhatsApp/Email, atau nilai uang pungli yang diminta..."
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingReport ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengirim Laporan...
                    </>
                  ) : (
                    <>
                      <Flag className="w-3.5 h-3.5" />
                      Kirim Laporan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
