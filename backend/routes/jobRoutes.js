/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLUEPRINT: backend/routes/jobRoutes.js
 * Router lengkap untuk pengelolaan lowongan dan persetujuan (approval) admin
 * menggunakan Prisma ORM dan PostgreSQL.
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// =======================================================
// 1. PUBLIC JOB ENDPOINTS
// =======================================================

/**
 * GET /api/jobs
 * Mengambil semua lowongan kerja dengan status ACTIVE untuk dipajang di halaman utama.
 * Mendukung pencarian teks (search) dan lokasi penempatan (location).
 */
router.get('/jobs', async (req, res) => {
  const { search, location } = req.query;
  
  // Struktur query default
  const queryFilter = {
    status: "ACTIVE"
  };

  // Filter pencarian teks
  if (search || location) {
    queryFilter.AND = [];
    
    if (search) {
      queryFilter.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (location) {
      queryFilter.AND.push({
        location: { contains: location, mode: 'insensitive' }
      });
    }
  }

  try {
    const jobs = await prisma.job.findMany({
      where: queryFilter,
      orderBy: {
        createdAt: 'desc'
      }
    });
    return res.json({ jobs });
  } catch (error) {
    console.error("Gagal mengambil data loker:", error);
    return res.status(500).json({ error: "Gagal memproses permintaan data lowongan." });
  }
});

/**
 * GET /api/jobs/detail/:id
 * Mengambil informasi lengkap lowongan kerja berdasarkan ID.
 */
router.get('/jobs/detail/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id }
    });

    if (!job) {
      return res.status(404).json({ error: "Lowongan kerja tidak ditemukan." });
    }

    return res.json({ job });
  } catch (error) {
    console.error("Gagal mengambil detail loker:", error);
    return res.status(500).json({ error: "Gagal mengambil data detail lowongan." });
  }
});


// =======================================================
// 2. EMPLOYER JOB ENDPOINTS (USER ROLE)
// =======================================================

/**
 * POST /api/jobs
 * Mengajukan lowongan kerja baru oleh Pemberi Kerja.
 * Status awal selalu dipaksa menjadi PENDING di tingkat server.
 */
router.post('/jobs', requireAuth, async (req, res) => {
  const { title, company, location, salary, description, requirements, contact } = req.body;

  if (!title || !company || !location || !salary || !description || !requirements || !contact) {
    return res.status(400).json({ error: "Semua kolom input lowongan wajib diisi." });
  }

  try {
    const now = new Date();
    // Hitung tanggal kedaluwarsa otomatis (30 hari sejak dibuat)
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + 30);

    const newJob = await prisma.job.create({
      data: {
        title,
        company,
        location,
        salary,
        description,
        requirements,
        contact,
        status: "PENDING", // Dipaksa PENDING demi keamanan bypass frontend!
        postedBy: req.user.id,
        expiresAt: expiresAt
      }
    });

    return res.status(201).json({
      message: "Lowongan berhasil diajukan! Menunggu persetujuan Administrator.",
      job: newJob
    });
  } catch (error) {
    console.error("Gagal membuat loker baru:", error);
    return res.status(500).json({ error: "Gagal menyimpan pengajuan lowongan baru." });
  }
});


// =======================================================
// 3. ADMIN ENDPOINTS (TERKUNCI KETAT DENGAN REQUIREADMIN)
// =======================================================

/**
 * GET /api/admin/jobs
 * Mengambil semua data lowongan tanpa filter status untuk moderasi.
 */
router.get('/admin/jobs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        postedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Hitung statistik untuk dasbor
    const stats = {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter((j) => j.status === "PENDING").length,
      activeJobs: jobs.filter((j) => j.status === "ACTIVE").length,
      rejectedJobs: jobs.filter((j) => j.status === "REJECTED").length,
      expiredJobs: jobs.filter((j) => j.status === "EXPIRED").length
    };

    return res.json({ jobs, stats });
  } catch (error) {
    console.error("Admin: Gagal memuat data:", error);
    return res.status(500).json({ error: "Gagal memproses data moderasi." });
  }
});

/**
 * POST /api/admin/jobs/:id/approve
 * Menyetujui pengajuan loker. Mengubah status menjadi ACTIVE dan mereset masa tayang 30 hari kedepan.
 */
router.post('/admin/jobs/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + 30);

    const updatedJob = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        status: "ACTIVE",
        createdAt: now, // Atur tanggal mulai tayang sejak disetujui
        expiresAt: expiresAt
      }
    });

    return res.json({
      message: `Lowongan "${updatedJob.title}" berhasil disetujui dan kini tayang selama 30 hari!`,
      job: updatedJob
    });
  } catch (error) {
    console.error("Admin: Gagal menyetujui loker:", error);
    return res.status(500).json({ error: "Gagal menyimpan persetujuan lowongan." });
  }
});

/**
 * POST /api/admin/jobs/:id/reject
 * Menolak pengajuan loker. Mengubah status menjadi REJECTED.
 */
router.post('/api/admin/jobs/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updatedJob = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        status: "REJECTED"
      }
    });

    return res.json({
      message: `Lowongan "${updatedJob.title}" telah ditolak (REJECTED).`,
      job: updatedJob
    });
  } catch (error) {
    console.error("Admin: Gagal menolak loker:", error);
    return res.status(500).json({ error: "Gagal menyimpan keputusan penolakan." });
  }
});

/**
 * DELETE /api/admin/jobs/:id
 * Menghapus data lowongan permanen dari database.
 */
router.delete('/admin/jobs/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.job.delete({
      where: { id: req.params.id }
    });

    return res.json({ message: "Lowongan kerja berhasil dihapus permanen." });
  } catch (error) {
    console.error("Admin: Gagal menghapus loker:", error);
    return res.status(500).json({ error: "Gagal menghapus lowongan dari sistem." });
  }
});

module.exports = router;
