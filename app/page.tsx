import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#111827",
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      {/* Top nav */}
      <header
        style={{
          borderBottom: "1px solid #e5e7eb",
          marginBottom: 24,
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
          {/* Logo */}
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

          {/* Nav links */}
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

      {/* Main content */}
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px 40px",
        }}
      >
        {/* Hero video section */}
        <section style={{ marginBottom: 40 }}>
          <div
            style={{
              background: "#000000",
              borderRadius: 0,
              overflow: "hidden",
              border: "1px solid #e5e7eb",
            }}
          >
            {/* 
              Put your hero video at /public/hero.mp4 (or change the src).
              You can also change to a big image if you prefer.
            */}
            <video
              src="/hero.mp4"
              controls
              // autoPlay
              // muted
              // loop
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        {/* Testimonials */}
        <section>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              textAlign: "left",
              marginBottom: 24,
            }}
          >
            Customer Testimonials
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 0,
              border: "1px solid #e5e7eb",
              borderRadius: 0,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "24px 20px",
                borderRight: "1px solid #e5e7eb",
                background: "#f9fafb",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0 }}>
                My daughter enjoys the one-on-one interaction with the trainer.
                Less distractions at Broken Bats than at other facilities.
              </p>
            </div>
            <div
              style={{
                padding: "24px 20px",
                borderRight: "1px solid #e5e7eb",
                background: "#f9fafb",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0 }}>
                Great facility and awesome trainers. We enjoy coming here every
                week!!
              </p>
            </div>
            <div
              style={{
                padding: "24px 20px",
                background: "#f9fafb",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0 }}>
                Friendly people and good location. We can&apos;t recommend
                Broken Bats enough. We love it.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
