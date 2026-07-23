/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Response } from "express";
import { Database } from "../db";
import { requireAuth, requireAdmin, AuthenticatedRequest } from "../middleware/authMiddleware";
import { JobReportReason, JobReportStatus } from "../../types";

const router = express.Router();

// ==========================================
// 1. ENDPOINT PELAMAR / USER: LAPORKAN LOKER
// ==========================================

// POST /api/reports/jobs/:jobId — Pelamar mengirim laporan lowongan
router.post("/reports/jobs/:jobId", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Anda harus login untuk melaporkan lowongan." });
    }

    const { jobId } = req.params;
    const { reasonCategory, description } = req.body;

    if (!reasonCategory || !description) {
      return res.status(400).json({ error: "Kategori alasan dan penjelasan laporan wajib diisi." });
    }

    const validReasons: JobReportReason[] = [
      "PUNGLI_BIAYA",
      "INDIKASI_PENIPUAN",
      "DATA_PALSU",
      "DISKRIMINASI",
      "LAINNYA"
    ];

    if (!validReasons.includes(reasonCategory)) {
      return res.status(400).json({ error: "Kategori alasan laporan tidak valid." });
    }

    const report = Database.createJobReport({
      jobId,
      reporterId: req.user.id,
      reasonCategory,
      description: description.trim()
    });

    return res.status(201).json({
      message: "Laporan Anda telah dikirim ke Tim Moderasi KERJASANA. Terima kasih telah menjaga keamanan komunitas!",
      report
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal mengirimkan laporan." });
  }
});


// ==========================================
// 2. ENDPOINT MODERASI ADMIN
// ==========================================

// GET /api/admin/reports — Admin mengambil seluruh daftar laporan lowongan
router.get("/admin/reports", requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = Database.getAllJobReports();
    return res.json({
      reports,
      total: reports.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Gagal mengambil data laporan." });
  }
});

// PATCH /api/admin/reports/:reportId/status — Admin memperbarui status laporan (misal: 'RESOLVED_ACTIONED', 'RESOLVED_REJECTED')
router.patch("/admin/reports/:reportId/status", requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    const validStatuses: JobReportStatus[] = [
      "PENDING",
      "INVESTIGATING",
      "RESOLVED_REJECTED",
      "RESOLVED_ACTIONED"
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Status laporan tidak valid." });
    }

    const report = Database.updateJobReportStatus(reportId, status);
    return res.json({
      message: `Status laporan berhasil diperbarui menjadi "${status}".`,
      report
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal memperbarui status laporan." });
  }
});

// POST /api/admin/jobs/:jobId/take-down — Admin menonaktifkan / take down lowongan yang dilaporkan
router.post("/admin/jobs/:jobId/take-down", requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = Database.takeDownJob(jobId);

    return res.json({
      message: `Lowongan "${job.title}" (${job.company}) berhasil ditindaklanjuti dan di-take down!`,
      job
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal menonaktifkan lowongan kerja." });
  }
});

// POST /api/admin/users/:userId/ban — Admin memblokir akun HRD bodong (isBanned = true) & menonaktifkan seluruh lokernya
router.post("/admin/users/:userId/ban", requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { user, takenDownJobsCount } = Database.banUserAndTakeDownJobs(userId);

    return res.json({
      message: `Akun HRD "${user.name}" (${user.email}) telah berhasil diblokir (BANNED) secara permanen. Sebanyak ${takenDownJobsCount} lowongan miliknya telah ditutup secara otomatis.`,
      user,
      takenDownJobsCount
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal memblokir akun HRD." });
  }
});

export default router;
