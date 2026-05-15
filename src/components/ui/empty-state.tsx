type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cn-border bg-cn-surface/50 px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-cn-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-cn-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
