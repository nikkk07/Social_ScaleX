"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast, Toaster } from "sonner";
import { GlassCard } from "../GlassCard";
import { submitEnquiry, warmSupabase, type SubmitResult } from "./submitEnquiry";

const inputClasses =
  "w-full liquid-glass-inset rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-[var(--color-violet-light)] transition-colors";
const errorClasses = "text-[#F87171] text-xs mt-1.5";
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

const DIRECT_CONTACT = "Call or WhatsApp +91 80777 27669 and we'll jump right on it.";

/**
 * One place that turns a SubmitResult into what the visitor sees. The rule
 * this exists to enforce: never claim success we didn't get, and never leave
 * someone unsure whether their enquiry sent. Every branch below is either a
 * confirmed send or an explicit failure with a way to reach us.
 */
function reportResult(result: SubmitResult): boolean {
  if (result.ok) {
    toast.success("Thanks — we've got your details.", {
      description: "We'll be in touch shortly, usually within a few hours.",
    });
    return true;
  }
  if (result.kind === "throttled") {
    const mins = Math.ceil(result.retryAfterMs / 60_000);
    toast.warning("You've just sent us something.", {
      description:
        mins <= 1
          ? "Give it a moment before sending again — or call us on +91 80777 27669."
          : `Please try again in about ${mins} minutes, or call +91 80777 27669.`,
    });
    return false;
  }
  toast.error("Something went wrong sending that.", { description: DIRECT_CONTACT });
  return false;
}

/**
 * A tripped honeypot is REPORTED, not silently dropped. A bot learns little
 * either way, but a password manager that autofills the hidden "Company" field
 * would otherwise put a real person into exactly the silent-discard hole this
 * whole phase exists to close. They get a message and a phone number.
 */
function reportHoneypot() {
  toast.error("We couldn't verify that submission.", { description: DIRECT_CONTACT });
}

function CallbackForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CallbackValues>({ resolver: zodResolver(callbackSchema) });

  const onSubmit = async (data: CallbackValues) => {
    if (data.company) return reportHoneypot();
    const { name, phone, bestTime } = data;
    const result = await submitEnquiry({
      kind: "callback",
      name: name.trim(),
      phone: phone.trim(),
      best_time: bestTime?.trim() || null,
    });
    // Only clear the form on a confirmed write — otherwise a failed send would
    // also destroy what they typed, and they'd have to type it all again.
    if (reportResult(result)) reset();
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
        <label htmlFor="cb-name" className="block text-sm font-medium text-white/75 mb-2">
          Your name
        </label>
        <input id="cb-name" type="text" autoComplete="name" className={inputClasses} placeholder="Your Name" {...register("name")} />
        {errors.name && <p className={errorClasses}>{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="cb-phone" className="block text-sm font-medium text-white/75 mb-2">
          Phone number
        </label>
        <input id="cb-phone" type="tel" autoComplete="tel" className={inputClasses} placeholder="+91 XXXXX XXXXX" {...register("phone")} />
        {errors.phone && <p className={errorClasses}>{errors.phone.message}</p>}
      </div>

      <div>
        <label htmlFor="cb-time" className="block text-sm font-medium text-white/75 mb-2">
          Best time to call (optional)
        </label>
        <input id="cb-time" type="text" className={inputClasses} placeholder="e.g. Tomorrow afternoon" {...register("bestTime")} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-white text-[#0B0A10] font-bold py-4 rounded-xl hover:bg-white/90 transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xl disabled:opacity-60 disabled:hover:scale-100"
      >
        {isSubmitting ? "Sending…" : "Request a callback"}
      </button>
      <p className="text-xs text-white/50 text-center">
        We usually call back within a few hours, during business hours.
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

  const onSubmit = async (data: QueryValues) => {
    if (data.company) return reportHoneypot();
    const { name, email, message } = data;
    const result = await submitEnquiry({
      kind: "query",
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    if (reportResult(result)) reset();
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
        <label htmlFor="q-name" className="block text-sm font-medium text-white/75 mb-2">
          Your name
        </label>
        <input id="q-name" type="text" autoComplete="name" className={inputClasses} placeholder="Your Name" {...register("name")} />
        {errors.name && <p className={errorClasses}>{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="q-email" className="block text-sm font-medium text-white/75 mb-2">
          Email
        </label>
        <input id="q-email" type="email" autoComplete="email" className={inputClasses} placeholder="your_email@gmail.com" {...register("email")} />
        {errors.email && <p className={errorClasses}>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="q-message" className="block text-sm font-medium text-white/75 mb-2">
          What do you need help with?
        </label>
        <textarea id="q-message" rows={3} className={`${inputClasses} resize-none`} placeholder="Tell us about your brand..." {...register("message")} />
        {errors.message && <p className={errorClasses}>{errors.message.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[var(--color-violet-cta)] text-white font-bold py-4 rounded-xl transition-transform hover:scale-[1.01] active:scale-[0.98] shadow-xl shadow-[var(--color-violet)]/25 border border-white/20 disabled:opacity-60 disabled:hover:scale-100"
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
        <div className="flex border-b border-white/10 relative">
          <button
            type="button"
            onClick={() => setActiveTab("callback")}
            aria-pressed={activeTab === "callback"}
            className={`flex-1 py-4 text-center font-medium transition-colors relative ${
              activeTab === "callback" ? "text-white" : "text-white/60 hover:text-white/90"
            }`}
          >
            Request a callback
            {activeTab === "callback" && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-[var(--color-violet)] to-[var(--color-emerald)] rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("query")}
            aria-pressed={activeTab === "query"}
            className={`flex-1 py-4 text-center font-medium transition-colors border-l border-white/10 relative ${
              activeTab === "query" ? "text-white" : "text-white/60 hover:text-white/90"
            }`}
          >
            Send a query
            {activeTab === "query" && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-[var(--color-violet)] to-[var(--color-emerald)] rounded-full" />
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
