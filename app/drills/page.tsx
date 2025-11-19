// app/drills/page.tsx
export default function DrillsPage() {
  // Later: check auth; if not logged in, show the top section only
  return (
    <div>
      <section style={{ marginBottom: 32 }}>
        <h1>Drills Library (Members Only)</h1>
        <p>
          This area is for Broken Bats Swing Lab members. Log in to see your
          assigned drills and training focus for the week.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <a href="/login">
            <button>Log In</button>
          </a>
          <a href="/swing-lab#pricing">
            <button>Join Swing Lab</button>
          </a>
        </div>
      </section>

      <section>
        <h2>Future Members View (concept)</h2>
        <p>
          Once authentication is wired up, this page will show each
          athlete&apos;s current focus, assigned drills, and notes from AI and
          their trainer.
        </p>
      </section>
    </div>
  );
}
