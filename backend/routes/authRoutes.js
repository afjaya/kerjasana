const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // Disarankan pakai bcryptjs, kalau belum ada: npm i bcryptjs

const prisma = new PrismaClient();

// ==========================================
// 1. ENDPOINT REGISTRASI USER (Ke Supabase)
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Cek apakah email sudah terdaftar di database Supabase
    // Catatan: Menggunakan prisma.user atau prisma.users sesuai model Prisma Kamu
    const userModel = prisma.user || prisma.users;
    
    const existingUser = await userModel.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email ini sudah terdaftar." });
    }

    // 2. Hash password sebelum disimpan
    // (Jika belum ada bcrypt, bisa ganti hashedPassword = password)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. SIMPAN USER BARU KE DATABASE SUPABASE
    // PERHATIKAN: Kolom di Supabase adalah 'passwordHash', BUKAN 'password'
    const newUser = await userModel.create({
      data: {
        name: name ? name.trim() : 'User Kerjasana',
        email: cleanEmail,
        passwordHash: hashedPassword, // FIX: Disesuaikan dengan nama kolom Supabase kamu
        role: role || 'USER'
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
    return res.status(500).json({ 
      error: "Gagal menyimpan data ke database Supabase.", 
      detail: error.message 
    });
  }
});

// ==========================================
// 2. ENDPOINT LOGIN USER (Cek Supabase)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userModel = prisma.user || prisma.users;

    // 1. Cari user di database Supabase
    const user = await userModel.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    // 2. Cek kecocokan password (mendukung passwordHash terenkripsi maupun plain-text)
    let isPasswordValid = false;
    if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    } else {
      isPasswordValid = user.passwordHash === password;
    }

    if (!isPasswordValid) {
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
    return res.status(500).json({ 
      error: "Gagal memproses login ke database.", 
      detail: error.message 
    });
  }
});

module.exports = router;