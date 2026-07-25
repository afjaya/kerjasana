/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Database } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/authMiddleware";
import { sendVerificationEmail } from "../utils/emailService";
import { UserRole } from "../../types";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "kerjasana-super-secret-key-123";

// Helper untuk memastikan default admin account ada di database
async function ensureDefaultAdmin() {
  try {
    const adminEmail = "admin@kerjasana.com";
    const existingAdmin = await Database.findUserByEmail(adminEmail);
    const adminPasswordHash = bcrypt.hashSync("AdminKerjasana2026!", 10);

    if (!existingAdmin) {
      await Database.createUser("Super Admin Kerjasana", adminEmail, adminPasswordHash, "ADMIN" as UserRole, true);
      console.log("✅ [AUTH] Default Super Admin account 'admin@kerjasana.com' successfully seeded.");
    }
  } catch (err) {
    // Admin mungkin sudah ada, tidak apa-apa
  }
}

// Inisialisasi default admin saat modul di-load
void ensureDefaultAdmin();

// Helper verifikasi password (dukungan Bcrypt $2a$/$2b$ & fallback Plaintext untuk entry manual)
function verifyPassword(password: string, passwordHash: string): boolean {
  if (passwordHash.startsWith("$2a$") || passwordHash.startsWith("$2b$")) {
    return bcrypt.compareSync(password, passwordHash);
  }
  // Fallback: pencocokan langsung plaintext
  return password === passwordHash;
}

// ==========================================
// 1. ENDPOINT REGISTRASI PUBLIK DENGAN VERIFIKASI EMAIL
// ==========================================
const handleRegister = async (req: express.Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Semua kolom input (Nama, Email, Password) wajib diisi." });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Dilarang mendaftar sebagai ADMIN melalui form publik
  if (role === "ADMIN") {
    return res.status(403).json({ 
      error: "Pendaftaran role Admin tidak diizinkan dari portal publik." 
    });
  }

  // Normalisasi Role (APPLICANT / CANDIDATE, HRD / USER)
  let userRole: UserRole = "APPLICANT";
  if (role === "HRD" || role === "USER") {
    userRole = "HRD";
  } else if (role === "APPLICANT" || role === "CANDIDATE") {
    userRole = "APPLICANT";
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    // Generate secure random verification token
    const verificationToken = "vtoken_" + crypto.randomBytes(24).toString("hex");

    // Buat user dengan status isVerified = false (belum diverifikasi)
    const user = await Database.createUser(
      name.trim(),
      cleanEmail,
      hashedPassword,
      userRole,
      false, // isVerified = false
      verificationToken
    );

    // Kirimkan email verifikasi
    try {
      await sendVerificationEmail(user, verificationToken);
    } catch (mailErr) {
      console.error("Gagal mengirimkan email verifikasi:", mailErr);
    }

    return res.status(201).json({
      message: `Registrasi akun ${userRole === "HRD" ? "HRD / Perusahaan" : "Pelamar Kerja"} berhasil! Kami telah mengirimkan link verifikasi ke email ${user.email}. Silakan periksa inbox/spam email Anda untuk memverifikasi akun sebelum login.`,
      needsVerification: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        jobPostingQuota: user.jobPostingQuota,
        isVerified: false
      }
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal melakukan registrasi." });
  }
};

router.post("/register", handleRegister);
router.post("/auth/register", handleRegister);

// ==========================================
// 2. ENDPOINT VERIFIKASI EMAIL (/verify-email)
// ==========================================
const handleVerifyEmail = async (req: express.Request, res: Response) => {
  const token = (req.query.token as string) || req.body.token;

  if (!token) {
    return res.status(400).json({ error: "Token verifikasi email wajib disertakan." });
  }

  try {
    const verifiedUser = await Database.verifyUserToken(token);

    // Generate JWT Token agar user langsung bisa login
    const jwtToken = jwt.sign(
      { id: verifiedUser.id, email: verifiedUser.email, role: verifiedUser.role, name: verifiedUser.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Selamat! Email Anda telah berhasil diverifikasi. Akun Anda kini aktif penuh.",
      token: jwtToken,
      user: {
        id: verifiedUser.id,
        name: verifiedUser.name,
        email: verifiedUser.email,
        role: verifiedUser.role,
        subscriptionPlan: verifiedUser.subscriptionPlan,
        jobPostingQuota: verifiedUser.jobPostingQuota,
        isVerified: true
      }
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal memverifikasi token email." });
  }
};

router.get("/verify-email", handleVerifyEmail);
router.post("/verify-email", handleVerifyEmail);
router.get("/auth/verify-email", handleVerifyEmail);
router.post("/auth/verify-email", handleVerifyEmail);

// ==========================================
// 3. ENDPOINT RESEND VERIFICATION LINK (/resend-verification)
// ==========================================
const handleResendVerification = async (req: express.Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email wajib diisi." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await Database.findUserByEmail(cleanEmail);

  if (!user) {
    return res.status(444).json({ error: "Pengguna dengan email ini tidak ditemukan." });
  }

  if (user.isVerified) {
    return res.status(400).json({ error: "Akun dengan email ini sudah terverifikasi sebelumnya." });
  }

  try {
    const newToken = "vtoken_" + crypto.randomBytes(24).toString("hex");
    const updatedUser = await Database.setVerificationToken(user.id, newToken);

    await sendVerificationEmail(updatedUser, newToken);

    return res.json({
      message: `Link verifikasi baru berhasil dikirimkan ke email ${user.email}. Silakan periksa inbox atau kotak SPAM Anda.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Gagal mengirimkan ulang link verifikasi." });
  }
};

router.post("/resend-verification", handleResendVerification);
router.post("/auth/resend-verification", handleResendVerification);

// ==========================================
// 4. ENDPOINT LOGIN PUBLIK (DENGAN CEK STATUS VERIFIKASI)
// ==========================================
const handleLogin = async (req: express.Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await Database.findUserByEmail(cleanEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Email atau password salah." });
  }

  if (user.isBanned) {
    return res.status(403).json({ 
      error: "Akun Anda telah diblokir karena pelanggaran ketentuan layanan." 
    });
  }

  // Cek jika akun belum diverifikasi via Email (Bypass khusus role ADMIN atau jika isVerified !== false)
  if (user.role !== "ADMIN" && user.isVerified === false) {
    return res.status(403).json({
      error: "Akun Anda belum diverifikasi via email. Silakan periksa inbox/spam email Anda dan klik link verifikasi.",
      needsVerification: true,
      email: user.email
    });
  }

  // Update jejak login (updatedAt)
  await Database.updateUserLastLogin(user.id);

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
      role: user.role,
      avatarUrl: user.avatarUrl,
      subscriptionPlan: user.subscriptionPlan,
      jobPostingQuota: user.jobPostingQuota,
      isBanned: user.isBanned,
      isVerified: user.isVerified !== false
    }
  });
};

router.post("/login", handleLogin);
router.post("/auth/login", handleLogin);

// ==========================================
// 5. ENDPOINT LOGIN KHUSUS SUPER ADMIN (/admin/login)
// ==========================================
const handleAdminLogin = async (req: express.Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password Admin wajib diisi." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = await Database.findUserByEmail(cleanEmail);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Kredensial Admin tidak valid atau tidak ditemukan." });
  }

  if (user.role !== "ADMIN") {
    return res.status(403).json({ error: "Akses ditolak. Akun Anda tidak memiliki otoritas Super Admin." });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: "Akun Admin ini telah diblokir." });
  }

  // Update jejak login (updatedAt)
  await Database.updateUserLastLogin(user.id);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    message: "Otentikasi Super Admin berhasil!",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      subscriptionPlan: user.subscriptionPlan,
      jobPostingQuota: user.jobPostingQuota,
      isVerified: true
    }
  });
};

router.post("/admin/login", handleAdminLogin);
router.post("/auth/admin/login", handleAdminLogin);

// ==========================================
// 6. ENDPOINT CEK USER ME (/me)
// ==========================================
const handleMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Sesi pengguna tidak valid." });
  }
  const dbUser = await Database.findUserById(req.user.id);
  if (!dbUser) {
    return res.status(404).json({ error: "Pengguna tidak ditemukan." });
  }
  if (dbUser.isBanned) {
    return res.status(403).json({ error: "Akun Anda telah diblokir." });
  }

  return res.json({
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      avatarUrl: dbUser.avatarUrl,
      subscriptionPlan: dbUser.subscriptionPlan,
      jobPostingQuota: dbUser.jobPostingQuota,
      isBanned: dbUser.isBanned,
      isVerified: dbUser.isVerified !== false
    }
  });
};

router.get("/me", requireAuth, handleMe);
router.get("/auth/me", requireAuth, handleMe);

export default router;
