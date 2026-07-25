/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Response } from "express";
import { Database } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";

const router = express.Router();

// 1. GET /api/candidate/profile — Ambil profil kandidat yang sedang login
router.get("/candidate/profile", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await Database.getCandidateProfile(userId) || {
      id: "",
      userId,
      phone: "",
      bio: "",
      currentJobTitle: "",
      skills: "",
      resumeUrl: "",
      portfolioUrl: "",
      dailyEmailAlerts: false,
      alertCategory: "",
      alertLocation: "",
      alertKeywords: "",
      updatedAt: new Date().toISOString()
    };

    return res.json({ profile, user: req.user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Gagal mengambil profil kandidat." });
  }
});

// 2. POST /api/candidate/profile — Upsert (buat/edit) profil kandidat
router.post("/candidate/profile", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      avatarUrl,
      phone,
      bio,
      currentJobTitle,
      skills,
      resumeUrl,
      portfolioUrl,
      dailyEmailAlerts,
      alertCategory,
      alertLocation,
      alertKeywords
    } = req.body;

    const updatedProfile = await Database.upsertCandidateProfile(userId, {
      avatarUrl,
      phone,
      bio,
      currentJobTitle,
      skills: Array.isArray(skills) ? skills.join(", ") : skills,
      resumeUrl,
      portfolioUrl,
      dailyEmailAlerts: Boolean(dailyEmailAlerts),
      alertCategory: alertCategory || "",
      alertLocation: alertLocation || "",
      alertKeywords: alertKeywords || ""
    });

    const refreshedUser = await Database.findUserById(userId);

    return res.json({
      message: "Profil & foto avatar kandidat berhasil diperbarui!",
      profile: updatedProfile,
      user: refreshedUser
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal memperbarui profil." });
  }
});

// 2b. POST /api/candidate/test-job-alert — Kirimkan simulasi/test email notifikasi loker harian
router.post("/candidate/test-job-alert", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const profile = await Database.getCandidateProfile(userId);
    const user = req.user!;

    if (!profile || !profile.dailyEmailAlerts) {
      return res.status(400).json({
        error: "Notifikasi email harian belum diaktifkan di profil Anda. Harap aktifkan terlebih dahulu."
      });
    }

    const allJobs = await Database.getActiveJobs();
    const categoryFilter = (profile.alertCategory || "").trim().toLowerCase();
    const locationFilter = (profile.alertLocation || "").trim().toLowerCase();
    const keywordFilter = (profile.alertKeywords || "").trim().toLowerCase();

    // Saring lowongan kerja aktif berdasarkan kriteria
    const matchedJobs = allJobs.filter((job) => {
      let matches = true;

      if (categoryFilter && categoryFilter !== "semua" && categoryFilter !== "semua kategori") {
        matches = matches && (job.category || "").toLowerCase().includes(categoryFilter);
      }

      if (locationFilter && locationFilter !== "semua" && locationFilter !== "semua kota") {
        matches = matches && (job.location || "").toLowerCase().includes(locationFilter);
      }

      if (keywordFilter) {
        const keywords = keywordFilter.split(",").map((k) => k.trim()).filter(Boolean);
        if (keywords.length > 0) {
          const jobText = `${job.title} ${job.description} ${job.requirements} ${job.company}`.toLowerCase();
          const hasMatch = keywords.some((kw) => jobText.includes(kw));
          matches = matches && hasMatch;
        }
      }

      return matches;
    });

    // Ambil sampel hingga 5 job teratas
    const sampleJobs = matchedJobs.slice(0, 5);

    const emailSubject = `[Rangkuman Harian] ${sampleJobs.length} Lowongan Kerja Baru Sesuai Kriteria Anda | Kerjasana`;
    const emailBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Halo ${user.name},</h2>
        <p>Berikut adalah ikhtisar lowongan kerja terbaru hari ini yang cocok dengan kriteria favorit Anda:</p>
        <ul>
          <li><strong>Kategori:</strong> ${profile.alertCategory || "Semua Kategori"}</li>
          <li><strong>Lokasi:</strong> ${profile.alertLocation || "Semua Lokasi"}</li>
          <li><strong>Kata Kunci:</strong> ${profile.alertKeywords || "Tidak ditentukan"}</li>
        </ul>
        <hr/>
        ${
          sampleJobs.length > 0
            ? sampleJobs
                .map(
                  (j) => `
              <div style="margin-bottom: 15px; padding: 12px; background: #f8fafc; border-radius: 10px;">
                <h4 style="margin: 0 0 5px 0;">${j.title} - ${j.company}</h4>
                <p style="margin: 0; font-size: 13px; color: #64748b;">📍 ${j.location} | 💰 ${j.salary}</p>
              </div>
            `
                )
                .join("")
            : "<p><em>Saat ini belum ada lowongan baru yang pas persis. Kami akan mengabari Anda begitu ada loker baru yang masuk!</em></p>"
        }
      </div>
    `;

    // Log email ke database sistem
    await Database.logEmail({
      jobId: sampleJobs[0]?.id || "alert-digest",
      jobTitle: sampleJobs[0]?.title || "Ringkasan Loker Harian",
      company: sampleJobs[0]?.company || "Kerjasana Alerts",
      recipientEmail: user.email,
      recipientName: user.name,
      subject: emailSubject,
      html: emailBody,
      status: "SENT"
    });

    return res.json({
      message: `Email sampel notifikasi loker harian berhasil dikirimkan ke ${user.email}!`,
      recipientEmail: user.email,
      matchedCount: matchedJobs.length,
      sampleJobsCount: sampleJobs.length,
      matchedJobs: sampleJobs
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Gagal mengirimkan simulasi email alert." });
  }
});

// 3. POST /api/jobs/:id/apply — Endpoint untuk melamar pekerjaan
router.post("/jobs/:id/apply", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const candidateId = req.user!.id;
    const rawId = req.params.id;
    const { coverLetter } = req.body;

    // Pastikan pekerjaan ada dan statusnya ACTIVE
    const job = await Database.findJobById(rawId);
    if (!job) {
      return res.status(404).json({ error: "Lowongan pekerjaan tidak ditemukan." });
    }

    if (job.status !== "ACTIVE") {
      return res.status(400).json({ error: "Lowongan pekerjaan ini sudah tidak aktif atau dalam masa moderasi." });
    }

    // Buat lamaran kerja baru menggunakan job.id resmi
    const application = await Database.createApplication({
      jobId: job.id,
      candidateId,
      coverLetter
    });

    // Simulasi Pengiriman Email Riwayat Pendaftaran ke Pelamar
    const candidateEmail = req.user!.email;
    const candidateName = req.user!.name;
    const emailNotice = `Notifikasi email riwayat pendaftaran telah dikirim ke alamat email Anda (${candidateEmail}).`;

    console.log(`[EMAIL SERVICE] Sending receipt email to: ${candidateEmail}`);
    console.log(`[EMAIL SERVICE] Subject: Bukti Pendaftaran Lamaran Kerja - ${job.title}`);
    console.log(`[EMAIL SERVICE] Dear ${candidateName}, lamaran Anda untuk posisi ${job.title} di ${job.company} telah kami terima.`);

    return res.status(201).json({
      message: `Lamaran Anda untuk posisi "${job.title}" di ${job.company} telah berhasil dikirim!`,
      emailSent: true,
      emailNotice,
      candidateEmail,
      application
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal mengirimkan lamaran pekerjaan." });
  }
});

// 4. GET /api/candidate/applications — Ambil daftar pekerjaan yang pernah dilamar kandidat
router.get("/candidate/applications", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const candidateId = req.user!.id;
    const applications = await Database.getCandidateApplications(candidateId);

    return res.json({
      applications,
      total: applications.length
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Gagal mengambil daftar lamaran." });
  }
});

// 5. GET /api/candidate/check-applied/:jobId — Cek apakah kandidat sudah melamar job ini
router.get("/candidate/check-applied/:jobId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const candidateId = req.user!.id;
    const rawJobId = req.params.jobId;

    const job = await Database.findJobById(rawJobId);
    const targetJobId = job ? job.id : rawJobId;

    const application = await Database.findApplication(targetJobId, candidateId);
    return res.json({
      hasApplied: !!application,
      application: application || null
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Gagal memeriksa status lamaran." });
  }
});

export default router;
