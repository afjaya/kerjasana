import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (options: { type?: ToastType; title?: string; message: string; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message, duration = 4000 }: { type?: ToastType; title?: string; message: string; duration?: number }) => {
      const id = "toast-" + Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Maksimal 5 toast sekaligus

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => showToast({ type: "success", title: title || "Berhasil", message }), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast({ type: "error", title: title || "Gagal", message }), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast({ type: "warning", title: title || "Peringatan", message }), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast({ type: "info", title: title || "Informasi", message }), [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus digunakan di dalam ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
  key?: string | number;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const styles = {
    success: {
      border: "border-emerald-200/80 bg-white/95 text-emerald-900",
      iconBg: "bg-emerald-100 text-emerald-600",
      icon: CheckCircle2,
      accent: "bg-emerald-500",
      titleColor: "text-emerald-950",
    },
    error: {
      border: "border-rose-200/80 bg-white/95 text-rose-900",
      iconBg: "bg-rose-100 text-rose-600",
      icon: XCircle,
      accent: "bg-rose-500",
      titleColor: "text-rose-950",
    },
    warning: {
      border: "border-amber-200/80 bg-white/95 text-amber-900",
      iconBg: "bg-amber-100 text-amber-600",
      icon: AlertTriangle,
      accent: "bg-amber-500",
      titleColor: "text-amber-950",
    },
    info: {
      border: "border-indigo-200/80 bg-white/95 text-indigo-900",
      iconBg: "bg-indigo-100 text-indigo-600",
      icon: Info,
      accent: "bg-indigo-500",
      titleColor: "text-indigo-950",
    },
  }[toast.type];

  const IconComponent = styles.icon;

  return (
    <div
      id={`toast-item-${toast.id}`}
      className={`pointer-events-auto relative flex items-start gap-3 p-4 rounded-2xl border ${styles.border} shadow-xl shadow-slate-900/10 backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-slide-in overflow-hidden`}
    >
      {/* Accent Indicator Bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${styles.accent}`} />

      {/* Icon */}
      <div className={`shrink-0 p-2 rounded-xl ${styles.iconBg}`}>
        <IconComponent className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 pr-4 min-w-0">
        {toast.title && <h4 className={`font-bold text-xs ${styles.titleColor} tracking-tight mb-0.5`}>{toast.title}</h4>}
        <p className="text-xs text-slate-600 leading-snug break-words font-medium">{toast.message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        aria-label="Tutup notifikasi"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
