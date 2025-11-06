
export const metadata = { title: 'Poker Prototype' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', padding: 20 }}>
        {children}
      </body>
    </html>
  );
}
