"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Globe, Zap, MessageSquare, Edit3, Inbox,
  MessageCircle, Link as LinkIcon, Users, CheckCircle, FileText,
  Bot, Sparkles, Fingerprint, Activity, Languages, Target,
  Phone, Clock, Star, CalendarCheck, ShieldCheck, TrendingUp,
  ChevronDown, Coffee, Car, Stethoscope
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../lib/api";
import RedberMascot from "../components/RedberMascot";

const INDUSTRIES = [
  { icon: Coffee, label: "Restaurant & Café" },
  { icon: Car, label: "Car Dealership" },
  { icon: Stethoscope, label: "Clinic & Healthcare" },
  { icon: ActivityIcon, label: "Salon & Spa" },
];

function ActivityIcon(props: any) { return <Activity {...props} />; }

const PLANS = [
  {
    emoji: "🟢", name: "Starter", billing: "Monthly / Yearly",
    priceMonthly: "₹5,500/mo", priceYearly: "₹55,000/yr",
    save: "Save ₹11,000 yearly",
    tagline: "Best for small businesses starting with AI automation.",
    features: [
      "AI Chat Receptionist",
      "Website chat widget integration",
      "Basic knowledge base training",
      "Website content crawling",
      "Lead capture (name, phone, email)",
      "CRM lead dashboard",
      "Conversation history",
      "Email notifications for new leads",
      "Up to 1 website",
    ],
    suitable: ["Small shops", "Service businesses", "Restaurants", "Consultants"],
    badge: null, badgeStyle: "",
    cardStyle: "bg-[#0e0e12] border border-white/10",
    btnStyle: "bg-white/8 hover:bg-white/15 text-white",
    checkColor: "text-emerald-400",
    nameColor: "text-gray-300",
    taglineColor: "text-gray-500",
    priceColor: "text-white",
    billingColor: "text-gray-500",
  },
  {
    emoji: "⭐", name: "Growth", billing: "Monthly / Yearly",
    priceMonthly: "₹9,999/mo", priceYearly: "₹1,00,000/yr",
    save: "Save ₹19,988 yearly",
    tagline: "Best for businesses receiving frequent enquiries.",
    features: [
      "Everything in Starter, plus:",
      "PDF document training",
      "Product catalog training",
      "Multiple knowledge sources",
      "Lead export (CSV / Excel)",
      "Conversation summaries",
      "Analytics dashboard",
      "Conversion rate & peak chat times",
      "Priority support · Up to 2 websites",
    ],
    suitable: ["Clinics", "Car dealerships", "Retail businesses", "E-commerce stores"],
    badge: "⭐ MOST POPULAR", badgeStyle: "bg-gradient-to-r from-indigo-500 to-violet-500 text-white",
    cardStyle: "bg-gradient-to-b from-indigo-950 to-[#0e0e12] border-2 border-indigo-500/50 shadow-[0_0_60px_rgba(99,102,241,0.2)] scale-[1.03] z-10",
    btnStyle: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-900/40",
    checkColor: "text-indigo-400",
    nameColor: "text-indigo-300",
    taglineColor: "text-indigo-200/50",
    priceColor: "text-white",
    billingColor: "text-indigo-300/50",
  },
  {
    emoji: "🚀", name: "Business", billing: "Monthly / Yearly",
    priceMonthly: "₹18,999/mo", priceYearly: "₹1,70,000/yr",
    save: "Save ₹57,988 yearly",
    tagline: "Full AI automation for larger businesses.",
    features: [
      "Everything in Growth, plus:",
      "Unlimited AI conversations",
      "Advanced website crawler",
      "Lead scoring & conversation insights",
      "Full conversation logs",
      "Customer interaction reports",
      "Multi-language AI support",
      "Up to 5 websites",
    ],
    suitable: ["Showrooms", "Hospitals", "Real estate", "Large service businesses"],
    badge: null, badgeStyle: "",
    cardStyle: "bg-[#0e0e12] border border-white/10",
    btnStyle: "bg-white/8 hover:bg-white/15 text-white",
    checkColor: "text-emerald-400",
    nameColor: "text-gray-300",
    taglineColor: "text-gray-500",
    priceColor: "text-white",
    billingColor: "text-gray-500",
  },
  {
    emoji: "💎", name: "2-Year Plan", billing: "Best Value · Business Package",
    priceMonthly: "≈ ₹11,875/mo avg", priceYearly: "₹2,85,000 total",
    save: "Free setup + training included",
    tagline: "Long-term AI automation with full Business package + free onboarding.",
    features: [
      "Everything in Business Plan",
      "Free full AI setup & configuration",
      "Free knowledge base training",
      "Priority onboarding support",
      "System optimization included",
      "Locked-in pricing for 2 years",
    ],
    suitable: ["Businesses wanting long-term AI automation"],
    badge: "💎 BEST VALUE", badgeStyle: "bg-gradient-to-r from-amber-400 to-orange-400 text-black",
    cardStyle: "bg-gradient-to-b from-amber-950/60 to-[#0e0e12] border border-amber-500/30",
    btnStyle: "bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-black font-black",
    checkColor: "text-amber-400",
    nameColor: "text-amber-400",
    taglineColor: "text-amber-200/40",
    priceColor: "text-white",
    billingColor: "text-amber-300/40",
  },
];

function IndiaPricing() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className={`flex flex-col relative rounded-[2rem] p-8 transition-all duration-300 ${plan.cardStyle} group h-full`}
          >
            {/* Top Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
              {plan.badge && (
                <span className={`${plan.badgeStyle} text-[10px] font-black px-4 py-1.5 rounded-full shadow-2xl tracking-widest`}>
                  {plan.badge}
                </span>
              )}
            </div>

            {/* Plan Icon & Name */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                {plan.emoji}
              </div>
              <div className="text-left">
                <p className={`text-xs font-black uppercase tracking-widest ${plan.nameColor}`}>{plan.name}</p>
                <p className={`text-[10px] font-bold opacity-60 ${plan.billingColor}`}>{plan.billing}</p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className={`text-3xl font-black ${plan.priceColor} tracking-tight`}>
                  {plan.priceMonthly}
                </span>
              </div>
              <div className="mt-1">
                <span className={`text-xs font-semibold opacity-70 ${plan.billingColor}`}>
                  {plan.priceYearly}
                </span>
              </div>
              <div className={`text-[10px] font-bold mt-1.5 ${plan.checkColor}`}>
                ✓ {plan.save}
              </div>
            </div>

            {/* Tagline */}
            <p className={`text-xs leading-relaxed mb-5 font-medium ${plan.taglineColor}`}>{plan.tagline}</p>

            {/* Features */}
            <div className="space-y-2.5 mb-5 flex-1">
              {plan.features.map((f, fi) => (
                <div key={fi} className="flex items-start gap-2.5">
                  <div className={`mt-0.5 shrink-0 ${plan.checkColor}`}>
                    <CheckCircle size={12} />
                  </div>
                  <span className={`text-xs leading-snug transition-colors ${f.includes("plus:") ? "font-bold text-gray-200" : "font-medium text-gray-400 group-hover:text-gray-200"}`}>{f}</span>
                </div>
              ))}
            </div>

            {/* Suitable For */}
            {(plan as any).suitable?.length > 0 && (
              <div className="mb-5 pt-4 border-t border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2">Suitable for</p>
                <div className="flex flex-wrap gap-1">
                  {(plan as any).suitable.map((s: string, si: number) => (
                    <span key={si} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/5">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <Link
              href="/contact"
              className={`block w-full text-center ${plan.btnStyle} font-black py-4 rounded-2xl transition-all text-[11px] uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-[0.98] shadow-xl`}
            >
              Get Started
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Trust Footer */}
      <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 group">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck size={14} className="text-indigo-400" /> Secure Payment
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <ActivityIcon size={14} className="text-indigo-400" /> Instant Access
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <Star size={14} className="text-indigo-400" /> 24/7 Support
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest">
          All prices in Indian Rupees (₹)
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  useEffect(() => {
    fetch(`${API_BASE}/api/bots/public/list`)
      .then(res => res.json())
      .then(data => {
        // API may return plain array or { bots: [] } shaped object
        const list = Array.isArray(data) ? data : (Array.isArray(data?.bots) ? data.bots : []);
        setBots(list);
        setLoading(false);
      })
      .catch(() => { setBots([]); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-[#020202] text-gray-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#020202] to-transparent blur-[120px] opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/redber_logo_transperent.png" alt="Redber" className="h-8 w-auto object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#industries" className="hover:text-white transition-colors">Industries</a>
            <a href="#demo" className="hover:text-white transition-colors">Live Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <a href="#demo" className="hidden sm:flex items-center gap-2 text-gray-300 hover:text-white text-sm font-semibold transition-colors">
              See Demo
            </a>
            <Link href="/contact" className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <motion.section
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative pt-44 pb-32 px-6 flex flex-col items-center text-center w-full z-10 min-h-[90vh] justify-center overflow-hidden"
      >
        {/* VIDEO BACKGROUND */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen"
            src="/bg.webm"
          />
          {/* Gradient fade out to blend with the rest of the black page */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020202]/40 via-transparent to-[#020202]" />
          {/* Subtle noise/grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold px-4 py-2 rounded-full mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Answering customers 24/7 — even when you&apos;re closed
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.05]"
        >
          Your AI Receptionist
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            That Never Sleeps.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 mb-4 leading-relaxed max-w-2xl mx-auto font-light"
        >
          Redber answers customer questions, books appointments, and captures leads — automatically —
          so your team can focus on what matters.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-sm text-gray-500 mb-10"
        >
          Built for restaurants, clinics, car dealerships, salons, and more.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link href="/contact" className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-full font-bold text-base shadow-[0_0_40px_rgba(99,102,241,0.35)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] hover:-translate-y-1 transition-all duration-300">
            Get Your AI Receptionist <ArrowRight size={18} />
          </Link>
          <a href="#demo" className="flex items-center gap-2 border border-white/15 text-gray-300 hover:text-white hover:border-white/30 px-7 py-4 rounded-full font-semibold text-base transition-all">
            <MessageCircle size={18} /> See It Live
          </a>
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 mb-20"
        >
          {[
            { icon: Clock, text: "Responds in under 3 seconds" },
            { icon: CalendarCheck, text: "Books appointments automatically" },
            { icon: TrendingUp, text: "Captures 3× more leads" },
            { icon: ShieldCheck, text: "No coding required" },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2">
              <Icon size={14} className="text-indigo-400" />
              <span>{text}</span>
            </div>
          ))}
        </motion.div>

        {/* ── COST COMPARISON VISUAL ── */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative w-full max-w-5xl mx-auto"
        >
          <div className="bg-[#0d0d10] border border-white/10 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/8 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/8 blur-[100px] rounded-full pointer-events-none" />

            <div className="text-center mb-12 relative z-10">
              <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
                One receptionist vs. Redber AI
              </h2>
              <p className="text-gray-400">Same job. One costs $3,500/mo. The other costs $49.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {/* Old Way */}
              <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-4">❌ Traditional Receptionist</p>
                <div className="space-y-3 text-sm text-gray-300">
                  {[
                    "Works 8 hrs/day, 5 days/week",
                    "Misses calls after hours",
                    "Gets sick, takes holidays",
                    "$3,500+ per month salary",
                    "Can only handle 1 caller at once",
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-500"><span className="text-rose-500 shrink-0">✕</span>{t}</div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                    <Bot size={28} className="text-white" />
                  </div>
                  <p className="text-white font-bold text-sm">Switch to</p>
                  <p className="text-indigo-400 font-black text-lg">Redber AI</p>
                </div>
              </div>

              {/* Redber  */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4">✅ Redber AI Receptionist</p>
                <div className="space-y-3 text-sm">
                  {[
                    "Works 24/7, 365 days a year",
                    "Answers every call & chat instantly",
                    "Never calls in sick",
                    "Starting at $49/month",
                    "Handles unlimited conversations",
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-200"><span className="text-emerald-400 shrink-0">✓</span>{t}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════ */}
      <section id="how-it-works" className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Simple Setup</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Up & running in 15 minutes</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">No technical skills needed. If you can copy-paste a link, you can deploy Redber.</p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01", icon: Globe, color: "from-rose-500 to-orange-500",
                  title: "Connect Your Business",
                  desc: "Enter your website URL. Redber reads every page and builds its knowledge base automatically — menus, services, pricing, FAQs, everything.",
                },
                {
                  step: "02", icon: Sparkles, color: "from-indigo-500 to-purple-500",
                  title: "Train the Persona",
                  desc: "Tell Redber its name, role, and tone. Our AI auto-generates a full personality — friendly, formal, or sales-focused — in one click.",
                },
                {
                  step: "03", icon: MessageCircle, color: "from-emerald-500 to-teal-500",
                  title: "Go Live Instantly",
                  desc: "Add one line of code to your website, or share the direct link. Your AI receptionist starts answering customers immediately.",
                },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-6 shadow-2xl relative`}>
                    <s.icon size={36} className="text-white" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#020202] border border-white/15 text-white text-[10px] font-black flex items-center justify-center">{s.step}</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          INDUSTRIES
      ═══════════════════════════════════════ */}
      <section id="industries" className="relative py-32 px-6 bg-[#040404] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Built For Your Industry</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Works for any customer-facing business</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Redber comes pre-trained for your industry. Deploy in minutes with smart defaults built for your business type.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                emoji: "🍽️", industry: "Restaurant & Café", color: "from-rose-500/10 to-orange-500/10", border: "border-rose-500/20",
                accent: "text-rose-400",
                answers: ["What are your opening hours?", "Do you have vegan options?", "Can I make a reservation?", "Do you offer delivery?"],
                stat: "68% of diners look for info online after hours",
              },
              {
                emoji: "🚗", industry: "Car Dealership", color: "from-blue-500/10 to-indigo-500/10", border: "border-blue-500/20",
                accent: "text-blue-400",
                answers: ["Is the 2024 SUV still available?", "Can I book a test drive?", "What finance options do you offer?", "What's your trade-in process?"],
                stat: "72% of car buyers research online before calling",
              },
              {
                emoji: "🏥", industry: "Medical Clinic & Spa", color: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-500/20",
                accent: "text-emerald-400",
                answers: ["Are you accepting new patients?", "How do I book an appointment?", "What insurance do you accept?", "What are your consultation fees?"],
                stat: "44% of patients book outside of business hours",
              },
              {
                emoji: "💇", industry: "Salon, Spa & Beauty", color: "from-pink-500/10 to-purple-500/10", border: "border-pink-500/20",
                accent: "text-pink-400",
                answers: ["What services do you offer?", "How much is a haircut?", "Can I book online?", "Do you offer gift vouchers?"],
                stat: "Missed bookings cost salons $8K+ per year on average",
              },
            ].map((ind, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-gradient-to-br ${ind.color} border ${ind.border} rounded-3xl p-8 relative overflow-hidden group`}
              >
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-4xl">{ind.emoji}</span>
                  <div>
                    <h3 className="text-xl font-black text-white">{ind.industry}</h3>
                    <p className={`text-xs font-bold ${ind.accent}`}>{ind.stat}</p>
                  </div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Redber answers these instantly:</p>
                <div className="space-y-2">
                  {ind.answers.map((q, qi) => (
                    <div key={qi} className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
                      <MessageCircle size={12} className={`${ind.accent} shrink-0`} />
                      <span className="text-sm text-gray-300">{q}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════ */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Capabilities</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">More than just a chatbot</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Redber is a full AI receptionist — it remembers customers, captures leads, books appointments, and reports back to you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Clock, color: "bg-rose-500/15 text-rose-400", title: "24/7 Availability", desc: "Your business never closes. Redber responds at 3am on a Sunday just as well as Monday morning." },
              { icon: CalendarCheck, color: "bg-indigo-500/15 text-indigo-400", title: "Appointment Booking", desc: "Customers can book directly in the chat. Redber captures date, time, name, and contact — no back-and-forth." },
              { icon: Users, color: "bg-emerald-500/15 text-emerald-400", title: "Lead Capture", desc: "Automatically asks for name and phone number at the right moment. Every lead goes straight to your inbox." },
              { icon: Fingerprint, color: "bg-purple-500/15 text-purple-400", title: "Remembers Customers", desc: "AI recalls returning visitors, past preferences, and previous conversations for a personal experience." },
              { icon: Languages, color: "bg-blue-500/15 text-blue-400", title: "Multi-Language", desc: "Replies in English, Arabic, Spanish, French, and more — automatically detects the visitor's language." },
              { icon: Globe, color: "bg-amber-500/15 text-amber-400", title: "Learns Your Business", desc: "Paste your website URL. Redber reads and absorbs your menus, services, prices, and FAQs instantly." },
              { icon: Zap, color: "bg-teal-500/15 text-teal-400", title: "Instant Responses", desc: "Under 3 seconds. No hold music. No 'your call is important to us'. Real answers, immediately." },
              { icon: TrendingUp, color: "bg-pink-500/15 text-pink-400", title: "Upsell Suggestions", desc: "AI proactively suggests add-ons, upgrades, and related services to increase average order value." },
              { icon: ShieldCheck, color: "bg-gray-500/15 text-gray-400", title: "Smart Guardrails", desc: "Set topics to avoid, compliance rules, and out-of-scope responses. Stays on-brand, always." },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/15 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon size={20} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          LIVE DEMO
      ═══════════════════════════════════════ */}
      <section id="demo" className="relative py-32 px-6 bg-black/40 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Live Examples</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">See live AI receptionists</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">These are real bots built on Redber. Try asking a question — they answer just like a trained receptionist would.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {loading ? (
              <div className="col-span-full py-20 flex justify-center text-gray-400">Loading receptionists...</div>
            ) : bots.filter(b => b.status === "Active" && b.id !== "redber-assistant-001").length === 0 ? (
              <div className="col-span-full text-center p-12 bg-white/5 border border-white/10 rounded-2xl">
                <Bot className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-xl font-bold text-white mb-2">No Live Bots Yet</p>
                <p className="text-gray-400">Create your first AI receptionist in the admin panel.</p>
              </div>
            ) : (
              bots.filter(b => b.status === "Active" && b.id !== "redber-assistant-001").map((bot, idx) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="w-full bg-[#0A0A0E] border border-white/10 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-colors group flex flex-col min-h-[480px]"
                >
                  <div className="flex items-center gap-4 mb-5">
                    {bot.avatar ? (
                      <img src={bot.avatar} alt={bot.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${bot.theme_color || 'bg-gradient-to-tr from-indigo-600 to-purple-600'}`}>
                        {bot.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-black text-white">{bot.name}</h3>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {bot.role} {bot.persona_config?.industry ? `· ${bot.persona_config.industry}` : ''}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-400 font-semibold">Online</span>
                    </div>
                  </div>

                  <div className="flex-1 bg-black/50 border border-white/5 rounded-2xl p-4 flex flex-col space-y-3 mb-5">
                    <div className="bg-white/8 text-gray-200 text-sm p-3 rounded-xl rounded-tl-none w-[88%]">
                      Hi! I&apos;m {bot.name}. How can I help you today?
                    </div>
                    {bot.role?.toLowerCase().includes('restaurant') || bot.persona_config?.industry?.toLowerCase().includes('restaurant') || bot.persona_config?.industry?.toLowerCase().includes('cafe') ? (
                      <>
                        <div className="bg-indigo-600 text-white text-sm p-3 rounded-xl rounded-tr-none w-[78%] self-end">Do you have vegan options?</div>
                        <div className="bg-white/8 text-gray-200 text-sm p-3 rounded-xl rounded-tl-none w-[92%] leading-relaxed">Yes! 🌱 We have a dedicated vegan menu with plant-based burgers, salads, and desserts. Want me to help you make a reservation?</div>
                      </>
                    ) : bot.persona_config?.industry?.toLowerCase().includes('auto') || bot.persona_config?.industry?.toLowerCase().includes('car') ? (
                      <>
                        <div className="bg-indigo-600 text-white text-sm p-3 rounded-xl rounded-tr-none w-[78%] self-end">Can I book a test drive?</div>
                        <div className="bg-white/8 text-gray-200 text-sm p-3 rounded-xl rounded-tl-none w-[92%] leading-relaxed">Absolutely! 🚗 I can book that for you right now. What day works best, and which model are you interested in?</div>
                      </>
                    ) : (
                      <>
                        <div className="bg-indigo-600 text-white text-sm p-3 rounded-xl rounded-tr-none w-[78%] self-end">What are your opening hours?</div>
                        <div className="bg-white/8 text-gray-200 text-sm p-3 rounded-xl rounded-tl-none w-[92%] leading-relaxed">We&apos;re open Monday to Saturday, 9am – 6pm. I can also book an appointment for you right now if you&apos;d like!</div>
                      </>
                    )}
                  </div>

                  <Link href={`/chat/${bot.name.toLowerCase()}`} className="mt-auto w-full py-3.5 rounded-xl bg-white text-black hover:bg-gray-100 font-bold flex justify-center items-center gap-2 transition-all text-sm">
                    Chat with {bot.name} <ArrowRight size={15} />
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════ */}
      <section className="relative py-32 px-6 bg-[#020202] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">Social Proof</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Business owners love it</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "We used to miss 20+ customer calls a day after hours. Now Redber handles them all and sends us the leads in the morning. It paid for itself in week one.", author: "Sarah M.", role: "Restaurant Owner", stars: 5 },
              { quote: "Our dealership gets test drive bookings 24/7 now. Customers book at midnight, we confirm in the morning. It's like having a receptionist that never goes home.", author: "James K.", role: "Sales Manager, AutoHub", stars: 5 },
              { quote: "I set it up in 30 minutes. Now patients get answers to their questions even on weekends, and our Monday call volume dropped by 40%.", author: "Dr. Priya N.", role: "Clinic Director", stars: 5 },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/8 p-8 rounded-3xl"
              >
                <div className="flex gap-0.5 mb-5">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-gray-200 text-base leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{t.author}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PRICING
      ═══════════════════════════════════════ */}
      <section id="pricing" className="relative py-32 px-6 bg-[#040404] border-t border-white/5">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Simple, transparent plans</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">One-time payment. No monthly fees. No hidden charges.</p>
          </div>

          {/* India-only pricing */}
          <IndiaPricing />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FAQ
      ═══════════════════════════════════════ */}
      <section className="relative py-32 px-6 bg-[#020202] border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">FAQ</p>
            <h2 className="text-4xl font-black">Common questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Do I need to know how to code?", a: "Not at all. You enter your website URL, Redber reads and learns it automatically, then gives you a shareable chat link. Setup takes about 15 minutes." },
              { q: "What if a customer asks something Redber doesn't know?", a: "Redber politely says it doesn't have that information and offers to connect the customer with your team. It never makes things up." },
              { q: "Can it actually book appointments?", a: "Yes. Redber captures the customer's preferred date, time, name, and phone number — and sends it directly to your lead inbox. You just confirm." },
              { q: "Does it work after hours and on weekends?", a: "That's the whole point. Redber works 24/7, 365 days a year. It answers at 3am on Christmas Day just as fluently as on a Monday morning." },
              { q: "Can I train it with my own menu, services, or pricing?", a: "Absolutely. Paste your website URL, upload a PDF, or type content manually. Redber absorbs it all and answers questions about it precisely." },
              { q: "How is this different from a regular chatbot?", a: "Old chatbots give scripted answers from a fixed list. Redber reads your actual business content and has real AI conversations. It understands context, remembers what was said, and adapts to each customer." },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between px-6 py-5">
                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors pr-4">{faq.q}</h4>
                  <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-indigo-400" : ""}`} />
                </div>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-400 leading-relaxed text-sm">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════ */}
      <section className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/20 pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-5xl mb-6">🤖</p>
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Your receptionist is standing by.
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Stop losing customers after hours. Set up your AI receptionist in 15 minutes — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-5 rounded-full font-bold text-lg shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all duration-300">
              Get Started Free <ArrowRight size={20} />
            </Link>
            <a href="#demo" className="text-gray-400 hover:text-white text-sm font-medium transition-colors underline underline-offset-4">
              See a live demo first
            </a>
          </div>
          <p className="mt-6 text-xs text-gray-600">No credit card. No engineers. Setup in 15 minutes.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#020202]">
        <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-2">
              <img src="/redber_logo_transperent.png" alt="Redber" className="h-6 w-auto object-contain" />
            </div>
            <p className="text-gray-600 text-sm">AI Receptionist for Businesses.</p>
            <div className="flex items-center gap-4 mt-4">
              <a href="https://www.instagram.com/redber.ai/?hl=en" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61579462559461" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-6 text-sm text-gray-500">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#industries" className="hover:text-white transition-colors">Industries</a>
            <a href="#demo" className="hover:text-white transition-colors">Live Demo</a>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors md:ml-4 md:border-l border-white/10 md:pl-4">Privacy</Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>

      <RedberMascot />
    </div>
  );
}
