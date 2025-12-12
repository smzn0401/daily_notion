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

const pxPerMinute = 1; // 1分=1px → AM/PM 各720px

function minutesBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((+b - +a) / 60000));
}

function Column({ label, base, items }: { label: string; base: Date; items: Slice[] }) {
  return (
    <div style= width: "50%", padding: "8px" >
      <div style= fontWeight: 700, marginBottom: 8 >{label}</div>
      <div style={{ position: "relative", height: `${12 * 60 * pxPerMinute}px`, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa" }}>
        {/* hour ticks */}
        {[...Array(13)].map((_, i) => (
          <div key={i} style={{ position: "absolute", top: `${i * 60 * pxPerMinute}px`, left: 0, right: 0, borderTop: "1px dashed #e5e7eb", fontSize: 10, color: "#6b7280" }}>
            <span style= position: "absolute", left: 4, transform: "translateY(-50%)" >
              {String(i).padStart(2, "0")}:00
            </span>
          </div>
        ))}

        {/* bars */}
        {items.map(s => {
          const start = new Date(s.start);
          const end = new Date(s.end);
          const top = minutesBetween(base, start) * pxPerMinute;
          const height = Math.max(3, minutesBetween(start, end) * pxPerMinute);
          return (
            <div key={s.id + s.start}
              title={`${s.title} (${start.toLocaleTimeString("ja-JP")}–${end.toLocaleTimeString("ja-JP")})`}
              style=
                position: "absolute",
                left: 80,
                right: 8,
                top,
                height,
                background: s.color,
                color: "white",
                borderRadius: 6,
                padding: "2px 6px",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)"
              
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
      <h2 style= fontSize: 18, fontWeight: 700, marginBottom: 12 >Daily Timeline: {data.dailyId}</h2>
      <div style= display: "flex", gap: 16 >
        <Column label="AM 0:00–12:00" base={amBase} items={amItems} />
        <Column label="PM 12:00–24:00" base={pmBase} items={pmItems} />
      </div>
    </div>
  );
}
