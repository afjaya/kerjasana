const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ==========================================
// ENDPOINT LOGIN (Debug Log & Multi-Password)
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
      console.log(`❌ [LOGIN 401] Email '${cleanEmail}' TIDAK DITEMUKAN di Supabase.`);
      return res.status(401).json({ error: "Email tidak terdaftar di database." });
    }

    // 2. Ambil nilai passwordHash dari DB
    const dbPassword = user.passwordHash || user.password;

    if (!dbPassword) {
      console.log(`❌ [LOGIN 401] User '${cleanEmail}' tidak punya nilai di kolom passwordHash.`);
      return res.status(401).json({ error: "Password di database kosong." });
    }

    // 3. Cek Kecocokan Password
    let isPasswordValid = false;

    // Cek jika password di DB berupa HASH BCRYPT
    if (dbPassword.startsWith('$2a$') || dbPassword.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(password, dbPassword);
    } else {
      // Cek jika user dibuat MANUAL di Supabase (TEKS POLOS)
      isPasswordValid = (dbPassword === password.trim());
    }

    if (!isPasswordValid) {
      console.log(`❌ [LOGIN 401] Password SALAH untuk email '${cleanEmail}'. (Input: ${password} vs DB: ${dbPassword})`);
      return res.status(401).json({ error: "Password yang Anda masukkan salah." });
    }

    // 4. UPDATE JEJAK LOGIN KE SUPABASE
    try {
      await userModel.update({
        where: { id: user.id },
        data: { updatedAt: new Date() }
      });
      console.log(`✅ [SUPABASE UPDATED] User ${cleanEmail} berhasil merekam jejak login!`);
    } catch (err) {
      console.warn("⚠️ Gagal update updatedAt di Supabase:", err.message);
    }

    // 5. RETURN SUCCESS
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
    console.error("🔥 Error Internal Server Login:", error);
    return res.status(500).json({ error: "Gagal memproses login.", detail: error.message });
  }
});

module.exports = router;