import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  maxWidth?: string;
};

export default function PageShell({ children, maxWidth = "max-w-7xl" }: Props) {
  return (
    <main className="min-h-screen bg-app-bg p-4 md:p-6 lg:p-8">
      <div className={`mx-auto w-full space-y-6 ${maxWidth}`}>{children}</div>
    </main>
  );
}
