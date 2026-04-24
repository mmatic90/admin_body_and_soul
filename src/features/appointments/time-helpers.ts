export function addMinutesToTimeString(
  startTime: string,
  totalMinutes: number,
) {
  const [hours, minutes] = startTime.slice(0, 5).split(":").map(Number);
  const total = hours * 60 + minutes + totalMinutes;
  const endHours = Math.floor(total / 60);
  const endMinutes = total % 60;

  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}
