export const metadata = {
  title: "Daily Timeline",
  description: "AM/PM two-column timeline",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style= margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" >
        {children}
      </body>
    </html>
  );
}
