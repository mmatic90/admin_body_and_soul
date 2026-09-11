"use client";

import { useMemo, useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import type { ServiceItem } from "@/features/settings/types";
import { bulkUpdateServicesWithPricingAction } from "@/features/settings/service-pricing-actions";
import { deleteServiceAction } from "@/features/settings/actions";
import SettingsDeleteButton from "@/components/settings-delete-button";
import { toast } from "sonner";

type Props = {
  services: ServiceItem[];
  configuration: Record<
    string,
    {
      employeeCount: number;
      roomCount: number;
    }
  >;
};

type EditableService = {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  duration_minutes: number;
  price_cents: number | null;
  price_min_cents: number | null;
  price_max_cents: number | null;
  display_order: number | null;
  service_group: string;
  service_group_en: string;
  priority_room: string;
  is_active: boolean;
  is_online_bookable: boolean;
};

function toEditable(service: ServiceItem): EditableService {
  return {
    id: service.id,
    name: service.name,
    name_en: service.name_en ?? "",
    description: service.description ?? "",
    description_en: service.description_en ?? "",
    duration_minutes: service.duration_minutes,
    price_cents: service.price_cents,
    price_min_cents: service.price_min_cents,
    price_max_cents: service.price_max_cents,
    display_order: service.display_order,
    service_group: service.service_group ?? "",
    service_group_en: service.service_group_en ?? "",
    priority_room: service.priority_room ?? "",
    is_active: service.is_active,
    is_online_bookable: service.is_online_bookable,
  };
}

function centsToInput(value: number | null) {
  return value == null ? "" : String(value / 100);
}

function inputToCents(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function inputToOrder(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function ServicesTable({ services, configuration }: Props) {
  const initialItems = useMemo(() => services.map(toEditable), [services]);
  const [items, setItems] = useState<EditableService[]>(initialItems);
  const [pending, startTransition] = useTransition();
  const hasChanges = JSON.stringify(items) !== JSON.stringify(initialItems);

  function updateItem<K extends keyof EditableService>(
    id: string,
    field: K,
    value: EditableService[K],
  ) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function saveChanges() {
    startTransition(async () => {
      const result = await bulkUpdateServicesWithPricingAction(
        items.map((item) => ({
          ...item,
          service_group: item.service_group || null,
          priority_room: item.priority_room || null,
        })),
      );
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  const inputClass = "w-full rounded-lg border border-app-soft bg-white px-3 py-2 text-app-text outline-none transition focus:border-app-accent";

  return (
    <div className="space-y-4">
      <div className="sticky top-2 z-40 flex flex-col gap-3 rounded-2xl border border-app-soft bg-white/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-app-muted">
            Redoslijed određuje poziciju usluge unutar kategorije. Za raspon cijene ostavi fiksnu cijenu praznom i unesi Min + Max.
          </div>
          {hasChanges ? (
            <div className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              Imaš nespremljene promjene
            </div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setItems(initialItems)} disabled={pending || !hasChanges} className="inline-flex items-center gap-2 rounded-xl border border-app-soft bg-white px-4 py-2 text-sm font-medium disabled:opacity-50">
            <RotateCcw className="h-4 w-4" /> Poništi
          </button>
          <button type="button" onClick={saveChanges} disabled={pending || !hasChanges} className="rounded-xl bg-app-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {pending ? "Spremanje..." : "Spremi izmjene"}
          </button>
        </div>
      </div>

      <div className="max-h-[72vh] overflow-auto rounded-2xl border border-app-soft">
        <table className="min-w-[2200px] border-collapse">
          <thead className="sticky top-0 z-30 bg-app-table-head shadow-sm">
            <tr className="text-left text-sm text-app-muted">
              <th className="px-4 py-3">Redoslijed</th>
              <th className="px-4 py-3">Naziv HR / EN</th>
              <th className="px-4 py-3">Provjera</th>
              <th className="px-4 py-3">Opis HR / EN</th>
              <th className="px-4 py-3">Trajanje</th>
              <th className="px-4 py-3">Fiksna €</th>
              <th className="px-4 py-3">Min €</th>
              <th className="px-4 py-3">Max €</th>
              <th className="px-4 py-3">Kategorija HR / EN</th>
              <th className="px-4 py-3">Prioritetna soba</th>
              <th className="px-4 py-3">Aktivno</th>
              <th className="px-4 py-3">Online</th>
              <th className="px-4 py-3">Akcije</th>
            </tr>
          </thead>
          <tbody className="bg-app-card">
            {items.map((service) => (
              <tr key={service.id} className="border-t border-app-soft align-top text-sm">
                <td className="px-4 py-4">
                  <input type="number" min={1} step={1} value={service.display_order ?? ""} onChange={(e) => updateItem(service.id, "display_order", inputToOrder(e.target.value))} className={`${inputClass} w-24`} />
                </td>
                <td className="space-y-2 px-4 py-4">
                  <input value={service.name} onChange={(e) => updateItem(service.id, "name", e.target.value)} className={inputClass} placeholder="HR" />
                  <input value={service.name_en} onChange={(e) => updateItem(service.id, "name_en", e.target.value)} className={inputClass} placeholder="EN" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex min-w-[180px] flex-col gap-1.5">
                    {!service.is_active ? (
                      <span className="w-fit rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                        Neaktivna
                      </span>
                    ) : null}
                    {service.price_cents == null &&
                    (service.price_min_cents == null || service.price_max_cents == null) ? (
                      <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Nema cijene
                      </span>
                    ) : null}
                    {(configuration[service.id]?.employeeCount ?? 0) === 0 ? (
                      <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Nema djelatnika
                      </span>
                    ) : null}
                    {(configuration[service.id]?.roomCount ?? 0) === 0 ? (
                      <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Nema sobe
                      </span>
                    ) : null}
                    {service.is_active &&
                    (service.price_cents != null ||
                      (service.price_min_cents != null && service.price_max_cents != null)) &&
                    (configuration[service.id]?.employeeCount ?? 0) > 0 &&
                    (configuration[service.id]?.roomCount ?? 0) > 0 ? (
                      <span className="w-fit rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Spremna
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="space-y-2 px-4 py-4">
                  <textarea value={service.description} onChange={(e) => updateItem(service.id, "description", e.target.value)} rows={3} className={`${inputClass} min-w-[300px]`} placeholder="Opis HR" />
                  <textarea value={service.description_en} onChange={(e) => updateItem(service.id, "description_en", e.target.value)} rows={3} className={`${inputClass} min-w-[300px]`} placeholder="Description EN" />
                </td>
                <td className="px-4 py-4"><input type="number" min={1} value={service.duration_minutes} onChange={(e) => updateItem(service.id, "duration_minutes", Number(e.target.value))} className={`${inputClass} w-24`} /></td>
                <td className="px-4 py-4"><input type="number" min={0} step="0.01" value={centsToInput(service.price_cents)} onChange={(e) => updateItem(service.id, "price_cents", inputToCents(e.target.value))} className={`${inputClass} w-24`} /></td>
                <td className="px-4 py-4"><input type="number" min={0} step="0.01" value={centsToInput(service.price_min_cents)} onChange={(e) => updateItem(service.id, "price_min_cents", inputToCents(e.target.value))} className={`${inputClass} w-24`} /></td>
                <td className="px-4 py-4"><input type="number" min={0} step="0.01" value={centsToInput(service.price_max_cents)} onChange={(e) => updateItem(service.id, "price_max_cents", inputToCents(e.target.value))} className={`${inputClass} w-24`} /></td>
                <td className="space-y-2 px-4 py-4">
                  <input value={service.service_group} onChange={(e) => updateItem(service.id, "service_group", e.target.value)} className={`${inputClass} min-w-[180px]`} placeholder="HR" />
                  <input value={service.service_group_en} onChange={(e) => updateItem(service.id, "service_group_en", e.target.value)} className={`${inputClass} min-w-[180px]`} placeholder="EN" />
                </td>
                <td className="px-4 py-4"><input value={service.priority_room} onChange={(e) => updateItem(service.id, "priority_room", e.target.value)} className={`${inputClass} min-w-[160px]`} /></td>
                <td className="px-4 py-4"><Toggle value={service.is_active} onChange={() => updateItem(service.id, "is_active", !service.is_active)} /></td>
                <td className="px-4 py-4"><Toggle value={service.is_online_bookable} onChange={() => updateItem(service.id, "is_online_bookable", !service.is_online_bookable)} /></td>
                <td className="px-4 py-4"><SettingsDeleteButton label={service.name} onDelete={deleteServiceAction.bind(null, service.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={onChange} className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${value ? "bg-app-accent" : "bg-app-soft"}`}>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}
