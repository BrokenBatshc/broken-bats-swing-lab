// app/contact/page.tsx
export default function ContactPage() {
  return (
    <div>
      <section style={{ marginBottom: 32 }}>
        <h1>Contact Broken Bats Hitting Club</h1>
        <p>
          Have questions about Swing Lab, memberships, or remote training?
          Reach out and we&apos;ll get back to you as soon as we can.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        {/* Later: replace with a real form handler */}
        <form
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <label>
            Name
            <input type="text" name="name" />
          </label>

          <label>
            Email
            <input type="email" name="email" />
          </label>

          <label>
            Athlete Age (optional)
            <input type="text" name="age" />
          </label>

          <label>
            Message
            <textarea name="message" rows={4} />
          </label>

          <button type="submit">Send Message</button>
        </form>
      </section>

      <section>
        <h2>Other ways to reach us</h2>
        <p>Email: info@brokenbatshc.com (placeholder)</p>
      </section>
    </div>
  );
}
