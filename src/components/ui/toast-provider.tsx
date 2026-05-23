"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type ToastTone = "success" | "error" | "info" | "warning";

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastInput = Omit<Toast, "id"> & { durationMs?: number };

const ToastContext = createContext<{ notify: (toast: ToastInput) => void } | null>(null);

const toneStyles: Record<ToastTone, { icon: string; className: string }> = {
  success: { icon: "check_circle", className: "border-emerald-500/25 bg-emerald-500/12 text-emerald-100" },
  error: { icon: "error", className: "border-red-500/25 bg-red-500/12 text-red-100" },
  info: { icon: "info", className: "border-sky-500/25 bg-sky-500/12 text-sky-100" },
  warning: { icon: "warning", className: "border-amber-500/25 bg-amber-500/12 text-amber-100" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((current) => [{ id, ...toast }, ...current].slice(0, 4));
    window.setTimeout(() => dismiss(id), toast.durationMs ?? 4500);
  }, [dismiss]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-5 top-5 z-[100000] flex w-[min(92vw,390px)] flex-col gap-3">
        {toasts.map((toast) => {
          const tone = toneStyles[toast.tone];
          return (
            <div
              key={toast.id}
              className={`cn-toast-enter rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl ${tone.className}`}
            >
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-xl">{tone.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black leading-tight text-white">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-white/72">{toast.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="rounded-lg p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Dismiss notification"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
