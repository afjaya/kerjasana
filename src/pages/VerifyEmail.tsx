/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2, MailCheck, ArrowRight, RefreshCw, Briefcase } from "lucide-react";
import { User as UserType } from "../types";

interface VerifyEmailProps {
  onLoginSuccess?: (token: string, user: UserType) => void;
}

export default function VerifyEmail({ onLoginSuccess }: VerifyEmailProps) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [verifiedUser, setVerifiedUser] = useState<UserType | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Form resend email state
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi email tidak ditemukan atau tautan tidak lengkap.");
      return;
    }

    const verify = async () => {
      try {
        setStatus("loading");
        const res = await fetch(`/api/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Gagal memverifikasi token email.");
        }

        setStatus("success");
        setMessage(data.message || "Email Anda berhasil diverifikasi!");
        if (data.user) {
          setVerifiedUser(data.user);
        }
        if (data.token) {
          setAuthToken(data.token);
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Terjadi kesalahan saat verifikasi email.");
      }
    };

    verify();
  }, [token]);

  const handleContinue = () => {
    if (authToken && verifiedUser && onLoginSuccess) {
      onLoginSuccess(authToken, verifiedUser);
      if (verifiedUser.role === "HRD" || verifiedUser.role === "USER") {
        navigate("/submit");
      } else {
        navigate("/");
      }
    } else {
      navigate("/login");
    }
  };

  const handleResendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendMsg(null);

    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirimkan ulang link verifikasi.");
      }

      setResendMsg({ type: "success", text: data.message });
      setResendEmail("");
    } catch (err: any) {
      setResendMsg({ type: "error", text: err.message });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
        {/* Header Logo */}
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md">
            K
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Kerjasana<span className="text-emerald-600">.com</span>
          </span>
        </div>

        {/* State 1: Loading */}
        {status === "loading" && (
          <div className="space-y-4 py-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Memverifikasi Alamat Email...</h2>
              <p className="text-sm text-slate-500">
                Harap tunggu sebentar, sistem sedang melakukan validasi token verifikasi Anda.
              </p>
            </div>
          </div>
        )}

        {/* State 2: Success */}
        {status === "success" && (
          <div className="space-y-5 py-4 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <MailCheck className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Akun Terverifikasi
              </div>
              <h2 className="text-2xl font-black text-slate-900">Email Berhasil Diverifikasi! 🎉</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {message || "Selamat! Alamat email Anda telah dikonfirmasi secara resmi. Akun Anda kini aktif penuh dan siap digunakan."}
              </p>
            </div>

            {verifiedUser && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-1">
                <p className="text-xs font-semibold text-slate-500">Detail Akun Terdaftar:</p>
                <p className="text-sm font-bold text-slate-900">{verifiedUser.name}</p>
                <p className="text-xs text-slate-600 font-mono">{verifiedUser.email}</p>
                <div className="pt-1">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                    {verifiedUser.role === "HRD" || verifiedUser.role === "USER" ? "HRD / Pemberi Kerja" : "Pelamar Kerja"}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleContinue}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{authToken ? "Masuk & Lanjutkan Akses" : "Menuju Halaman Login"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State 3: Error */}
        {status === "error" && (
          <div className="space-y-6 py-2 animate-fade-in">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Verifikasi Email Gagal</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            </div>

            {/* Form Minta Ulang Verification Email */}
            <div className="pt-2 border-t border-slate-100 text-left space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" /> Kirim Ulang Link Verifikasi
              </h3>
              <p className="text-xs text-slate-500">
                Masukkan email yang Anda daftarkan di bawah ini untuk mendapatkan tautan verifikasi baru:
              </p>

              <form onSubmit={handleResendSubmit} className="space-y-2.5">
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="nama.email@domain.com"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 transition-colors"
                />

                <button
                  type="submit"
                  disabled={resendLoading || !resendEmail}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengirimkan Link...
                    </>
                  ) : (
                    "Kirimkan Link Verifikasi Baru"
                  )}
                </button>
              </form>

              {resendMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    resendMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border border-rose-200 text-rose-800"
                  }`}
                >
                  {resendMsg.text}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
              >
                &larr; Kembali ke Halaman Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
