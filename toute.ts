import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const dailyId = params.id;

  // Dailyに紐づくTask/Scheduleを取得する想定のクエリ
  // 1) Daily→Task relationをロールアップしているビューがあれば、DB側フィルタで date=dateOfDaily でもOK
  const tasks = await notion.databases.query({
    database_id: process.env.NOTION_TASK_DB_ID!,
    filter: {
      and: [
        { property: "Daily", relation: { contains: dailyId } },
        { property: "Time", date: { is_not_empty: true } },
      ],
    },
  });

  const schedules = await notion.databases.query({
    database_id: process.env.NOTION_SCHEDULE_DB_ID!,
    filter: {
      and: [
        { property: "Daily", relation: { contains: dailyId } },
        { property: "Date", date: { is_not_empty: true } },
      ],
    },
  });

  const normalize = (p: any, kind: "task" | "schedule") => {
    const title =
      p.properties?.Name?.title?.[0]?.plain_text ??
      p.properties?.Title?.title?.[0]?.plain_text ??
      p.properties?.名前?.title?.[0]?.plain_text ??
      "Untitled";
    const dt = kind === "task" ? p.properties.Time : p.properties.Date;
    const s = new Date(dt.date.start);
    const e = new Date(dt.date.end ?? dt.date.start);

    return { id: p.id, kind, title, s, e };
  };

  const base = [
    ...tasks.results.map((p: any) => normalize(p, "task")),
    ...schedules.results.map((p: any) => normalize(p, "schedule")),
  ];

  // 当日境界（DailyのDateがDBにある場合はそれを使うのがベスト）
  const day0 = new Date(new Date(base[0]?.s ?? Date.now()).setHours(0, 0, 0, 0));
  const d0 = day0;
  const d12 = new Date(day0); d12.setHours(12);
  const d24 = new Date(day0); d24.setDate(d24.getDate() + 1);

  const clamp = (x: Date, a: Date, b: Date) => new Date(Math.min(Math.max(+x, +a), +b));
  const valid = (a: Date, b: Date) => +b > +a;

  const sliced = base.flatMap((it) => {
    const amStart = clamp(it.s, d0, d12);
    const amEnd   = clamp(it.e, d0, d12);
    const pmStart = clamp(it.s, d12, d24);
    const pmEnd   = clamp(it.e, d12, d24);
    const color = it.kind === "task" ? "#3b82f6" : "#22c55e";

    const parts: any[] = [];
    if (valid(amStart, amEnd)) parts.push({ ...it, start: amStart, end: amEnd, column: "AM", color });
    if (valid(pmStart, pmEnd)) parts.push({ ...it, start: pmStart, end: pmEnd, column: "PM", color });
    return parts;
  });

  return NextResponse.json({ items: sliced, day: { d0, d12, d24 } });
}
