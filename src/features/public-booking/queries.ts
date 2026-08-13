import { createAdminClient } from "@/lib/supabase/admin";

export type PublicBookingTherapist = {
  id: string;
  display_name: string;
};

export type PublicBookingService = {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  duration_minutes: number;
  price_cents: number | null;
  price_min_cents: number | null;
  price_max_cents: number | null;
  service_group: string | null;
  service_group_en: string | null;
  therapists: PublicBookingTherapist[];
};

export async function getOnlineBookableServices(): Promise<PublicBookingService[]> {
  const supabase = createAdminClient();

  const [
    { data: services, error: servicesError },
    { data: mappings, error: mappingsError },
    { data: employees, error: employeesError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select(
        `
          id,
          name,
          name_en,
          description,
          description_en,
          duration_minutes,
          price_cents,
          price_min_cents,
          price_max_cents,
          service_group,
          service_group_en
        `,
      )
      .eq("is_active", true)
      .eq("is_online_bookable", true)
      .order("service_group", { ascending: true })
      .order("name", { ascending: true }),

    supabase.from("employee_services").select("employee_id, service_id"),

    supabase
      .from("employees")
      .select("id, display_name")
      .eq("is_active", true)
      .order("display_name", { ascending: true }),
  ]);

  if (servicesError) throw new Error(servicesError.message);
  if (mappingsError) throw new Error(mappingsError.message);
  if (employeesError) throw new Error(employeesError.message);

  const employeeById = new Map(
    (employees ?? []).map((employee) => [employee.id, employee]),
  );

  const therapistsByService = new Map<string, PublicBookingTherapist[]>();

  for (const mapping of mappings ?? []) {
    const employee = employeeById.get(mapping.employee_id);
    if (!employee) continue;

    const current = therapistsByService.get(mapping.service_id) ?? [];
    if (!current.some((item) => item.id === employee.id)) {
      current.push({ id: employee.id, display_name: employee.display_name });
      therapistsByService.set(mapping.service_id, current);
    }
  }

  return (services ?? []).map((service) => ({
    ...service,
    therapists: therapistsByService.get(service.id) ?? [],
  })) as PublicBookingService[];
}
