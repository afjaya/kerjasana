/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLUEPRINT: backend/server.js
 * Entrypoint utama untuk server backend produksi dalam arsitektur Monorepo.
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const jobRoutes = require('./routes/jobRoutes');
const { initCronJobs } = require('./utils/cron');
const { Database } = require('./db'); // 🟢 Tambahkan import Database jika dipanggil di sini

// Muat variabel lingkungan
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rute API Utama
app.use('/api', jobRoutes);

// 🟢 ==========================================
// 1. ENDPOINT VERIFIKASI EMAIL (GET)
// 🟢 ==========================================
app.get('/api/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ 
        error: "Token verifikasi email tidak ditemukan atau tautan tidak lengkap." 
      });
    }

    const user = await Database.verifyEmailToken(token);

    return res.status(200).json({
      message: "Email Anda berhasil diverifikasi!",
      user,
    });
  } catch (error) {
    return res.status(400).json({ 
      error: error.message || "Terjadi kesalahan saat memverifikasi token email." 
    });
  }
});

// 🟢 ==========================================
// 2. ENDPOINT RESEND VERIFIKASI EMAIL (POST)
// 🟢 ==========================================
app.post('/api/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email wajib diisi." });
    }

    await Database.resendVerificationEmail(email);

    return res.status(200).json({
      message: "Link verifikasi baru telah dikirimkan ke email Anda.",
    });
  } catch (error) {
    return res.status(400).json({ 
      error: error.message || "Gagal mengirimkan ulang link verifikasi." 
    });
  }
});

// Jalankan Sistem Cron untuk Auto-Expire (Setiap tengah malam)
initCronJobs();

// Handler kesehatan server dasar
app.get('/health', (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "kerjasana-backend" 
  });
});

// Menangani rute tidak terdefinisi (404)
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint API tidak ditemukan." });
});

// Booting Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 BACKEND KERJASANA.COM TELAH AKTIF`);
  console.log(`   Berjalan di port: http://0.0.0.0:${PORT}`);
  console.log(`   DBMS            : PostgreSQL via Prisma ORM`);
  console.log(`   Cron-Job        : Aktif (Auto-Expire 30 Hari)`);
  console.log(`=======================================================`);
});