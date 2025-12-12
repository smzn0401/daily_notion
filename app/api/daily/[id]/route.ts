import { NextRequest, NextResponse } from "next/server";
import { fetchDailySlices } from "@/lib/notion";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const data = await fetchDailySlices(id);
    return NextResponse.json({ ok: true, dailyId: id, ...data }, { status: 200 });
  } catch (e: any) {
    const msg = e?.body ?? e?.message ?? "UNKNOWN";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
