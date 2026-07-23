import React from "react";
import { LucideIcon, Search, Briefcase, Plus, RefreshCw, FilterX } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon = Briefcase,
  title,
  description,
  badge,
  primaryAction,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`bg-white rounded-3xl border border-slate-100 p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center relative overflow-hidden group ${className}`}
    >
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-radial from-slate-50/80 via-transparent to-transparent pointer-events-none" />

      {/* Badge / Tag if specified */}
      {badge && (
        <span className="mb-4 inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border border-slate-200/60">
          {badge}
        </span>
      )}

      {/* Icon Container with subtle ring */}
      <div className="relative mb-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300">
          <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 stroke-[1.75]" />
        </div>
        {/* Subtle decorative dot */}
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-xs">
          0
        </div>
      </div>

      {/* Text Content */}
      <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight max-w-md">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed max-w-lg font-medium">
        {description}
      </p>

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/15 hover:shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
              {primaryAction.label}
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold border border-slate-200/80 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
