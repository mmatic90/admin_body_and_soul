import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export default function DashboardLinkCard({
  href,
  title,
  description,
  icon: Icon,
}: Props) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-app-soft bg-app-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-app-card-alt hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-white p-3 transition group-hover:bg-app-bg">
          <Icon className="h-6 w-6 text-app-muted transition group-hover:text-app-accent" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-app-text">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-app-muted">{description}</p>
        </div>
      </div>
    </Link>
  );
}
