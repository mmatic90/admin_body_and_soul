import type { AppointmentServiceInput } from "@/features/appointments/types";

export function calculateTotalDuration(items: AppointmentServiceInput[]) {
  return items.reduce((sum, item) => {
    const value = Number(item.duration_minutes);
    return sum + (Number.isFinite(value) && value > 0 ? value : 0);
  }, 0);
}
