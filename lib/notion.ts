import { Client } from "@notionhq/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

export const JST = () => dayjs().tz("Asia/Tokyo");
export const toISO = (d: Date) => new Date(d).toISOString();

export type Slice = {
  id: string;
  title: string;
  kind: "task" | "schedule";
  start: string; // ISO
  end: string;   // ISO
  column: "AM" | "PM";
  color: string;
};

export async function getTodayDailyId(): Promise<{ id: string; fallback: boolean } | null> {
  const dailyDb = process.env.NOTION_DAILY_DB_ID!;
  const jst = JST();
  const start = jst.startOf("day").toISOString();
  const end = jst.endOf("day").toISOString();

  // 今日一致
  const r = await notion.databases.query({
    database_id: dailyDb,
    filter: { property: "Date", date: { on_or_after: start, on_or_before: end } },
    sorts: [{ property: "Date", direction: "descending" }],
    page_size: 1
  });
  if (r.results.length > 0) return { id: r.results[0].id, fallback: false };

  // 代替：最新
  const latest = await notion.databases.query({
    database_id: dailyDb,
    sorts: [{ property: "Date", direction: "descending" }],
    page_size: 1
  });
  if (latest.results.length > 0) return { id: latest.results[0].id, fallback: true };

  return null;
}

type NotionProp = any;

function getTitle(p: any): string {
  const candidates = [
    p.properties?.Name,
    p.properties?.Title,
    p.properties?.名前,
    p.properties?.タイトル
  ] as NotionProp[];
  for (const c of candidates) {
    const t = c?.title?.[0]?.plain_text;
    if (t) return t;
  }
  return "Untitled";
}

function getDateRange(p: any, keys: string[]): { s: Date; e: Date } | null {
  for (const k of keys) {
    const prop = p.properties?.[k];
    const s = prop?.date?.start;
    if (!s) continue;
    const e = prop?.date?.end ?? s;
    return { s: new Date(s), e: new Date(e) };
  }
  return null;
}

export async function fetchDailySlices(dailyId: string): Promise<{ items: Slice[]; day: { d0: string; d12: string; d24: string } }> {
  const taskDb = process.env.NOTION_TASK_DB_ID!;
  const scheduleDb = process.env.NOTION_SCHEDULE_DB_ID!;

  // Task
  const tasks = await notion.databases.query({
    database_id: taskDb,
    filter: {
      and: [
        { property: "Daily", relation: { contains: dailyId } },
        { property: "Time", date: { is_not_empty: true } }
      ]
    },
    page_size: 100
  });

  // Schedule
  const schedules = await notion.databases.query({
    database_id: scheduleDb,
    filter: {
      and: [
        { property: "Daily", relation: { contains: dailyId } },
        { property: "Date", date: { is_not_empty: true } }
      ]
    },
    page_size: 100
  });

  // 境界（各アイテムの開始から同日判定でもよいが、厳密にはDailyのDateを読むのがベスト）
  const baseDate = tasks.results[0] ?? schedules.results[0];
  const baseStart =
    getDateRange(baseDate, ["Time", "Date"])?.s ??
    new Date(JST().startOf("day").format());

  const d0 = new Date(baseStart);
  d0.setHours(0, 0, 0, 0);
  const d12 = new Date(d0);
  d12.setHours(12, 0, 0, 0);
  const d24 = new Date(d0);
  d24.setDate(d24.getDate() + 1);

  const toBase = (arr: any[], kind: "task" | "schedule") =>
    arr.map((p) => {
      const title = getTitle(p);
      const dr = getDateRange(p, kind === "task" ? ["Time"] : ["Date"]);
      if (!dr) return null;
      return { id: p.id, title, kind, s: dr.s, e: dr.e };
    }).filter(Boolean) as { id: string; title: string; kind: "task" | "schedule"; s: Date; e: Date }[];

  const baseItems = [
    ...toBase(tasks.results, "task"),
    ...toBase(schedules.results, "schedule")
  ];

  const clamp = (x: Date, a: Date, b: Date) => new Date(Math.min(Math.max(+x, +a), +b));
  const valid = (a: Date, b: Date) => +b > +a;

  const items: Slice[] = baseItems.flatMap((it) => {
    const amStart = clamp(it.s, d0, d12);
    const amEnd   = clamp(it.e, d0, d12);
    const pmStart = clamp(it.s, d12, d24);
    const pmEnd   = clamp(it.e, d12, d24);
    const color = it.kind === "task" ? "#3b82f6" : "#22c55e";

    const parts: Slice[] = [];
    if (valid(amStart, amEnd)) parts.push({ id: it.id, title: it.title, kind: it.kind, start: amStart.toISOString(), end: amEnd.toISOString(), column: "AM", color });
    if (valid(pmStart, pmEnd)) parts.push({ id: it.id, title: it.title, kind: it.kind, start: pmStart.toISOString(), end: pmEnd.toISOString(), column: "PM", color });
    return parts;
  });

  return { items, day: { d0: d0.toISOString(), d12: d12.toISOString(), d24: d24.toISOString() } };
}
