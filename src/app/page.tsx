import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  Star,
} from "lucide-react";
import CookieConsent from "@/components/cookie-consent";
import PublicFooter from "@/components/public-footer";

const services = [
  {
    title: "Njega lica",
    text: "Individualni tretmani za njegu, hidrataciju i osvježenje kože.",
  },
  {
    title: "Masaže",
    text: "Opuštajući tretmani za tijelo, cirkulaciju i smanjenje napetosti.",
  },
  {
    title: "Njega ruku i nogu",
    text: "Manikura, pedikura i profesionalna njega za uredan izgled.",
  },
  {
    title: "Body programi",
    text: "Tretmani za oblikovanje tijela i osjećaj lakoće.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f8f3ef] text-[#2f2723]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#e8cfc0,transparent_35%),radial-gradient(circle_at_bottom_left,#d8b6a4,transparent_30%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#9b6f5b]">
                Beauty salon
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Body & Soul
              </h1>
            </div>

            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <a href="#usluge" className="hover:text-[#9b6f5b]">
                Usluge
              </a>
              <a href="#o-nama" className="hover:text-[#9b6f5b]">
                O nama
              </a>
              <a href="#kontakt" className="hover:text-[#9b6f5b]">
                Kontakt
              </a>
              <Link
                href="/booking"
                className="rounded-full bg-[#2f2723] px-5 py-2.5 text-white transition hover:bg-[#4a3932]"
              >
                Rezerviraj termin
              </Link>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d7b9a8] bg-white/60 px-4 py-2 text-sm text-[#7b594b] shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Profesionalna njega u opuštajućem ambijentu
              </div>

              <h2 className="text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
                Ljepota, njega i mir na jednom mjestu.
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-[#6f5a50]">
                Body & Soul je salon posvećen individualnom pristupu,
                kvalitetnim tretmanima i ugodnom iskustvu od prvog dolaska do
                završetka tretmana.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2723] px-7 py-4 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#4a3932]"
                >
                  <CalendarCheck className="h-5 w-5" />
                  Rezerviraj termin
                </Link>

                <a
                  href="#kontakt"
                  className="inline-flex items-center justify-center rounded-full border border-[#c9a997] bg-white/60 px-7 py-4 font-semibold text-[#2f2723] transition hover:bg-white"
                >
                  Kontaktiraj salon
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/50 p-4 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] bg-[#2f2723] p-8 text-white">
                <div className="flex items-center gap-2 text-[#e8cfc0]">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>

                <p className="mt-8 text-2xl font-medium leading-relaxed">
                  “Mjesto gdje se profesionalna njega spaja s opuštanjem i
                  osjećajem potpune pažnje.”
                </p>

                <div className="mt-10 grid gap-4 text-sm text-[#eadbd2]">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5" />
                    Radno vrijeme prema dogovorenim terminima
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5" />
                    Rovinj, Hrvatska
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5" />
                    Kontakt podaci uskoro
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="usluge" className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9b6f5b]">
            Usluge
          </p>
          <h3 className="mt-3 text-4xl font-semibold">
            Tretmani prilagođeni tvojim potrebama
          </h3>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-3xl border border-[#eadbd2] bg-white/70 p-6 shadow-sm"
            >
              <h4 className="text-xl font-semibold">{service.title}</h4>
              <p className="mt-3 leading-7 text-[#6f5a50]">{service.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="o-nama" className="bg-white/60 px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9b6f5b]">
              O nama
            </p>
            <h3 className="mt-3 text-4xl font-semibold">
              Salon u kojem je svaki tretman osobno iskustvo.
            </h3>
          </div>

          <p className="text-lg leading-9 text-[#6f5a50]">
            Naša filozofija je jednostavna: kvalitetna usluga, pažljiv pristup i
            ugodan ambijent. Svakom klijentu pristupamo individualno, uz
            preporuku tretmana prema stvarnim potrebama.
          </p>
        </div>
      </section>

      <section id="kontakt" className="mx-auto max-w-7xl px-6 py-24">
        <div className="rounded-[2rem] bg-[#2f2723] p-8 text-white md:p-12">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#e8cfc0]">
                Kontakt
              </p>
              <h3 className="mt-3 text-4xl font-semibold">
                Želiš rezervirati termin?
              </h3>
              <p className="mt-5 leading-8 text-[#eadbd2]">
                Rezervaciju ćeš uskoro moći napraviti direktno online. Za sada
                možeš koristiti ovu stranicu kao osnovu javnog weba.
              </p>
            </div>

            <div className="flex items-center md:justify-end">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 font-semibold text-[#2f2723] transition hover:bg-[#eadbd2]"
              >
                Otvori online rezervacije
              </Link>
            </div>
          </div>
        </div>
      </section>
      <CookieConsent />
      <PublicFooter />
    </main>
  );
}
