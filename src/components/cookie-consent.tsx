"use client";

import { useEffect, useState } from "react";

const COOKIE_KEY = "bodyandsoul_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(COOKIE_KEY);
    if (!saved) setVisible(true);
  }, []);

  function acceptCookies() {
    window.localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  }

  function rejectCookies() {
    window.localStorage.setItem(COOKIE_KEY, "rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-2xl border border-[#eadbd2] bg-white p-5 shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-semibold text-[#2f2723]">Kolačići</h2>
          <p className="mt-1 text-sm leading-6 text-[#6f5a50]">
            Ova stranica koristi osnovne kolačiće za ispravan rad stranice i
            poboljšanje korisničkog iskustva. Trenutno ne koristimo marketinške
            kolačiće.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={rejectCookies}
            className="rounded-xl border border-[#eadbd2] px-4 py-2 text-sm font-semibold text-[#2f2723]"
          >
            Odbij
          </button>

          <button
            type="button"
            onClick={acceptCookies}
            className="rounded-xl bg-[#2f2723] px-4 py-2 text-sm font-semibold text-white"
          >
            Prihvati
          </button>
        </div>
      </div>
    </div>
  );
}
