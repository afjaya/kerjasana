/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import jobRoutes from "./src/server/routes/jobRoutes";
import candidateRoutes from "./src/server/routes/candidateRoutes";
import paymentRoutes from "./src/server/routes/paymentRoutes";
import reportRoutes from "./src/server/routes/reportRoutes";
import { initCronJobs } from "./src/server/utils/cron";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware penting untuk parsing JSON body
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Kesehatan dasar
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      service: "Kerjasana API Backend" 
    });
  });

  // Pasang router lowongan kerja, kandidat, pembayaran, laporan, dan autentikasi
  app.use("/api", jobRoutes);
  app.use("/api", candidateRoutes);
  app.use("/api", paymentRoutes);
  app.use("/api", reportRoutes);

  // Inisialisasi Sistem Cron Jobs untuk Auto-Expire lowongan 30 hari
  initCronJobs();

  // Integrasi Vite middleware untuk pengembangan & penyajian file statis di produksi
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Berjalan dalam mode PENGEMBANGAN (Development). Menyambungkan middleware Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Berjalan dalam mode PRODUKSI (Production). Menyajikan file statis dari folder dist/...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Fallback rute Express ke index.html untuk Single Page Application routing (SPA)
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=============================================================`);
    console.log(`🚀 SERVER KERJASANA.COM TELAH AKTIF`);
    console.log(`   Berjalan pada: http://localhost:${PORT}`);
    console.log(`   Teknologi  : Node.js, Express, JWT, node-cron, React-Vite`);
    console.log(`=============================================================`);
  });
}

startServer();
