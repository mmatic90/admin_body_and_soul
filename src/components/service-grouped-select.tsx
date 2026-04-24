"use client";

import { groupServicesForSelect } from "@/features/services/group-services";

type ServiceItem = {
  id: string;
  name: string;
  duration_minutes: number;
  service_group: string | null;
  is_active?: boolean;
};

type Props = {
  services: ServiceItem[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
};

export default function ServiceGroupedSelect({
  services,
  value,
  onChange,
  name,
}: Props) {
  const groupedServices = groupServicesForSelect(
    services.filter((service) => service.is_active !== false),
  );

  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-app-soft bg-white px-4 py-3 text-app-text outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20"
    >
      <option value="">Odaberi uslugu</option>

      {groupedServices.map((group) => (
        <optgroup key={group.groupLabel} label={group.groupLabel}>
          {group.services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
