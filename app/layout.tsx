// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Broken Bats Hitting Club",
  description: "AI-assisted swing analysis and remote hitting development.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <header
          style={{
            borderBottom: "1px solid #ddd",
            padding: "12px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 700 }}>Broken Bats Hitting Club</div>
          <nav style={{ display: "flex", gap: "16px", fontSize: 14 }}>
            <a href="/">Home</a>
            <a href="/swing-lab">Swing Lab</a>
            <a href="/drills">Drills</a>
            <a href="/contact">Contact</a>
            <a href="/login">Login</a>
          </nav>
        </header>
        <main style={{ padding: "24px", maxWidth: 960, margin: "0 auto" }}>
          {children}
        </main>
        <footer
          style={{
            borderTop: "1px solid #eee",
            padding: "12px 24px",
            fontSize: 12,
            textAlign: "center",
            marginTop: 40,
          }}
        >
          © {new Date().getFullYear()} Broken Bats Hitting Club
        </footer>
      </body>
    </html>
  );
}
