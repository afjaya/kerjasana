/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, ArrowRight, KeyRound, Sparkles } from "lucide-react";
import { User as UserType } from "../types";
import { useToast } from "../context/ToastContext";

interface AdminLoginProps {
  onLoginSuccess: (token: string, user: UserType) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("admin@kerjasana.com");
  const [password, setPassword] = useState("AdminKerjasana2026!");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password Admin wajib diisi.", "Otentikasi Gagal");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Akses Admin ditolak.");
      }

      if (data.user?.role !== "ADMIN") {
        throw new Error("Akses ditolak. Akun Anda bukan Super Admin.");
      }

      onLoginSuccess(data.token, data.user);
      toast.success("Selamat datang di Panel Moderasi Admin Kerjasana!", "Otentikasi Berhasil");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Gagal masuk sebagai Super Admin.", "Akses Ditolak");
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail("admin@kerjasana.com");
    setPassword("AdminKerjasana2026!");
    toast.info("Kredensial Super Admin berhasil dimasukkan.", "Auto-fill Admin");
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-0">
      <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Security Glow Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="text-center space-y-3 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-rose-600/20 border border-white/10">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700/80 text-[11px] font-bold text-rose-400">
              <KeyRound className="w-3.5 h-3.5" />
              PORTAL RAHASIA SUPER ADMIN
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Sistem Moderasi Central
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Masukkan kredensial otorisasi terenkripsi untuk mengelola platform
            </p>
          </div>
        </div>

        {/* Form Login Admin */}
        <form onSubmit={handleAdminLoginSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Email Khusus Admin
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kerjasana.com"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Sandi Enkripsi Admin
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Otentikasi & Buka Dashboard Admin
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Admin Credential Preset */}
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-2 relative z-10 text-xs">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400">
            <span className="flex items-center gap-1 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              Default Admin Credential (Seed)
            </span>
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
            >
              Gunakan
            </button>
          </div>
          <div className="text-[11px] font-mono bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-slate-300 space-y-0.5">
            <div>Email: <span className="text-emerald-400 font-bold">admin@kerjasana.com</span></div>
            <div>Pass: <span className="text-amber-400 font-bold">AdminKerjasana2026!</span></div>
          </div>
        </div>

        {/* Footer Warning */}
        <p className="text-[10px] text-center text-slate-500 font-semibold relative z-10">
          ⚠️ Halaman ini khusus untuk Tim Internal Moderasi Kerjasana.com.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
