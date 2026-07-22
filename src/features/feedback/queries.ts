import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { feedbackIdSchema } from "@/features/feedback/validation";
import type { FeedbackRow } from "@/features/feedback/types";

async function requireSystemDeveloper() {
  const permissions = await getCurrentUserPermissions();

  if (!permissions?.isSystemDeveloper) {
    throw new Error("Nemate dopuštenje za pristup feedbacku.");
  }

  return permissions;
}

export async function getFeedbackList(): Promise<FeedbackRow[]> {
  await requireSystemDeveloper();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as FeedbackRow[];
}

export async function getFeedbackById(id: string): Promise<FeedbackRow | null> {
  await requireSystemDeveloper();

  const parsedId = feedbackIdSchema.safeParse(id);
  if (!parsedId.success) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return (data as FeedbackRow | null) ?? null;
}

export async function createFeedbackScreenshotSignedUrl(path: string) {
  await requireSystemDeveloper();

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("feedback")
    .createSignedUrl(path, 60 * 15);

  if (error) throw new Error(error.message);

  return data.signedUrl;
}
