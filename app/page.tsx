// app/page.tsx
export default function HomePage() {
  return (
    <div>
      <section style={{ marginBottom: 32 }}>
        <h1>Build a dangerous swing from anywhere.</h1>
        <p>
          Broken Bats Hitting Club combines AI swing analysis and real coaching
          to help hitters level up without needing a fancy facility.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <a href="/swing-lab">
            <button>Get Started with Swing Lab</button>
          </a>
          <a href="/swing-lab#pricing">
            <button>View Memberships</button>
          </a>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>What is Broken Bats?</h2>
        <p>
          Broken Bats Hitting Club is a remote-first hitting program for serious
          hitters and baseball parents. Record your swing on your phone, send it
          in, and get clear feedback, drills, and a plan for what to work on
          next.
        </p>
        <ul>
          <li>Remote, phone-based swing analysis</li>
          <li>AI-assisted breakdowns customized to each hitter</li>
          <li>Human trainers reviewing progress on premium plans</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>How Swing Lab Works</h2>
        <ol>
          <li>
            <strong>Record your swing</strong> – Side view or open side on your
            phone.
          </li>
          <li>
            <strong>Upload to Swing Lab</strong> – Use your Broken Bats account
            to submit the clip.
          </li>
          <li>
            <strong>Get feedback + drills</strong> – AI breaks down your swing
            and recommends drills; higher plans add monthly coach review.
          </li>
        </ol>
        <a href="/swing-lab">Learn more about Swing Lab →</a>
      </section>

      <section>
        <h2>Membership Options</h2>
        <ul>
          <li>
            <strong>Swing Analysis – $75 per analysis</strong> – One-time AI
            breakdown + report and drill recommendations.
          </li>
          <li>
            <strong>Minor League – $150 / month</strong> – 3 video uploads per
            week with AI that learns the athlete.
          </li>
          <li>
            <strong>Major League – $225 / month</strong> – 10 uploads per week,
            AI feedback, monthly human trainer review, and Blast Motion data
            integration.
          </li>
        </ul>
      </section>
    </div>
  );
}
