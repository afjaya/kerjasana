import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ==========================================
// 1. ENDPOINT REGISTRASI USER (Ke Supabase)
// ==========================================
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Cek apakah email sudah terdaftar di Supabase
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email ini sudah terdaftar." });
    }

    // SIMPAN USER BARU KE DATABASE SUPABASE (Gunakan passwordHash)
    const newUser = await prisma.user.create({
      data: {
        name: name ? name.trim() : 'User Kerjasana',
        email: cleanEmail,
        passwordHash: password, // <-- DISESUAIKAN DENGAN SKEMA PRISMA KAMU
        role: role || 'CANDIDATE'
      }
    });

    return res.status(201).json({
      message: "Registrasi berhasil!",
      token: "session-token-kerjasana-" + Date.now(),
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Error Prisma Register:", error);
    return res.status(500).json({ error: "Gagal menyimpan data ke database Supabase." });
  }
});

// ==========================================
// 2. ENDPOINT LOGIN USER (Cek Supabase)
// ==========================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Cari user di database Supabase
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    // Cek passwordHash di database
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    return res.json({
      message: "Login berhasil!",
      token: "session-token-kerjasana-" + Date.now(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error Prisma Login:", error);
    return res.status(500).json({ error: "Gagal memproses login ke database." });
  }
});

export default router;