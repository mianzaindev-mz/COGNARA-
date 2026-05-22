"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface DoubleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmWord?: string; // e.g., "CONFIRM" or "I AGREE"
  actionButtonText?: string;
  danger?: boolean;
}

export function DoubleConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmWord,
  actionButtonText = "Confirm",
  danger = false
}: DoubleConfirmModalProps) {
  const [inputValue, setInputValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure portal target is only accessed client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleConfirm = () => {
    if (confirmWord && inputValue !== confirmWord) return;
    if (!confirmWord && !checked) return;
    
    // reset state
    setInputValue("");
    setChecked(false);
    onConfirm();
  };

  const isButtonDisabled = confirmWord ? inputValue !== confirmWord : !checked;

  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Backdrop — full viewport blur */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl cursor-pointer animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md bg-[#1a1a1a] border border-white/30 rounded-3xl p-8 shadow-2xl shadow-black/90 animate-in fade-in zoom-in-95 duration-300"
        style={{ zIndex: 100000 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dcm-title"
        aria-describedby="dcm-desc"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-500/15 text-red-400' : 'bg-primary/15 text-primary'}`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {danger ? 'warning' : 'gpp_maybe'}
              </span>
            </div>
            <div className="flex-1">
              <h2 id="dcm-title" className="text-xl font-bold text-white tracking-tight">{title}</h2>
              <p id="dcm-desc" className="text-sm text-white/60 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="p-5 bg-white/8 rounded-2xl border border-white/10 space-y-4 backdrop-blur-sm">
            {confirmWord ? (
              <div className="space-y-3">
                <label className="text-xs font-bold text-white/70 uppercase tracking-widest block">
                  Type <span className="text-white font-bold">&quot;{confirmWord}&quot;</span> to confirm
                </label>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoFocus
                  placeholder={confirmWord}
                  className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 text-white font-semibold placeholder:text-white/30 focus:bg-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                />
              </div>
            ) : (
              <label className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-white/5 rounded-xl transition-colors">
                <div className="relative flex items-center justify-center pt-0.5 flex-shrink-0">
                  <input 
                    type="checkbox" 
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    autoFocus
                    className="w-5 h-5 appearance-none rounded border-2 border-white/30 bg-white/5 checked:bg-primary checked:border-primary transition-all peer cursor-pointer hover:border-white/50"
                  />
                  <span className="material-symbols-outlined absolute pointer-events-none text-black opacity-0 peer-checked:opacity-100 text-[16px] font-bold">check</span>
                </div>
                <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors select-none">
                  I understand that this action is permanent and cannot be undone.
                </span>
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
            >
              Cancel
            </button>
            <button 
              disabled={isButtonDisabled}
              onClick={handleConfirm}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
                ${danger 
                  ? 'bg-red-500/90 text-white hover:bg-red-500 hover:shadow-red-500/40 disabled:hover:shadow-red-500/20' 
                  : 'bg-primary text-black hover:brightness-125 hover:shadow-primary/40 disabled:hover:shadow-primary/20'}`}
            >
              {actionButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Portal to document.body so it escapes any parent overflow/z-index
  return createPortal(modal, document.body);
}

