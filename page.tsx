"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DailyTimeline({ params }: { params: { id: string } }) {
  const { data } = useSWR(`/api/daily/${params.id}`, fetcher);
  if (!data) return <div>Loading...</div>;

  const am = data.items.filter((x: any) => x.column === "AM");
  const pm = data.items.filter((x: any) => x.column === "PM");

  const Grid = ({ column, items }: any) => (
    <div style= flex: 1, borderLeft: "1px solid #eee", position: "relative", height: 720 >
      {/* 15分刻み=24*15min=96マス。ここは簡略化して12時間=720分=1px/分で実装 */}
      {/* 軸ラベルなどは省略 */}
      {items.map((x: any) => {
        const base = column === "AM" ? new Date(data.day.d0) : new Date(data.day.d12);
        const px = (ms: number) => (ms / 60000); // 1min=1px
        const top = px(+x.start - +base);
        const height = px(+x.end - +x.start);
        return (
          <div key={x.id + x.start}
            title={`${x.title}`}
            style=
              position: "absolute",
              left: 8,
              right: 8,
              top,
              height: Math.max(2, height),
              background: x.color,
              borderRadius: 4,
              color: "white",
              fontSize: 12,
              padding: "2px 6px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            >
            {x.title}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style= display: "flex", gap: 12 >
      <div style= width: 120 >
        <div>AM 0:00–12:00</div>
        <div>PM 12:00–24:00</div>
      </div>
      <div style= display: "flex", flex: 1, gap: 12 >
        <Grid column="AM" items={am}/>
        <Grid column="PM" items={pm}/>
      </div>
    </div>
  );
}
