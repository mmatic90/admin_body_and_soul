type AppointmentServiceLabelItem = {
  service?: {
    name?: string | null;
  } | null;
};

export function formatAppointmentServicesLabel(
  items: AppointmentServiceLabelItem[] | null | undefined,
) {
  if (!items || items.length === 0) {
    return "-";
  }

  const names = items
    .map((item) => item.service?.name?.trim())
    .filter((value): value is string => Boolean(value));

  if (names.length === 0) {
    return "-";
  }

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]} + ${names[1]}`;
  }

  return `${names[0]} + ${names[1]} +${names.length - 2}`;
}
