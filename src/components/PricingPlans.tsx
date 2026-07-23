import React, { useState } from "react";
import { Check, Zap, Sparkles, ShieldCheck, Loader2, Star, Building, ArrowRight, HelpCircle } from "lucide-react";
import { User } from "../types";
import { useToast } from "../context/ToastContext";

interface PricingPlansProps {
  user: User | null;
  onPlanUpdated?: () => void;
}

export default function PricingPlans({ user, onPlanUpdated }: PricingPlansProps) {
  const toast = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const currentPlan = user?.subscriptionPlan || "FREE";
  const quota = user?.jobPostingQuota ?? 2;

  const handleCheckoutPlan = async (planType: "SUBSCRIPTION_PRO" | "SUBSCRIPTION_ENTERPRISE", amount: number) => {
    if (!user) {
      toast.warning("Silakan masuk sebagai Pemberi Kerja terlebih dahulu.", "Autentikasi Diperlukan");
      return;
    }

    setLoadingPlan(planType);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          paymentType: planType,
          amount
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          "Pemberitahuan Demo: Fitur Premium/Featured Job Berhasil Diaktifkan Tanpa Pemotongan Saldo!",
          "Paket Langganan Berhasil Ditambahkan"
        );
        if (onPlanUpdated) {
          onPlanUpdated();
        }
        window.dispatchEvent(new Event("refresh-jobs"));
      } else {
        toast.error(data.error || "Gagal memperbarui paket langganan.", "Gagal");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan jaringan saat memproses langganan.", "Error");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
          <Zap className="w-3.5 h-3.5 text-indigo-600" /> Khusus Pemberi Kerja (HRD & Owner)
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pilih Paket Langganan Loker
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Temukan talenta terbaik dengan cepat. Pelamar <strong className="text-emerald-600">100% GRATIS</strong> melamar kerja tanpa biaya apapun.
        </p>

        {user && (
          <div className="pt-2">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-900 text-white rounded-2xl text-xs font-semibold shadow-md">
              <span>Paket Saat Ini: <strong className="text-indigo-400 uppercase">{currentPlan}</strong></span>
              <span className="w-1 h-1 bg-slate-700 rounded-full" />
              <span>Sisa Kuota Posting: <strong className="text-emerald-400">{quota} Loker</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* FREE PLAN */}
        <div className={`bg-white border rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
          currentPlan === "FREE" ? "border-slate-400 shadow-md ring-2 ring-slate-400/20" : "border-slate-200 hover:border-slate-300"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Starter</span>
              {currentPlan === "FREE" && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Paket Aktif
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-900">FREE</h3>
            <p className="text-xs text-slate-500 mt-1">Cocok untuk UMKM & Usaha Lokal pemula.</p>

            <div className="my-6">
              <span className="text-3xl font-black text-slate-900">Rp 0</span>
              <span className="text-xs text-slate-500 font-medium"> / bulan</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>2 Kuota Posting Loker</strong> / bulan</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Masa tayang 30 hari otomatis</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Dasbor manajemen pelamar dasar</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Notifikasi email otomatis</span>
              </li>
            </ul>
          </div>

          <button
            disabled={true}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed bg-slate-50 text-center"
          >
            {currentPlan === "FREE" ? "Paket Aktif Anda" : "Paket Dasar"}
          </button>
        </div>

        {/* PRO PLAN (RECOMMENDED) */}
        <div className={`bg-gradient-to-b from-indigo-900 to-slate-900 border rounded-3xl p-6 flex flex-col justify-between text-white shadow-xl relative overflow-hidden ${
          currentPlan === "PRO" ? "border-indigo-400 ring-4 ring-indigo-500/30" : "border-indigo-800"
        }`}>
          {/* Badge Terpopuler */}
          <div className="absolute top-0 right-0">
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 text-[10px] font-black uppercase tracking-wider py-1 px-4 rounded-bl-2xl shadow-md flex items-center gap-1">
              <Star className="w-3 h-3 fill-slate-900" /> Paling Populer
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Professional</span>
              {currentPlan === "PRO" && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Paket Aktif
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              PRO PLAN <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-indigo-200 mt-1">Solusi ideal untuk bisnis berkembang yang butuh rekrutmen cepat.</p>

            <div className="my-6">
              <span className="text-3xl font-black text-white">Rp 150.000</span>
              <span className="text-xs text-indigo-300 font-medium"> / paket</span>
            </div>

            <ul className="space-y-3 text-xs text-indigo-100 mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>10 Kuota Posting Loker Tambahan</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Status <strong>Prioritas / Featured Job</strong> (Gratis 1 Loker)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Fitur Screening Pelamar Berbasis ATS Matcher</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Dukungan Pelayanan HRD Prioritas</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckoutPlan("SUBSCRIPTION_PRO", 150000)}
            disabled={loadingPlan !== null}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingPlan === "SUBSCRIPTION_PRO" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses Demo...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                {currentPlan === "PRO" ? "Beli Tambahan Kuota PRO" : "Pilih Paket PRO (Rp 150rb)"}
              </>
            )}
          </button>
        </div>

        {/* ENTERPRISE PLAN */}
        <div className={`bg-white border rounded-3xl p-6 flex flex-col justify-between transition-all ${
          currentPlan === "ENTERPRISE" ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Enterprise</span>
              {currentPlan === "ENTERPRISE" && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Paket Aktif
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
              ENTERPRISE <Building className="w-4 h-4 text-emerald-600" />
            </h3>
            <p className="text-xs text-slate-500 mt-1">Untuk perusahaan besar dan agency rekrutmen masif.</p>

            <div className="my-6">
              <span className="text-3xl font-black text-slate-900">Rp 450.000</span>
              <span className="text-xs text-slate-500 font-medium"> / paket</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-700 mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>50 Kuota Posting Loker Tambahan</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong>5 Loker Featured Prioritas</strong> Paling Atas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Akses Penuh Database Resume Pelamar</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Account Manager Khusus & Support 24/7</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckoutPlan("SUBSCRIPTION_ENTERPRISE", 450000)}
            disabled={loadingPlan !== null}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingPlan === "SUBSCRIPTION_ENTERPRISE" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {currentPlan === "ENTERPRISE" ? "Beli Tambahan ENTERPRISE" : "Pilih ENTERPRISE (Rp 450rb)"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Note / Disclaimer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900">Aturan Bisnis & Bebas Potongan untuk Pelamar:</span>
          <p className="text-slate-600 leading-relaxed">
            Sesuai aturan platform KERJASANA.COM, pelamar kerja (Candidate) <strong>100% GRATIS tanpa biaya tersembunyi</strong>. Pembayaran hanya berlaku bagi Pemberi Kerja yang ingin mendapatkan fitur prioritas sorotan loker dan paket kuota posting tambahan.
          </p>
        </div>
      </div>
    </div>
  );
}
