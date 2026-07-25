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
const { Database } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint Verifikasi Email
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
      message: "Email Anda berhasil diverifikasi! Silakan login.",
      user,
    });
  } catch (error) {
    return res.status(400).json({ 
      error: error.message || "Terjadi kesalahan saat memverifikasi token email." 
    });
  }
});

// Handler Logika Kirim Ulang Email Verifikasi
const handleResendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email wajib diisi." });
    }

    console.log(`[RESEND] Menerima request kirim ulang untuk: ${email}`);

    // Set timeout 10 detik agar tidak muter-muter tanpa kepastian
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Pengiriman email timeout/terlalu lama. Periksa koneksi SMTP.")), 10000)
    );

    // Jalankan pengiriman email dengan batas waktu
    await Promise.race([
      Database.resendVerificationEmail(email),
      timeoutPromise
    ]);

    console.log(`[RESEND SUCCESS] Email verifikasi berhasil dikirim ke: ${email}`);

    return res.status(200).json({
      message: "Link verifikasi baru telah dikirimkan ke email Anda.",
    });

  } catch (error) {
    console.error("[RESEND VERIFICATION ERROR]:", error.message);
    return res.status(400).json({ 
      error: error.message || "Gagal mengirimkan ulang link verifikasi." 
    });
  }
};

app.post('/api/resend-verification', handleResendVerification);
app.post('/api/auth/resend-verification', handleResendVerification);

// Rute API Utama (termasuk Auth & Jobs)
app.use('/api', jobRoutes);

// Cron Job Auto-Expire
initCronJobs();

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "kerjasana-backend" 
  });
});

// Handler 404
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