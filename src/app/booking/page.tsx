import Link from "next/link";

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-[#f8f3ef] px-6 py-10 text-[#2f2723]">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-[#9b6f5b]">
          ← Povratak na početnu
        </Link>

        <section className="mt-10 rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9b6f5b]">
            Online rezervacije
          </p>

          <h1 className="mt-3 text-4xl font-semibold">
            Rezerviraj svoj termin
          </h1>

          <p className="mt-5 leading-8 text-[#6f5a50]">
            Ovdje ćemo u sljedećem koraku dodati odabir usluge, slobodne termine
            i obrazac za podatke klijenta.
          </p>

          <div className="mt-8 rounded-2xl border border-dashed border-[#d8b6a4] bg-[#f8f3ef] p-6 text-sm text-[#6f5a50]">
            Sljedeći korak: prikaz samo onih usluga koje su u adminu označene
            kao dostupne za online rezervacije.
          </div>
        </section>
      </div>
    </main>
  );
}