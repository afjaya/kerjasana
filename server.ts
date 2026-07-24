/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ENTRYPOINT UTAMA SERVER FULLSTACK (EXPRESS + VITE + PRISMA + SUPABASE)
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Import Routes
import authRoutes from "./src/server/routes/authRoutes";
import jobRoutes from "./src/server/routes/jobRoutes";
import candidateRoutes from "./src/server/routes/candidateRoutes";
import paymentRoutes from "./src/server/routes/paymentRoutes";
import reportRoutes from "./src/server/routes/reportRoutes";

// Import Utilities
import { initCronJobs } from "./src/server/utils/cron";

// Load environment variables (.env)
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // ==========================================================
  // 1. MIDDLEWARE GLOBAL & CORS
  // ==========================================================
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Parsing JSON & URL-encoded Form Body
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Health Check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      service: "Kerjasana API Backend (Supabase Connected)" 
    });
  });

  // ==========================================================
  // 2. MOUNTING ROUTES (URUTAN SANGAT KRUSIAL!)
  // ==========================================================
  
  // 🔥 UTAMA: Pasang authRoutes PALING ATAS agar Register & Login
  // TIDAK TERCEGAT oleh middleware/requireAuth dari router lain!
  app.use("/api/auth", authRoutes);

  // Router API lainnya dipasang di bawah Rute Auth
  app.use("/api", jobRoutes);
  app.use("/api", candidateRoutes);
  app.use("/api", paymentRoutes);
  app.use("/api", reportRoutes);

  // ==========================================================
  // 3. CRON JOBS
  // ==========================================================
  try {
    initCronJobs();
  } catch (cronErr: any) {
    console.warn("⚠️ CronJob initialization warning:", cronErr?.message || cronErr);
  }

  // ==========================================================
  // 4. INTEGRASI MIDDLEWARE VITE (DEV vs PROD)
  // ==========================================================
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Mode: PENGEMBANGAN (Development). Menyambungkan middleware Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Mode: PRODUKSI (Production). Menyajikan file statis dari folder dist/...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Fallback rute Express ke index.html untuk Single Page Application (SPA) routing
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ==========================================================
  // 5. GLOBAL ERROR HANDLER
  // ==========================================================
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("🔥 Global Server Error:", err);
    res.status(500).json({ 
      error: "Terjadi kesalahan internal pada server.", 
      detail: err?.message || "Unknown error" 
    });
  });

  // ==========================================================
  // 6. BOOTING SERVER
  // ==========================================================
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`=============================================================`);
    console.log(`🚀 SERVER KERJASANA.COM TELAH AKTIF (SUPABASE CONNECTED)`);
    console.log(`   Berjalan pada : http://0.0.0.0:${PORT}`);
    console.log(`   Teknologi    : Express, Vite, TypeScript, Prisma, Supabase`);
    console.log(`=============================================================`);
  });
}

startServer();