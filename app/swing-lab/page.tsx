import Link from "next/link";

export default function SwingLabPage() {
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
          Swing Lab – Remote Swing Analysis
        </h1>

        <p
          style={{
            fontSize: 15,
            color: "#4b5563",
            marginBottom: 12,
          }}
        >
          Swing Lab is our video-based hitting service. Players send in a swing
          and receive a detailed written report plus specific drills to work on
          at home or in the cage. It feels like a one-on-one lesson even when
          you can&apos;t be in the facility.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              1. Upload Your Swing
            </h2>
            <p style={{ margin: 0, color: "#4b5563" }}>
              Use your phone to record a clear side-view swing. Create an
              account, log in, and upload the clip through your Swing Lab
              dashboard.
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              2. Get a Swing Report
            </h2>
            <p style={{ margin: 0, color: "#4b5563" }}>
              We break down what you&apos;re doing well and the 2–4 biggest
              things to fix, written directly to the player in simple language.
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          >
            <h2
              style={{
                fontSize: 18,
                marginTop: 0,
                marginBottom: 8,
              }}
            >
              3. Get Specific Drills
            </h2>
            <p style={{ margin: 0, color: "#4b5563" }}>
              Each report includes 3–6 drills tailored to that swing so players
              know exactly what to work on in their next practice.
            </p>
          </div>
        </div>

        <Link
          href="/login"
          style={{
            display: "inline-flex",
            padding: "10px 18px",
            borderRadius: 999,
            background: "#111827",
            color: "#f9fafb",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Log In or Create an Account
        </Link>
      </main>
    </div>
  );
}
