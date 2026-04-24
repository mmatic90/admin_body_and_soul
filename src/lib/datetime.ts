export function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time.slice(0, 5)}:00`);
}

export function isAppointmentPast(date: string, endTime: string) {
  const end = combineDateAndTime(date, endTime);
  return end.getTime() < Date.now();
}

export function formatDateHR(dateStr: string) {
  return new Intl.DateTimeFormat("hr-HR").format(new Date(dateStr));
}

export function formatTimeHM(timeStr: string) {
  return timeStr.slice(0, 5);
}

export function formatDateTimeHR(dateStr: string, timeStr: string) {
  return `${formatDateHR(dateStr)} ${formatTimeHM(timeStr)}`;
}
