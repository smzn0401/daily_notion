import { NextResponse } from "next/server";
import { getTodayDailyId } from "@/lib/notion";

export async function GET() {
  const r = await getTodayDailyId();
  if (!r) return NextResponse.json({ ok: false, reason: "NO_DAILY" }, { status: 404 });
  return NextResponse.json({ ok: true, id: r.id, fallback: r.fallback });
}
