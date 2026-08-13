"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Lang = "hr" | "en";

type Therapist = {
  id: string;
  display_name: string;
};

type Service = {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  duration_minutes: number;
  price_cents: number | null;
  price_min_cents: number | null;
  price_max_cents: number | null;
  service_group: string | null;
  service_group_en: string | null;
  therapists: Therapist[];
};

type Slot = {
  start_time: string;
  end_time: string;
  employee_id: string;
  employee_name: string;
  room_id: string;
  room_name: string;
};

const text = {
  hr: {
    min: "min",
    back: "← Nazad na usluge",
    backToCategories: "← Nazad na kategorije",
    chooseService: "Odaberi uslugu",
    chooseCategory: "Odaberi kategoriju",
    chooseTherapist: "Odaberi terapeuta",
    chooseTherapistText: "Odaberi terapeuta kod kojeg želiš rezervirati termin.",
    categoryLabel: "Kategorija",
    chooseCategoryText:
      "Prvo odaberi kategoriju usluge, zatim odaberi tretman koji želiš rezervirati.",
    chooseServiceText: "Prikazane su samo usluge dostupne za online rezervaciju.",
    otherCategory: "Ostalo",
    dateTime: "Datum i vrijeme",
    selectedDate: "Odabrani datum",
    loading: "Učitavanje slobodnih termina...",
    noSlots: "Nema slobodnih termina za odabrani datum.",
    noTherapists: "Za ovu uslugu trenutačno nije postavljen terapeut.",
    freeSlots: "Slobodni sati",
    contactTitle: "Kontakt podaci",
    contactText:
      "Unesi svoje podatke kako bi salon mogao potvrditi rezervaciju. Broj telefona je obavezan jer ćeš SMS-om dobiti potvrdu ili povratnu informaciju.",
    selectedSlot: "Odabrani termin",
    therapistLabel: "Terapeut",
    fullName: "Ime i prezime *",
    phone: "Telefon *",
    phoneHelp:
      "SMS potvrde šalju se samo na hrvatske brojeve. Ako nemaš hrvatski broj, obavezno unesi email kako bi salon mogao poslati potvrdu emailom.",
    email: "Email (opcionalno)",
    note: "Napomena (opcionalno)",
    submit: "Pošalji zahtjev za rezervaciju",
    submitting: "Slanje zahtjeva...",
    chooseSlotFirst: "Prvo odaberi slobodan sat.",
    serviceInfo: "Trajanje tretmana:",
    priceLabel: "Cijena",
    alerts: {
      missingSlot: "Odaberi uslugu, datum i termin.",
      missingName: "Ime i prezime je obavezno.",
      availabilityError: "Greška pri dohvaćanju termina.",
      bookingError: "Greška pri rezervaciji.",
    },
  },
  en: {
    min: "min",
    back: "← Back to services",
    backToCategories: "← Back to categories",
    chooseService: "Choose a service",
    chooseCategory: "Choose a category",
    chooseTherapist: "Choose a therapist",
    chooseTherapistText: "Choose the therapist you would like to book with.",
    categoryLabel: "Category",
    chooseCategoryText:
      "First choose a service category, then select the treatment you would like to book.",
    chooseServiceText: "Only services available for online booking are shown.",
    otherCategory: "Other",
    dateTime: "Date and time",
    selectedDate: "Selected date",
    loading: "Loading available times...",
    noSlots: "No available times for the selected date.",
    noTherapists: "No therapist is currently assigned to this service.",
    freeSlots: "Available times",
    contactTitle: "Contact details",
    contactText:
      "Enter your details so the salon can review your request. Phone number is required because you will receive confirmation or feedback by SMS.",
    selectedSlot: "Selected appointment",
    therapistLabel: "Therapist",
    fullName: "Full name *",
    phone: "Phone *",
    phoneHelp:
      "SMS notifications are available only for Croatian phone numbers. If you do not have a Croatian number, please enter your email so the salon can send confirmation by email.",
    email: "Email (optional)",
    note: "Note (optional)",
    submit: "Send booking request",
    submitting: "Sending request...",
    chooseSlotFirst: "Please choose an available time first.",
    serviceInfo: "Treatment duration:",
    priceLabel: "Price",
    alerts: {
      missingSlot: "Please choose a service, date and time.",
      missingName: "Full name is required.",
      availabilityError: "Error loading available times.",
      bookingError: "Error sending booking request.",
    },
  },
};

function getServiceDescription(service: Service, lang: Lang) {
  if (lang === "en" && service.description_en?.trim()) return service.description_en;
  return service.description;
}

function getServiceName(service: Service, lang: Lang) {
  if (lang === "en" && service.name_en?.trim()) return service.name_en;
  return service.name;
}

function getRawServiceGroup(service: Service, lang: Lang) {
  if (lang === "en" && service.service_group_en?.trim()) return service.service_group_en;
  return service.service_group;
}

function normalizeCategory(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  if (!cleaned) return "";
  return cleaned.charAt(0).toLocaleUpperCase() + cleaned.slice(1);
}

function formatMoney(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

function formatServicePrice(service: Service) {
  if (service.price_min_cents != null && service.price_max_cents != null) {
    return `${formatMoney(service.price_min_cents)} – ${formatMoney(service.price_max_cents)}`;
  }
  if (service.price_cents != null) return formatMoney(service.price_cents);
  return null;
}

function formatDateInputValue(date: unknown) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(typeof date === "string" ? `${date}T00:00:00` : (date as any));
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getTodayValue() {
  return formatDateInputValue(new Date());
}

function formatDateDisplay(date: string, lang: Lang) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return lang === "en" ? `${day}/${month}/${year}` : `${day}.${month}.${year}.`;
}

function getVisibleDays(startDate: string, lang: Lang, days = 4) {
  const base = new Date(`${startDate}T00:00:00`);
  const locale = lang === "en" ? "en-GB" : "hr-HR";
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(base);
    date.setDate(date.getDate() + index);
    return {
      value: formatDateInputValue(date),
      dayName: date.toLocaleDateString(locale, { weekday: "short" }),
      dayNumber: date.toLocaleDateString(locale, { day: "2-digit" }),
      month: date.toLocaleDateString(locale, { month: "short" }),
    };
  });
}

export default function BookingClient({ services, lang }: { services: Service[]; lang: Lang }) {
  const router = useRouter();
  const today = getTodayValue();
  const t = text[lang];

  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarStartDate, setCalendarStartDate] = useState(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categoryItems = useMemo(() => {
    const map = new Map<string, string>();
    for (const service of services) {
      const raw = getRawServiceGroup(service, lang)?.trim() || t.otherCategory;
      const key = raw.toLocaleLowerCase().trim();
      if (!map.has(key)) map.set(key, normalizeCategory(raw));
    }
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [services, lang, t.otherCategory]);

  const filteredServices = useMemo(() => {
    if (!selectedGroupKey) return [];
    return services.filter((service) => {
      const raw = getRawServiceGroup(service, lang)?.trim() || t.otherCategory;
      return raw.toLocaleLowerCase().trim() === selectedGroupKey;
    });
  }, [services, selectedGroupKey, lang, t.otherCategory]);

  const selectedTherapist = selectedService?.therapists.find(
    (therapist) => therapist.id === selectedTherapistId,
  );

  const visibleDays = getVisibleDays(calendarStartDate, lang, 4);

  async function loadAvailability(service: Service, date: string, employeeId: string | null) {
    if (!employeeId) return;
    setLoading(true);
    setSlots([]);
    setSelectedSlot(null);

    try {
      const res = await fetch("/api/public/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, date, employeeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || t.alerts.availabilityError);
        return;
      }
      const suggestions: Slot[] = data.suggestions || [];
      setSlots(
        Array.from(
          new Map(suggestions.map((slot) => [slot.start_time, slot])).values(),
        ),
      );
    } catch (error) {
      console.error(error);
      alert(t.alerts.availabilityError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedService && selectedTherapistId && selectedDate) {
      loadAvailability(selectedService, selectedDate, selectedTherapistId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService, selectedTherapistId]);

  function chooseService(service: Service) {
    setSelectedService(service);
    setSelectedDate(today);
    setCalendarStartDate(today);
    setSlots([]);
    setSelectedSlot(null);
    setSelectedTherapistId(service.therapists.length === 1 ? service.therapists[0].id : null);
  }

  function goBackToServices() {
    setSelectedService(null);
    setSelectedTherapistId(null);
    setSelectedDate(today);
    setCalendarStartDate(today);
    setSlots([]);
    setSelectedSlot(null);
  }

  async function submitBooking() {
    if (submitting) return;
    if (!selectedService || !selectedDate || !selectedSlot) {
      alert(t.alerts.missingSlot);
      return;
    }
    if (!fullName.trim()) {
      alert(t.alerts.missingName);
      return;
    }

    const normalizedPhone = phone.trim().replace(/\s+/g, "");
    const hasCroatianPhone = normalizedPhone.startsWith("+385") || normalizedPhone.startsWith("00385") || normalizedPhone.startsWith("09");

    if (!phone.trim() && !email.trim()) {
      alert(lang === "en" ? "Please enter a Croatian phone number or an email address." : "Unesi hrvatski broj telefona ili email adresu.");
      return;
    }
    if (!hasCroatianPhone && !email.trim()) {
      alert(lang === "en" ? "SMS confirmations are available only for Croatian numbers. Please enter your email." : "SMS potvrde šalju se samo na hrvatske brojeve. Molimo unesi email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: selectedDate,
          slot: selectedSlot,
          fullName,
          phone,
          email,
          note,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || t.alerts.bookingError);
        return;
      }

      const params = new URLSearchParams({
        lang,
        id: data.requestId,
        date: selectedDate,
        time: selectedSlot.start_time,
        service: getServiceName(selectedService, lang),
      });
      router.push(`/booking/success?${params.toString()}`);
    } catch (error) {
      console.error(error);
      alert(t.alerts.bookingError);
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date();
  const filteredSlots = slots.filter(
    (slot) => new Date(`${selectedDate}T${slot.start_time}`) > now,
  );

  return (
    <div className="space-y-10">
      {!selectedService && (
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">
              {selectedGroupKey ? t.chooseService : t.chooseCategory}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6f5a50]">
              {selectedGroupKey ? t.chooseServiceText : t.chooseCategoryText}
            </p>
          </div>

          {!selectedGroupKey ? (
            <div className="grid gap-4 md:grid-cols-2">
              {categoryItems.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setSelectedGroupKey(category.key)}
                  className="rounded-2xl border border-[#eadbd2] bg-[#f8f3ef] p-5 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b6f5b]">{t.categoryLabel}</div>
                  <div className="mt-2 text-xl font-semibold">{category.label}</div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button type="button" onClick={() => setSelectedGroupKey(null)} className="mb-4 text-sm font-medium text-[#9b6f5b]">
                {t.backToCategories}
              </button>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredServices.map((service) => {
                  const price = formatServicePrice(service);
                  const description = getServiceDescription(service, lang);
                  return (
                    <button key={service.id} type="button" onClick={() => chooseService(service)} className="rounded-2xl border border-[#eadbd2] bg-[#f8f3ef] p-5 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
                      <div className="text-lg font-semibold">{getServiceName(service, lang)}</div>
                      {description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#6f5a50]">{description}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-[#6f5a50]">
                        <span>{service.duration_minutes} {t.min}</span>
                        {price ? <><span>·</span><span>{price}</span></> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {selectedService && (
        <section>
          <button type="button" onClick={goBackToServices} className="mb-6 text-sm font-medium text-[#9b6f5b]">{t.back}</button>

          <div className="mb-8 rounded-2xl border border-[#eadbd2] bg-[#f8f3ef] p-5">
            <h2 className="text-2xl font-semibold">{getServiceName(selectedService, lang)}</h2>
            {getServiceDescription(selectedService, lang) ? (
              <p className="mt-3 text-sm leading-7 text-[#6f5a50]">{getServiceDescription(selectedService, lang)}</p>
            ) : null}
            <p className="mt-2 text-sm text-[#6f5a50]">{t.serviceInfo} {selectedService.duration_minutes} {t.min}.</p>
            {formatServicePrice(selectedService) ? (
              <p className="mt-2 text-sm font-semibold">{t.priceLabel}: {formatServicePrice(selectedService)}</p>
            ) : null}
          </div>

          {selectedService.therapists.length === 0 ? (
            <div className="rounded-2xl border border-[#eadbd2] bg-white p-5 text-sm text-[#6f5a50]">{t.noTherapists}</div>
          ) : (
            <div className="grid gap-8">
              {selectedService.therapists.length > 1 && (
                <section className="rounded-[1.75rem] border border-[#eadbd2] bg-[#f8f3ef] p-6 md:p-8">
                  <h3 className="text-xl font-semibold">{t.chooseTherapist}</h3>
                  <p className="mt-2 text-sm text-[#6f5a50]">{t.chooseTherapistText}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {selectedService.therapists.map((therapist) => (
                      <button
                        key={therapist.id}
                        type="button"
                        onClick={() => {
                          setSelectedTherapistId(therapist.id);
                          setSelectedSlot(null);
                        }}
                        className={`rounded-2xl border p-4 text-left font-semibold transition ${selectedTherapistId === therapist.id ? "border-[#2f2723] bg-[#2f2723] text-white" : "border-[#eadbd2] bg-white hover:bg-[#fffaf7]"}`}
                      >
                        {therapist.display_name}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {selectedTherapistId && (
                <>
                  <section className="rounded-[1.75rem] border border-[#eadbd2] bg-[#f8f3ef] p-6 md:p-8">
                    <h3 className="text-xl font-semibold">{t.dateTime}</h3>
                    <div className="mt-5 flex items-center gap-3">
                      <button type="button" onClick={() => {
                        const previous = new Date(`${calendarStartDate}T00:00:00`);
                        previous.setDate(previous.getDate() - 4);
                        const previousValue = formatDateInputValue(previous);
                        setCalendarStartDate(previousValue < today ? today : previousValue);
                      }} disabled={calendarStartDate <= today} className="rounded-xl border border-[#eadbd2] bg-white px-4 py-3 text-sm font-semibold disabled:opacity-40">←</button>

                      <input type="date" value={selectedDate} min={today} onChange={(e) => {
                        const date = e.target.value;
                        setSelectedDate(date);
                        setCalendarStartDate(date);
                        loadAvailability(selectedService, date, selectedTherapistId);
                      }} className="min-w-0 flex-1 rounded-xl border border-[#eadbd2] bg-white px-4 py-3 text-sm outline-none" />

                      <button type="button" onClick={() => {
                        const next = new Date(`${calendarStartDate}T00:00:00`);
                        next.setDate(next.getDate() + 4);
                        setCalendarStartDate(formatDateInputValue(next));
                      }} className="rounded-xl border border-[#eadbd2] bg-white px-4 py-3 text-sm font-semibold">→</button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {visibleDays.map((day) => (
                        <button key={day.value} type="button" onClick={() => {
                          setSelectedDate(day.value);
                          loadAvailability(selectedService, day.value, selectedTherapistId);
                        }} className={`rounded-2xl border px-4 py-3 text-left transition ${selectedDate === day.value ? "border-[#2f2723] bg-[#2f2723] text-white" : "border-[#eadbd2] bg-white hover:bg-[#fffaf7]"}`}>
                          <div className="text-xs uppercase opacity-70">{day.dayName}</div>
                          <div className="mt-1 text-xl font-semibold">{day.dayNumber}</div>
                          <div className="text-xs opacity-70">{day.month}</div>
                        </button>
                      ))}
                    </div>

                    <p className="mt-4 text-sm text-[#6f5a50]">{t.selectedDate}: <span className="font-semibold text-[#2f2723]">{formatDateDisplay(selectedDate, lang)}</span></p>
                    {loading ? <p className="mt-6 text-sm text-[#6f5a50]">{t.loading}</p> : null}
                    {!loading && filteredSlots.length === 0 ? <p className="mt-6 rounded-xl bg-white p-4 text-sm text-[#6f5a50]">{t.noSlots}</p> : null}
                    {!loading && filteredSlots.length > 0 ? (
                      <div className="mt-8">
                        <h4 className="text-sm font-semibold text-[#6f5a50]">{t.freeSlots}</h4>
                        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-3">
                          {filteredSlots.map((slot) => (
                            <button key={`${slot.start_time}-${slot.employee_id}-${slot.room_id}`} type="button" onClick={() => setSelectedSlot(slot)} className={`rounded-2xl border px-3 py-4 text-center text-base font-semibold transition ${selectedSlot?.start_time === slot.start_time ? "border-[#2f2723] bg-[#2f2723] text-white" : "border-[#eadbd2] bg-white hover:bg-[#fffaf7]"}`}>
                              {slot.start_time}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-[1.75rem] border border-[#eadbd2] bg-white p-6 md:p-8">
                    <h3 className="text-xl font-semibold">{t.contactTitle}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#6f5a50]">{t.contactText}</p>
                    {selectedTherapist && selectedService.therapists.length > 1 ? <p className="mt-3 text-sm"><span className="text-[#6f5a50]">{t.therapistLabel}: </span><span className="font-semibold">{selectedTherapist.display_name}</span></p> : null}
                    {selectedSlot ? <div className="mt-5 rounded-xl bg-[#f8f3ef] p-4 text-sm text-[#6f5a50]">{t.selectedSlot}: <span className="font-semibold text-[#2f2723]">{formatDateDisplay(selectedDate, lang)} {selectedSlot.start_time} - {selectedSlot.end_time}</span></div> : null}
                    <input placeholder={t.fullName} value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-5 w-full rounded-xl border border-[#eadbd2] px-4 py-3 outline-none" />
                    <input placeholder={t.phone} value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-4 w-full rounded-xl border border-[#eadbd2] px-4 py-3 outline-none" />
                    <p className="mt-2 text-xs text-[#6f5a50]">{t.phoneHelp}</p>
                    <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-4 w-full rounded-xl border border-[#eadbd2] px-4 py-3 outline-none" />
                    <textarea placeholder={t.note} value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="mt-4 w-full resize-none rounded-xl border border-[#eadbd2] px-4 py-3 outline-none" />
                    <button type="button" onClick={submitBooking} disabled={submitting || !selectedSlot} className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#2f2723] py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                      {submitting ? t.submitting : t.submit}
                    </button>
                    {!selectedSlot ? <p className="mt-3 text-center text-xs text-[#6f5a50]">{t.chooseSlotFirst}</p> : null}
                  </section>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
