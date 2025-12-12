export default async function Page() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/daily/today`, { cache: "no-store" });
  if (!res.ok) {
    return <div style= padding: 16 >今日のDailyが見つかりませんでした。</div>;
  }
  const data = await res.json();
  // /daily/[id] へ即時リダイレクト（SSRメタで簡易転送）
  return <meta httpEquiv="refresh" content={`0; url=/daily/${data.id}`} />;
}
