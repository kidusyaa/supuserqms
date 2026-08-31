import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@iconify/react";

export const metadata: Metadata = {
  title: "For Business - Grow Your Salon, Barbershop & Spa with GizeBook",
  description: "Learn how GizeBook streamlines queue management, online appointments, staff scheduling, and customer growth for beauty & wellness businesses.",
  alternates: { canonical: "/for-business" },
};

export default function ForBusinessPage() {
  const REGISTRATION_URL = "https://app.gizebook.com/registration/company";

  const benefits = [
    {
      icon: "solar:users-group-two-rounded-bold-duotone",
      title: "Real-Time Queue Management",
      description: "Eliminate crowded waiting rooms. Customers can join a digital queue, receive live wait-time updates, and arrive precisely when it's their turn.",
      badge: "No More Waiting Room Chaos",
    },
    {
      icon: "solar:calendar-date-bold-duotone",
      title: "24/7 Online Appointment Booking",
      description: "Never miss a customer while you're busy cutting hair or performing a massage. Clients can book appointment slots round the clock.",
      badge: "Zero Phone Call Interruptions",
    },
    {
      icon: "solar:user-id-bold-duotone",
      title: "Staff & Schedule Control",
      description: "Assign services to specific specialists, manage individual provider shifts, and track team performance with ease.",
      badge: "Team Management",
    },
    {
      icon: "solar:tag-price-bold-duotone",
      title: "Packages & Discount Promotions",
      description: "Create bundle deals (e.g. 3-in-1 refresh packages) and timed discount offers to fill empty chairs during off-peak hours.",
      badge: "Boost Average Ticket Size",
    },
    {
      icon: "solar:card-2-bold-duotone",
      title: "Prepayment & Deposit Protection",
      description: "Protect your schedule against no-shows by requiring upfront deposits or full prepayment for high-value services.",
      badge: "Reduce No-Shows",
    },
    {
      icon: "solar:star-fall-bold-duotone",
      title: "Local Discovery & Verified Reviews",
      description: "Gain prime visibility when clients in your neighborhood search for barbershops, spas, or salons on GizeBook.",
      badge: "Grow Client Base",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Business Profile",
      description: "Sign up in 2 minutes with your salon or barbershop name, location address, logo, and contact info.",
      icon: "solar:shop-2-bold-duotone",
    },
    {
      number: "02",
      title: "Add Services & Packages",
      description: "List your treatments, set prices, durations, service categories, and bundled special packages.",
      icon: "solar:clipboard-list-bold-duotone",
    },
    {
      number: "03",
      title: "Configure Hours & Staff",
      description: "Set your weekly opening hours and assign staff providers who can deliver each service.",
      icon: "solar:clock-circle-bold-duotone",
    },
    {
      number: "04",
      title: "Start Accepting Clients",
      description: "Go live immediately! Clients can find your salon, join live queues, and book appointments online.",
      icon: "solar:rocket-2-bold-duotone",
    },
  ];

  const faqs = [
    {
      q: "How much does it cost to register my business?",
      a: "Getting started on GizeBook is completely free to set up. You can create your company profile, list all your services, and start taking bookings right away.",
    },
    {
      q: "Do I need special hardware to run GizeBook in my shop?",
      a: "No special hardware is required! GizeBook runs smoothly on any smartphone, tablet, laptop, or desktop computer with an internet browser.",
    },
    {
      q: "Can clients join our walk-in queue remotely?",
      a: "Yes! Clients can join your live queue directly through the GizeBook web app or in person, and they'll see their exact position in line.",
    },
    {
      q: "Can I manage multiple staff members and stylists?",
      a: "Absolutely. You can add providers, specify which services each team member performs, and manage individual working schedules.",
    },
    {
      q: "How do discount promotions and packages work?",
      a: "You can create special promotional packages (like 'Haircut + Beard Trim + Hot Towel') or attach percentage/fixed discounts to any service at any time.",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
      
      {/* ── 1. Hero Section ── */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-[#1b3a47] text-white pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 max-w-5xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase mb-6 backdrop-blur-xs animate-in fade-in duration-300">
            <Icon icon="solar:sparkles-bold" className="w-4 h-4 text-amber-400" />
            <span>For Salons, Barbershops & Spas</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-tight mb-6">
            Grow Your Business &amp; <br className="hidden sm:inline" />
            <span className="text-amber-400">Eliminate Queue Chaos</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Streamline walk-in queues, accept 24/7 online appointments, manage staff effortlessly, and attract more local clients with GizeBook.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={REGISTRATION_URL}
              target="_blank"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <span>Register Your Business Free</span>
              <Icon icon="solar:arrow-right-up-linear" className="w-5 h-5" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-base backdrop-blur-md transition-all"
            >
              <span>See How It Works</span>
              <Icon icon="solar:alt-arrow-down-linear" className="w-5 h-5" />
            </a>
          </div>

          {/* Trust Highlights Pills */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-amber-400" />
              <span>Real-Time Digital Queue</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-amber-400" />
              <span>Instant Appointment Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-amber-400" />
              <span>Multi-Staff Management</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-amber-400" />
              <span>Zero Complicated Setup</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Key Benefits Section ── */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="font-serif font-bold text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-tight mb-3">
            Why Top Salons &amp; Barbers Choose GizeBook
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            Everything you need to automate daily operations, delight clients, and increase monthly revenue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 flex items-center justify-center text-amber-600">
                    <Icon icon={b.icon} width="26" height="26" />
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full border border-amber-200/50">
                    {b.badge}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white mb-2">
                  {b.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Step-by-Step Registration & Usage Guide ── */}
      <section id="how-it-works" className="py-16 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2 block">
              Easy Onboarding
            </span>
            <h2 className="font-serif font-bold text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-tight mb-3">
              Get Started in 4 Simple Steps
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              Start taking online bookings and managing your queue in under 10 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-6 flex flex-col justify-between hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-serif font-black text-2xl text-amber-500">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-2xs flex items-center justify-center text-slate-700 dark:text-slate-200">
                      <Icon icon={step.icon} width="20" height="20" />
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Registration Button under Steps */}
          <div className="mt-12 text-center">
            <Link
              href={REGISTRATION_URL}
              target="_blank"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-tertiary hover:bg-slate-900 text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all active:scale-98"
            >
              <span>Begin Registration Now</span>
              <Icon icon="solar:arrow-right-linear" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Comparison: Before vs After GizeBook ── */}
      <section className="py-16 sm:py-24 max-w-5xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight mb-2">
            The GizeBook Advantage
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            See the difference modern queue and booking management makes for your shop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Way */}
          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-4">
              <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
              <span>Traditional Walk-In &amp; Phone Booking</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                <span>Crowded waiting chairs with frustrated, waiting clients</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                <span>Constantly answering phone calls while serving customers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                <span>Frequent no-shows and lost appointment revenue</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                <span>Manual paper appointment books that easily get messy</span>
              </li>
            </ul>
          </div>

          {/* With GizeBook */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-4">
              <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
              <span>With GizeBook Digital Management</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Live digital queue with transparent, real-time wait times</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Automatic 24/7 online bookings directly into your calendar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Prepayment options to guarantee client attendance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Automated reviews, service packages, and revenue growth</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 5. FAQs Section ── */}
      <section className="py-12 max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Have questions about listing your business? Here are the answers.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs"
            >
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white mb-2">
                {faq.q}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Final Call to Action ── */}
      <section className="mt-16 max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#1b3a47] rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl border border-slate-700">
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="font-serif font-bold text-2xl sm:text-4xl text-white tracking-tight mb-4">
              Ready to Upgrade Your Salon or Barbershop?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mb-8">
              Join leading beauty and wellness providers on GizeBook. Free registration takes just a few minutes.
            </p>
            <Link
              href={REGISTRATION_URL}
              target="_blank"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <span>Register Your Business Today</span>
              <Icon icon="solar:arrow-right-up-linear" className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
