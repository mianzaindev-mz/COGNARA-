"use client";

import { useState, useEffect } from "react";
import { SettingsSection, SettingsToggle } from "@/components/ui/settings-ui";

export function AdminSettingsClient() {
  const [loaded, setLoaded] = useState(false);
  const [flags, setFlags] = useState({
    AI_AGENT: true,
    CODE_EDITOR: true,
    NOTEBOOK: true,
    PEER_SESSIONS: true,
    PAYMENTS_STRIPE: true,
    LIVE_CLASSES: false,
    GITHUB_IMPORT: false,
    LINKEDIN_CERTS: false,
  });

  const [maintenance, setMaintenance] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; description?: string; type: "success" | "warning" | "info" }[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedFlags = localStorage.getItem("cognara_admin_flags");
      if (savedFlags) {
        setFlags(JSON.parse(savedFlags));
      }
      const savedMaintenance = localStorage.getItem("cognara_maintenance_mode");
      if (savedMaintenance) {
        setMaintenance(JSON.parse(savedMaintenance));
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage:", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  const showToast = (message: string, description?: string, type: "success" | "warning" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, description, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const toggleFlag = (key: keyof typeof flags) => {
    const nextVal = !flags[key];
    const updatedFlags = { ...flags, [key]: nextVal };
    setFlags(updatedFlags);
    try {
      localStorage.setItem("cognara_admin_flags", JSON.stringify(updatedFlags));
    } catch (e) {
      console.error(e);
    }
    showToast(
      `Flag Updated`,
      `${key.replace("_", " ")} feature is now ${nextVal ? "ENABLED" : "DISABLED"}.`,
      nextVal ? "success" : "info"
    );
  };

  const handleConfirmMaintenance = () => {
    const nextState = !maintenance;
    setMaintenance(nextState);
    try {
      localStorage.setItem("cognara_maintenance_mode", JSON.stringify(nextState));
    } catch (e) {
      console.error(e);
    }
    setShowConfirmModal(false);
    showToast(
      nextState ? "Maintenance Mode Activated" : "System Restored Online",
      nextState 
        ? "Platform access has been suspended for all non-admin users." 
        : "Full access restored for student and coach portals.",
      nextState ? "warning" : "success"
    );
  };

  if (!loaded) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <section className="space-y-2">
          <div className="h-8 w-48 rounded bg-black/5 dark:bg-white/5" />
          <div className="h-4 w-80 rounded bg-black/5 dark:bg-white/5" />
        </section>
        <div className="glass-card rounded-[2rem] p-8 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-black/5 dark:bg-white/5" />
          <div className="h-10 w-full rounded bg-black/5 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 relative">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink">Platform Settings</h1>
        <p className="mt-1 text-sm text-cn-ink-muted">Configure platform-wide settings and feature flags</p>
      </section>

      {/* Feature Flags */}
      <SettingsSection title="Feature Flags">
        {[
          { name: "AI Agent", key: "AI_AGENT" },
          { name: "Code Editor", key: "CODE_EDITOR" },
          { name: "Notebook", key: "NOTEBOOK" },
          { name: "Peer Sessions", key: "PEER_SESSIONS" },
          { name: "Stripe Payments", key: "PAYMENTS_STRIPE" },
          { name: "Live Classes", key: "LIVE_CLASSES" },
          { name: "GitHub Import", key: "GITHUB_IMPORT" },
          { name: "LinkedIn Certs", key: "LINKEDIN_CERTS" },
        ].map(f => (
          <SettingsToggle
            key={f.key}
            label={f.name}
            description={`Key: ${f.key}`}
            checked={flags[f.key as keyof typeof flags]}
            onChange={() => toggleFlag(f.key as keyof typeof flags)}
          />
        ))}
      </SettingsSection>

      {/* Maintenance Mode */}
      <SettingsSection title="Maintenance Settings" danger>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              {maintenance ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </>
              )}
            </span>
            <span className={`text-base font-black tracking-tight ${maintenance ? "text-rose-500" : "text-emerald-500"}`}>
              {maintenance ? "System Status: UNDER MAINTENANCE" : "System Status: ONLINE"}
            </span>
          </div>
          <p className="text-xs text-cn-ink-muted leading-relaxed max-w-xl">
            When enabled, all student and coach interface logins will be redirected to a dedicated maintenance screen. Administrator dashboard controls remain fully functional.
          </p>
        </div>

        {/* Premium custom toggle switch */}
        <div 
          onClick={() => setShowConfirmModal(true)}
          className={`relative w-14 h-8 rounded-full transition-all duration-300 cursor-pointer shrink-0 border border-black/10 dark:border-white/10 ${
            maintenance 
              ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]" 
              : "bg-black/20 dark:bg-[#2a2a2a] hover:bg-black/30 dark:hover:bg-[#3a3a3a]"
          }`}
        >
          <div 
            className={`absolute top-[3px] left-[3px] w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
              maintenance ? "translate-x-[24px]" : "translate-x-0"
            }`}
          >
            <span className={`material-symbols-outlined text-[14px] font-bold ${maintenance ? "text-rose-500" : "text-black/30"}`}>
              {maintenance ? "construction" : "power_settings_new"}
            </span>
          </div>
        </div>
      </SettingsSection>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          {/* Glassmorphic Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity cursor-pointer" 
            onClick={() => setShowConfirmModal(false)}
          />
          
          {/* Modal Container */}
          <div className="glass-card max-w-md w-full rounded-[2rem] p-8 border border-white/10 dark:border-black/40 shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 space-y-6 bg-white/80 dark:bg-black/80 backdrop-blur-2xl">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                maintenance ? "bg-emerald-500/10 text-emerald-500 animate-pulse" : "bg-rose-500/10 text-rose-500 animate-pulse"
              }`}>
                <span className="material-symbols-outlined text-2xl font-bold">
                  {maintenance ? "check_circle" : "warning"}
                </span>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-cn-ink dark:text-white">
                  {maintenance ? "Deactivate Maintenance?" : "Activate Maintenance?"}
                </h4>
                <p className="text-xs text-cn-ink-muted mt-0.5">Please confirm system status transition</p>
              </div>
            </div>
            
            <p className="text-sm text-cn-ink-muted leading-relaxed">
              {maintenance ? (
                "This will restore live platform access immediately. Student and coach logins, dashboards, classes, and Stripe payments will go live."
              ) : (
                "This will suspend active platform access instantly. All student and coach logins will be redirected to a dedicated maintenance screen. Administrator system controls remain operational."
              )}
            </p>
            
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-3 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold text-cn-ink dark:text-white transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMaintenance}
                className={`px-5 py-3 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md ${
                  maintenance 
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/15" 
                    : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/15"
                }`}
              >
                {maintenance ? "Confirm Go Live" : "Confirm Maintenance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Glassmorphic Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`glass-card p-4 rounded-2xl border flex items-start gap-3 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300 bg-white/70 dark:bg-black/70 backdrop-blur-2xl ${
              toast.type === "success" 
                ? "border-emerald-500/20 text-emerald-950 dark:text-emerald-50"
                : toast.type === "warning"
                ? "border-rose-500/20 text-rose-950 dark:text-rose-50"
                : "border-indigo-500/20 text-indigo-950 dark:text-indigo-50"
            }`}
          >
            <span className={`material-symbols-outlined shrink-0 ${
              toast.type === "success" ? "text-emerald-500" : toast.type === "warning" ? "text-rose-500" : "text-indigo-500"
            }`}>
              {toast.type === "success" ? "check_circle" : toast.type === "warning" ? "warning" : "info"}
            </span>
            <div className="flex-1">
              <p className="font-bold text-sm leading-tight">{toast.message}</p>
              {toast.description && <p className="text-xs opacity-80 mt-1 leading-normal">{toast.description}</p>}
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
