"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
};

type Slot = {
  start_time: string;
  end_time: string;
  employee_id: string;
  employee_name: string;
  room_id: string;
  room_name: string;
};

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

function formatDateHr(date: string) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}.`;
}

function getVisibleDays(startDate: string, days = 4) {
  const base = new Date(`${startDate}T00:00:00`);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(base);
    date.setDate(date.getDate() + index);

    const value = formatDateInputValue(date);

    return {
      value,
      dayName: date.toLocaleDateString("hr-HR", { weekday: "short" }),
      dayNumber: date.toLocaleDateString("hr-HR", { day: "2-digit" }),
      month: date.toLocaleDateString("hr-HR", { month: "short" }),
    };
  });
}

export default function BookingClient({ services }: { services: Service[] }) {
  const router = useRouter();
  const today = getTodayValue();

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

  const visibleDays = getVisibleDays(calendarStartDate, 4);

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
        alert(data.error || "Greška pri dohvaćanju termina.");
        return;
      }

      const suggestions: Slot[] = data.suggestions || [];

      const uniqueByTime = Array.from(
        new Map(suggestions.map((slot) => [slot.start_time, slot])).values(),
      );

      setSlots(uniqueByTime);
    } catch (error) {
      console.error(error);
      alert("Greška pri dohvaćanju termina.");
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
      alert("Odaberi uslugu, datum i termin.");
      return;
    }

    if (!fullName.trim()) {
      alert("Ime i prezime je obavezno.");
      return;
    }

    if (!phone.trim()) {
      alert("Broj telefona je obavezan.");
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
        alert(data.error || "Greška pri rezervaciji.");
        return;
      }

      const params = new URLSearchParams({
        date: selectedDate,
        time: selectedSlot.start_time,
        service: selectedService.name,
      });

      router.push(`/booking/success?${params.toString()}`);
    } catch (error) {
      console.error(error);
      alert("Greška pri rezervaciji.");
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
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => {
                setSelectedService(service);
                setSelectedDate(today);
                setCalendarStartDate(today);
              }}
              className="rounded-2xl border border-[#eadbd2] bg-[#f8f3ef] p-5 text-left transition hover:bg-white"
            >
              <div className="text-lg font-semibold">{service.name}</div>
              <div className="mt-2 text-sm text-[#6f5a50]">
                {service.duration_minutes} min
              </div>
            </button>
          ))}
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
            ← Nazad na usluge
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold">{selectedService.name}</h2>
            <p className="mt-2 text-sm text-[#6f5a50]">
              Odaberi datum i početak termina. Trajanje tretmana:{" "}
              {selectedService.duration_minutes} min.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#eadbd2] bg-[#f8f3ef] p-6">
              <h3 className="text-xl font-semibold">Datum i vrijeme</h3>

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
                Odabrani datum:{" "}
                <span className="font-semibold text-[#2f2723]">
                  {formatDateHr(selectedDate)}
                </span>
              </p>

              {loading && (
                <p className="mt-6 text-sm text-[#6f5a50]">
                  Učitavanje slobodnih termina...
                </p>
              )}

              {!loading && selectedDate && filteredSlots.length === 0 && (
                <p className="mt-6 rounded-xl bg-white p-4 text-sm text-[#6f5a50]">
                  Nema slobodnih termina za odabrani datum.
                </p>
              )}

              {!loading && filteredSlots.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-[#6f5a50]">
                    Slobodni sati
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
              <h3 className="text-xl font-semibold">Kontakt podaci</h3>

              <p className="mt-3 text-sm leading-6 text-[#6f5a50]">
                Unesi svoje podatke kako bi salon mogao potvrditi rezervaciju.
                Broj telefona je obavezan jer ćeš SMS-om dobiti potvrdu ili
                povratnu informaciju.
              </p>

              {selectedSlot && (
                <div className="mt-5 rounded-xl bg-[#f8f3ef] p-4 text-sm text-[#6f5a50]">
                  Odabrani termin:{" "}
                  <span className="font-semibold text-[#2f2723]">
                    {formatDateHr(selectedDate)} {selectedSlot.start_time} -{" "}
                    {selectedSlot.end_time}
                  </span>
                </div>
              )}

              <input
                placeholder="Ime i prezime *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-5 w-full rounded-xl border border-[#eadbd2] px-4 py-3 outline-none"
              />

              <input
                placeholder="Telefon *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-4 w-full rounded-xl border border-[#eadbd2] px-4 py-3 outline-none"
              />

              <p className="mt-2 text-xs text-[#6f5a50]">
                Broj telefona je obavezan jer ćeš putem SMS-a dobiti potvrdu ili
                povratnu informaciju o rezervaciji.
              </p>

              <input
                type="email"
                placeholder="Email (opcionalno)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-4 w-full rounded-xl border border-[#eadbd2] px-4 py-3 outline-none"
              />

              <textarea
                placeholder="Napomena (opcionalno)"
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
                    Slanje zahtjeva...
                    <span className="ml-2 animate-spin">⏳</span>
                  </>
                ) : (
                  "Pošalji zahtjev za rezervaciju"
                )}
              </button>

              {!selectedSlot && (
                <p className="mt-3 text-center text-xs text-[#6f5a50]">
                  Prvo odaberi slobodan sat.
                </p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
