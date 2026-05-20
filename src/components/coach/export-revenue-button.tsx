"use client";

import { useState } from "react";

export function ExportRevenueButton({ data }: { data: { date: string; revenue: number }[] }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    
    try {
      const headers = ["Date", "Revenue (USD)"];
      const csvContent = [
        headers.join(","),
        ...data.map(row => `${row.date},${row.revenue}`)
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `revenue-export-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button 
      onClick={handleExport}
      disabled={exporting}
      className="bg-cn-border/50 hover:bg-cn-border dark:bg-white/5 dark:hover:bg-white/10 border border-cn-border dark:border-white/10 rounded-lg px-4 py-2 text-[10px] font-black text-cn-ink dark:text-white transition-all uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
    >
      {exporting ? "Exporting..." : "Export CSV"}
    </button>
  );
}
