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

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const { data, error } = await supabase
    .from("online_booking_requests")
    .update({
      archived_at: new Date().toISOString(),
    })
    .is("archived_at", null)
    .in("status", ["accepted", "rejected"])
    .lt("created_at", cutoff.toISOString())
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    archived: data?.length ?? 0,
  });
}
