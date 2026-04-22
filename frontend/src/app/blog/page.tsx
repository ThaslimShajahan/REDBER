"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function BlogPage() {
  const posts = [
    { title: "How AI is Reshaping Customer Service in 2026", date: "April 18, 2026", category: "Trends", slug: "ai-reshaping-customer-service" },
    { title: "The Hidden Cost of Missed Leads (And How to Fix It)", date: "March 24, 2026", category: "Business", slug: "hidden-cost-missed-leads" },
    { title: "Introducing Redber: Your 24/7 Virtual Receptionist", date: "February 10, 2026", category: "Product Update", slug: "introducing-redber" },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0] font-sans pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors mb-12">
          <ArrowLeft size={16} /> Back to home
        </Link>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#C6F432] bg-[rgba(198,244,50,0.12)] px-3 py-1.5 rounded-full inline-flex mb-6">
            BLOG & INSIGHTS
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-12">
            The latest from <span className="text-white">Redber.</span>
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <Link href={`/blog/${post.slug}`} className="group block h-full p-8 rounded-3xl bg-[#141414] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(198,244,50,0.3)] transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-16">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C6F432]">{post.category}</span>
                  <ArrowUpRight size={20} className="text-[rgba(255,255,255,0.3)] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3 leading-tight">{post.title}</h3>
                  <p className="text-[0.85rem] font-semibold text-[rgba(255,255,255,0.4)]">{post.date}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
