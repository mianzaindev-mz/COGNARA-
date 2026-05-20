"use client";

import React from "react";

export function SettingsSection({ title, icon, children, danger, accent = "orange" }: { 
  title: string; 
  icon?: string; 
  children: React.ReactNode; 
  danger?: boolean; 
  accent?: "orange" | "indigo";
}) {
  return (
    <section className={`glass-card rounded-[2rem] p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ${danger ? "border-red-500/20 bg-red-500/5" : ""}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl ${danger ? "bg-red-500/10" : "bg-black/5 dark:bg-white/5"} flex items-center justify-center`}>
          <span className={`material-symbols-outlined ${danger ? "text-red-500" : (accent === "indigo" ? "text-indigo-600 dark:text-indigo-400" : "text-cn-orange")}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon || (danger ? "warning" : "settings")}
          </span>
        </div>
        <h3 className={`text-2xl font-bold ${danger ? "text-red-500" : "text-cn-ink dark:text-white"}`}>{title}</h3>
      </div>
      <div className={danger ? "flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-red-500/10" : "w-full"}>
        {children}
      </div>
    </section>
  );
}

export function SettingsToggle({ label, description, checked, onChange, disabled, accent = "orange" }: {
  label: string; 
  description: string; 
  checked: boolean; 
  onChange: (v: boolean) => void; 
  disabled?: boolean;
  accent?: "orange" | "indigo";
}) {
  return (
    <div 
      className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${disabled ? "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 opacity-50 cursor-not-allowed" : "hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group"}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div className="space-y-1 pr-4">
        <p className="text-lg font-bold text-cn-ink dark:text-white">{label}</p>
        <p className="text-xs font-semibold text-cn-ink-subtle dark:text-on-surface-variant opacity-80">{description}</p>
      </div>
      <div className={`relative w-11 h-6 rounded-full transition-colors ${checked ? (accent === "indigo" ? "bg-indigo-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]" : "bg-cn-orange shadow-[0_0_15px_rgba(255,90,38,0.3)]") : "bg-black/20 dark:bg-[#2a2a2a]"} shrink-0`}>
        <div className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full transition-transform ${checked ? "translate-x-[20px]" : "translate-x-0"}`} />
      </div>
    </div>
  );
}

export function SettingsSelect({ label, value, onChange, options, accent = "orange" }: {
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  options: { value: string; label: string }[];
  accent?: "orange" | "indigo";
}) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-cn-ink-subtle dark:text-on-surface-variant uppercase tracking-wider">{label}</label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-5 text-cn-ink dark:text-white appearance-none focus:ring-2 ${accent === "indigo" ? "focus:ring-indigo-500" : "focus:ring-cn-orange"} focus:border-transparent outline-none transition-all`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-cn-ink-subtle dark:text-on-surface-variant">unfold_more</span>
      </div>
    </div>
  );
}

export function SettingsInput({ label, id, value, onChange, placeholder, accent = "orange" }: {
  label: string; 
  id: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
  accent?: "orange" | "indigo";
}) {
  return (
    <div className="space-y-3 w-full">
      <label htmlFor={id} className="text-xs font-semibold text-cn-ink-subtle dark:text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input 
        id={id} 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder} 
        className={`w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-5 text-cn-ink dark:text-white focus:ring-2 ${accent === "indigo" ? "focus:ring-indigo-500" : "focus:ring-cn-orange"} focus:border-transparent outline-none transition-all placeholder:text-black/30 dark:placeholder:text-on-surface-variant/40`} 
      />
    </div>
  );
}

export function SettingsTextarea({ label, id, value, onChange, placeholder, rows = 3, accent = "orange" }: {
  label: string; 
  id: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string; 
  rows?: number;
  accent?: "orange" | "indigo";
}) {
  return (
    <div className="space-y-3 sm:col-span-2 w-full">
      <label htmlFor={id} className="text-xs font-semibold text-cn-ink-subtle dark:text-on-surface-variant uppercase tracking-wider">{label}</label>
      <textarea 
        id={id} 
        rows={rows} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder} 
        className={`w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-4 px-5 text-cn-ink dark:text-white focus:ring-2 ${accent === "indigo" ? "focus:ring-indigo-500" : "focus:ring-cn-orange"} focus:border-transparent outline-none transition-all placeholder:text-black/30 dark:placeholder:text-on-surface-variant/40 resize-none`} 
      />
    </div>
  );
}
