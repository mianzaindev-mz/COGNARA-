// src/app/coach/grade-scales/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast-provider";
import { getStandardGradeScale } from "@/lib/utils/grading";
import { Badge } from "@/components/ui/badge";

type GradeScaleRow = {
  letter: string;
  min_pct: number;
  max_pct: number;
  grade_point: number;
  label: string;
};

type GradeScale = {
  id: string;
  name: string;
  is_default: boolean;
  grades: GradeScaleRow[];
  passing_grade: string;
  coach_id: string;
  created_at: string;
};

export default function GradeScalesBuilderPage() {
  const { notify } = useToast();
  const [scales, setScales] = useState<GradeScale[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Editor State
  const [selectedScale, setSelectedScale] = useState<GradeScale | null>(null);
  const [scaleName, setScaleName] = useState("");
  const [passingGrade, setPassingGrade] = useState("D");
  const [isDefault, setIsDefault] = useState(false);
  const [grades, setGrades] = useState<GradeScaleRow[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadScales = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/grade-scales");
      const data = await res.json();
      if (res.ok) {
        setScales(data.scales || []);
      }
    } catch {
      notify({ title: "Load Error", description: "Failed to retrieve grade scales.", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScales();
  }, []);

  // Set default Standard Scale for new creations
  const handleNewScale = () => {
    setSelectedScale(null);
    setScaleName("New Custom Scale");
    setPassingGrade("D");
    setIsDefault(false);
    setGrades(getStandardGradeScale());
    setIsEditing(true);
    setValidationError(null);
  };

  const handleSelectScale = (scale: GradeScale) => {
    setSelectedScale(scale);
    setScaleName(scale.name);
    setPassingGrade(scale.passing_grade || "D");
    setIsDefault(scale.is_default);
    setGrades(scale.grades);
    setIsEditing(true);
    setValidationError(null);
  };

  // Perform Live Validation on changes
  useEffect(() => {
    if (!isEditing || grades.length === 0) return;
    
    const sorted = [...grades].sort((a, b) => a.min_pct - b.min_pct);
    if (sorted[0].min_pct !== 0) {
      setValidationError("Grade scale must start at 0%.");
      return;
    }
    if (sorted[sorted.length - 1].max_pct !== 100) {
      setValidationError("Grade scale must cover up to 100%.");
      return;
    }

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].min_pct !== sorted[i - 1].max_pct + 1) {
        setValidationError(`Gap or overlap detected between ${sorted[i - 1].letter} (${sorted[i - 1].min_pct}-${sorted[i - 1].max_pct}%) and ${sorted[i].letter} (${sorted[i].min_pct}-${sorted[i].max_pct}%). Values must be contiguous (e.g. 59% and 60%).`);
        return;
      }
    }

    setValidationError(null);
  }, [grades, isEditing]);

  const handleRowChange = (index: number, field: keyof GradeScaleRow, value: any) => {
    const updated = [...grades];
    if (field === "min_pct" || field === "max_pct") {
      updated[index] = { ...updated[index], [field]: parseInt(value, 10) || 0 };
    } else if (field === "grade_point") {
      updated[index] = { ...updated[index], [field]: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setGrades(updated);
  };

  const handleAddRow = () => {
    setGrades(prev => [
      ...prev,
      { letter: "New", min_pct: 0, max_pct: 0, grade_point: 1.0, label: "Description" }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setGrades(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) {
      notify({ title: "Validation Blocked", description: validationError, tone: "warning" });
      return;
    }
    if (!scaleName.trim()) {
      notify({ title: "Validation Error", description: "Scale name is required.", tone: "error" });
      return;
    }

    setSaveLoading(true);
    const url = selectedScale ? `/api/grade-scales/${selectedScale.id}` : "/api/grade-scales";
    const method = selectedScale ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scaleName,
          is_default: isDefault,
          passing_grade: passingGrade,
          grades: grades.sort((a, b) => b.min_pct - a.min_pct) // Keep sorted descending
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      notify({ title: "Scale Saved", description: "Grade scale saved successfully.", tone: "success" });
      setIsEditing(false);
      loadScales();
    } catch (err: any) {
      notify({ title: "Save Failed", description: err.message || "Failed to commit scale.", tone: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (scaleId: string) => {
    if (!confirm("Are you sure you want to delete this scale?")) return;
    try {
      const res = await fetch(`/api/grade-scales/${scaleId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      notify({ title: "Deleted", description: "Scale deleted successfully.", tone: "success" });
      if (selectedScale?.id === scaleId) {
        setIsEditing(false);
      }
      loadScales();
    } catch (err: any) {
      notify({ title: "Delete Blocked", description: err.message, tone: "error" });
    }
  };

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-7xl h-full pb-8">
      <section className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-cn-ink flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-500 animate-pulse text-[28px]">scale</span>
          Professor Grade Scales
        </h1>
        <p className="text-sm text-cn-ink-muted">Define customizable grading standards, GPA limits, and passing letter metrics for quiz attempts.</p>
      </section>

      <div className="flex gap-6 items-start flex-1 min-h-[550px]">
        {/* Left Side: Scale List */}
        <div className="w-1/3 shrink-0 border border-cn-border bg-cn-surface p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-cn-border">
            <span className="text-xs font-bold text-cn-ink uppercase">Your Grade Scales</span>
            <button
              onClick={handleNewScale}
              className="py-1 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 shadow-md shadow-rose-600/20"
            >
              <span className="material-symbols-outlined text-[12px]">add</span>
              Create New
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-cn-ink-subtle">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500/20 border-t-rose-500 inline-block mb-2" />
              <p>Loading scale parameters...</p>
            </div>
          ) : scales.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-cn-ink-subtle opacity-40">gavel</span>
              <p className="text-xs font-bold text-cn-ink">No Custom Scales Defined</p>
              <p className="text-[10px] text-cn-ink-subtle">You are currently using the default system Standard scale.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {scales.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectScale(s)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    selectedScale?.id === s.id
                      ? "bg-cn-canvas border-rose-500/30"
                      : "bg-cn-surface hover:bg-cn-canvas border-cn-border"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-cn-ink">{s.name}</span>
                    {s.is_default && (
                      <Badge variant="success" size="sm">
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-cn-ink-subtle pt-1 border-t border-cn-border/30">
                    <span>Passing letter: <strong className="text-rose-500">{s.passing_grade}</strong></span>
                    <span>{s.grades.length} letter divisions</span>
                  </div>
                  {s.coach_id !== "system" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(s.id);
                      }}
                      className="text-[10px] text-red-500 hover:text-red-600 self-end font-semibold flex items-center mt-1"
                    >
                      <span className="material-symbols-outlined text-[12px] mr-0.5">delete</span>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Builder workspace */}
        <div className="flex-1 border border-cn-border bg-cn-surface p-6 rounded-2xl shadow-sm min-h-[500px] flex flex-col">
          {isEditing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-5 flex-grow">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-cn-ink-subtle mb-1">Grade Scale Name</label>
                  <input
                    type="text"
                    required
                    value={scaleName}
                    onChange={(e) => setScaleName(e.target.value)}
                    className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3.5 py-2 text-xs text-cn-ink outline-none focus:border-rose-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cn-ink-subtle mb-1">Min Passing Letter</label>
                  <select
                    value={passingGrade}
                    onChange={(e) => setPassingGrade(e.target.value)}
                    className="w-full bg-cn-canvas border border-cn-border rounded-xl px-3.5 py-2 text-xs text-cn-ink outline-none focus:border-rose-500/40"
                  >
                    {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Default setup toggle */}
              <label className="flex items-center gap-2.5 text-xs text-cn-ink-subtle cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="accent-rose-500 h-4 w-4 rounded border-cn-border"
                />
                <span>Set as default scale for all of my course evaluations</span>
              </label>

              {/* Grades Table */}
              <div className="flex-grow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-cn-ink">Division Ranges (Contiguous Coverage)</span>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="py-1 px-2.5 bg-cn-canvas border border-cn-border rounded-lg text-[10px] text-cn-ink font-semibold flex items-center gap-1 hover:bg-cn-border transition"
                  >
                    <span className="material-symbols-outlined text-[12px]">add</span>
                    Add Custom Row
                  </button>
                </div>

                <div className="max-h-[350px] overflow-y-auto custom-scrollbar border border-cn-border rounded-xl">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-cn-canvas border-b border-cn-border sticky top-0 text-cn-ink-subtle font-bold">
                      <tr>
                        <th className="px-4 py-2.5">Letter</th>
                        <th className="px-4 py-2.5">Min %</th>
                        <th className="px-4 py-2.5">Max %</th>
                        <th className="px-4 py-2.5">GPA Point</th>
                        <th className="px-4 py-2.5">Label Description</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cn-border text-cn-ink">
                      {grades.map((row, i) => (
                        <tr key={i} className="hover:bg-cn-canvas/50">
                          <td className="px-4 py-1.5 w-16">
                            <input
                              type="text"
                              value={row.letter}
                              maxLength={3}
                              onChange={(e) => handleRowChange(i, "letter", e.target.value)}
                              className="w-12 bg-cn-canvas border border-cn-border rounded px-1.5 py-0.5 text-center font-bold text-cn-ink uppercase outline-none"
                            />
                          </td>
                          <td className="px-4 py-1.5 w-20">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={row.min_pct}
                              onChange={(e) => handleRowChange(i, "min_pct", e.target.value)}
                              className="w-16 bg-cn-canvas border border-cn-border rounded px-1.5 py-0.5 text-center text-cn-ink outline-none"
                            />
                          </td>
                          <td className="px-4 py-1.5 w-20">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={row.max_pct}
                              onChange={(e) => handleRowChange(i, "max_pct", e.target.value)}
                              className="w-16 bg-cn-canvas border border-cn-border rounded px-1.5 py-0.5 text-center text-cn-ink outline-none"
                            />
                          </td>
                          <td className="px-4 py-1.5 w-24">
                            <input
                              type="number"
                              min={0}
                              max={4}
                              step={0.1}
                              value={row.grade_point}
                              onChange={(e) => handleRowChange(i, "grade_point", e.target.value)}
                              className="w-20 bg-cn-canvas border border-cn-border rounded px-1.5 py-0.5 text-center text-cn-ink outline-none"
                            />
                          </td>
                          <td className="px-4 py-1.5">
                            <input
                              type="text"
                              value={row.label}
                              onChange={(e) => handleRowChange(i, "label", e.target.value)}
                              className="w-full bg-cn-canvas border border-cn-border rounded px-2 py-0.5 text-cn-ink outline-none"
                            />
                          </td>
                          <td className="px-4 py-1.5 text-right w-16">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(i)}
                              className="text-red-500 hover:text-red-600 transition flex items-center ml-auto"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Validation Warning Callout */}
              {validationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">warning</span>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Action Buttons panel */}
              <div className="flex justify-end gap-2 border-t border-cn-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-cn-canvas hover:bg-cn-border text-cn-ink rounded-xl text-xs font-bold transition border border-cn-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading || !!validationError}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                  {saveLoading ? "Saving scale parameters..." : "Save Scale"}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 h-full flex flex-col gap-2 items-center justify-center text-center text-cn-ink-subtle my-auto">
              <span className="material-symbols-outlined text-4xl opacity-40">space_dashboard</span>
              <p className="text-xs font-bold">Workspace Inactive</p>
              <p className="text-[10px] max-w-[200px] leading-relaxed mx-auto">Select a grade scale from the left panel to inspect parameters, or click "+ Create New" to construct custom evaluation metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
