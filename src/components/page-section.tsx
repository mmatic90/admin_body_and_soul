import { ReactNode } from "react";

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export default function PageSection({
  title,
  description,
  children,
  actions,
}: Props) {
  const hasHeader = title || description || actions;

  return (
    <section className="rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm">
      {hasHeader && (
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 className="text-xl font-semibold tracking-tight text-app-text">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 max-w-2xl text-sm text-app-muted">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
