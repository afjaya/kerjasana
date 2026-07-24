/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Key, Mail, User, Shield, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN" | "CANDIDATE">("CANDIDATE");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Reset form status saat berpindah tab
  const handleTabSwitch = (loginState: boolean) => {
    setIsLogin(loginState);
    setError("");
    setSuccess("");
    // Opsional: Clear password demi keamanan saat switch tab
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin 
      ? { email: email.trim(), password } 
      : { name: name.trim(), email: email.trim(), password, role };

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

      const successMsg = isLogin ? "Login berhasil!" : "Registrasi berhasil!";
      setSuccess(successMsg);
      toast.success(
        isLogin ? "Sesi login Anda telah aktif." : "Akun Anda berhasil dibuat!", 
        isLogin ? "Login Berhasil" : "Registrasi Berhasil"
      );
      
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
      const errorMsg = err.message || "Gagal menyambung ke server.";
      setError(errorMsg);
      toast.error(errorMsg, "Autentikasi Gagal");
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
        {/* Header Banner */}
        <div className="bg-indigo-600 text-white px-6 py-8 text-center relative">
          <div className="absolute top-3 right-3 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase backdrop-blur-sm">
            KERJASANA PORTAL
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Selamat Datang</h2>
          <p className="text-indigo-100 text-xs mt-1 leading-relaxed">
            {isLogin 
              ? "Masuk untuk mengelola lowongan & lamaran kerja Anda" 
              : "Daftar akun baru untuk mulai mencari kerja atau rekrutmen"}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => handleTabSwitch(true)}
            className={`flex-1 py-3.5 text-center text-sm font-semibold transition-all ${
              isLogin 
                ? "text-indigo-600 border-b-2 border-indigo-600 font-bold bg-white" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch(false)}
            className={`flex-1 py-3.5 text-center text-sm font-semibold transition-all ${
              !isLogin 
                ? "text-indigo-600 border-b-2 border-indigo-600 font-bold bg-white" 
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

          {/* Input Nama Lengkap (Hanya Registrasi) */}
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
                  disabled={isLoading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all disabled:bg-slate-50"
                  placeholder="Contoh: HRD Tokopedia atau Budi Setiawan"
                />
              </div>
            </div>
          )}

          {/* Input Email */}
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
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all disabled:bg-slate-50"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          {/* Input Password dengan Toggle Visibilitas */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 transition-all disabled:bg-slate-50"
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

     

{/* ✅ SESUDAH (Hanya Pelamar & HRD / Owner + grid-cols-2): */}
{!isLogin && (
  <div>
    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
      Mendaftar Sebagai
    </label>
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setRole("CANDIDATE")}
        className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
          role === "CANDIDATE"
            ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold shadow-sm"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        <User className="w-3.5 h-3.5 text-emerald-600" />
        Pelamar
      </button>

      <button
        type="button"
        disabled={isLoading}
        onClick={() => setRole("USER")}
        className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
          role === "USER"
            ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-sm"
            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
        }`}
      >
        <User className="w-3.5 h-3.5 text-indigo-600" />
        HRD / Owner
      </button>
    </div>
  </div>
)}

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl mt-2 transition-all shadow-md shadow-indigo-600/10 active:translate-y-[1px] flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading 
              ? "Sedang Memproses..." 
              : isLogin 
                ? "Masuk Ke Portal" 
                : "Daftar Akun Sekarang"}
          </button>
        </form>

              
      </div>
    </div>
  );
}