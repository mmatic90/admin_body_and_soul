export function formatTime(value: string) {
  return value.slice(0, 5);
}

export function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("hr-HR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function statusLabel(status: string) {
  switch (status) {
    case "scheduled":
      return "Zakazan";
    case "completed":
      return "Odrađen";
    case "cancelled":
      return "Otkazan";
    case "no_show":
      return "Nije došao";
    default:
      return status;
  }
}
