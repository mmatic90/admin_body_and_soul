type ServiceItem = {
  id: string;
  name: string;
  service_group: string | null;
  is_active?: boolean;
};

type GroupedServices = {
  groupLabel: string;
  services: ServiceItem[];
};

const GROUP_ORDER = [
  "Njega lica",
  "Body program & oblikovanje",
  "Masaže",
  "Njega ruku & nogu",
  "Depilacija",
  "Lice & obrve",
  "Trajna epilacija laserom (808 nm)",
];

export function groupServicesForSelect(
  services: ServiceItem[],
): GroupedServices[] {
  const map = new Map<string, ServiceItem[]>();

  for (const service of services) {
    const group = service.service_group?.trim() || "Ostalo";

    if (!map.has(group)) {
      map.set(group, []);
    }

    map.get(group)!.push(service);
  }

  const grouped = Array.from(map.entries()).map(
    ([groupLabel, groupServices]) => ({
      groupLabel,
      services: groupServices.sort((a, b) =>
        a.name.localeCompare(b.name, "hr"),
      ),
    }),
  );

  grouped.sort((a, b) => {
    const aIndex = GROUP_ORDER.indexOf(a.groupLabel);
    const bIndex = GROUP_ORDER.indexOf(b.groupLabel);

    const safeA = aIndex === -1 ? 999 : aIndex;
    const safeB = bIndex === -1 ? 999 : bIndex;

    if (safeA !== safeB) return safeA - safeB;

    return a.groupLabel.localeCompare(b.groupLabel, "hr");
  });

  return grouped;
}
