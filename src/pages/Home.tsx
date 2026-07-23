/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, MapPin, DollarSign, Calendar, Eye, Send, Building2, Briefcase, FileText, X, CheckCircle2, Share2, Check, Cpu, TrendingUp, Coffee, Palette, Layers, Plus, RefreshCw, Landmark, GraduationCap, Stethoscope, HardHat, Filter, Sparkles } from "lucide-react";
import { Job } from "../types";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";

const CATEGORIES = [
  { name: "Semua Kategori", value: "", icon: Briefcase, bg: "bg-slate-100 hover:bg-slate-200 text-slate-700", activeBg: "bg-slate-800 text-white" },
  { name: "IT / Teknologi", value: "IT / Teknologi", icon: Cpu, bg: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700", activeBg: "bg-indigo-600 text-white" },
  { name: "Keuangan & Akuntansi", value: "Keuangan & Akuntansi", icon: Landmark, bg: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700", activeBg: "bg-emerald-600 text-white" },
  { name: "Pendidikan & Pelatihan", value: "Pendidikan & Pelatihan", icon: GraduationCap, bg: "bg-blue-50 hover:bg-blue-100 text-blue-700", activeBg: "bg-blue-600 text-white" },
  { name: "Kesehatan & Farmasi", value: "Kesehatan & Farmasi", icon: Stethoscope, bg: "bg-teal-50 hover:bg-teal-100 text-teal-700", activeBg: "bg-teal-600 text-white" },
  { name: "Sales & Marketing", value: "Sales & Marketing", icon: TrendingUp, bg: "bg-amber-50 hover:bg-amber-100 text-amber-700", activeBg: "bg-amber-600 text-white" },
  { name: "Administrasi & Umum", value: "Administrasi & Umum", icon: FileText, bg: "bg-violet-50 hover:bg-violet-100 text-violet-700", activeBg: "bg-violet-600 text-white" },
  { name: "F&B / Pelayanan", value: "F&B / Pelayanan", icon: Coffee, bg: "bg-orange-50 hover:bg-orange-100 text-orange-700", activeBg: "bg-orange-600 text-white" },
  { name: "Desain & Media", value: "Desain & Media", icon: Palette, bg: "bg-pink-50 hover:bg-pink-100 text-pink-700", activeBg: "bg-pink-600 text-white" },
  { name: "Konstruksi & Teknik", value: "Konstruksi & Teknik", icon: HardHat, bg: "bg-cyan-50 hover:bg-cyan-100 text-cyan-700", activeBg: "bg-cyan-600 text-white" },
  { name: "Lainnya", value: "Lainnya", icon: Layers, bg: "bg-slate-50 hover:bg-slate-100 text-slate-600", activeBg: "bg-slate-600 text-white" }
];

const POPULAR_CITIES = [
  { name: "Semua Kota", value: "" },
  { name: "Jakarta", value: "Jakarta" },
  { name: "Bali", value: "Bali" },
  { name: "Surabaya", value: "Surabaya" },
  { name: "Bandung", value: "Bandung" },
  { name: "Yogyakarta", value: "Yogyakarta" },
  { name: "Semarang", value: "Semarang" },
  { name: "Medan", value: "Medan" },
  { name: "Malang", value: "Malang" },
  { name: "Makassar", value: "Makassar" }
];

export default function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk modal detail loker
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // State untuk status salin link
  const [copied, setCopied] = useState(false);

  // Efek untuk menyinkronkan query parameter 'job' dengan state selectedJob
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (selectedJob) {
      queryParams.set("job", selectedJob.id);
      window.history.replaceState(null, "", "?" + queryParams.toString());
    } else {
      queryParams.delete("job");
      const searchStr = queryParams.toString();
      window.history.replaceState(null, "", searchStr ? "?" + searchStr : window.location.pathname);
    }
  }, [selectedJob]);

  // Efek untuk otomatis membuka detail pekerjaan jika ada parameter 'job' di URL saat data jobs selesai dimuat
  useEffect(() => {
    if (jobs.length > 0) {
      const queryParams = new URLSearchParams(window.location.search);
      const jobId = queryParams.get("job");
      if (jobId && !selectedJob) {
        const found = jobs.find((j) => j.id === jobId);
        if (found) {
          setSelectedJob(found);
        }
      }
    }
  }, [jobs]);

  const handleShare = (job: Job) => {
    const shareUrl = `${window.location.origin}/?job=${job.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success(`Tautan lowongan "${job.title}" telah disalin ke clipboard!`, "Tautan Tersalin");
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error("Gagal menyalin link ke clipboard:", err);
      toast.error("Gagal menyalin tautan ke clipboard", "Gagal Salin");
    });
  };

  // Debounce input pencarian agar tidak membebani server pada setiap keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setLocation(locationInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, locationInput]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (location) queryParams.append("location", location);
      if (category) queryParams.append("category", category);

      const res = await fetch(`/api/jobs?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Gagal mengambil daftar loker:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Berlangganan event pembaruan daftar loker (misal setelah trigger cron/backdate)
    const handleRefresh = () => fetchJobs();
    window.addEventListener("refresh-jobs", handleRefresh);
    return () => window.removeEventListener("refresh-jobs", handleRefresh);
  }, [search, location, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setLocation(locationInput);
    fetchJobs();
  };

  const filterParts = [];
  if (category) filterParts.push(category);
  if (location) filterParts.push(`di ${location}`);
  if (search) filterParts.push(`"${search}"`);
  const filterSummary = filterParts.join(" ");

  const metaTitle = selectedJob
    ? `${selectedJob.title} - ${selectedJob.company} (${selectedJob.location}) | kerjasana.com`
    : filterSummary
    ? `Lowongan Kerja ${filterSummary} — Kerjasana`
    : "Kerjasana — Portal Lowongan Kerja Lokal Terpercaya";

  const metaDescription = selectedJob
    ? `Lowongan kerja ${selectedJob.title} di ${selectedJob.company} (${selectedJob.location}). Kategori: ${selectedJob.category || 'Lainnya'}. Gaji: ${selectedJob.salary || 'Sesuai Kesepakatan'}. ${selectedJob.description.replace(/[\r\n]+/g, ' ').substring(0, 140)}...`
    : filterSummary
    ? `Daftar lowongan kerja ${filterSummary} terverifikasi terbaru di Kerjasana.`
    : "Cari dan lamar lowongan kerja lokal terverifikasi di kerjasana.com. Temukan karir impian di bidang IT, Keuangan, Pendidikan, Sales, dan industri favorit Anda.";

  const canonicalUrl = selectedJob
    ? `${window.location.origin}/?job=${selectedJob.id}`
    : window.location.href;

  return (
    <div className="space-y-8">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {/* Open Graph / Facebook / WhatsApp */}
        <meta property="og:type" content={selectedJob ? "article" : "website"} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Kerjasana" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
      </Helmet>
      {/* 1. Hero Search Section */}
      <div className="bg-gradient-to-br from-indigo-800 to-slate-950 rounded-3xl text-white px-6 py-12 md:p-16 shadow-xl relative overflow-hidden">
        {/* Ornamen latar belakang */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.15),transparent_40%)]" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-700/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold font-mono tracking-wider uppercase">
            🇮🇩 Portal Lowongan Kerja Lokal
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1]">
            Hubungkan Bakat Lokal Dengan Peluang Kerja Terbaik
          </h1>
          <p className="text-slate-100 text-sm md:text-base font-medium max-w-xl leading-relaxed">
            Temukan pekerjaan impian Anda di lingkungan terdekat. Bersih, aman dari penipuan, dan melalui proses verifikasi admin yang ketat.
          </p>

          {/* Form Pencarian */}
          <form onSubmit={handleSearchSubmit} className="pt-4">
            <div className="bg-white rounded-2xl p-2 shadow-lg grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_auto] gap-2">
              {/* Kolom Keyword */}
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari posisi, keahlian, atau nama perusahaan..."
                  className="w-full text-slate-800 text-sm bg-transparent pl-10 pr-10 py-3 focus:outline-none placeholder-slate-400 font-medium"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Bersihkan pencarian"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Kolom Lokasi */}
              <div className="relative flex items-center border-t md:border-t-0 md:border-l border-slate-100">
                <MapPin className="w-5 h-5 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  list="city-options"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Kota atau lokasi wilayah..."
                  className="w-full text-slate-800 text-sm bg-transparent pl-10 pr-10 py-3 focus:outline-none placeholder-slate-400 font-medium"
                />
                <datalist id="city-options">
                  {POPULAR_CITIES.filter((c) => c.value).map((city) => (
                    <option key={city.value} value={city.value} />
                  ))}
                </datalist>
                {locationInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationInput("");
                      setLocation("");
                    }}
                    className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Bersihkan lokasi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Kolom Kategori Industri */}
              <div className="relative flex items-center border-t md:border-t-0 md:border-l border-slate-100">
                <Filter className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-slate-800 text-sm bg-transparent pl-9 pr-8 py-3 focus:outline-none appearance-none cursor-pointer font-medium"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.value} className="text-slate-800 bg-white">
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Tombol Cari */}
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-indigo-700/10 cursor-pointer"
              >
                Cari Loker
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Filter Kategori Pekerjaan & Lokasi Kota */}
      <div className="space-y-4 bg-slate-50 p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-xs">
        {/* Kategori Industri */}
        <div className="space-y-2">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pl-1">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            Saring Berdasarkan Kategori Industri
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.value;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive 
                      ? `${cat.activeBg} shadow-md shadow-slate-900/10 scale-[1.02]` 
                      : "bg-white border border-slate-200/60 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-200/50 my-2" />

        {/* Lokasi Kota Populer */}
        <div className="space-y-2">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pl-1">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            Saring Berdasarkan Lokasi Kota
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2">
            {POPULAR_CITIES.map((city) => {
              const isActive = (location === city.value) || (locationInput === city.value && city.value !== "");
              return (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => {
                    setLocationInput(city.value);
                    setLocation(city.value);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 scale-[1.02]"
                      : "bg-white border border-slate-200/60 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <MapPin className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-rose-500"}`} />
                  {city.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Job Board Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              Lowongan Kerja Terbaru yang Aktif
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Menampilkan lowongan kerja lokal terverifikasi yang tayang selama 30 hari ke depan.
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-mono text-xs font-bold border border-slate-200">
            {jobs.length} Lowongan Tayang
          </span>
        </div>

        {/* Filter Aktif Feedback */}
        {(search || location || category) && (
          <div className="flex flex-wrap items-center gap-2 p-3.5 bg-indigo-50/70 border border-indigo-100/60 rounded-2xl text-xs text-indigo-800 animate-fade-in">
            <span className="font-semibold text-slate-500">Filter Aktif:</span>
            {search && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-xl shadow-xs">
                Kata kunci: <span className="font-bold text-indigo-900">"{search}"</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-xl shadow-xs">
                Lokasi: <span className="font-bold text-indigo-900">"{location}"</span>
                <button
                  type="button"
                  onClick={() => {
                    setLocationInput("");
                    setLocation("");
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-indigo-100 px-2.5 py-1 rounded-xl shadow-xs">
                Kategori: <span className="font-bold text-indigo-900">{category}</span>
                <button
                  type="button"
                  onClick={() => {
                    setCategory("");
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchInput("");
                setLocationInput("");
                setSearch("");
                setLocation("");
                setCategory("");
              }}
              className="ml-auto text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline px-2 py-1 transition-all"
            >
              Hapus Semua Filter
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse flex flex-col p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-1/3 bg-slate-200 rounded" />
                    <div className="h-4 w-1/4 bg-slate-200 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-slate-200 rounded" />
                </div>
                <div className="h-10 w-full bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Search}
            badge={search || location || category ? "Pencarian Kosong" : "Belum Ada Lowongan"}
            title={search || location || category ? "Tidak Ada Lowongan yang Cocok" : "Belum Ada Lowongan Kerja Aktif"}
            description={
              search || location || category
                ? `Tidak ditemukan lowongan kerja aktif untuk kriteria yang Anda masukkan. Silakan coba atur ulang filter pencarian atau gunakan kata kunci lain.`
                : "Saat ini belum ada lowongan kerja aktif yang terpublikasi. Pasang lowongan kerja perusahaan Anda sekarang untuk mulai menerima lamaran dari talenta terbaik!"
            }
            primaryAction={
              search || location || category
                ? {
                    label: "Reset Filter Pencarian",
                    icon: RefreshCw,
                    onClick: () => {
                      setSearchInput("");
                      setLocationInput("");
                      setSearch("");
                      setLocation("");
                      setCategory("");
                    }
                  }
                : {
                    label: "Pasang Lowongan Baru",
                    icon: Plus,
                    onClick: () => navigate("/submit")
                  }
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`rounded-2xl border transition-all p-5 sm:p-6 flex flex-col md:flex-row justify-between gap-5 relative group ${
                  job.isFeatured
                    ? "bg-gradient-to-r from-amber-50/70 via-yellow-50/40 to-white border-amber-300 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30"
                    : "bg-white border-slate-100 shadow-xs hover:shadow-md hover:border-indigo-100"
                }`}
              >
                {/* Info Loker */}
                <div className="space-y-3.5 flex-1">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 transition-colors ${
                      job.isFeatured
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-slate-50 border border-slate-100 text-indigo-600 group-hover:bg-indigo-50 group-hover:border-indigo-100"
                    }`}>
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {job.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-sm border border-amber-300">
                            <Sparkles className="w-3 h-3 fill-slate-900" /> Prioritas ⭐
                          </span>
                        )}
                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-700 transition-colors">
                          {job.title}
                        </h3>
                        {job.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100/50">
                            {job.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                        {job.company}
                      </p>
                    </div>
                  </div>

                  {/* Keterangan Atribut */}
                  <div className="flex flex-wrap gap-y-2 gap-x-2.5 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-semibold text-slate-700">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                      {job.salary}
                    </span>
                    {(job.salaryMin !== undefined || job.salaryMax !== undefined) && (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-bold text-xs" title="Loker Transparan: Perusahaan mencantumkan rentang gaji secara jelas">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Rentang: {job.salaryMin ? `Rp ${job.salaryMin.toLocaleString('id-ID')}` : '0'} - {job.salaryMax ? `Rp ${job.salaryMax.toLocaleString('id-ID')}` : 'Nego'} {job.salaryPeriod ? `/${job.salaryPeriod}` : ''}
                      </span>
                    )}
                    <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-sky-500" />
                      Hingga {new Date(job.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  {/* Ringkasan Deskripsi */}
                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                    {job.description}
                  </p>
                </div>

                {/* Tombol Aksi */}
                <div className="flex md:flex-col justify-between items-end shrink-0 md:border-l border-slate-100 md:pl-6 md:min-w-[140px] gap-4">
                  <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50 text-[10px] font-bold tracking-wider uppercase font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    TAYANG (ACTIVE)
                  </span>
                  
                  <button
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/10 cursor-pointer hover:translate-x-0.5"
                  >
                    <Eye className="w-4 h-4" />
                    Detail & Lamar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Detail Job Overlay Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-indigo-800 text-white p-6 relative shrink-0">
              <button
                onClick={() => setSelectedJob(null)}
                className="absolute top-4 right-4 text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 max-w-[90%]">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-[10px] font-bold font-mono tracking-wider uppercase">
                    Peluang Kerja Lokal
                  </span>
                  {selectedJob.category && (
                    <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-150 text-[10px] font-bold font-mono tracking-wider uppercase">
                      {selectedJob.category}
                    </span>
                  )}
                </div>
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">
                  {selectedJob.title}
                </h3>
                <p className="text-slate-100 font-semibold text-sm">
                  {selectedJob.company} — <span className="font-medium text-xs opacity-90">{selectedJob.location}</span>
                </p>
              </div>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Ringkasan */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/80 text-xs">
                <div>
                  <span className="block text-slate-400 font-medium">Estimasi Gaji / Upah:</span>
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1 mt-0.5">
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    {selectedJob.salary}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Batas Pengiriman:</span>
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1 mt-0.5">
                    <Calendar className="w-4 h-4 text-sky-500" />
                    {new Date(selectedJob.expiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Transparansi Gaji jika tersedia */}
              {(selectedJob.salaryMin !== undefined || selectedJob.salaryMax !== undefined) && (
                <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Loker Transparan — Rentang Gaji Resmi
                    </div>
                    <div className="text-base font-black text-emerald-950 mt-1">
                      {selectedJob.salaryMin ? `Rp ${selectedJob.salaryMin.toLocaleString("id-ID")}` : "0"}
                      {" — "}
                      {selectedJob.salaryMax ? `Rp ${selectedJob.salaryMax.toLocaleString("id-ID")}` : "Nego"}
                      <span className="text-xs font-medium text-emerald-700 ml-1">
                        / {selectedJob.salaryPeriod || "Bulan"}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200/80">
                    Transparansi Terverifikasi
                  </span>
                </div>
              )}

              {/* Deskripsi */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Deskripsi Pekerjaan
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap pl-5">
                  {selectedJob.description}
                </p>
              </div>

              {/* Persyaratan */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Kualifikasi & Persyaratan
                </h4>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap pl-5">
                  {selectedJob.requirements}
                </div>
              </div>

              {/* Pembuat Loker */}
              <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 text-[11px] text-slate-500">
                Diajukan oleh: <span className="font-bold text-slate-700">{selectedJob.postedByName}</span> pada {new Date(selectedJob.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.
              </div>
            </div>

            {/* Footer Modal (Kontak / Apply) */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <div className="text-center sm:text-left">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Hubungi Kontak / Kirim CV Ke:</span>
                <span className="text-sm font-bold text-slate-800 select-all font-mono">
                  {selectedJob.contact}
                </span>
              </div>
              
              <div className="w-full sm:w-auto flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleShare(selectedJob)}
                  className={`w-1/2 sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                    copied
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs"
                      : "bg-white border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/50 shadow-xs"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Bagikan
                    </>
                  )}
                </button>

                <a
                  href={`mailto:${selectedJob.contact}?subject=Lamaran Pekerjaan: ${selectedJob.title} - (Melalui kerjasana.com)`}
                  className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-indigo-600/10"
                >
                  <Send className="w-4 h-4" />
                  Kirim Lamaran
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
