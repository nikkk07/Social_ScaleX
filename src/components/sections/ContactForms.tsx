"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast, Toaster } from "sonner";
import { GlassCard } from "../GlassCard";
import { submitEnquiry, warmSupabase, type SubmitResult } from "./submitEnquiry";
import { CONTACT_OFFER } from "@/lib/content";
import { CONTACTS } from "@/lib/site";

const inputClasses =
  "w-full liquid-glass-inset rounded-lg px-4 py-3 text-ink placeholder:text-ink-subtle transition-colors";
const labelClasses = "block text-sm font-medium text-ink-muted mb-2";
const errorClasses = "text-critical text-xs mt-1.5";
// No `focus:outline-none` on the inputs: the global `input:focus-visible`
// ring in theme.css is the keyboard indicator, and suppressing it here would
// repeat the FAQ's Phase 8 bug in the one place on the site where losing your
// place mid-form actually costs a lead.
//
// Off-screen honeypot: real users never see or fill it; bots do.
const honeypotClasses = "absolute left-[-9999px] w-px h-px overflow-hidden";

/** Indian mobile: 10 digits starting 6–9, optional +91 / spaces / hyphens. */
const indianPhone = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;

const callbackSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  phone: z
    .string()
    .trim()
    .refine((v) => indianPhone.test(v.replace(/[\s-]/g, "")), "Enter a valid Indian mobile number"),
  bestTime: z.string().trim().max(80).optional(),
  // Honeypot. Deliberately NOT `.max(0)`: that made zod reject the whole form
  // before onSubmit ever ran, and the error attached to a field that is
  // off-screen and has no error slot — so a tripped honeypot produced a dead
  // button and total silence. Anyone caught by a false positive (a password
  // manager autofilling "Company") would be silently discarded, which is the
  // exact bug this phase exists to close. Let the value through and handle it
  // in onSubmit, where it can be reported.
  company: z.string().optional(),
});

const querySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Enter a valid email address"),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)"),
  // Honeypot. Deliberately NOT `.max(0)`: that made zod reject the whole form
  // before onSubmit ever ran, and the error attached to a field that is
  // off-screen and has no error slot — so a tripped honeypot produced a dead
  // button and total silence. Anyone caught by a false positive (a password
  // manager autofilling "Company") would be silently discarded, which is the
  // exact bug this phase exists to close. Let the value through and handle it
  // in onSubmit, where it can be reported.
  company: z.string().optional(),
});

type CallbackValues = z.infer<typeof callbackSchema>;
type QueryValues = z.infer<typeof querySchema>;

// Built from site.ts and content.ts rather than retyped. The literal
// "+91 80777 27669" appeared three times in this file; a number that is
// wrong in one of three places is worse than one that is absent.
const PRIMARY_PHONE = CONTACTS[0].display;
const DIRECT_CONTACT = `Call or WhatsApp ${PRIMARY_PHONE} and we'll jump right on it.`;

/** The outcome of a submit, in the words shown on screen and announced. */
interface Status {
  ok: boolean;
  text: string;
}

/**
 * The submit outcome, on screen and to a screen reader.
 *
 * The toasts alone were not enough. sonner renders bottom-centre, auto-
 * dismisses, and is the first thing gone if the tab is backgrounded mid-send
 * — so the only confirmation that an enquiry reached us could disappear
 * before it was read. This region is inline, next to the button that was
 * pressed, and it persists until the next submit.
 *
 * It is rendered ALWAYS, empty when idle. A live region has to be in the DOM
 * before its content changes; one that mounts together with its message is
 * routinely missed by screen readers.
 */
function SubmitStatus({ status }: { status: Status | null }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {status ? (
        <p
          className={`text-sm rounded-lg px-4 py-3 ${
            status.ok
              ? "text-positive liquid-glass-inset"
              : "text-critical liquid-glass-inset"
          }`}
        >
          {status.text}
        </p>
      ) : null}
    </div>
  );
}

/**
 * One place that turns a SubmitResult into what the visitor sees. The rule
 * this exists to enforce: never claim success we didn't get, and never leave
 * someone unsure whether their enquiry sent. Every branch below is either a
 * confirmed send or an explicit failure with a way to reach us.
 */
function reportResult(result: SubmitResult): Status {
  if (result.ok) {
    const description = "We'll be in touch shortly, usually within a few hours.";
    toast.success("Thanks — we've got your details.", { description });
    return { ok: true, text: `Thanks — we've got your details. ${description}` };
  }
  if (result.kind === "throttled") {
    const mins = Math.ceil(result.retryAfterMs / 60_000);
    const description =
      mins <= 1
        ? `Give it a moment before sending again — or call us on ${PRIMARY_PHONE}.`
        : `Please try again in about ${mins} minutes, or call ${PRIMARY_PHONE}.`;
    toast.warning("You've just sent us something.", { description });
    return { ok: false, text: `You've just sent us something. ${description}` };
  }
  toast.error("Something went wrong sending that.", { description: DIRECT_CONTACT });
  return { ok: false, text: `Something went wrong sending that. ${DIRECT_CONTACT}` };
}

/**
 * A tripped honeypot is REPORTED, not silently dropped. A bot learns little
 * either way, but a password manager that autofills the hidden "Company" field
 * would otherwise put a real person into exactly the silent-discard hole this
 * whole phase exists to close. They get a message and a phone number.
 */
function reportHoneypot(): Status {
  toast.error("We couldn't verify that submission.", { description: DIRECT_CONTACT });
  return { ok: false, text: `We couldn't verify that submission. ${DIRECT_CONTACT}` };
}

function CallbackForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CallbackValues>({ resolver: zodResolver(callbackSchema) });
  const [status, setStatus] = useState<Status | null>(null);

  const onSubmit = async (data: CallbackValues) => {
    setStatus(null);
    if (data.company) return setStatus(reportHoneypot());
    const { name, phone, bestTime } = data;
    const result = await submitEnquiry({
      kind: "callback",
      name: name.trim(),
      phone: phone.trim(),
      best_time: bestTime?.trim() || null,
    });
    const outcome = reportResult(result);
    setStatus(outcome);
    // Only clear the form on a confirmed write — otherwise a failed send would
    // also destroy what they typed, and they'd have to type it all again.
    if (outcome.ok) reset();
  };

  return (
    // Fetch the Supabase chunk when they first touch the form; see
    // submitEnquiry.ts for why this is the trigger and not module scope or idle.
    <form
      className="space-y-6"
      onSubmit={handleSubmit(onSubmit)}
      onFocusCapture={warmSupabase}
      noValidate
    >
      <div className={honeypotClasses} aria-hidden>
        <label>
          Company
          <input type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
        </label>
      </div>

      <div>
        <label htmlFor="cb-name" className={labelClasses}>
          Your name
        </label>
        {/* aria-invalid drives both the announcement and the red border, so
            the state cannot be visually wrong while being correct to a
            screen reader. aria-describedby points at the message itself. */}
        <input
          id="cb-name"
          type="text"
          autoComplete="name"
          className={inputClasses}
          placeholder="Your Name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "cb-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="cb-name-error" role="alert" className={errorClasses}>
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cb-phone" className={labelClasses}>
          Phone number
        </label>
        <input
          id="cb-phone"
          type="tel"
          autoComplete="tel"
          className={inputClasses}
          placeholder="+91 XXXXX XXXXX"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "cb-phone-error" : undefined}
          {...register("phone")}
        />
        {errors.phone && (
          <p id="cb-phone-error" role="alert" className={errorClasses}>
            {errors.phone.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cb-time" className={labelClasses}>
          Best time to call (optional)
        </label>
        <input id="cb-time" type="text" className={inputClasses} placeholder="e.g. Tomorrow afternoon" {...register("bestTime")} />
      </div>

      <SubmitStatus status={status} />

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-cta w-full disabled:opacity-60 disabled:hover:scale-100"
      >
        {isSubmitting ? "Sending…" : "Request a callback"}
      </button>
      <p className="text-2xs text-ink-subtle text-center">
        {CONTACT_OFFER.callbackNote}
      </p>
    </form>
  );
}

function QueryForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QueryValues>({ resolver: zodResolver(querySchema) });
  const [status, setStatus] = useState<Status | null>(null);

  const onSubmit = async (data: QueryValues) => {
    setStatus(null);
    if (data.company) return setStatus(reportHoneypot());
    const { name, email, message } = data;
    const result = await submitEnquiry({
      kind: "query",
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    const outcome = reportResult(result);
    setStatus(outcome);
    if (outcome.ok) reset();
  };

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(onSubmit)}
      onFocusCapture={warmSupabase}
      noValidate
    >
      <div className={honeypotClasses} aria-hidden>
        <label>
          Company
          <input type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
        </label>
      </div>

      <div>
        <label htmlFor="q-name" className={labelClasses}>
          Your name
        </label>
        <input
          id="q-name"
          type="text"
          autoComplete="name"
          className={inputClasses}
          placeholder="Your Name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "q-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="q-name-error" role="alert" className={errorClasses}>
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="q-email" className={labelClasses}>
          Email
        </label>
        <input
          id="q-email"
          type="email"
          autoComplete="email"
          className={inputClasses}
          placeholder="your_email@gmail.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "q-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="q-email-error" role="alert" className={errorClasses}>
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="q-message" className={labelClasses}>
          What do you need help with?
        </label>
        <textarea
          id="q-message"
          rows={3}
          className={`${inputClasses} resize-none`}
          placeholder="Tell us about your brand..."
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "q-message-error" : undefined}
          {...register("message")}
        />
        {errors.message && (
          <p id="q-message-error" role="alert" className={errorClasses}>
            {errors.message.message}
          </p>
        )}
      </div>

      <SubmitStatus status={status} />

      {/* The one primary action in this section, in the one accent colour.
          It replaced a white button here and a violet one on the other tab:
          two different treatments for the same act, neither of them the
          site's CTA colour. */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-cta w-full disabled:opacity-60 disabled:hover:scale-100"
      >
        {isSubmitting ? "Sending…" : "Send query"}
      </button>
    </form>
  );
}

/**
 * The interactive half of the contact section: tab switch, both forms, and
 * the toast host. Split out of Contact.tsx and loaded through next/dynamic so
 * react-hook-form, zod and sonner stay off the homepage's critical path —
 * together they were roughly a third of the initial JavaScript, for a widget
 * below the fold that most visitors never touch.
 */
export default function ContactForms() {
  const [activeTab, setActiveTab] = useState<"callback" | "query">("callback");

  return (
    <GlassCard className="p-2">
      <div className="rounded-3xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-stroke relative">
          <button
            type="button"
            onClick={() => setActiveTab("callback")}
            aria-pressed={activeTab === "callback"}
            className={`flex-1 py-4 text-center font-medium transition-colors relative ${
              activeTab === "callback" ? "text-ink" : "text-ink-subtle hover:text-ink"
            }`}
          >
            Request a callback
            {activeTab === "callback" && (
              <span className="rule-growth absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-pill" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("query")}
            aria-pressed={activeTab === "query"}
            className={`flex-1 py-4 text-center font-medium transition-colors border-l border-stroke relative ${
              activeTab === "query" ? "text-ink" : "text-ink-subtle hover:text-ink"
            }`}
          >
            Send a query
            {activeTab === "query" && (
              <span className="rule-growth absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-pill" />
            )}
          </button>
        </div>

        <div className="p-8">
          {activeTab === "callback" ? <CallbackForm /> : <QueryForm />}
        </div>
      </div>
      <Toaster position="bottom-center" theme="dark" richColors />
    </GlassCard>
  );
}
