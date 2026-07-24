const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // Disarankan pakai bcryptjs, kalau belum ada: npm i bcryptjs

const prisma = new PrismaClient();

// ==========================================
// ENDPOINT LOGIN USER (Merekam Jejak di Supabase)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userModel = prisma.user || prisma.users;

    // 1. Cari user di Supabase
    const user = await userModel.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    // 2. Cek Password
    let isPasswordValid = false;
    if (user.passwordHash && (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$'))) {
      isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    } else {
      isPasswordValid = user.passwordHash === password;
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    // 3. 🎯 REKAM JEJAK LOGIN KE SUPABASE DI SINI!
    const updatedUser = await userModel.update({
      where: { id: user.id },
      data: {
        // Otomatis memperbarui kolom updatedAt atau lastLoginAt (jika ada) ke jam sekarang
        updatedAt: new Date() 
      }
    });

    console.log(`[Supabase Log] User ${updatedUser.email} berhasil login pada ${new Date().toISOString()}`);

    // 4. Return Respon Login
    return res.json({
      message: "Login berhasil!",
      token: "session-token-kerjasana-" + Date.now(),
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
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