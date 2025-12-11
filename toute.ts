import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  // まずは動作確認のダミー応答
  return NextResponse.json({
    ok: true,
    dailyId: params.id,
    items: [
      // AM: 09:00–10:30 のダミー
      { id: "t1", title: "Task sample", kind: "task", start: "2025-12-12T09:00:00+09:00", end: "2025-12-12T10:30:00+09:00", column: "AM", color: "#3b82f6" },
      // PM: 13:00–15:00 のダミー
      { id: "s1", title: "Schedule sample", kind: "schedule", start: "2025-12-12T13:00:00+09:00", end: "2025-12-12T15:00:00+09:00", column: "PM", color: "#22c55e" },
    ],
    day: {
      d0: "2025-12-12T00:00:00+09:00",
      d12: "2025-12-12T12:00:00+09:00",
      d24: "2025-12-13T00:00:00+09:00"
    }
  });
}
