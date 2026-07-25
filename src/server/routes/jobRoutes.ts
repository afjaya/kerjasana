/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Response } from "express";
import jwt from "jsonwebtoken";
import { Database } from "../db";
import { requireAuth, requireAdmin, AuthenticatedRequest } from "../middleware/authMiddleware";
import { sendApprovalNotification } from "../utils/emailService";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "kerjasana-super-secret-key-123";

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register Pemberi Kerja / User baru
router.post("/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Semua kolom input wajib diisi." });
  }

  try {
    // Role bisa diatur ke ADMIN, CANDIDATE, atau USER
    const userRole = (role === "ADMIN" || role === "CANDIDATE" || role === "USER") ? role : "USER";
    const user = Database.createUser(name, email, password, userRole);
    
    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Registrasi berhasil!",
      token,
      user
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal melakukan registrasi." });
  }
});

// Login User & Admin
router.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }

  const user = Database.findUserByEmail(email);
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: "Email atau password salah." });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: "Akun Anda telah diblokir karena pelanggaran ketentuan layanan." });
  }

  // Generate JWT Token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    message: "Login berhasil!",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// Cek profil pengguna yang sedang login
router.get("/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.user });
});


// ==========================================
// 2. PUBLIC JOB ROUTES
// ==========================================

// Ambil semua lowongan kerja ACTIVE (tayang di halaman utama) dengan filter opsional
router.get("/jobs", (req, res) => {
  const { search, location, category } = req.query;
  let jobs = Database.getActiveJobs();

  if (search) {
    const q = (search as string).toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
    );
  }

  if (location) {
    const loc = (location as string).toLowerCase();
    jobs = jobs.filter((j) => j.location.toLowerCase().includes(loc));
  }

  if (category) {
    const cat = (category as string).toLowerCase();
    jobs = jobs.filter((j) => (j.category || "Lainnya").toLowerCase() === cat);
  }

  return res.json({ jobs });
});

// ==========================================
// 3. EMPLOYER (HRD/OWNER) JOB ROUTES
// ==========================================

// Ambil daftar lowongan kerja milik user yang sedang login
router.get("/jobs/my", requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const allJobs = Database.getJobs();
  const myJobs = allJobs.filter((j) => j.postedBy === req.user!.id);
  
  return res.json({ jobs: myJobs });
});

// Ambil detail lowongan kerja tertentu (Mendukung /api/jobs/:id dan /api/jobs/detail/:id)
const getJobDetailHandler = (req: express.Request, res: express.Response) => {
  const rawId = req.params.id;
  const job = Database.findJobById(rawId);
  if (!job) {
    return res.status(404).json({ error: "Lowongan kerja tidak ditemukan." });
  }
  return res.json({ job });
};

router.get("/jobs/detail/:id", getJobDetailHandler);
router.get("/jobs/:id", getJobDetailHandler);

// Membatalkan / Menghapus lowongan kerja milik HRD sendiri
router.delete("/jobs/my/:id", requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const job = Database.findJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ error: "Lowongan kerja tidak ditemukan." });
  }

  // Hak akses: hanya pembuat lowongan atau admin yang berhak menghapus
  if (job.postedBy !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Anda tidak memiliki hak akses untuk membatalkan lowongan ini." });
  }

  Database.deleteJob(req.params.id);
  return res.json({ 
    message: `Lowongan "${job.title}" berhasil dibatalkan dan dihapus dari sistem.`,
    jobId: req.params.id
  });
});

// Submit lowongan kerja baru (status otomatis menjadi PENDING)
router.post("/jobs", requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const { title, company, location, salary, salaryMin, salaryMax, salaryPeriod, description, requirements, contact, category } = req.body;

  if (!title || !company || !location || !salary || !description || !requirements || !contact) {
    return res.status(400).json({ error: "Semua kolom input lowongan wajib diisi." });
  }

  const parsedMin = salaryMin !== undefined && salaryMin !== null && salaryMin !== "" ? Number(salaryMin) : undefined;
  const parsedMax = salaryMax !== undefined && salaryMax !== null && salaryMax !== "" ? Number(salaryMax) : undefined;

  const newJob = Database.createJob({
    title,
    company,
    location,
    salary,
    salaryMin: parsedMin && !isNaN(parsedMin) ? parsedMin : undefined,
    salaryMax: parsedMax && !isNaN(parsedMax) ? parsedMax : undefined,
    salaryPeriod: salaryPeriod || "Bulan",
    description,
    requirements,
    contact,
    category: category || "Lainnya",
    postedBy: req.user.id,
    postedByName: req.user.name
  });

  return res.status(201).json({
    message: "Lowongan kerja berhasil diajukan! Status saat ini: PENDING. Menunggu persetujuan admin.",
    job: newJob
  });
});


// ==========================================
// 4. ADMIN JOB MODERATION ROUTES (TERKUNCI KETAT)
// ==========================================

// Ambil semua lowongan kerja untuk moderasi admin (termasuk yang PENDING, REJECTED, EXPIRED)
router.get("/admin/jobs", requireAuth, requireAdmin, (req, res) => {
  const jobs = Database.getJobs();
  
  // Statistik ringkas untuk dashboard admin
  const stats = {
    totalJobs: jobs.length,
    pendingJobs: jobs.filter((j) => j.status === "PENDING").length,
    activeJobs: jobs.filter((j) => j.status === "ACTIVE").length,
    rejectedJobs: jobs.filter((j) => j.status === "REJECTED").length,
    expiredJobs: jobs.filter((j) => j.status === "EXPIRED").length
  };

  return res.json({ jobs, stats });
});

// Ambil riwayat notifikasi email otomatis untuk admin
router.get("/admin/emails", requireAuth, requireAdmin, (req, res) => {
  const emails = Database.getEmails();
  return res.json({ emails });
});

// Setujui lowongan kerja (APPROVE -> Mengubah status menjadi ACTIVE dan mereset masa berlaku 30 hari)
router.post("/admin/jobs/:id/approve", requireAuth, requireAdmin, (req, res) => {
  try {
    const updatedJob = Database.updateJobStatus(req.params.id, "ACTIVE");
    
    // Kirim notifikasi email otomatis secara asinkron (background task)
    const posterUser = Database.findUserById(updatedJob.postedBy);
    sendApprovalNotification(updatedJob, posterUser).catch((err) => {
      console.error("[Email Error] Gagal memicu pengiriman email otomatis:", err);
    });

    return res.json({
      message: `Lowongan "${updatedJob.title}" berhasil disetujui (APPROVED) dan kini tayang di halaman utama selama 30 hari kedepan! Notifikasi email otomatis telah dipicu.`,
      job: updatedJob
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal memproses persetujuan." });
  }
});

// Pemicu simulasi / pengiriman ulang notifikasi email untuk lowongan tertentu
router.post("/admin/jobs/:id/resend-email", requireAuth, requireAdmin, async (req, res) => {
  try {
    const job = Database.findJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Lowongan kerja tidak ditemukan." });
    }

    const posterUser = Database.findUserById(job.postedBy);
    const emailLog = await sendApprovalNotification(job, posterUser);

    return res.json({
      message: `Simulasi notifikasi email untuk lowongan "${job.title}" berhasil dipicu!`,
      emailLog
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal memicu simulasi notifikasi email." });
  }
});

// Tolak lowongan kerja (REJECT -> Mengubah status menjadi REJECTED)
router.post("/admin/jobs/:id/reject", requireAuth, requireAdmin, (req, res) => {
  try {
    const updatedJob = Database.updateJobStatus(req.params.id, "REJECTED");
    return res.json({
      message: `Lowongan "${updatedJob.title}" berhasil ditolak (REJECTED).`,
      job: updatedJob
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal memproses penolakan." });
  }
});

// Hapus lowongan kerja permanen oleh Admin
router.delete("/admin/jobs/:id", requireAuth, requireAdmin, (req, res) => {
  try {
    Database.deleteJob(req.params.id);
    return res.json({ message: "Lowongan kerja berhasil dihapus secara permanen dari sistem." });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal menghapus lowongan." });
  }
});

// ==========================================
// 4. HRD / EMPLOYER APPLICANTS MANAGEMENT
// ==========================================

// GET /api/employer/applications — Dapatkan seluruh lamaran masuk untuk loker milik HRD yang sedang login
router.get("/employer/applications", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const isAdmin = req.user.role === "ADMIN";
    const applications = Database.getEmployerApplications(req.user.id, isAdmin);
    
    return res.json({
      applications,
      total: applications.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Gagal mengambil daftar pelamar HRD." });
  }
});

// GET /api/jobs/:id/applicants — Dapatkan daftar pelamar untuk loker tertentu (Khusus HRD Pembuat Loker atau Admin)
router.get("/jobs/:id/applicants", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const jobId = req.params.id;
    const job = Database.findJobById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Lowongan kerja tidak ditemukan." });
    }

    // Validasi wewenang: hanya pemilik loker (postedBy) atau ADMIN yang boleh melihat pelamar
    if (job.postedBy !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Akses ditolak. Anda tidak memiliki wewenang untuk melihat pelamar lowongan ini." });
    }

    const applicants = Database.getJobApplicants(jobId);
    return res.json({
      job,
      applicants,
      total: applicants.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Gagal mengambil daftar pelamar." });
  }
});

// PATCH /api/jobs/applications/:applicationId/status atau /api/employer/applications/:applicationId/status
const updateApplicantStatusHandler = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = ["APPLIED", "SHORTLISTED", "INTERVIEW", "ACCEPTED", "REJECTED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Status lamaran tidak valid." });
    }

    const updatedApp = Database.updateApplicationStatus(applicationId, status);
    return res.json({
      message: `Status pelamar berhasil diperbarui menjadi "${status}".`,
      application: updatedApp
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal memperbarui status pelamar." });
  }
};

router.patch("/jobs/applications/:applicationId/status", requireAuth, updateApplicantStatusHandler);
router.patch("/employer/applications/:applicationId/status", requireAuth, updateApplicantStatusHandler);


// ==========================================
// 5. SYSTEM SIMULATOR ROUTES
// ==========================================

// Memicu cron job auto-expire secara paksa via tombol frontend
router.post("/simulator/trigger-cron", (req, res) => {
  const { expiredCount, updatedJobs } = Database.runAutoExpire();
  return res.json({
    message: "Cron Job auto-expire simulasi berhasil dijalankan!",
    expiredCount,
    updatedJobs,
    details: expiredCount > 0 
      ? `${expiredCount} lowongan yang telah lewat 30 hari berhasil diubah statusnya menjadi EXPIRED.` 
      : "Tidak ada lowongan aktif yang melewati batas 30 hari saat ini."
  });
});

// Memajukan/memundurkan tanggal pembuatan lowongan agar bisa diuji kedaluwarsa secara instan
router.post("/simulator/backdate", (req, res) => {
  const { jobId, daysAgo } = req.body;

  if (!jobId || daysAgo === undefined) {
    return res.status(400).json({ error: "Kolom jobId dan daysAgo wajib disertakan." });
  }

  try {
    const updatedJob = Database.forceSetJobAge(jobId, Number(daysAgo));
    return res.json({
      message: `Simulasi: Lowongan "${updatedJob.title}" berhasil di-backdate menjadi ${daysAgo} hari yang lalu.`,
      job: updatedJob
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal melakukan backdate." });
  }
});

// Ambil log email yang terkirim (untuk simulator panel / email inspector)
router.get("/simulator/emails", (req, res) => {
  try {
    const emails = Database.getEmails();
    return res.json({ emails });
  } catch (error: any) {
    return res.status(500).json({ error: "Gagal mengambil log email." });
  }
});

export default router;
