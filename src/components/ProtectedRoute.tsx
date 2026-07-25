/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { User, UserRole } from "../types";

interface ProtectedRouteProps {
  user: User | null;
  allowedRoles: UserRole[];
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user,
  allowedRoles,
  children,
  redirectTo
}) => {
  const location = useLocation();

  // 1. Jika belum login
  if (!user) {
    const defaultRedirect = allowedRoles.includes("ADMIN") ? "/admin/login" : "/login";
    return <Navigate to={redirectTo || defaultRedirect} state={{ from: location }} replace />;
  }

  // 2. Cek apakah user diblokir
  if (user.isBanned) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-rose-100 text-center space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
            🚫
          </div>
          <h2 className="text-xl font-black text-slate-800">Akun Anda Diblokir</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Akun Anda telah dinonaktifkan oleh Administrator karena terindikasi melanggar ketentuan layanan platform Kerjasana.com.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all"
          >
            Keluar dari Sesi
          </button>
        </div>
      </div>
    );
  }

  // 3. Otorisasi fleksibel role
  const userRole = user.role;
  const isAuthorized = allowedRoles.some((role) => {
    if (role === userRole) return true;
    if ((role === "APPLICANT" || role === "CANDIDATE") && (userRole === "APPLICANT" || userRole === "CANDIDATE")) return true;
    if ((role === "HRD" || role === "USER") && (userRole === "HRD" || userRole === "USER")) return true;
    return false;
  });

  if (!isAuthorized) {
    if (userRole === "ADMIN") return <Navigate to="/admin" replace />;
    if (userRole === "HRD" || userRole === "USER") return <Navigate to="/submit" replace />;
    if (userRole === "APPLICANT" || userRole === "CANDIDATE") return <Navigate to="/candidate" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
