"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0] font-sans pb-20">
      <div className="max-w-3xl mx-auto px-6 pt-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors mb-12">
          <ArrowLeft size={16} /> Back to home
        </Link>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#C6F432] bg-[rgba(198,244,50,0.12)] px-3 py-1.5 rounded-full inline-flex mb-6">
            LEGAL
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">
            Cookie Policy
          </h1>
          <p className="text-sm font-semibold text-[rgba(255,255,255,0.4)] mb-12">Last Updated: April 19, 2026</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="prose prose-invert prose-p:text-[rgba(255,255,255,0.7)] prose-headings:text-white prose-a:text-[#C6F432] max-w-none">
          <h3>1. What are cookies?</h3>
          <p>
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>

          <h3>2. How we use cookies</h3>
          <p>
            We use cookies to understand how you use our site and to improve your experience. This includes personalizing content and advertising. By continuing to use our site, you accept our use of cookies, revised Privacy Policy and Terms of Service.
          </p>

          <h3>3. Types of Cookies We Use</h3>
          <ul>
            <li><strong>Essential Cookies:</strong> These cookies are strictly necessary to provide you with services available through our website and to use some of its features.</li>
            <li><strong>Analytics/Performance Cookies:</strong> These cookies are used to collect information about traffic to our website and how users use our website.</li>
            <li><strong>Functionality Cookies:</strong> These are used to recognize you when you return to our website.</li>
          </ul>

          <h3>4. Managing Cookies</h3>
          <p>
            You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
          </p>
          
          <p className="mt-12 text-sm text-[rgba(255,255,255,0.4)]">
            If you have any questions about our use of cookies or other technologies, please email us at privacy@redber.in.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
