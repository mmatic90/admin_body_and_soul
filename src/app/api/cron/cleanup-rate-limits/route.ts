import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAuthorized(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  return Boolean(expectedSecret) && authHeader === `Bearer ${expectedSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("public_api_rate_limits")
    .delete()
    .lt("created_at", cutoff);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
  });
}
