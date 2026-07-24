/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Briefcase, AlertTriangle, ShieldCheck, Sparkles, Check, CheckCircle2 } from "lucide-react";

import { HelmetProvider } from "react-helmet-async";
import Navbar from "./components/Navbar";
//import SimulatorPanel from "./components/SimulatorPanel";
import Home from "./pages/Home";
import SubmitJob from "./pages/SubmitJob";
import AdminDashboard from "./pages/AdminDashboard";
import AuthPage from "./pages/AuthPage";
import JobDetail from "./pages/JobDetail";
import CandidateDashboard from "./pages/CandidateDashboard";
import EmployerTransactions from "./pages/EmployerTransactions";
import { User, Job } from "./types";
import { ToastProvider, useToast } from "./context/ToastContext";

const queryClient = new QueryClient();

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  // Memeriksa token di localStorage saat aplikasi dimuat
  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setIsCheckingAuth(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        // Token tidak valid/kedaluwarsa
        localStorage.removeItem("token");
        setUser(null);
      }
    } catch (e) {
      console.error("Gagal melakukan otorisasi login", e);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Mengambil daftar seluruh jobs untuk sinkronisasi Simulator
  const fetchAllJobsForSimulator = async () => {
    try {
      // Kita panggil endpoint publik saja, atau jika admin panggil endpoint admin
      const token = localStorage.getItem("token");
      const url = user?.role === "ADMIN" ? "/api/admin/jobs" : "/api/jobs";
      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (res.ok) {
        setJobs(data.jobs || []);
      }
    } catch (e) {
      console.error("Gagal sinkronisasi data jobs untuk simulator", e);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    fetchAllJobsForSimulator();

    // Berlangganan event refresh dari halaman-halaman
    const handleRefresh = () => fetchAllJobsForSimulator();
    window.addEventListener("refresh-jobs", handleRefresh);
    return () => window.removeEventListener("refresh-jobs", handleRefresh);
  }, [user]);

  // Handler Login Sukses
  const handleLoginSuccess = (token: string, loggedUser: User) => {
    localStorage.setItem("token", token);
    setUser(loggedUser);
    window.dispatchEvent(new Event("refresh-jobs"));
    toast.success(`Selamat datang, ${loggedUser.name}!`, "Login Berhasil");
  };

  // Handler Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.dispatchEvent(new Event("refresh-jobs"));
    toast.info("Anda telah keluar dari sesi.", "Logout");
  };

  // Handler Simulator: Ganti Akun Instan
  const handleSelectUser = async (email: string, pass: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (res.ok) {
        handleLoginSuccess(data.token, data.user);
        // Navigasi halaman berdasarkan peran
        if (data.user.role === "ADMIN") {
          navigate("/admin");
        } else if (data.user.role === "CANDIDATE") {
          navigate("/candidate");
        } else {
          navigate("/submit");
        }
      } else {
        toast.error(data.error || "Gagal berganti akun", "Simulator Error");
      }
    } catch (e) {
      console.error("Simulator Login gagal", e);
      toast.error("Gagal terhubung ke server", "Simulator Error");
    }
  };

  // Handler Simulator: Jalankan Cron Auto-Expire
  const handleTriggerCron = async () => {
    try {
      const res = await fetch("/api/simulator/trigger-cron", { method: "POST" });
      const data = await res.json();
      window.dispatchEvent(new Event("refresh-jobs"));
      toast.info(data.message || "Pemeriksaan otomatis kadaluarsa selesai", "Simulator Cron");
      return data;
    } catch (e) {
      toast.error("Gagal menjalankan cron", "Simulator Error");
    }
  };

  // Handler Simulator: Backdate Pembuatan Job
  const handleBackdateJob = async (jobId: string, daysAgo: number) => {
    const res = await fetch("/api/simulator/backdate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, daysAgo })
    });
    if (res.ok) {
      window.dispatchEvent(new Event("refresh-jobs"));
      toast.success(`Tanggal lowongan dimundurkan ${daysAgo} hari`, "Simulator Success");
    } else {
      const data = await res.json();
      toast.error(data.error || "Gagal memundurkan tanggal", "Simulator Error");
      throw new Error(data.error);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Menyiapkan Aplikasi Kerjasana...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navbar Utama */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* Konten Halaman */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs/:id" element={<JobDetail user={user} />} />
          <Route path="/candidate" element={<CandidateDashboard user={user} />} />
          <Route path="/profile/transactions" element={<EmployerTransactions user={user} />} />
          <Route path="/submit" element={<SubmitJob user={user} />} />
          <Route path="/admin" element={<AdminDashboard user={user} />} />
          <Route path="/auth" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/login" element={<AuthPage onLoginSuccess={handleLoginSuccess} />} />
        </Routes>

        {/* Panel Simulator Melayang / Di Bawah 
          <SimulatorPanel 
          currentUser={user}
          onSelectUser={handleSelectUser}
          onTriggerCron={handleTriggerCron}
          onBackdateJob={handleBackdateJob}
          jobs={jobs}
        />*/}
      </main>

      {/* Footer Hak Cipta */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1.5">
          <p className="font-semibold text-slate-500">
            © 2026 kerjasana.com — Solusi Lowongan Kerja Lokal Aman & Tepercaya.
          </p>
          <p>
            Dibuat menggunakan React, Node.js, Express, Tailwind CSS, Prisma ORM, dan PostgreSQL.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </HashRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
