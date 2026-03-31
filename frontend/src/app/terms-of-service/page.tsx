"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TermsPage() {
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
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-8">Terms of Service</h1>
                    <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                        <p className="mb-4">Last Updated: March 2026</p>
                        
                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">1. Acceptance of Terms</h2>
                        <p className="mb-6">By accessing or using the Redber AI platform, you agree to comply with and be bound by these Terms of Service. If you do not agree, please refrain from using our platform.</p>

                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">2. Description of Service</h2>
                        <p className="mb-6">Redber provides AI-powered virtual receptionists and customer engagement tools designed to help businesses manage customer queries, appointments, and leads.</p>

                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">3. User Obligations</h2>
                        <p className="mb-4">You agree to use our services responsibly and legally. This means you will not:</p>
                        <ul className="list-disc pl-6 mb-6 space-y-2">
                            <li>Use our AI services to generate prohibited, illegal, or harmful content.</li>
                            <li>Attempt to exploit, reverse engineer, or negatively impact platform infrastructure.</li>
                            <li>Upload confidential third-party data to our systems without the right handling or permission.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">4. Payment and Subscription</h2>
                        <p className="mb-6">Certain features of Redber may require a paid subscription. You agree to provide accurate billing details and promptly update them if they fail. Redber reserves the right to modify pricing with advance notice.</p>

                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">5. Limitation of Liability</h2>
                        <p className="mb-6">Redber provides its AI "as is" and makes no absolute guarantees on perfect AI accuracy in unstructured queries. We are not liable for business interruptions or consequential damages arising from the use of our service.</p>

                        <h2 className="text-2xl font-bold text-white mt-10 mb-4">6. Changes to Terms</h2>
                        <p className="mb-6">We reserve the right to modify these terms at any time. Material changes will be communicated via email or an announcement on the dashboard.</p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
