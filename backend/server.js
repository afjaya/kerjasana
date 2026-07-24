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

// Import routes
const jobRoutes = require('./routes/jobRoutes');
const authRoutes = require('./routes/authRoutes');
const { initCronJobs } = require('./utils/cron');

// Muat variabel lingkungan (.env)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE GLOBAL
// ==========================================

// Izinkan CORS dari semua origin/domain agar Frontend web tidak kena blokir
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// RUTE API UNTUK PUBLIK (TANPA MIDDLEWARE AUTH)
// ==========================================

// 1. Rute Auth (Register & Login) - BEBAS DIAKSES SIAPAPUN
app.use('/api/auth', authRoutes);

// 2. RUTE JOBS / LAINNYA
app.use('/api', jobRoutes);

// Jalankan Sistem Cron untuk Auto-Expire (Setiap tengah malam)
try {
  initCronJobs();
} catch (err) {
  console.warn("⚠️ Warning CronJob:", err.message);
}

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

// Global Error Handler (Biar server tidak langsung crash jika ada unhandled error)
app.use((err, req, res, next) => {
  console.error("🔥 Server Internal Error:", err);
  res.status(500).json({ error: "Terjadi kesalahan internal pada server.", detail: err.message });
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