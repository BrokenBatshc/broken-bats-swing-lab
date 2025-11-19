// app/swing-lab/page.tsx
export default function SwingLabPage() {
  return (
    <div>
      <section style={{ marginBottom: 32 }}>
        <h1>Broken Bats Swing Lab</h1>
        <p>AI-assisted swing analysis with real coaching behind it.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>How It Works</h2>
        <ol>
          <li>
            <strong>Upload your swing</strong> – Record from the open side or
            slightly behind and upload via your account.
          </li>
          <li>
            <strong>AI analyzes your mechanics</strong> – The system tracks body
            positions, timing, and bat path and flags issues.
          </li>
          <li>
            <strong>Get feedback, drills, and reviews</strong> – Receive a
            written breakdown, drills, and on Major League plans, a monthly
            human trainer review.
          </li>
        </ol>
      </section>

      <section id="pricing" style={{ marginBottom: 32 }}>
        <h2>Plans & Pricing</h2>

        <h3>Swing Analysis – $75 per analysis</h3>
        <p>Perfect for a one-time “checkup” on your swing.</p>
        <ul>
          <li>Upload a single video.</li>
          <li>AI breakdown of your swing.</li>
          <li>Written report in plain language.</li>
          <li>3–5 drill recommendations.</li>
        </ul>

        <h3>Minor League – $150 / month</h3>
        <p>For hitters who want steady feedback and a weekly focus.</p>
        <ul>
          <li>Up to 3 video uploads per week.</li>
          <li>AI feedback and drill recommendations on each upload.</li>
          <li>AI learns your patterns and refines cues over time.</li>
          <li>Access to members-only drills library.</li>
        </ul>

        <h3>Major League – $225 / month</h3>
        <p>For serious hitters who want near-daily feedback and a coach.</p>
        <ul>
          <li>Up to 10 video uploads per week.</li>
          <li>AI feedback and drills on each upload.</li>
          <li>AI builds a deeper profile of your swing over time.</li>
          <li>
            Monthly human trainer review of recent swings with added notes and
            adjustments.
          </li>
          <li>
            Blast Motion data integration via a simple form submitted with your
            video.
          </li>
        </ul>
      </section>

      <section>
        <h2>FAQ</h2>
        <h4>What ages do you work with?</h4>
        <p>
          We primarily work with youth, high school, and college hitters. If the
          athlete can safely swing a bat and follow simple instructions, we can
          help.
        </p>

        <h4>How do I record the swing?</h4>
        <p>
          Use your phone, film from the open side or slightly behind, and make
          sure we can see the full body and bat through contact.
        </p>

        <h4>How fast is feedback?</h4>
        <p>
          Our goal is to return AI feedback within a short window after upload.
          Exact turnaround times can vary as we grow, but we&apos;ll be clear in
          your account dashboard.
        </p>
      </section>
    </div>
  );
}
