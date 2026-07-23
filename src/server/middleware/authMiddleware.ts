/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Database } from "../db";
import { UserRole } from "../../types";

const JWT_SECRET = process.env.JWT_SECRET || "kerjasana-super-secret-key-123";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

// Middleware untuk memverifikasi apakah user sudah login (JWT Valid)
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      error: "Akses ditolak. Token autentikasi tidak ditemukan atau tidak valid." 
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
      name: string;
    };

    // Validasi apakah user masih ada di database
    const user = Database.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User tidak ditemukan dalam sistem." });
    }

    // Cek apakah akun user diblokir (banned)
    if (user.isBanned) {
      return res.status(403).json({ 
        error: "Akun Anda telah diblokir karena pelanggaran ketentuan layanan." 
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    
    next();
  } catch (error) {
    console.error("JWT Verification error:", error);
    return res.status(401).json({ error: "Sesi Anda telah kedaluwarsa atau token tidak valid." });
  }
}

// Middleware khusus untuk membatasi akses hanya ke ADMIN
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Pastikan requireAuth dijalankan terlebih dahulu sebelum ini
  if (!req.user) {
    return res.status(401).json({ error: "Akses ditolak. Anda harus login terlebih dahulu." });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ 
      error: "Akses ditolak. Halaman ini hanya boleh diakses oleh Administrator." 
    });
  }

  next();
}

// Middleware khusus untuk membatasi akses hanya ke Pemberi Kerja (USER) atau ADMIN
export function requireEmployerOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Akses ditolak. Anda harus login terlebih dahulu." });
  }

  if (req.user.role !== "USER" && req.user.role !== "ADMIN") {
    return res.status(403).json({ 
      error: "Akses ditolak. Fitur pembayaran ini khusus untuk Pemberi Kerja (HRD) / Administrator." 
    });
  }

  next();
}
