type DataTableColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No data available",
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-cn-border bg-cn-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cn-border bg-cn-canvas/50">
              {columns.map(col => (
                <th key={col.key} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-cn-ink-subtle ${col.className ?? ""}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cn-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-cn-ink-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className={`transition-colors hover:bg-cn-canvas/60 ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-4 py-3.5 text-cn-ink ${col.className ?? ""}`}>
                      {col.render ? col.render(row) : (row[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
