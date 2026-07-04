import React from "react";
import { LegalPage } from "./LegalPage";

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <section>
        <h2>What we collect</h2>
        <p>
          When you request a callback or send a query through our website, we collect the
          details you type in: your name, phone number, email address, and anything you tell
          us about your brand. That's it — we don't harvest anything behind your back.
        </p>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          We use your contact details for one purpose: to get back to you about working
          together. We don't sell your information, we don't rent it out, and we don't add
          you to mailing lists you didn't ask for.
        </p>
      </section>
      <section>
        <h2>Client account data</h2>
        <p>
          If you become a client and give us access to your Instagram, Facebook, or YouTube
          accounts, that access is used strictly to deliver the services you hired us for.
          Account credentials remain yours, analytics data remains yours, and any performance
          numbers we publish (like the ones on our homepage) appear only with the client's
          explicit permission.
        </p>
      </section>
      <section>
        <h2>Cookies and analytics</h2>
        <p>
          This site may use basic analytics to understand how visitors use it — page views
          and rough location, never anything that identifies you personally. No advertising
          trackers run on this site.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          Want your details removed from our records? Call or message us at
          +91 80777 27669 and we'll delete them. No forms, no waiting periods.
        </p>
      </section>
    </LegalPage>
  );
}
