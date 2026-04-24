import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "employee";

export type CurrentUserPermissions = {
  userId: string;
  email: string | null;
  role: AppRole;
  employeeId: string | null;
  displayName: string;
  colorHex: string | null;
  isEmployee: boolean;
};

export async function getCurrentUserPermissions(): Promise<CurrentUserPermissions | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, display_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.is_active === false) {
    return null;
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, color_hex, is_active")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (employeeError) {
    return null;
  }

  if (employee && employee.is_active === false) {
    return null;
  }

  return {
    userId: user.id,
    email: profile.email ?? user.email ?? null,
    role: profile.role as AppRole,
    employeeId: employee?.id ?? null,
    displayName: profile.display_name ?? user.email ?? "Korisnik",
    colorHex: employee?.color_hex ?? null,
    isEmployee: Boolean(employee),
  };
}

export function isAdmin(role: AppRole) {
  return role === "admin";
}

export function canAccessReports(role: AppRole) {
  return role === "admin";
}

export function canAccessSettings(role: AppRole) {
  return role === "admin";
}

export function canAccessScheduleManagement(role: AppRole) {
  return role === "admin";
}
