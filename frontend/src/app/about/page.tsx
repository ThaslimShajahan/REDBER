"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0] font-sans pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors mb-12">
          <ArrowLeft size={16} /> Back to home
        </Link>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#C6F432] bg-[rgba(198,244,50,0.12)] px-3 py-1.5 rounded-full inline-flex mb-6">
            ABOUT US
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8">
            We build AI that <br/><span className="text-[#C6F432]">works for you.</span>
          </h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-8 text-[1.05rem] text-[rgba(255,255,255,0.7)] leading-relaxed">
          <p>
            At Redber, we believe that every business, regardless of size, deserves access to world-class operational efficiency. Founded by the team at Acenzos, our mission is to democratize artificial intelligence for customer-facing operations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
            <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] p-6 rounded-2xl">
              <div className="text-3xl font-black text-white mb-2">10M+</div>
              <div className="text-sm font-semibold text-[rgba(255,255,255,0.4)]">Conversations Handled</div>
            </div>
            <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] p-6 rounded-2xl">
              <div className="text-3xl font-black text-white mb-2">24/7</div>
              <div className="text-sm font-semibold text-[rgba(255,255,255,0.4)]">Always Online</div>
            </div>
            <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] p-6 rounded-2xl">
              <div className="text-3xl font-black text-[#C6F432] mb-2">0.25s</div>
              <div className="text-sm font-semibold text-[rgba(255,255,255,0.4)]">Average Response Time</div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Our Vision</h2>
          <p>
            We envisioned a world where missing a customer message or failing to capture a lead out of hours is a thing of the past. Redber isn't just a chatbot; it's an intelligent agent capable of holding context, closing sales, and driving actual business value without sleeping.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Built by Acenzos</h2>
          <p>
            Redber was engineered from the ground up by Acenzos. We specialize in building robust platforms, combining deep technical expertise with a relentless focus on beautiful user experiences.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
