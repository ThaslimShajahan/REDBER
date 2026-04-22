"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { API_BASE } from "../../lib/api";

function ContactFormContent() {
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

    useEffect(() => {
        const subject = searchParams.get("subject");
        const message = searchParams.get("message");
        if (subject || message) {
            setFormData(prev => ({
                ...prev,
                ...(subject && { subject }),
                ...(message && { message })
            }));
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        try {
            const res = await fetch(`${API_BASE}/api/admin/contacts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setStatus("success");
                setFormData({ name: "", email: "", subject: "", message: "" });
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white font-sans selection:bg-[#C6F432] selection:text-[#0d0d0d] overflow-hidden relative">
            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-[#C6F432]/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-[#64dcff]/5 blur-[150px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#0d0d0d]/80 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <ArrowLeft size={18} className="text-white/40 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                        <span className="font-bold text-white/60 group-hover:text-white transition-colors text-sm tracking-wide uppercase">Back</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <img src="/logo/Redber Logo white.svg" alt="Redber" className="h-7 w-auto" />
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 bg-[#C6F432]/10 border border-[#C6F432]/20 text-[#C6F432] text-xs font-bold px-4 py-2 rounded-full mb-8">
                        <MessageSquare size={14} />
                        Get in Touch
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.05] text-white">
                        Let's build <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#C6F432] to-[#64dcff]">something iconic.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/50 mb-12 max-w-lg leading-relaxed font-medium">
                        Have questions about our AI employees? Need a custom solution? Reach out and our team will get back to you within 24 hours.
                    </p>

                    <div className="space-y-6">
                        {[
                            { icon: Mail, title: "Email us", data: "customercare@redber.in", href: "mailto:customercare@redber.in" },
                            { icon: Phone, title: "Call / WhatsApp", data: "+91 6238910451", href: "tel:+916238910451" },
                            { icon: MapPin, title: "Serving clients", data: "India & Globally", href: null }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-5 items-center group">
                                <div className="w-12 h-12 rounded-2xl border border-white/5 flex items-center justify-center text-white/60 bg-white/5 shrink-0 group-hover:border-[#C6F432]/30 group-hover:text-[#C6F432] transition-colors">
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest">{item.title}</h4>
                                    {item.href ? (
                                        <a href={item.href} className="font-semibold text-lg mt-1 block hover:opacity-80 transition-opacity text-white">{item.data}</a>
                                    ) : (
                                        <p className="text-white font-semibold text-lg mt-1">{item.data}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                >
                    <div className="bg-[#141414] border border-white/10 p-8 md:p-12 rounded-[32px] shadow-2xl overflow-hidden relative">
                        <AnimatePresence mode="wait">
                            {status === "success" ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="py-16 text-center space-y-6"
                                >
                                    <div className="w-20 h-20 bg-[#C6F432]/10 text-[#C6F432] border border-[#C6F432]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle size={40} />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white">Message Received!</h2>
                                    <p className="text-white/50">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                                    <button
                                        onClick={() => setStatus("idle")}
                                        className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-3 rounded-xl transition-colors font-bold text-sm"
                                    >
                                        Send another message
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-5"
                                >
                                    {status === "error" && (
                                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium px-4 py-3 rounded-xl">
                                            Something went wrong. Please try emailing us directly at{" "}
                                            <a href="mailto:customercare@redber.in" className="underline">customercare@redber.in</a>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[0.65rem] font-bold text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Enter your name"
                                                className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-xl outline-none focus:border-[#C6F432]/50 focus:ring-1 focus:ring-[#C6F432]/50 transition-all font-medium placeholder:text-white/20 text-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[0.65rem] font-bold text-white/40 uppercase tracking-widest ml-1">Email</label>
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="john@company.com"
                                                className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-xl outline-none focus:border-[#C6F432]/50 focus:ring-1 focus:ring-[#C6F432]/50 transition-all font-medium placeholder:text-white/20 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[0.65rem] font-bold text-white/40 uppercase tracking-widest ml-1">Subject</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="Partnership, Custom Bot, etc."
                                            className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-xl outline-none focus:border-[#C6F432]/50 focus:ring-1 focus:ring-[#C6F432]/50 transition-all font-medium placeholder:text-white/20 text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[0.65rem] font-bold text-white/40 uppercase tracking-widest ml-1">How can we help?</label>
                                        <textarea
                                            required
                                            rows={5}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Tell us about your needs..."
                                            className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-xl outline-none focus:border-[#C6F432]/50 focus:ring-1 focus:ring-[#C6F432]/50 transition-all font-medium placeholder:text-white/20 text-white resize-none"
                                        />
                                    </div>
                                    <button
                                        disabled={status === "submitting"}
                                        type="submit"
                                        className="w-full bg-[#C6F432] hover:bg-[#aad424] text-[#0d0d0d] font-bold py-4 rounded-xl shadow-[0_4px_24px_rgba(198,244,50,0.15)] hover:shadow-[0_8px_32px_rgba(198,244,50,0.25)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[0.95rem] uppercase tracking-wider"
                                    >
                                        {status === "submitting" ? "Sending..." : <><Send size={18} /> Send Message</>}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

export default function ContactPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d]" />}>
            <ContactFormContent />
        </Suspense>
    );
}

