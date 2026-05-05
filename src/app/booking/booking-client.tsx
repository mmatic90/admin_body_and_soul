"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Lang = "hr" | "en";

type Service = {
  id: string;
  name: string;
  name_en: string | null;
  duration_minutes: number;
  service_group: string | null;
  service_group_en: string | null;
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
    chooseService: "Odaberi uslugu",
    chooseServiceText:
      "Prikazane su samo usluge dostupne za online rezervaciju.",
    dateTime: "Datum i vrijeme",
    selectedDate: "Odabrani datum",
    loading: "Učitavanje slobodnih termina...",
    noSlots: "Nema slobodnih termina za odabrani datum.",
    freeSlots: "Slobodni sati",
    contactTitle: "Kontakt podaci",
    contactText:
      "Unesi svoje podatke kako bi salon mogao potvrditi rezervaciju. Broj telefona je obavezan jer ćeš SMS-om dobiti potvrdu ili povratnu informaciju.",
    selectedSlot: "Odabrani termin",
    fullName: "Ime i prezime *",
    phone: "Telefon *",
    phoneHelp:
      "Broj telefona je obavezan jer ćeš putem SMS-a dobiti potvrdu ili povratnu informaciju o rezervaciji.",
    email: "Email (opcionalno)",
    note: "Napomena (opcionalno)",
    submit: "Pošalji zahtjev za rezervaciju",
    submitting: "Slanje zahtjeva...",
    chooseSlotFirst: "Prvo odaberi slobodan sat.",
    serviceInfo: "Odaberi datum i početak termina. Trajanje tretmana:",
    alerts: {
      missingSlot: "Odaberi uslugu, datum i termin.",
      missingName: "Ime i prezime je obavezno.",
      missingPhone: "Broj telefona je obavezan.",
      availabilityError: "Greška pri dohvaćanju termina.",
      bookingError: "Greška pri rezervaciji.",
    },
  },
  en: {
    min: "min",
    back: "← Back to services",
    chooseService: "Choose a service",
    chooseServiceText: "Only services available for online booking are shown.",
    dateTime: "Date and time",
    selectedDate: "Selected date",
    loading: "Loading available times...",
    noSlots: "No available times for the selected date.",
    freeSlots: "Available times",
    contactTitle: "Contact details",
    contactText:
      "Enter your details so the salon can review your request. Phone number is required because you will receive confirmation or feedback by SMS.",
    selectedSlot: "Selected appointment",
    fullName: "Full name *",
    phone: "Phone *",
    phoneHelp:
      "Phone number is required because you will receive confirmation or feedback about your booking request by SMS.",
    email: "Email (optional)",
    note: "Note (optional)",
    submit: "Send booking request",
    submitting: "Sending request...",
    chooseSlotFirst: "Please choose an available time first.",
    serviceInfo: "Choose a date and start time. Treatment duration:",
    alerts: {
      missingSlot: "Please choose a service, date and time.",
      missingName: "Full name is required.",
      missingPhone: "Phone number is required.",
      availabilityError: "Error loading available times.",
      bookingError: "Error sending booking request.",
    },
  },
};

function getServiceName(service: Service, lang: Lang) {
  if (lang === "en" && service.name_en?.trim()) return service.name_en;
  return service.name;
}

function getServiceGroup(service: Service, lang: Lang) {
  if (lang === "en" && service.service_group_en?.trim()) {
    return service.service_group_en;
  }

  return service.service_group;
}

function formatDateInputValue(date: unknown) {
  if (!date) return "";

  let d: Date;

  if (date instanceof Date) {
    d = date;
  } else if (typeof date === "string") {
    d = new Date(`${date}T00:00:00`);
  } else {
    d = new Date(date as any);
  }

  if (Number.isNaN(d.getTime())) {
    console.error("Invalid date passed:", date);
    return "";
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayValue() {
  return formatDateInputValue(new Date());
}

function formatDateDisplay(date: string, lang: Lang) {
  if (!date) return "";
  const [year, month, day] = date.split("-");

  if (lang === "en") return `${day}/${month}/${year}`;
  return `${day}.${month}.${year}.`;
}

function getVisibleDays(startDate: string, lang: Lang, days = 4) {
  const base = new Date(`${startDate}T00:00:00`);
  const locale = lang === "en" ? "en-GB" : "hr-HR";

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(base);
    date.setDate(date.getDate() + index);

    const value = formatDateInputValue(date);

    return {
      value,
      dayName: date.toLocaleDateString(locale, { weekday: "short" }),
      dayNumber: date.toLocaleDateString(locale, { day: "2-digit" }),
      month: date.toLocaleDateString(locale, { month: "short" }),
    };
  });
}

export default function BookingClient({
  services,
  lang,
}: {
  services: Service[];
  lang: Lang;
}) {
  const router = useRouter();
  const today = getTodayValue();
  const t = text[lang];

  const [selectedService, setSelectedService] = useState<Service | null>(null);
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

  const visibleDays = getVisibleDays(calendarStartDate, lang, 4);

  async function loadAvailability(service: Service, date: string) {
    setLoading(true);
    setSlots([]);
    setSelectedSlot(null);

    try {
      const res = await fetch("/api/public/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: service.id,
          date,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || t.alerts.availabilityError);
        return;
      }

      const suggestions: Slot[] = data.suggestions || [];

      const uniqueByTime = Array.from(
        new Map(suggestions.map((slot) => [slot.start_time, slot])).values(),
      );

      setSlots(uniqueByTime);
    } catch (error) {
      console.error(error);
      alert(t.alerts.availabilityError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailability(selectedService, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService]);

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

    if (!phone.trim()) {
      alert(t.alerts.missingPhone);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: selectedDate,
          slot: selectedSlot,
          fullName,
          phone,
          email,
          note,
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

  const filteredSlots = slots.filter((slot) => {
    const slotDateTime = new Date(`${selectedDate}T${slot.start_time}`);
    return slotDateTime > now;
  });

  return (
    <div className="space-y-10">
      {!selectedService && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">{t.chooseService}</h2>
            <p className="mt-2 text-sm leading-6 text-[#6f5a50]">
              {t.chooseServiceText}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => {
              const group = getServiceGroup(service, lang);

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setSelectedService(service);
                    setSelectedDate(today);
                    setCalendarStartDate(today);
                  }}
                  className="group rounded-2xl border border-[#eadbd2] bg-[#f8f3ef] p-5 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                >
                  {group ? (
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9b6f5b]">
                      {group}
                    </div>
                  ) : null}

                  <div className="mt-2 text-lg font-semibold">
                    {getServiceName(service, lang)}
                  </div>

                  <div className="mt-2 text-sm text-[#6f5a50]">
                    {service.duration_minutes} {t.min}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedService && (
        <div>
          <button
            type="button"
            onClick={() => {
              setSelectedService(null);
              setSelectedDate(today);
              setCalendarStartDate(today);
              setSlots([]);
              setSelectedSlot(null);
            }}
            className="mb-6 text-sm font-medium text-[#9b6f5b]"
          >
            {t.back}
          </button>

          <div className="mb-8 rounded-2xl border border-[#eadbd2] bg-[#f8f3ef] p-5">
            <h2 className="text-2xl font-semibold">
              {getServiceName(selectedService, lang)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6f5a50]">
              {t.serviceInfo} {selectedService.duration_minutes} {t.min}.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#eadbd2] bg-[#f8f3ef] p-6">
              <h3 className="text-xl font-semibold">{t.dateTime}</h3>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const previous = new Date(`${calendarStartDate}T00:00:00`);
                    previous.setDate(previous.getDate() - 4);

                    const previousValue = formatDateInputValue(previous);
                    const safeValue =
                      previousValue < today ? today : previousValue;

                    setCalendarStartDate(safeValue);
                  }}
                  disabled={calendarStartDate <= today}
                  className="rounded-xl border border-[#eadbd2] bg-white px-4 py-3 text-sm font-semibold disabled:opacity-40"
                >
                  ←
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={(e) => {
                    const date = e.target.value;
                    setSelectedDate(date);
                    setCalendarStartDate(date);
                    loadAvailability(selectedService, date);
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-[#eadbd2] bg-white px-4 py-3 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(`${calendarStartDate}T00:00:00`);
                    next.setDate(next.getDate() + 4);
                    setCalendarStartDate(formatDateInputValue(next));
                  }}
                  className="rounded-xl border border-[#eadbd2] bg-white px-4 py-3 text-sm font-semibold"
                >
                  →
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {visibleDays.map((day) => {
                  const active = selectedDate === day.value;

                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        setSelectedDate(day.value);
                        loadAvailability(selectedService, day.value);
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-[#2f2723] bg-[#2f2723] text-white"
                          : "border-[#eadbd2] bg-white hover:bg-[#fffaf7]"
                      }`}
                    >
                      <div className="text-xs uppercase opacity-70">
                        {day.dayName}
                      </div>
                      <div className="mt-1 text-xl font-semibold">
                        {day.dayNumber}
                      </div>
                      <div className="text-xs opacity-70">{day.month}</div>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-sm text-[#6f5a50]">
                {t.selectedDate}:{" "}
                <span className="font-semibold text-[#2f2723]">
                  {formatDateDisplay(selectedDate, lang)}
                </span>
              </p>

              {loading && (
                <p className="mt-6 text-sm text-[#6f5a50]">{t.loading}</p>
              )}

              {!loading && selectedDate && filteredSlots.length === 0 && (
                <p className="mt-6 rounded-xl bg-white p-4 text-sm text-[#6f5a50]">
                  {t.noSlots}
                </p>
              )}

              {!loading && filteredSlots.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-[#6f5a50]">
                    {t.freeSlots}
                  </h4>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {filteredSlots.map((slot) => {
                      const active =
                        selectedSlot?.start_time === slot.start_time &&
                        selectedSlot?.employee_id === slot.employee_id &&
                        selectedSlot?.room_id === slot.room_id;

                      return (
                        <button
                          key={`${slot.start_time}-${slot.employee_id}-${slot.room_id}`}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-xl border px-4 py-3 text-center font-semibold transition ${
                            active
                              ? "border-[#2f2723] bg-[#2f2723] text-white"
                              : "border-[#eadbd2] bg-white hover:bg-[#fffaf7]"
                          }`}
                        >
                          {slot.start_time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#eadbd2] bg-white p-6">
              <h3 className="text-xl font-semibold">{t.contactTitle}</h3>

              <p className="mt-3 text-sm leading-6 text-[#6f5a50]">
                {t.contactText}
              </p>

              {selectedSlot && (
                <div className="mt-5 rounded-xl bg-[#f8f3ef] p-4 text-sm text-[#6f5a50]">
                  {t.selectedSlot}:{" "}
                  <span className="font-semibold text-[#2f2723]">
                    {formatDateDisplay(selectedDate, lang)}{" "}
                    {selectedSlot.start_time} - {selectedSlot.end_time}
                  </span>
                </div>
              )}

              <input
                placeholder={t.fullName}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-5 w-full rounded-xl border border-[#eadbd2] px-4 py-3 outline-none"
              />

              <input
                placeholder={t.phone}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-4 w-full rounded-xl border border-[#eadbd2] px-4 py-3 outline-none"
              />

              <p className="mt-2 text-xs text-[#6f5a50]">{t.phoneHelp}</p>

              <input
                type="email"
                placeholder={t.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-4 w-full rounded-xl border border-[#eadbd2] px-4 py-3 outline-none"
              />

              <textarea
                placeholder={t.note}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="mt-4 w-full resize-none rounded-xl border border-[#eadbd2] px-4 py-3 outline-none"
              />

              <button
                type="button"
                onClick={submitBooking}
                disabled={submitting || !selectedSlot}
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#2f2723] py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    {t.submitting}
                    <span className="ml-2 animate-spin">⏳</span>
                  </>
                ) : (
                  t.submit
                )}
              </button>

              {!selectedSlot && (
                <p className="mt-3 text-center text-xs text-[#6f5a50]">
                  {t.chooseSlotFirst}
                </p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
