"use client";

import Link from "next/link";
import { useEffect } from "react";

const SCROLL_KEY = "audit-log-scroll-position";

export function AuditLogScrollRestorer() {
  useEffect(() => {
    const stored = sessionStorage.getItem(SCROLL_KEY);
    if (!stored) return;

    const top = Number(stored);
    if (Number.isFinite(top)) {
      requestAnimationFrame(() => window.scrollTo({ top, behavior: "auto" }));
    }
  }, []);

  return null;
}

export function AuditLogNavigationLink({
  href,
  children,
  className,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={ariaLabel}
      className={className}
      onClick={() => sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))}
    >
      {children}
    </Link>
  );
}
