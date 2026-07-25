/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserCheck, Building2, User, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, MailCheck, RefreshCw, AlertCircle } from "lucide-react";
import { User as UserType } from "../types";
import { useToast } from "../context/ToastContext";

interface LoginProps {
  onLoginSuccess: (token: string, user: UserType) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  // Default active role choice is strictly between APPLICANT and HRD (NO ADMIN option!)
  const [selectedRole, setSelectedRole] = useState<"APPLICANT" | "HRD">("APPLICANT");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State notifikasi verifikasi email
  const [verificationNotice, setVerificationNotice] = useState<{ email: string; message: string } | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const handleResendLink = async (emailToResend: string) => {
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToResend })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirimkan ulang link verifikasi.");
      }

      toast.success(data.message || "Link verifikasi baru telah dikirimkan!", "Terkirim");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirimkan link verifikasi.", "Error");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegisterMode && !name)) {
      toast.error("Mohon lengkapi seluruh kolom formulir.", "Validasi Gagal");
      return;
    }

    setIsLoading(true);
    setVerificationNotice(null);

    try {
      const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegisterMode
        ? { name, email, password, role: selectedRole }
        : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          setVerificationNotice({ email: data.email || email, message: data.error });
        }
        throw new Error(data.error || "Gagal memproses otentikasi.");
      }

      // Jika registrasi memerlukan verifikasi email
      if (isRegisterMode && data.needsVerification) {
        setVerificationNotice({
          email: data.user?.email || email,
          message: data.message || "Registrasi berhasil! Silakan periksa inbox email Anda untuk memverifikasi akun."
        });
        toast.info("Link verifikasi email telah dikirimkan ke email Anda.", "Cek Email");
        setIsRegisterMode(false);
        return;
      }

      // Simpan token & panggil handler
      onLoginSuccess(data.token, data.user);

      toast.success(
        isRegisterMode ? "Registrasi berhasil! Selamat datang." : "Login berhasil!",
        "Sukses"
      );

      // Redirect otomatis sesuai role yang dikembalikan
      if (data.user.role === "ADMIN") {
        navigate("/admin");
      } else if (data.user.role === "HRD" || data.user.role === "USER") {
        navigate("/submit");
      } else {
        navigate("/candidate");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan pada koneksi server.", "Login Gagal");
    } finally {
      setIsLoading(false);
    }
  };

  // Preset demo login instan untuk memudahkan penguji
  const fillPreset = (roleType: "APPLICANT" | "HRD") => {
    setSelectedRole(roleType);
    setIsRegisterMode(false);
    if (roleType === "APPLICANT") {
      setEmail("rian.candidate@gmail.com");
      setPassword("candidate123");
    } else {
      setEmail("budi@tokopedia.com");
      setPassword("owner123");
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 px-4 sm:px-0">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className={`h-2 -mx-8 -mt-8 ${selectedRole === "APPLICANT" ? "bg-emerald-600" : "bg-indigo-600"}`} />

        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Portal Otentikasi Publik Kerjasana.com
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {isRegisterMode ? "Buat Akun Baru" : "Masuk ke Akun Anda"}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isRegisterMode
              ? "Pilih kategori pendaftaran dan lengkapi data profil Anda"
              : "Akses dashboard pencarian kerja atau manajemen lowongan kerja"}
          </p>
        </div>

        {/* Tab Selector Role (STRICTLY ONLY APPLICANT & HRD - NO ADMIN) */}
        <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedRole("APPLICANT")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedRole === "APPLICANT"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Pelamar Kerja
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("HRD")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedRole === "HRD"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Perusahaan / HRD
          </button>
        </div>

        {/* Banner Notifikasi Verifikasi Email jika pendaftaran sukses atau akun belum diverifikasi */}
        {verificationNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5 animate-fade-in text-left">
            <div className="flex items-start gap-2.5">
              <MailCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                  Tautan Verifikasi Email Dikirimkan ✉️
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Kami telah mengirimkan link verifikasi ke <strong className="font-bold underline">{verificationNotice.email}</strong>.
                  Silakan periksa inbox/spam email Anda dan klik link tersebut untuk mengaktifkan akun.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-emerald-700">Belum menerima email?</span>
              <button
                type="button"
                onClick={() => handleResendLink(verificationNotice.email)}
                disabled={resendLoading}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${resendLoading ? "animate-spin" : ""}`} />
                <span>{resendLoading ? "Mengirim..." : "Kirim Ulang Email"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Form Otentikasi */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {selectedRole === "HRD" ? "Nama Penanggung Jawab / HRD" : "Nama Lengkap Pelamar"}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={selectedRole === "HRD" ? "Contoh: Budi Setiawan" : "Contoh: Rian Pratama"}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Alamat Email Resmi
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={selectedRole === "HRD" ? "hrd@perusahaan.com" : "nama@email.com"}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Kata Sandi / Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 px-4 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
              selectedRole === "APPLICANT"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isRegisterMode ? "Daftar Akun Sekarang" : "Masuk ke Dashboard"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode Register / Login */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {isRegisterMode ? (
              <span>Sudah memiliki akun? <strong className="text-emerald-600 hover:underline">Masuk di sini</strong></span>
            ) : (
              <span>Belum punya akun? <strong className="text-emerald-600 hover:underline">Daftar sekarang</strong></span>
            )}
          </button>
        </div>

        {/* Preset Akun Demo Cepat */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Coba Akun Demo Cepat:
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillPreset("APPLICANT")}
              className="flex-1 py-1.5 px-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg font-bold text-[11px] text-slate-700 hover:text-emerald-700 transition-all cursor-pointer"
            >
              Demo Pelamar (Rian)
            </button>
            <button
              type="button"
              onClick={() => fillPreset("HRD")}
              className="flex-1 py-1.5 px-2 bg-white border border-slate-200 hover:border-indigo-500 rounded-lg font-bold text-[11px] text-slate-700 hover:text-indigo-700 transition-all cursor-pointer"
            >
              Demo HRD (Tokopedia)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
