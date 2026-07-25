/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, ShieldAlert, PlusCircle, LogOut, User, LogIn, Receipt } from "lucide-react";
import { User as UserType } from "../types";

interface NavbarProps {
  user: UserType | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-600/10 transition-transform group-hover:scale-105">
                K
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">
                kerjasana<span className="text-indigo-600">.com</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-10 md:flex md:space-x-4">
              <Link
                to="/"
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/")
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                }`}
              >
                Cari Lowongan
              </Link>
              
              <Link
                to="/submit"
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/submit")
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                }`}
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Pasang Loker
              </Link>

              {user && user.role !== "CANDIDATE" && (
                <Link
                  to="/profile/transactions"
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/profile/transactions")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                  }`}
                >
                  <Receipt className="w-4 h-4 mr-1.5 text-indigo-600" />
                  Riwayat Transaksi
                </Link>
              )}

              {user && user.role === "CANDIDATE" && (
                <Link
                  to="/candidate"
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/candidate")
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                  }`}
                >
                  <User className="w-4 h-4 mr-1.5 text-indigo-600" />
                  Dasbor Pelamar
                </Link>
              )}

              {user && user.role === "ADMIN" && (
                <Link
                  to="/admin"
                  className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/admin")
                      ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                      : "text-slate-600 hover:text-amber-600 hover:bg-slate-50"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 mr-1.5 text-amber-600" />
                  Dasbor Admin
                </Link>
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                {/* User Info Capsule */}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold text-slate-800 leading-tight">
                    {user.name}
                  </span>
                  <span className="flex items-center gap-1 justify-end">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        user.role === "ADMIN"
                          ? "bg-amber-500"
                          : user.role === "CANDIDATE"
                          ? "bg-emerald-500"
                          : "bg-indigo-500"
                      }`}
                    />
                    <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400">
                      {user.role === "ADMIN"
                        ? "ADMINISTRATOR"
                        : user.role === "CANDIDATE"
                        ? "PELAMAR"
                        : "PEMBERI KERJA"}
                    </span>
                  </span>
                </div>

                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100 shadow-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                )}

                <button
                  onClick={() => {
                    onLogout();
                    navigate("/");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-colors"
                  title="Keluar dari akun"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition-all hover:translate-y-[-1px] active:translate-y-0"
                >
                  <LogIn className="w-4 h-4" />
                  Masuk / Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
