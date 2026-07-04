import React from "react";
import { LegalPage } from "./LegalPage";

export function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="July 2026">
      <section>
        <h2>Who we are</h2>
        <p>
          Social ScaleX is a social media marketing agency based in Delhi NCR, India. We
          manage and grow brand presence across Instagram, Facebook, and YouTube — content
          production, page management, paid advertising, and reporting.
        </p>
      </section>
      <section>
        <h2>Our services</h2>
        <p>
          The exact scope of work — platforms, deliverables, posting cadence, ad budgets, and
          fees — is agreed individually with each client before work begins. Nothing on this
          website constitutes a fixed offer; the free strategy call is where we scope your
          engagement.
        </p>
      </section>
      <section>
        <h2>Results and expectations</h2>
        <p>
          Every metric shown on this website comes from real client dashboards, shared with
          permission. Past performance is exactly that — past. Social platforms change their
          algorithms without notice, and we never guarantee specific follower counts, view
          numbers, or revenue outcomes. What we do guarantee is honest reporting of what's
          actually happening.
        </p>
      </section>
      <section>
        <h2>Content ownership</h2>
        <p>
          Content we create for your brand belongs to your brand. Accounts, credentials, and
          audiences remain the client's property at all times, during and after our
          engagement.
        </p>
      </section>
      <section>
        <h2>Liability</h2>
        <p>
          We work carefully and in line with each platform's published policies. We're not
          liable for actions taken by the platforms themselves — algorithm changes, feature
          removals, or account restrictions arising from factors outside our control.
        </p>
      </section>
      <section>
        <h2>Getting in touch</h2>
        <p>
          Questions about these terms? Call +91 80777 27669 or +91 78278 10150, or send a
          query through the contact form on our homepage.
        </p>
      </section>
    </LegalPage>
  );
}
