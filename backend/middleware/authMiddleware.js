/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BLUEPRINT: backend/middleware/authMiddleware.js
 * Guna membatasi akses endpoint sensitif di tingkat routing backend.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "kerjasana-super-secret-key-123";

/**
 * Middleware untuk memverifikasi apakah request membawa JWT valid di header Authorization.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: "Akses ditolak. Token autentikasi tidak ditemukan atau tidak valid." 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Simpan data user hasil decode ke dalam object request (req.user)
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    };
    
    next();
  } catch (error) {
    console.error("JWT Verification error:", error);
    return res.status(401).json({ 
      error: "Sesi Anda telah kedaluwarsa atau token tidak sah." 
    });
  }
}

/**
 * Middleware untuk membatasi akses khusus pengguna dengan role ADMINISTRATOR.
 * WAJIB diletakkan SETELAH middleware requireAuth.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      error: "Akses ditolak. Anda harus login terlebih dahulu." 
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: "Akses ditolak. Hak akses khusus Administrator diperlukan." 
    });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
