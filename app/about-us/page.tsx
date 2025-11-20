import Link from "next/link";

export default function AboutUsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 24,
          background: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
            }}
          >
            <img
              src="/logo.png"
              alt="Broken Bats Hitting Club logo"
              style={{ width: 160, height: 160, objectFit: "contain" }}
            />
          </Link>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              fontSize: 14,
            }}
          >
            <Link href="/" style={{ textDecoration: "none", color: "#111827" }}>
              Home
            </Link>
            <Link
              href="/about-us"
              style={{ textDecoration: "none", color: "#111827" }}
            >
              About Us
            </Link>
            <Link
              href="/swing-lab"
              style={{ textDecoration: "none", color: "#111827" }}
            >
              Swing Lab
            </Link>
            <Link
              href="/drills"
              style={{ textDecoration: "none", color: "#111827" }}
            >
              Drills
            </Link>
            <Link
              href="/login"
              style={{ textDecoration: "none", color: "#111827" }}
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 24px 40px",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            marginBottom: 12,
          }}
        >
          About Broken Bats Hitting Club
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#4b5563",
            marginBottom: 12,
          }}
        >
          {/* Placeholder – you can replace this with your real story later */}
          Welcome to Broken Bats Hitting Club, where our passion for player development meets cutting-edge technology. Located in Dallas, GA, our small, player-focused facility is dedicated to helping athletes of all ages and skill levels elevate their game.
We combine advanced tools like Rapsodo and Blast with modern AI-powered swing analysis to break down every detail of the hitter’s movement. Our AI technology helps identify patterns, inefficiencies, and opportunities for improvement in each swing, while our experienced coaches step in with human insight, clear explanations, and customized drills. The result is the best of both worlds: data-driven feedback plus real coaching that players can understand and apply.
At Broken Bats, we focus on individual growth, confidence, and long-term development—not just quick fixes. Every session is designed to help players build better habits, make smarter adjustments, and ultimately reach their full potential at the plate.
Follow us on social media @brokenbatshc or give us a call to start your training experience with Broken Bats Hitting Club today.
        </p>

        <p
          style={{
            fontSize: 15,
            color: "#4b5563",
            marginBottom: 12,
          }}
        >
          This is placeholder copy for now. You can update this section with
          your origin story, coaching philosophy, and anything else parents need
          to know about why Broken Bats is different.
        </p>

        <p
          style={{
            fontSize: 15,
            color: "#4b5563",
          }}
        >
          Use this space to share your mission, the ages you work with, and what
          players can expect when they walk into the facility for the first
          time.
        </p>
      </main>
    </div>
  );
}
