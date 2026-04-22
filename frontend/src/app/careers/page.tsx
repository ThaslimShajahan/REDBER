"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CareersPage() {
  const jobs = [
    { title: "Senior AI Engineer", loc: "Remote / Kochi", type: "Full-time" },
    { title: "Product Designer", loc: "Remote", type: "Full-time" },
    { title: "Growth Marketer", loc: "Remote / Kochi", type: "Full-time" },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0] font-sans pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors mb-12">
          <ArrowLeft size={16} /> Back to home
        </Link>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#C6F432] bg-[rgba(198,244,50,0.12)] px-3 py-1.5 rounded-full inline-flex mb-6">
            JOIN THE TEAM
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8">
            Build the future of<br/><span className="text-white">AI agents with us.</span>
          </h1>
          <p className="text-[1.1rem] text-[rgba(255,255,255,0.6)] mb-16 max-w-2xl leading-relaxed">
            We are looking for passionate builders, thinkers, and tinkerers who want to push the boundaries of what conversational AI can achieve for businesses globally.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <h2 className="text-2xl font-bold text-white mb-6">Open Positions</h2>
          <div className="space-y-4">
            {jobs.map((job, i) => (
              <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl bg-[#141414] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] transition-colors cursor-pointer group">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                  <div className="flex gap-3 text-sm font-semibold text-[rgba(255,255,255,0.4)]">
                    <span>{job.loc}</span>
                    <span>·</span>
                    <span>{job.type}</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm font-bold text-[#C6F432] group-hover:underline">
                  Apply Now <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 p-8 rounded-3xl bg-[rgba(198,244,50,0.05)] border border-[rgba(198,244,50,0.15)] text-center">
            <h3 className="text-xl font-bold text-white mb-3">Don't see a fit?</h3>
            <p className="text-[rgba(255,255,255,0.6)] text-sm mb-6 max-w-lg mx-auto">
              We are moving fast and always looking for exceptional talent. Send your resume and a bit about yourself to our team.
            </p>
            <Link href="/contact" className="inline-flex font-bold text-[#0d0d0d] bg-[#C6F432] px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
              Contact Us
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
