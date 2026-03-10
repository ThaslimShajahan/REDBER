"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Globe, Zap, Brain, MessageSquare, Edit3, Inbox, MessageCircle, Link as LinkIcon, Users, CheckCircle, FileText, Send, Bot, Sparkles, BookOpen, Fingerprint, Activity, Gauge, Languages, LineChart, Target, History, Search, ListTodo } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../lib/api";
import RedberMascot from "../components/RedberMascot";

export default function Home() {
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  useEffect(() => {
    fetch(`${API_BASE}/api/admin/bots`)
      .then(res => res.json())
      .then(data => { setBots(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#020202] text-gray-100 font-sans selection:bg-purple-500/30 overflow-x-hidden">

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#020202] to-transparent blur-[120px] opacity-70" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Modern Glass Header */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img src="/logo_white.png" alt="Redber Logo" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-2xl tracking-tight text-white">Redber</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">See Examples</a>
            <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="#demo" className="flex items-center gap-2 bg-white text-black hover:bg-gray-100 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              View Demo
            </a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <motion.section
        ref={heroRef}
        style={{ opacity, scale }}
        className="relative pt-40 pb-16 md:pt-52 md:pb-24 px-6 flex flex-col items-center text-center max-w-6xl mx-auto z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 text-xs font-bold px-4 py-2 rounded-full mb-8 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Redber 1.0 is Live
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-[1.05]"
        >
          Intelligent AI <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
            Customer Support.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-2xl text-gray-400 mb-6 leading-relaxed max-w-2xl mx-auto font-light"
        >
          Discover how our advanced AI learns from your data to provide instant, accurate, and engaging assistance 24/7.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16"
        >
          <Link href="#demo" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] hover:-translate-y-1 transition-all duration-300">
            See Examples <ArrowRight size={20} />
          </Link>
        </motion.div>


        {/* TRUSTED BY / SOCIAL PROOF */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-4xl mx-auto mb-20 text-center"
        >
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Trusted by innovative companies</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {['Acme Corp', 'GlobalTech', 'Nexus', 'Starlight', 'Vanguard'].map((company, i) => (
              <span key={i} className="text-xl font-black text-white mix-blend-overlay">{company}</span>
            ))}
          </div>
        </motion.div>

        {/* INFOGRAPHIC HERO REPLACEMENT */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative w-full max-w-5xl mx-auto mt-10"
        >
          <div className="bg-[#111115] border border-white/10 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden shadow-2xl">
            {/* Background glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

            <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Learns from your website content</h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-16">Redber reads your public pages and builds an answer base automatically.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative z-10">

              {/* Step 1 */}
              <div className="flex flex-col items-center w-full h-full">
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-6 py-3 rounded-full font-bold text-sm mb-6 flex items-center gap-3 shrink-0">
                  <div className="w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs">1</div>
                  Enter Your Website URL
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full h-full relative backdrop-blur-md shadow-xl z-20 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4 text-xs text-gray-300 bg-white/10 p-3 rounded-lg border border-white/10">
                    <Globe size={14} className="text-rose-400" />
                    <span className="font-medium">yourwebsite.com</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-sm">
                      <Globe size={16} /> Pages
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-sm">
                      <FileText size={16} /> Blogs
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 border border-white/10 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-sm">
                      <FileText size={16} /> PDFs
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting Dashed Line 1 (Desktop) */}
              <div className="hidden md:block absolute top-[65%] left-[28%] right-[68%] border-t-2 border-dashed border-rose-500/40 z-0"></div>

              {/* Step 2 */}
              <div className="flex flex-col items-center w-full h-full justify-start mt-10 md:mt-0">
                <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-6 py-3 rounded-full font-bold text-sm mb-6 flex items-center gap-3 shrink-0">
                  <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs">2</div>
                  Crawl your public content
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full h-full min-h-[240px] relative backdrop-blur-md shadow-xl z-20 flex flex-col">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-[10px] text-white">AI</div>
                      <span className="text-xs font-bold text-white">AI Assistant</span>
                    </div>
                  </div>
                  <div className="space-y-4 flex flex-col justify-end flex-1">
                    <div className="bg-[#26262a] text-white text-xs p-3 rounded-2xl rounded-tr-none ml-auto w-[85%] font-medium">
                      Hi! What can I order from here?
                    </div>
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xs p-3 rounded-2xl rounded-tl-none w-[95%] shadow-lg">
                      Hello! 🍕 This pizzeria offers a variety of <span className="font-extrabold text-white">pizzas, pastas, salads, and desserts.</span> You can order for delivery, takeaway, or dine in.
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting Dashed Line 2 (Desktop) */}
              <div className="hidden md:block absolute top-[65%] left-[68%] right-[28%] border-t-2 border-dashed border-indigo-500/40 z-0"></div>

              {/* Step 3 */}
              <div className="flex flex-col items-center w-full h-full mt-10 md:mt-0">
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-full font-bold text-sm mb-6 flex items-center gap-3 shrink-0">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs">3</div>
                  Routes leads to inbox
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full h-full relative backdrop-blur-md shadow-xl z-20 flex flex-col justify-center">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white"><Inbox size={18} /></div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">New Lead Captured</p>
                      <p className="text-xs text-gray-400">Redber AI System</p>
                    </div>
                  </div>
                  <div className="bg-white/10 border border-emerald-500/30 rounded-xl p-4 text-sm text-white">
                    <p className="text-emerald-400 font-bold mb-3 flex items-center gap-2 text-base"><CheckCircle size={16} /> High Intent Lead</p>
                    <div className="space-y-2">
                      <p className="flex items-center"><span className="text-gray-300 inline-block w-20 text-xs font-semibold uppercase">Name</span> <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded">John Doe</span></p>
                      <p className="flex items-center"><span className="text-gray-300 inline-block w-20 text-xs font-semibold uppercase">Phone</span> <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded">+1 555-0198</span></p>
                      <p className="flex items-center"><span className="text-gray-300 inline-block w-20 text-xs font-semibold uppercase">Interest</span> <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded">Delivery Order</span></p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* KEY FEATURES SECTION - REIMAGINED */}
      <section id="features" className="relative py-32 px-6 bg-[#040404] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">AI capabilities that redefine engagement</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">From auto-training personas to deep self-learning knowledge bases, Redber is built for scale.</p>
          </div>

          {/* Group 1: Core AI & Personas */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center"><Bot size={20} /></div>
              <h3 className="text-2xl font-bold text-white">Advanced Persona Engine</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Sparkles, color: "text-purple-400", title: "Auto-Training Persona", desc: "Set a role (e.g., 'Restaurant Receptionist') and the AI automatically builds base knowledge for greetings, menus, and etiquette." },
                { icon: Fingerprint, color: "text-indigo-400", title: "Conversation Memory", desc: "AI remembers returning users, previous bookings, and personal preferences to deliver a personalized welcome back." },
                { icon: Target, color: "text-rose-400", title: "Smart Intent Detection", desc: "Automatically identifies if a user wants a reservation, has a complaint, or is ready to buy, triggering the proper flow." },
                { icon: Languages, color: "text-blue-400", title: "Multi-Language Output", desc: "Instantly reply in the user's preferred language (English, Arabic, Hindi, Malayalam) without manual translation setups." }
              ].map((f, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                  <f.icon size={24} className={`${f.color} mb-4`} />
                  <h4 className="text-lg font-bold text-white mb-2">{f.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Knowledge Management */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><BookOpen size={20} /></div>
              <h3 className="text-2xl font-bold text-white">Self-Learning Knowledge Base</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Globe, color: "text-emerald-400", title: "Auto Knowledge Import", desc: "Automatically extract, clean, and chunk data from websites, PDFs, and manual text into the vector database." },
                { icon: Search, color: "text-teal-400", title: "Self-Learning & Gap Detection", desc: "When users ask unknown questions, Redber flags the knowledge gap allowing admins to approve and add new info." },
                { icon: Gauge, color: "text-cyan-400", title: "AI Confidence Scoring", desc: "Answers are algorithmically ranked (High, Med, Low). For low confidence, AI asks clarifying questions to prevent hallucination." },
                { icon: LineChart, color: "text-green-400", title: "Growth Tracking", desc: "Admin dashboard showing exactly how many items the AI has learned from websites, documents, and interactions." },
                { icon: History, color: "text-lime-400", title: "Knowledge Timeline", desc: "A detailed audit log of when specific knowledge was added or learned naturally through conversation." },
                { icon: ListTodo, color: "text-emerald-400", title: "Industry Templates", desc: "Deploy instantly with pre-trained system prompts for Restaurants, Car Dealerships, and Clinics out-of-the-box." }
              ].map((f, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                  <f.icon size={24} className={`${f.color} mb-4`} />
                  <h4 className="text-lg font-bold text-white mb-2">{f.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Group 3: Sales & Analytics */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center"><Activity size={20} /></div>
              <h3 className="text-2xl font-bold text-white">Lead Generation & Analytics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Users, color: "text-amber-400", title: "AI Lead Intelligence", desc: "Automatically extracts Name, Phone, Email, and Intent. Scores all leads 0-100 based on conversion likelihood." },
                { icon: Zap, color: "text-orange-400", title: "Proactive Suggestion Engine", desc: "AI takes initiative. Instead of just answering, it drives sales by proactively suggesting reservations or test drives." },
                { icon: Target, color: "text-red-400", title: "Quality Monitoring", desc: "Automatically tracks conversation accuracy, user satisfaction, and unresolved queries to help you refine system performance." }
              ].map((f, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                  <f.icon size={24} className={`${f.color} mb-4`} />
                  <h4 className="text-lg font-bold text-white mb-2">{f.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / PROOF */}
      <section className="py-32 px-6 overflow-hidden relative">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
              A single platform for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">customer engagement.</span>
            </h2>
            <div className="space-y-6">
              {[
                { icon: LinkIcon, title: "Connect your data source", desc: "Simply enter your website URL or upload a file. The bot absorbs everything instantly." },
                { icon: Edit3, title: "Define the persona", desc: "Decide how the bot behaves—should it be formal, friendly, or focus purely on lead generation?" },
                { icon: Users, title: "Deploy and convert", desc: "Copy the script tag to your HTML and start assisting visitors 24/7." }
              ].map((s, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="mt-1 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 shrink-0">
                    <s.icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">{s.title}</h4>
                    <p className="text-gray-400 font-light leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <a href="#demo" className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-8 py-3.5 rounded-full font-bold shadow-lg transition-all">
                Explore Capabilities <ArrowRight size={18} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 w-full"
          >
            <div className="bg-[#0f0f12] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-10">
                <CheckCircle size={14} /> Active Lead Capture
              </div>
              <div className="border border-white/5 rounded-xl bg-black/50 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">RE</div>
                  <div>
                    <p className="text-sm font-bold text-white">Redber Assistant</p>
                    <p className="text-xs text-emerald-400">Online</p>
                  </div>
                </div>
                <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto">
                  <div className="bg-white/10 w-[85%] rounded-2xl p-3 text-sm text-gray-200 rounded-tl-none leading-relaxed">
                    Hello! I'm the Redber automated assistant. Are you interested in creating a custom AI bot for your site?
                  </div>
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-[75%] rounded-2xl p-3 text-sm text-white rounded-tr-none ml-auto leading-relaxed shadow-lg">
                    Yes, but how long does it take to train the AI?
                  </div>
                  <div className="bg-white/10 w-[85%] rounded-2xl p-3 text-sm text-gray-200 rounded-tl-none leading-relaxed">
                    Training takes just seconds! You just paste your URL, and we scrape and configure the entire knowledge base for you. Would you like to try it now?
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* TESTIMONIALS / WALL OF LOVE */}
      <section className="relative py-32 px-6 bg-[#020202] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Loved by businesses everywhere</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">See what our users are saying about Redber's transformative AI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { quote: "Redber handled 80% of our customer queries on day one. Utterly game-changing.", author: "Sarah Jenkins", role: "Support Lead, TechFlow" },
              { quote: "We just pasted our URL and the AI knew everything about our catalog. Incredible MVP.", author: "David Vance", role: "Founder, AutoHub" },
              { quote: "The customized persona makes it feel exactly like talking to one of our own team members.", author: "Elena Rostova", role: "Marketing Director" }
            ].map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map(star => <span key={star} className="text-yellow-500 text-lg">★</span>)}
                </div>
                <p className="text-gray-300 text-lg font-medium mb-8 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">{t.author.charAt(0)}</div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{t.author}</h4>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXAMPLES SECTION */}
      <section id="demo" className="relative py-32 px-6 bg-black/40 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6">See Redber in Action</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Here are some active bots created on our platform. Try asking them questions relevant to their configured knowledge base.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {loading ? (
              <div className="col-span-full py-20 flex justify-center text-gray-400 font-medium">Loading examples...</div>
            ) : bots.filter(b => b.status === "Active" && b.id !== "redber-assistant-001").length === 0 ? (
              <div className="col-span-full text-center p-12 bg-white/5 border border-white/10 rounded-2xl">
                <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-xl font-bold text-white mb-2">No Live Bots Yet</p>
                <p className="text-gray-400">Create your first AI agent in the dashboard.</p>
              </div>
            ) : (
              bots.filter(b => b.status === "Active" && b.id !== "redber-assistant-001").map((bot, idx) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="w-full bg-[#0A0A0E] border border-white/10 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-colors group relative flex flex-col h-auto min-h-[520px]"
                >
                  <div className="flex items-center gap-4 mb-6">
                    {bot.avatar ? (
                      <img src={bot.avatar} alt={bot.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${bot.theme_color || 'bg-gradient-to-tr from-indigo-600 to-purple-600'}`}>
                        {bot.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-white">{bot.name}</h3>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{bot.role} {bot.persona_config?.industry ? `· ${bot.persona_config.industry}` : ''}</p>
                    </div>
                  </div>

                  {/* Mock Chat Showcase */}
                  <div className="flex-1 bg-black/50 border border-white/5 rounded-2xl flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-black/50 to-transparent z-10"></div>
                    <div className="flex-1 overflow-y-auto p-4 pb-4 flex flex-col space-y-4">

                      <div className="bg-white/10 text-gray-200 text-sm p-3 rounded-2xl rounded-tl-none w-[85%] self-start leading-relaxed mt-2">
                        Hello! I'm {bot.name}. How can I assist you today?
                      </div>

                      {/* Dynamic Chat bubbles based on bot role/industry */}
                      {bot.role.toLowerCase().includes('restaurant') || bot.persona_config?.industry?.toLowerCase().includes('restaurant') || bot.persona_config?.industry?.toLowerCase().includes('cafe') ? (
                        <>
                          <div className="bg-indigo-600 text-white text-sm p-3 rounded-2xl rounded-tr-none w-[80%] self-end shadow-lg">
                            Do you have any vegan options?
                          </div>
                          <div className="bg-white/10 text-gray-200 text-sm p-3 rounded-2xl rounded-tl-none w-[90%] self-start leading-relaxed relative">
                            <span className="absolute -left-1 -top-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            Yes! We have several vegan options including our Plant-based Burger and Vegan Caesar Salad. Shall I help you reserve a table?
                          </div>
                        </>
                      ) : bot.role.toLowerCase().includes('auto') || bot.persona_config?.industry?.toLowerCase().includes('auto') || bot.persona_config?.industry?.toLowerCase().includes('dealership') || bot.persona_config?.industry?.toLowerCase().includes('car') ? (
                        <>
                          <div className="bg-indigo-600 text-white text-sm p-3 rounded-2xl rounded-tr-none w-[80%] self-end shadow-lg">
                            I want to test drive the new SUV.
                          </div>
                          <div className="bg-white/10 text-gray-200 text-sm p-3 rounded-2xl rounded-tl-none w-[90%] self-start leading-relaxed relative">
                            <span className="absolute -left-1 -top-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                            Great choice! To book your test drive, could I please get your preferred date and time, along with your phone number?
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-indigo-600 text-white text-sm p-3 rounded-2xl rounded-tr-none w-[80%] self-end shadow-lg">
                            Can you tell me about your services?
                          </div>
                          <div className="bg-white/10 text-gray-200 text-sm p-3 rounded-2xl rounded-tl-none w-[90%] self-start leading-relaxed relative">
                            <span className="absolute -left-1 -top-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            Absolutely. Based on our website, we offer comprehensive solutions tailored to your needs. Would you like me to connect you with an expert?
                          </div>
                        </>
                      )}

                    </div>
                  </div>

                  {/* Capabilities tags */}
                  <div className="flex flex-wrap gap-2 mt-4 mb-4">
                    {bot.persona_config?.lead_capture_mode && <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Lead Capture On</span>}
                    {bot.persona_config?.goals?.map((g: string, i: number) => (
                      <span key={i} className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{g}</span>
                    )).slice(0, 2)}
                  </div>

                  <Link href={`/chat/${bot.name.toLowerCase()}`} className="mt-auto w-full py-3.5 rounded-xl bg-white text-black hover:bg-gray-200 font-bold flex justify-center items-center transition-all gap-2 z-10">
                    Chat with {bot.name} <ArrowRight size={16} />
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>


      {/* HOW IT COMPARES / PRICING */}
      <section className="relative py-32 px-6 bg-[#040404] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Simple, transparent pricing</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Start for free, scale when you need to.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] relative">
              <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
              <p className="text-gray-400 mb-6">Perfect for trying out Redber.</p>
              <div className="mb-8"><span className="text-5xl font-black text-white">$0</span><span className="text-gray-500">/mo</span></div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle size={18} className="text-emerald-500" /> 1 AI Bot</li>
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle size={18} className="text-emerald-500" /> Web Crawling (Up to 50 pages)</li>
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle size={18} className="text-emerald-500" /> Standard Support</li>
              </ul>
              <Link href="/contact" className="block w-full text-center bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-full transition-colors">Contact Us</Link>
            </div>
            {/* Pro */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-10 rounded-[2.5rem] relative shadow-2xl overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <div className="absolute -top-4 -right-4 bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg transform rotate-12">POPULAR</div>
              <h3 className="text-2xl font-bold text-white mb-2">Business</h3>
              <p className="text-gray-400 mb-6">For teams that need more power.</p>
              <div className="mb-8"><span className="text-5xl font-black text-white">$49</span><span className="text-gray-500">/mo</span></div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle size={18} className="text-indigo-400" /> Unlimited AI Bots</li>
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle size={18} className="text-indigo-400" /> Unlimited Crawling & PDFs</li>
                <li className="flex items-center gap-3 text-gray-300"><CheckCircle size={18} className="text-indigo-400" /> API Access & White-label</li>
              </ul>
              <Link href="/contact" className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-full transition-all shadow-lg hover:shadow-indigo-500/25">Contact for Business</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="relative py-32 px-6 bg-[#020202] border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-lg">Everything you need to know about Redber.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "Do I need to know how to code?", a: "Not at all. Just enter your website URL, let Redber crawl it, and paste a single script tag into your website's HTML to start." },
              { q: "Can I upload PDFs and documents?", a: "Yes! The Admin dashboard allows you to directly upload PDF files and manually ingest raw text alongside website indexing." },
              { q: "Is it really free?", a: "Yes, our starter plan lets you build and deploy one fully functional bot completely for free. You only pay when you scale." },
              { q: "Does the AI collect leads?", a: "Absolutely. When you toggle 'Lead Capture Mode', Redber smartly asks visitors for their name and phone/email, piping it directly to your Inbox." }
            ].map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="text-xl font-bold text-white mb-2">{faq.q}</h4>
                <p className="text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6 border-t border-white/5 bg-gradient-to-b from-[#020202] to-[#050510]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to automate your support?</h2>
          <p className="text-gray-400 text-lg mb-10">Integrate our intelligent AI agents to transform your customer experience.</p>
          <a href="#demo" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-10 py-5 rounded-full font-bold text-xl shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all duration-300">
            View Live Examples
          </a>
          <p className="mt-6 text-sm text-gray-500">Reach out to learn how it can fit your business.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#020202]">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-2">
              <img src="/logo_white.png" alt="Redber Logo" className="h-6 w-auto object-contain" />
              <span className="font-extrabold text-xl tracking-tight text-white">Redber</span>
            </div>
            <p className="text-gray-500 text-sm">Create AI Chatbots in minutes.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-gray-400 hover:text-white font-medium text-sm transition-colors">Features</a>
            <Link href="/contact" className="text-gray-400 hover:text-white font-medium text-sm transition-colors">Contact Us</Link>
            <a href="#demo" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full font-medium text-sm transition-colors">View Demo</a>
          </div>
        </div>
      </footer>
      <RedberMascot />

    </div>
  );
}
