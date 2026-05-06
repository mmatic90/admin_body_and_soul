import { createAdminClient } from "@/lib/supabase/admin";

type CheckRateLimitArgs = {
  ip: string;
  endpoint: string;
  limit?: number;
  windowMinutes?: number;
};

export async function checkRateLimit({
  ip,
  endpoint,
  limit = 5,
  windowMinutes = 10,
}: CheckRateLimitArgs) {
  const supabase = createAdminClient();

  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("public_api_rate_limits")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("ip_address", ip)
    .eq("endpoint", endpoint)
    .gte("created_at", since);

  if (error) {
    throw new Error(error.message);
  }

  if ((count ?? 0) >= limit) {
    return {
      allowed: false,
      remaining: 0,
    };
  }

  const { error: insertError } = await supabase
    .from("public_api_rate_limits")
    .insert({
      ip_address: ip,
      endpoint,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    allowed: true,
    remaining: limit - ((count ?? 0) + 1),
  };
}
