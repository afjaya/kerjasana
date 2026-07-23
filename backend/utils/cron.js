/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLUEPRINT: backend/utils/cron.js
 * Cron Job otomatis menggunakan node-cron untuk mengubah status loker
 * dari ACTIVE menjadi EXPIRED setelah 30 hari.
 */

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Menginisialisasi tugas terjadwal (Cron Job) untuk auto-expire.
 */
function initCronJobs() {
  console.log("[CRON-JOB] Menginisialisasi tugas terjadwal auto-expire...");

  // Konfigurasi Jadwal: Berjalan setiap hari pada pukul 00:00 (Tengah Malam)
  // Format: menit(0-59) jam(0-23) hari(1-31) bulan(1-12) hari-dalam-seminggu(0-6)
  const cronSchedule = "0 0 * * *";

  cron.schedule(cronSchedule, async () => {
    console.log("[CRON-JOB] Mulai memindai lowongan yang melewati masa berlaku 30 hari...");
    const now = new Date();

    try {
      // Cari dan update loker yang:
      // 1. Berstatus ACTIVE
      // 2. Kolom expiresAt bernilai kurang dari waktu sekarang (now)
      const result = await prisma.job.updateMany({
        where: {
          status: "ACTIVE",
          expiresAt: {
            lt: now
          }
        },
        data: {
          status: "EXPIRED"
        }
      });

      if (result.count > 0) {
        console.log(`[CRON-JOB] Sukses! Sebanyak ${result.count} lowongan telah kedaluwarsa secara otomatis.`);
      } else {
        console.log("[CRON-JOB] Pengecekan selesai. Tidak ada lowongan aktif yang kedaluwarsa hari ini.");
      }
    } catch (error) {
      console.error("[CRON-JOB] Gagal memproses pembaruan kedaluwarsa otomatis:", error);
    }
  });

  console.log(`[CRON-JOB] Scheduler aktif dengan pola: "${cronSchedule}" (Setiap tengah malam)`);
}

module.exports = {
  initCronJobs
};
