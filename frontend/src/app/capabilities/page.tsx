"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Brain, Calendar, Globe, Headphones, HeartHandshake,
  Layers, MessageSquare, Mic, PhoneCall, ShieldCheck, Zap 
} from "lucide-react";

const capabilities = [
  {
    icon: <PhoneCall size={28} />,
    title: "Omnichannel Deployment",
    description: "Deploy a single AI brain across Phone lines, SMS, WhatsApp, Web Live Chat, and social media platforms. Meet your customers exactly where they already are."
  },
  {
    icon: <Globe size={28} />,
    title: "Real-Time Multi-Language",
    description: "Break global barriers. Redber natively understands and speaks over 30 languages with dialect-specific nuance without any manual translation delays."
  },
  {
    icon: <Calendar size={28} />,
    title: "Calendar & CRM Sync",
    description: "Direct read/write access to your tools. The AI books meetings dynamically, checks availability, and updates CRM records in HubSpot, Salesforce, and more."
  },
  {
    icon: <Mic size={28} />,
    title: "Ultra-Realistic Voice",
    description: "Powered by advanced low-latency Text-to-Speech models. Callers cannot tell they are speaking to an AI thanks to emotional inflection and conversational pacing."
  },
  {
    icon: <HeartHandshake size={28} />,
    title: "Seamless Human Handoff",
    description: "Redber knows its limits. When a complex or sensitive situation arises, the AI instantly bridges the call or chat to an available human operator with full context."
  },
  {
    icon: <Zap size={28} />,
    title: "24/7 Autopilot & Concurrent Handling",
    description: "Never miss a lead. Redber handles infinite concurrent calls simultaneously during peak hours, acting as an infinitely scalable frontline team."
  },
  {
    icon: <Brain size={28} />,
    title: "Custom Knowledge Base (RAG)",
    description: "Train Redber on your specific business. Upload PDFs, connect your website, and let it answer intricate questions using solely your authorized data."
  },
  {
    icon: <ShieldCheck size={28} />,
    title: "Enterprise Grade Security",
    description: "All conversations and generated data are strictly sandboxed. Redber adheres to major compliance frameworks to keep your leads and customer data safe."
  },
  {
    icon: <MessageSquare size={28} />,
    title: "Advanced Context Memory",
    description: "Treats customers like VIPs by remembering details from previous calls or chats, picking up exactly where the last conversation left off."
  },
  {
    icon: <Layers size={28} />,
    title: "Custom Integration Workflows",
    description: "Beyond just booking, trigger custom webhook events to ping Slack, send follow-up emails, or initiate complex backend automations automatically."
  },
  {
    icon: <Headphones size={28} />,
    title: "Audio Interruption & Backchanneling",
    description: "Just like a real person, the AI stops talking instantly if the user interrupts, and uses active listening cues ('mhm', 'yeah') to keep the conversation natural."
  }
];

export default function CapabilitiesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden pt-40 pb-20">
      
      {/* Navigation Bar */}
      <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[1200px] z-[100] bg-[#0d0d0d]/85 backdrop-blur-[20px] rounded-full border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)] px-4 py-2 md:px-6 md:py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/logo/Redber Logo white.svg" alt="Redber" className="w-[110px] md:w-[150px] h-auto" />
        </Link>
        <ul className="hidden md:flex gap-10 list-none m-0 p-0 text-[15px]">
          <li><Link href="/" className="text-white/55 hover:text-white font-semibold transition-colors">Home</Link></li>
          <li><Link href="/#how-it-works" className="text-white font-semibold transition-colors">How It Works</Link></li>
          <li><Link href="/contact" className="text-white/55 hover:text-white font-semibold transition-colors">Contact</Link></li>
        </ul>
        <Link href="/contact" className="bg-[#C6F432] hover:bg-[#aad424] text-black font-extrabold px-5 py-2.5 md:px-7 md:py-3 rounded-full text-sm md:text-base transition-colors">
          Book Demo
        </Link>
      </nav>

      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-gradient-to-b from-[#C6F432]/10 via-violet-500/5 to-transparent blur-[120px] pointer-events-none z-0" />

      <div className="max-w-[1280px] mx-auto px-6 relative z-10">
        
        {/* Header Title */}
        <div className="mb-16">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white bg-white/5 px-4 py-2 rounded-full border border-white/10 transition-colors mb-8 font-semibold text-sm">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
              Total <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C6F432] to-[#64dcff]">Capabilities</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
              Redber is an advanced cognitive mesh. Explore the complete technical and operational features that make our AI agents indistinguishable from top-tier human employees.
            </p>
          </motion.div>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + (idx * 0.05), duration: 0.5 }}
              key={idx}
              className="bg-[#141414] border border-white/5 rounded-3xl p-8 hover:bg-[#1a1a1a] hover:border-[#C6F432]/30 transition-all duration-300 group cursor-default"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 text-[#C6F432] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#C6F432]/10 transition-transform duration-300">
                {cap.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4">{cap.title}</h3>
              <p className="text-gray-400 leading-relaxed text-[0.95rem]">
                {cap.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-12 md:p-16 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C6F432] opacity-5 blur-[100px] rounded-full pointer-events-none" />
          
          <h2 className="text-4xl md:text-5xl font-black mb-6 relative z-10">Stop losing revenue to slow responses.</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 relative z-10">
            Automate your front desk, sales pipeline, and customer support with Redber today. Deployment takes minutes.
          </p>
          <div className="flex justify-center relative z-10">
            <Link href="/contact" className="inline-flex items-center gap-3 bg-[#C6F432] text-black font-bold text-lg px-8 py-4 rounded-full hover:bg-[#aad424] transition-colors shadow-[0_0_30px_rgba(198,244,50,0.3)]">
              Build your AI Assistant <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// Ensure you import ArrowRight above if not grabbed
const ArrowRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);
