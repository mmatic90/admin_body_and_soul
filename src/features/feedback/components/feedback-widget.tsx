"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { MessageCircle, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createFeedback } from "@/features/feedback/actions";

function detectBrowser(userAgent: string) {
  if (userAgent.includes("Edg/")) return "Microsoft Edge";
  if (userAgent.includes("Chrome/")) return "Google Chrome";
  if (userAgent.includes("Firefox/")) return "Mozilla Firefox";
  if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) return "Safari";
  return "Nepoznat preglednik";
}

function detectOperatingSystem(userAgent: string) {
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac OS")) return "macOS";
  if (userAgent.includes("Android")) return "Android";
  if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS";
  if (userAgent.includes("Linux")) return "Linux";
  return "Nepoznat operativni sustav";
}

export default function FeedbackWidget() {
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userAgent = window.navigator.userAgent;

    formData.set("pageUrl", window.location.href);
    formData.set("userAgent", userAgent);
    formData.set("browser", detectBrowser(userAgent));
    formData.set("operatingSystem", detectOperatingSystem(userAgent));
    formData.set("viewport", `${window.innerWidth}x${window.innerHeight}`);
    formData.set("language", window.navigator.language || "hr");
    formData.set("appVersion", process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0");

    startTransition(async () => {
      const result = await createFeedback(formData);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Hvala! Vaš feedback je zaprimljen. ❤️");
      formRef.current?.reset();
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-app-accent px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
        aria-label="Pošalji feedback"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Zatvori feedback"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
          />

          <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-app-soft bg-app-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-app-soft px-5 py-5 sm:px-7">
              <div>
                <h2 className="text-xl font-bold text-app-text">Feedback</h2>
                <p className="mt-1 text-sm leading-6 text-app-muted">
                  Pronašli ste grešku ili imate ideju? Svaka prijava pomaže unaprijediti Body &amp; Soul. Hvala vam! ❤️
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-xl border border-app-soft bg-white p-2 text-app-text transition hover:bg-app-bg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">
                <input type="hidden" name="pagePath" value={pathname} />

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-app-text">Vrsta</span>
                  <select
                    name="type"
                    defaultValue="bug"
                    required
                    className="w-full rounded-2xl border border-app-soft bg-white px-4 py-3 text-sm text-app-text outline-none transition focus:border-app-accent"
                  >
                    <option value="bug">🐞 Greška</option>
                    <option value="improvement">✨ Poboljšanje</option>
                    <option value="idea">💡 Ideja</option>
                    <option value="question">❓ Pitanje</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-app-text">Naslov</span>
                  <input
                    name="title"
                    required
                    minLength={3}
                    maxLength={160}
                    placeholder="Kratko opišite problem ili ideju"
                    className="w-full rounded-2xl border border-app-soft bg-white px-4 py-3 text-sm text-app-text outline-none transition placeholder:text-app-muted focus:border-app-accent"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-app-text">Opis</span>
                  <textarea
                    name="description"
                    required
                    minLength={5}
                    maxLength={5000}
                    rows={7}
                    placeholder="Napišite što se dogodilo, što ste očekivali ili kako bi poboljšanje trebalo raditi."
                    className="w-full resize-y rounded-2xl border border-app-soft bg-white px-4 py-3 text-sm text-app-text outline-none transition placeholder:text-app-muted focus:border-app-accent"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-app-text">Prioritet</span>
                  <select
                    name="priority"
                    defaultValue="medium"
                    className="w-full rounded-2xl border border-app-soft bg-white px-4 py-3 text-sm text-app-text outline-none transition focus:border-app-accent"
                  >
                    <option value="low">Nizak</option>
                    <option value="medium">Srednji</option>
                    <option value="high">Visok</option>
                    <option value="critical">Kritičan</option>
                  </select>
                </label>

                <label className="block rounded-2xl border border-dashed border-app-soft bg-app-card-alt p-4 transition hover:bg-app-bg">
                  <span className="flex items-center gap-2 text-sm font-semibold text-app-text">
                    <Upload className="h-4 w-4" /> Screenshot, po želji
                  </span>
                  <span className="mt-1 block text-xs text-app-muted">PNG, JPG ili WebP, najviše 5 MB</span>
                  <input
                    type="file"
                    name="screenshot"
                    accept="image/png,image/jpeg,image/webp"
                    className="mt-3 block w-full text-sm text-app-muted file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-app-text"
                  />
                </label>

                <p className="rounded-2xl bg-app-card-alt px-4 py-3 text-xs leading-5 text-app-muted">
                  Uz prijavu će se automatski poslati trenutna stranica, preglednik, operativni sustav i veličina prozora kako bi se problem lakše pronašao.
                </p>
              </div>

              <div className="flex gap-3 border-t border-app-soft px-5 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1 rounded-2xl border border-app-soft bg-white px-4 py-3 text-sm font-semibold text-app-text transition hover:bg-app-bg disabled:opacity-60"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-app-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPending ? "Šaljem..." : "Pošalji feedback"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
