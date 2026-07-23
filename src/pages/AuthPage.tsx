/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Key, Mail, User, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import { User as UserType } from "../types";
import { useToast } from "../context/ToastContext";

interface AuthPageProps {
  onLoginSuccess: (token: string, user: UserType) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const applyParam = searchParams.get("apply");

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN" | "CANDIDATE">("CANDIDATE");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin 
      ? { email, password } 
      : { name, email, password, role };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Terjadi kesalahan pada server.");
      }

      setSuccess(isLogin ? "Login berhasil!" : "Registrasi berhasil!");
      toast.success(isLogin ? "Sesi login Anda telah aktif." : "Akun Anda berhasil dibuat!", isLogin ? "Login Berhasil" : "Registrasi Berhasil");
      
      // Tunggu animasi sebentar lalu panggil callback sukses dan redirect jika ada parameter
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
        if (redirectTo) {
          const hasApplyQuery = redirectTo.includes("apply=");
          let target = redirectTo;
          if (applyParam === "true" && !hasApplyQuery) {
            target += (redirectTo.includes("?") ? "&" : "?") + "apply=true";
          }
          navigate(target);
        } else {
          navigate("/");
        }
      }, 800);

    } catch (err: any) {
      setError(err.message || "Gagal menyambung ke server.");
      toast.error(err.message || "Gagal melakukan diautentikasi.", "Autentikasi Gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <Helmet>
        <title>{isLogin ? "Masuk Sesi — Kerjasana" : "Pendaftaran Akun Baru — Kerjasana"}</title>
        <meta name="description" content="Masuk ke akun Kerjasana Anda atau daftarkan perusahaan baru untuk mulai memasang iklan lowongan kerja lokal terverifikasi." />
      </Helmet>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Banner */}
        <div className="bg-indigo-600 text-white px-6 py-8 text-center relative">
          <div className="absolute top-3 right-3 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase">
            KERJASANA PORTAL
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Selamat Datang</h2>
          <p className="text-indigo-100 text-xs mt-1 leading-relaxed">
            {isLogin 
              ? "Masuk untuk mengelola lowongan kerja lokal Anda" 
              : "Daftar sebagai Pemberi Kerja untuk memasang iklan loker gratis"}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => {
              setIsLogin(true);
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              isLogin 
                ? "text-indigo-600 border-b-2 border-indigo-600 font-bold bg-slate-50/50" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Masuk Akun
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError("");
              setSuccess("");
            }}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-colors ${
              !isLogin 
                ? "text-indigo-600 border-b-2 border-indigo-600 font-bold bg-slate-50/50" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-700 text-xs font-medium animate-pulse">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Kolom Nama Lengkap (Hanya Registrasi) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Nama Lengkap / Perusahaan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all"
                  placeholder="Contoh: HRD Tokopedia atau Budi Setiawan"
                />
              </div>
            </div>
          )}

          {/* Kolom Email */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all"
                placeholder="nama@perusahaan.com"
              />
            </div>
          </div>

          {/* Kolom Password */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all"
                placeholder="Minimal 6 karakter"
              />
            </div>
          </div>

          {/* Pilihan Peran (Hanya Registrasi) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mendaftar Sebagai
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("CANDIDATE")}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                    role === "CANDIDATE"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  Pelamar
                </button>
                <button
                  type="button"
                  onClick={() => setRole("USER")}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                    role === "USER"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  HRD / Owner
                </button>
                <button
                  type="button"
                  onClick={() => setRole("ADMIN")}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1 ${
                    role === "ADMIN"
                      ? "bg-amber-50 border-amber-500 text-amber-700 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  Admin
                </button>
              </div>
            </div>
          )}

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl mt-2 transition-all shadow-md shadow-indigo-600/10 active:translate-y-[1px]"
          >
            {isLoading 
              ? "Sedang Memproses..." 
              : isLogin 
                ? "Masuk Ke Portal" 
                : "Daftar Akun Sekarang"}
          </button>
        </form>

        {/* Demo Credentials Hint */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
          <span className="font-bold text-slate-700">Akun Pengujian Cepat:</span>
          <div className="mt-1 flex flex-col gap-1">
            <div>
              🧑‍💼 Pelamar (Candidate): <span className="font-mono bg-slate-200/60 px-1 py-0.5 rounded text-slate-700">rian.candidate@gmail.com</span> | password: <span className="font-mono bg-slate-200/60 px-1 py-0.5 rounded text-slate-700">candidate123</span>
            </div>
            <div>
              👨‍💼 Pemberi Kerja (HRD): <span className="font-mono bg-slate-200/60 px-1 py-0.5 rounded text-slate-700">budi@tokopedia.com</span> | password: <span className="font-mono bg-slate-200/60 px-1 py-0.5 rounded text-slate-700">owner123</span>
            </div>
            <div>
              👑 Administrator: <span className="font-mono bg-slate-200/60 px-1 py-0.5 rounded text-slate-700">admin@kerjasana.com</span> | password: <span className="font-mono bg-slate-200/60 px-1 py-0.5 rounded text-slate-700">admin123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
