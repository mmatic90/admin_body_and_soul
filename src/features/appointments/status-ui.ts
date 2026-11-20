type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export function getAppointmentStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case "scheduled":
      return "Zakazano";
    case "completed":
      return "Odrađeno";
    case "cancelled":
      return "Otkazano";
    case "no_show":
      return "No-show";
  }
}

export function getAppointmentStatusBadgeClass(status: AppointmentStatus) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "no_show":
      return "bg-amber-100 text-amber-800";
    case "scheduled":
      return "bg-blue-100 text-blue-700";
  }
}

export function getAppointmentCardClass(status: AppointmentStatus) {
  switch (status) {
    case "scheduled":
      return "border-blue-200 bg-blue-50";
    case "completed":
      return "border-green-300 bg-green-50";
    case "cancelled":
      return "border-red-200 bg-red-50";
    case "no_show":
      return "border-amber-300 bg-amber-50";
  }
}

export function getAppointmentAccentClass(status: AppointmentStatus) {
  switch (status) {
    case "scheduled":
      return "bg-blue-500";
    case "completed":
      return "bg-green-600";
    case "cancelled":
      return "bg-red-400";
    case "no_show":
      return "bg-amber-500";
  }
}
