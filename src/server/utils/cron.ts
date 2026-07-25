/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import cron from "node-cron";
import { Database } from "../db";

// Menyimpan referensi ke instance cron job agar bisa dipantau/dihentikan jika perlu
let jobInstance: any = null;

export function initCronJobs() {
  console.log("[CRON] Menginisialisasi sistem cron auto-expire...");

  // Konfigurasi standar produksi: Berjalan setiap hari pada pukul 00:00 (tengah malam)
  // '0 0 * * *'
  // Untuk keperluan demo/pengujian interaktif, kita set setiap jam atau bisa dipicu via simulator
  const cronSchedule = "0 * * * *"; // Setiap jam sekali

  try {
    const job = cron.schedule(cronSchedule, async () => {
      console.log("[CRON] Menjalankan pengecekan otomatis lowongan kedaluwarsa...");
      const { expiredCount, updatedJobs } = await Database.runAutoExpire();
      
      if (expiredCount > 0) {
        console.log(`[CRON] Sukses! ${expiredCount} lowongan telah kedaluwarsa secara otomatis.`);
        console.log(`[CRON] Daftar lowongan expired: ${updatedJobs.join(", ")}`);
      } else {
        console.log("[CRON] Tidak ada lowongan aktif yang kedaluwarsa saat ini.");
      }
    });

    jobInstance = job;
    console.log(`[CRON] Cron Job aktif dengan jadwal: "${cronSchedule}"`);
  } catch (error) {
    console.error("[CRON] Gagal menginisialisasi cron-job:", error);
  }
}

export function getCronStatus() {
  return {
    isActive: jobInstance !== null,
    schedule: "0 * * * * (Setiap jam sekali)",
    description: "Memeriksa & memperbarui lowongan 'ACTIVE' yang telah melewati 30 hari menjadi 'EXPIRED'."
  };
}
