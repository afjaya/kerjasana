const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. REGISTER USER
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email sudah terdaftar!" });
    }

    // Simpan User Baru LANGSUNG KE SUPABASE
    // NOTE: Prisma schema expects `passwordHash` column. Using that field name here.
    // In production, replace this with a proper hash (bcrypt) before storing.
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: password, // TODO: hash with bcrypt in production
        role: role || 'USER'
      }
    });

    res.status(201).json({
      message: "Registrasi berhasil!",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Error Register Supabase:", error);
    res.status(500).json({ error: "Gagal mendaftarkan user ke database." });
  }
};

// 2. LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari user di Supabase
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Compare with stored passwordHash (replace with bcrypt.compare in production)
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: "Email atau password salah!" });
    }

    res.json({
      message: "Login berhasil!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error Login Supabase:", error);
    res.status(500).json({ error: "Gagal login." });
  }
};