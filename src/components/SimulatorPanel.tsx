/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Play, RotateCcw, ShieldCheck, UserCheck, Calendar, Info, Sparkles, CheckCircle2, FileSearch, Award, Search, AlertTriangle, ArrowRight } from "lucide-react";
import { User, Job } from "../types";

interface SimulatorPanelProps {
  currentUser: User | null;
  onSelectUser: (email: string, pass: string) => void;
  onTriggerCron: () => Promise<{ expiredCount: number; updatedJobs: string[] }>;
  onBackdateJob: (jobId: string, daysAgo: number) => Promise<void>;
  jobs: Job[];
}

export default function SimulatorPanel({
  currentUser,
  onSelectUser,
  onTriggerCron,
  onBackdateJob,
  jobs
}: SimulatorPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [backdateDays, setBackdateDays] = useState(35);
  const [cronResult, setCronResult] = useState<{ expiredCount: number; updatedJobs: string[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ATS Checker State
  const [atsJobDesc, setAtsJobDesc] = useState("Membutuhkan Web Developer dengan keahlian React, TypeScript, Node.js, Express, Tailwind CSS, REST API, Git, dan pemahaman database PostgreSQL/MongoDB.");
  const [atsResumeText, setAtsResumeText] = useState("Saya seorang Web Developer berpengalaman dengan React, JavaScript, HTML, CSS, Git, REST API, dan Node.js.");
  const [atsResult, setAtsResult] = useState<{
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  } | null>(null);

  const handleRunCron = async () => {
    setIsLoading(true);
    setCronResult(null);
    setMsg("");
    try {
      const res = await onTriggerCron();
      setCronResult(res);
      setMsg("Cron job auto-expire berhasil dijalankan secara manual!");
    } catch (e) {
      setMsg("Gagal menjalankan cron job.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyBackdate = async () => {
    if (!selectedJobId) {
      setMsg("Silakan pilih lowongan yang ingin di-backdate.");
      return;
    }
    setIsLoading(true);
    setMsg("");
    try {
      await onBackdateJob(selectedJobId, backdateDays);
      setMsg(`Sukses! Tanggal pembuatan loker berhasil dimundurkan ${backdateDays} hari yang lalu.`);
    } catch (e) {
      setMsg("Gagal melakukan backdate.");
    } finally {
      setIsLoading(false);
    }
  };

  // Algoritma Analisis ATS Resume Matcher
  const handleCalculateAts = () => {
    if (!atsJobDesc || !atsResumeText) return;

    // Tokenisasi kata kunci utama (abaikan kata sambung umum)
    const stopWords = new Set(["dan", "dengan", "yang", "untuk", "di", "ke", "atau", "pada", "dalam", "bisa", "adalah", "sebagai", "minimal", "pengalaman", "dengan", "serta", "saja"]);
    
    const extractWords = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9#+.]/gi, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));
    };

    const jobKeywords = Array.from(new Set(extractWords(atsJobDesc)));
    const resumeWords = new Set(extractWords(atsResumeText));

    const matched: string[] = [];
    const missing: string[] = [];

    jobKeywords.forEach((kw) => {
      if (resumeWords.has(kw)) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    });

    const score = jobKeywords.length > 0 
      ? Math.round((matched.length / jobKeywords.length) * 100) 
      : 0;

    setAtsResult({
      score: Math.min(100, Math.max(10, score)),
      matchedKeywords: matched.slice(0, 10),
      missingKeywords: missing.slice(0, 10)
    });
  };

  const activeJobs = jobs.filter((j) => j.status === "ACTIVE");

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
      {/* Header Panel */}
      <div className="bg-slate-800 px-5 py-4 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <div>
            <h3 className="font-bold text-sm text-slate-50 uppercase tracking-wider">
              System Simulator (Developer Sandbox)
            </h3>
            <p className="text-[11px] text-slate-400">
              Gunakan panel ini untuk menguji workflow sistem & ATS Resume Checker secara real-time.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[11px] font-mono font-medium px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
        >
          {isOpen ? "Sembunyikan" : "Tampilkan"}
        </button>
      </div>

      {isOpen && (
        <div className="p-5 space-y-6">
          {/* 1. Fast Role Swapper */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              1. Jalur Cepat Ganti Peran (Role Swapper)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Login instan ke akun demo untuk menguji peran sebagai <strong>Pelamar (Candidate)</strong>, <strong>Pemberi Kerja</strong>, atau <strong>Admin</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => onSelectUser("rian.candidate@gmail.com", "candidate123")}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  currentUser?.email === "rian.candidate@gmail.com"
                    ? "bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/20"
                    : "bg-slate-800/60 border-slate-700 hover:border-slate-600 text-slate-300"
                }`}
              >
                <div className="w-6 h-6 rounded bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  PL
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold leading-tight truncate">Pelamar (Kandidat)</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">rian.candidate@gmail.com</div>
                </div>
              </button>

              <button
                onClick={() => onSelectUser("budi@tokopedia.com", "owner123")}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  currentUser?.email === "budi@tokopedia.com"
                    ? "bg-indigo-950/40 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-950/20"
                    : "bg-slate-800/60 border-slate-700 hover:border-slate-600 text-slate-300"
                }`}
              >
                <div className="w-6 h-6 rounded bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                  PK
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold leading-tight truncate">Pemberi Kerja (HRD)</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">budi@tokopedia.com</div>
                </div>
              </button>

              <button
                onClick={() => onSelectUser("admin@kerjasana.com", "admin123")}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  currentUser?.email === "admin@kerjasana.com"
                    ? "bg-amber-950/40 border-amber-500 text-amber-200 shadow-md shadow-amber-950/20"
                    : "bg-slate-800/60 border-slate-700 hover:border-slate-600 text-slate-300"
                }`}
              >
                <div className="w-6 h-6 rounded bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                  AD
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold leading-tight truncate">Administrator</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">admin@kerjasana.com</div>
                </div>
              </button>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* 2. Simulator ATS Resume Checker */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileSearch className="w-4 h-4 text-emerald-400" />
              2. Simulasi ATS Resume Checker (Kesesuaian CV)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uji ketepatan kata kunci CV pelamar terhadap deskripsi lowongan kerja untuk menghitung skor kelolosan ATS (Applicant Tracking System).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">Persyaratan & Deskripsi Loker:</label>
                <textarea
                  value={atsJobDesc}
                  onChange={(e) => setAtsJobDesc(e.target.value)}
                  className="w-full h-20 text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Paste deskripsi pekerjaan / kualifikasi..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">Ringkasan CV Pelamar:</label>
                <textarea
                  value={atsResumeText}
                  onChange={(e) => setAtsResumeText(e.target.value)}
                  className="w-full h-20 text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Paste isi CV / ringkasan keahlian pelamar..."
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculateAts}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Hitung Skor ATS Resume
            </button>

            {atsResult && (
              <div className="p-3.5 bg-slate-800/90 rounded-xl border border-slate-700 space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">Skor Kesesuaian ATS:</span>
                  <span className={`px-3 py-1 rounded-full font-black text-xs ${
                    atsResult.score >= 70
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : atsResult.score >= 40
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}>
                    {atsResult.score}% ATS Match
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      atsResult.score >= 70 ? "bg-emerald-500" : atsResult.score >= 40 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${atsResult.score}%` }}
                  />
                </div>

                {/* Kata kunci yang cocok */}
                {atsResult.matchedKeywords.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400">Kata Kunci Cocok Terdeteksi:</span>
                    <div className="flex flex-wrap gap-1">
                      {atsResult.matchedKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-[10px]">
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rekomendasi Kata Kunci Tambahan */}
                {atsResult.missingKeywords.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-700">
                    <span className="text-[11px] font-bold text-amber-400">Disarankan Ditambahkan ke CV Anda:</span>
                    <div className="flex flex-wrap gap-1">
                      {atsResult.missingKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-950/60 border border-amber-800 text-amber-300 rounded text-[10px]">
                          + {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <hr className="border-slate-800" />

          {/* 3. Time Travel Backdate */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-400" />
              3. Simulasi Perjalanan Waktu (Backdate Loker)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pilih loker <strong>ACTIVE</strong> saat ini dan mundurkan tanggal pembuatannya ke masa lalu (misal: 35 hari yang lalu) untuk melampaui masa berlaku 30 hari.
            </p>
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Pilih Lowongan Kerja Aktif:
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Pilih Lowongan Kerja --</option>
                  {activeJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      [{j.company}] {j.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Dimundurkan Sebesar:
                  </label>
                  <input
                    type="number"
                    value={backdateDays}
                    onChange={(e) => setBackdateDays(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                    placeholder="Contoh: 35"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyBackdate}
                  disabled={isLoading || !selectedJobId}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1.5"
                >
                  Terapkan Backdate
                </button>
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* 4. Trigger Cron Job */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-4 h-4 text-amber-400" />
              4. Jalankan Cron Auto-Expire Loker 30 Hari
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jalankan script cron-job secara manual. Cron-job akan menyisir seluruh lowongan aktif, dan secara otomatis mengubah statusnya menjadi <strong>EXPIRED</strong> jika usianya telah melebihi 30 hari.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleRunCron}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition-all active:translate-y-[1px]"
              >
                <RotateCcw className="w-4 h-4" />
                Jalankan Cron Job Auto-Expire Sekarang
              </button>
            </div>

            {/* Hasil Cron */}
            {cronResult && (
              <div className="mt-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Pemeriksaan Selesai!
                </div>
                <p className="text-slate-300 font-medium">
                  Jumlah lowongan kedaluwarsa: <span className="font-bold text-white text-sm">{cronResult.expiredCount}</span>
                </p>
                {cronResult.expiredCount > 0 ? (
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">Loker yang berubah status menjadi EXPIRED:</span>
                    <ul className="list-disc pl-4 text-slate-300 mt-1 space-y-0.5">
                      {cronResult.updatedJobs.map((title, i) => (
                        <li key={i}>{title}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-slate-400 text-[11px]">
                    Tidak ada lowongan aktif yang berusia di atas 30 hari. Gunakan fitur <strong>Backdate Loker</strong> di atas terlebih dahulu, kemudian jalankan kembali cron ini!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Toast / Message banner */}
          {msg && (
            <div className="p-3 bg-slate-800 border-l-4 border-amber-500 text-amber-200 rounded-r-lg text-xs font-medium leading-relaxed">
              {msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

