import React, { useState } from "react";
import { Sparkles, ShieldCheck, Zap, X, CheckCircle2, Loader2, Award } from "lucide-react";
import { Job } from "../types";
import { useToast } from "../context/ToastContext";

interface UpgradeFeaturedModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UpgradeFeaturedModal({
  job,
  isOpen,
  onClose,
  onSuccess
}: UpgradeFeaturedModalProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !job) return null;

  const handlePay = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          jobId: job.id,
          paymentType: "FEATURED_JOB",
          amount: 50000
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          "Pemberitahuan Demo: Fitur Premium/Featured Job Berhasil Diaktifkan Tanpa Pemotongan Saldo!",
          "Loker Prioritas Aktif"
        );
        window.dispatchEvent(new Event("refresh-jobs"));
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Gagal memproses pembayaran.", "Pembayaran Gagal");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan jaringan saat memproses pembayaran.", "Koneksi Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-amber-200 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative">
        {/* Header Background */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 text-white border border-white/30 shadow-inner">
            <Award className="w-7 h-7 text-yellow-200" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-yellow-400 text-slate-900 uppercase tracking-wider shadow-sm mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Sorotan Prioritas (14 Hari)
          </span>

          <h3 className="text-xl font-extrabold text-white">
            Upgrade ke Featured Job
          </h3>
          <p className="text-xs text-amber-100 mt-1 leading-relaxed">
            Posisikan lowongan kerja Anda di paling atas beranda dengan Badge Emas Eksklusif.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Information Detail Job */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Lowongan Dipilih:
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">{job.title}</div>
            <div className="text-xs text-slate-600 truncate">{job.company} • {job.location}</div>
          </div>

          {/* Benefits */}
          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span><strong>Tampil di Posisi Paling Atas</strong> pada pencarian dan beranda.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span><strong>Lencana Emas Prioritas ⭐</strong> untuk menarik 5x lebih banyak pelamar berkualitas.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Masa aktif status Featured selama <strong>14 Hari Penuh</strong>.</span>
            </div>
          </div>

          {/* Dry Run / Bypass Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold">Simulasi Mode (Dry-Run):</span>
              <p className="mt-0.5 text-amber-800">
                Sistem berjalan dalam mode <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">PAYMENT_BYPASS=true</code>. Klik bayar untuk mengaktifkan status Featured secara instan gratis tanpa biaya nyata!
              </p>
            </div>
          </div>

          {/* Price Breakdown & Pay Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Pembayaran</div>
              <div className="text-xl font-black text-slate-900">
                Rp 50.000 <span className="text-xs font-semibold text-slate-500">/ 14 hari</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={isLoading}
              className="py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Bayar Sekarang
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
