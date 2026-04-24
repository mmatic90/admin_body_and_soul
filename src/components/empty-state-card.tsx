import { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyStateCard({ title, description, action }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-app-soft bg-app-card-alt p-8 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-app-text">{title}</h3>

      <p className="mt-2 text-sm text-app-muted max-w-md mx-auto">
        {description}
      </p>

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
