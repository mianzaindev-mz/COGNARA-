"use client";

import { JUDGE0_LANGUAGES, type LanguageKey } from "@/lib/compiler/judge0";

const languages = Object.entries(JUDGE0_LANGUAGES).map(([key, val]) => ({
  key: key as LanguageKey,
  label: val.label,
}));

type Props = {
  value: LanguageKey;
  onChange: (lang: LanguageKey) => void;
};

export function LanguageSelector({ value, onChange }: Props) {
  return (
    <select
      id="language-selector"
      value={value}
      onChange={(e) => onChange(e.target.value as LanguageKey)}
      className="h-9 rounded-xl border border-cn-border bg-cn-surface px-3 text-sm font-medium text-cn-ink outline-none transition focus:border-cn-orange focus:ring-2 focus:ring-cn-orange/20"
    >
      {languages.map((l) => (
        <option key={l.key} value={l.key}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
