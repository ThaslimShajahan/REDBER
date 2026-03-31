"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[60vw] h-[60vh] bg-indigo-600/10 blur-[150px] rounded-full opacity-50" />
                <div className="absolute bottom-0 left-0 w-[50vw] h-[50vh] bg-purple-600/10 blur-[150px] rounded-full opacity-50" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-black/40 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ArrowLeft size={20} className="text-gray-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                        <span className="font-bold text-gray-300 group-hover:text-white transition-colors">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <img src="/redber_logo_transperent.png" alt="Redber" className="h-6 w-auto" />
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8">Privacy Policy</h1>
                    <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                        <p className="mb-4">Last Updated: March 2026</p>
                        
                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">1. Introduction</h2>
                        <p className="mb-6">At Redber, we are committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy outlines how we collect, use, and safeguard your information when you use our AI receptionist platform and related services.</p>

                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">2. Information We Collect</h2>
                        <p className="mb-4">We collect information that you manually provide to us (such as account details, chatbot configurations, and billing info), as well as automated data collection related to API usage, chat logs, and system performance.</p>
                        <ul className="list-disc pl-6 mb-6 space-y-2">
                            <li><strong>Account Information:</strong> Name, Email Address, Phone Number, and Company Details.</li>
                            <li><strong>Chat Data:</strong> Transcripts and metadata of conversations held between your users and the Redber AI bots.</li>
                            <li><strong>Usage Data:</strong> Analytics, IP addresses, and device data to improve platform performance.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">3. How We Use Your Data</h2>
                        <p className="mb-6">We use the collected information solely to provide, maintain, and improve our services to you. Data is optionally used to improve the underlying NLP models only with your explicit consent. We never sell your personal data to third parties.</p>

                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">4. Data Security</h2>
                        <p className="mb-6">We implement industry-standard encryption, continuous monitoring, and secure server environments to prevent unauthorized access, disclosure, or destruction of data.</p>

                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">5. Your Rights</h2>
                        <p className="mb-6">Depending on your location, you may have the right to access, rectify, or delete your personal data. You can exercise these rights by contacting us directly.</p>

                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">6. Contact Us</h2>
                        <p className="mb-6">If you have any questions or concerns regarding this Privacy Policy, please contact us at <a href="mailto:customercare@redber.in" className="text-indigo-400 hover:text-indigo-300">customercare@redber.in</a>.</p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
