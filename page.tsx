type Slice = {
  id: string;
  title: string;
  kind: "task" | "schedule";
  start: string;
  end: string;
  column: "AM" | "PM";
  color: string;
};

type Api = {
  ok: boolean;
  dailyId: string;
  items: Slice[];
  day: { d0: string; d12: string; d24: string; };
};

const pxPerMinute = 1; // 1分=1px（AM/PM 各720px）

function minutesBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((+b - +a) / 60000));
}

function Column({ label, base, items }: { label: string; base: Date; items: Slice[] }) {
  return (
    <div style= flex: 1, border: "1px solid #eee", padding: 8 >
      <div style= fontWeight: 600, marginBottom: 8 >{label}</div>
      <div style= position: "relative", height: 720 * pxPerMinute >
        {/* 時間の目盛り（任意） */}
        {[...Array(13)].map((_, i) => (
          <div key={i} style=
            position: "absolute",
            top: i * 60 * pxPerMinute,
            left: 0, right: 0,
            borderTop: "1px dashed #f0f0f0",
            fontSize: 10, color: "#999"
          >
            {String(i).padStart(2,"0")}:00
          </div>
        ))}
        {/* バー描画 */}
        {items.map(s => {
          const start = new Date(s.start);
          const end = new Date(s.end);
          const top = minutesBetween(base, start) * pxPerMinute;
          const height = Math.max(2, minutesBetween(start, end) * pxPerMinute);
          return (
            <div key={s.id + s.start}
              title={`${s.title} (${start.toLocaleTimeString()}–${end.toLocaleTimeString()})`}
              style=
                position: "absolute",
                left: 8,
                right: 8,
                top,
                height,
                background: s.color,
                borderRadius: 6,
                color: "white",
                padding: "4px 8px",
                fontSize: 12,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
              
            >
              {s.title}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function Page({ params }: { params: { id: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/daily/${params.id}`, { cache: "no-store" });
  if (!res.ok) {
    return <div style= padding: 16 >APIエラー: {res.status}</div>;
  }
  const data = (await res.json()) as Api;

  const amBase = new Date(data.day.d0);
  const pmBase = new Date(data.day.d12);
  const amItems = data.items.filter(i => i.column === "AM");
  const pmItems = data.items.filter(i => i.column === "PM");

  return (
    <div style= padding: 16 >
      <h2>Daily Timeline: {data.dailyId}</h2>
      <div style= display: "flex", gap: 16 >
        <Column label="AM 0:00–12:00" base={amBase} items={amItems} />
        <Column label="PM 12:00–24:00" base={pmBase} items={pmItems} />
      </div>
    </div>
  );
}
