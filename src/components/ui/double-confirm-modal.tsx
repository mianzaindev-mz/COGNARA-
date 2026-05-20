"use client";

import { useState } from "react";

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

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmWord && inputValue !== confirmWord) return;
    if (!confirmWord && !checked) return;
    
    // reset state
    setInputValue("");
    setChecked(false);
    onConfirm();
  };

  const isButtonDisabled = confirmWord ? inputValue !== confirmWord : !checked;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#131313] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                {danger ? 'warning' : 'gpp_maybe'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-on-surface">{title}</h2>
          </div>
          
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {description}
          </p>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
            {confirmWord ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Type <strong className="text-white">"{confirmWord}"</strong> to confirm
                </label>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/30"
                  placeholder={confirmWord}
                />
              </div>
            ) : (
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center pt-0.5">
                  <input 
                    type="checkbox" 
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    className="w-5 h-5 appearance-none rounded border border-white/20 bg-black/30 checked:bg-primary checked:border-primary transition-all peer cursor-pointer"
                  />
                  <span className="material-symbols-outlined absolute pointer-events-none text-white opacity-0 peer-checked:opacity-100 text-[16px] font-bold">check</span>
                </div>
                <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors select-none">
                  I understand that this action is permanent and cannot be undone.
                </span>
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-white/5 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={isButtonDisabled}
              onClick={handleConfirm}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
                ${danger 
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20 hover:shadow-red-500/40' 
                  : 'bg-primary text-black hover:brightness-110 shadow-primary/20 hover:shadow-primary/40'}`}
            >
              {actionButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
