
export const metadata = { title: 'Poker Prototype' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          margin: 0,
          padding: 0,
          minHeight: '100%',
          backgroundColor: '#020617'
        }}
      >
        {children}
      </body>
    </html>
  );
}
