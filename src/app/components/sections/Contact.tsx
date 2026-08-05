import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { GlassCard } from "../GlassCard";
import { Reveal } from "../effects/Reveal";

const inputClasses =
  "w-full liquid-glass-inset rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[var(--color-violet-light)] transition-colors";
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
  company: z.string().max(0).optional(), // honeypot
});

const querySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().email("Enter a valid email address"),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)"),
  company: z.string().max(0).optional(), // honeypot
});

type CallbackValues = z.infer<typeof callbackSchema>;
type QueryValues = z.infer<typeof querySchema>;

/**
 * TODO(phase-8): replace with an insert into public.inbound_enquiries via
 * the Supabase anon client, then show a success toast + reset. Until then
 * this fails LOUDLY and never claims success — the previous version
 * silently discarded every enquiry, which is the bug being fixed.
 */
function reportUnwired(kind: "callback" | "query", payload: Record<string, unknown>) {
  console.error(
    `[contact] "${kind}" submission is not wired to Supabase yet (Phase 8). ` +
      "Nothing was sent. Payload:",
    payload,
  );
  toast.error("Our form isn't live yet — please reach us directly.", {
    description: "Call or WhatsApp +91 80777 27669 and we'll jump right on it.",
  });
}

function CallbackForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CallbackValues>({ resolver: zodResolver(callbackSchema) });

  const onSubmit = async (data: CallbackValues) => {
    if (data.company) return; // honeypot tripped — drop silently
    const { name, phone, bestTime } = data;
    reportUnwired("callback", { name, phone, bestTime });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
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
    formState: { errors, isSubmitting },
  } = useForm<QueryValues>({ resolver: zodResolver(querySchema) });

  const onSubmit = async (data: QueryValues) => {
    if (data.company) return; // honeypot tripped — drop silently
    const { name, email, message } = data;
    reportUnwired("query", { name, email, message });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
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

export function Contact() {
  const [activeTab, setActiveTab] = useState<"callback" | "query">("callback");

  return (
    <section
      id="contact"
      aria-label="Contact Social ScaleX"
      className="py-24 md:py-32 relative border-t border-white/5 section-cv"
    >
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <Reveal className="w-full lg:w-1/2">
            <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">
              Ready to scale?
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
              Let&apos;s build something your audience can&apos;t ignore.
            </h2>
            <p className="text-white/70 text-lg leading-relaxed max-w-lg">
              Your first strategy call is free. No pitch decks, no pressure — just an honest
              conversation about what growth looks like for your brand.
            </p>
          </Reveal>

          <Reveal className="w-full lg:w-1/2" delay={0.15}>
            <GlassCard className="p-2">
              <div className="rounded-3xl overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-white/10 relative">
                  <button
                    onClick={() => setActiveTab("callback")}
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
                    onClick={() => setActiveTab("query")}
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
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
