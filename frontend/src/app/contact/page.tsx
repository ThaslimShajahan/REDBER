"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { API_BASE } from "../../lib/api";

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

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
        <div className="min-h-screen bg-[#020202] text-white font-sans selection:bg-purple-500/30 overflow-hidden relative">
            {/* Dynamic Background */}
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

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold px-4 py-2 rounded-full mb-8">
                        <MessageSquare size={14} />
                        Get in Touch
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.05]">
                        Let's build <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400">something iconic.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-lg leading-relaxed font-light">
                        Have questions about our AI employees? Need a custom solution? Reach out and our human team will get back to you within 24 hours.
                    </p>

                    <div className="space-y-8">
                        {[
                            { icon: Mail, title: "Email us", data: "customercare@redber.in", href: "mailto:customercare@redber.in", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                            { icon: Phone, title: "Call / WhatsApp", data: "+91 9633 484 641", href: "tel:+919633484641", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                            { icon: MapPin, title: "Serving clients", data: "India & Globally", href: null, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-5 items-start">
                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${item.color} ${item.bg} shrink-0`}>
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{item.title}</h4>
                                    {item.href ? (
                                        <a href={item.href} className={`font-medium text-lg mt-1 block hover:opacity-80 transition-opacity ${item.color}`}>{item.data}</a>
                                    ) : (
                                        <p className="text-white font-medium text-lg mt-1">{item.data}</p>
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
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 blur-3xl -z-10 rounded-[3rem]" />
                    <div className="bg-[#0f0f12] border border-white/10 p-8 md:p-12 rounded-[32px] shadow-2xl backdrop-blur-3xl overflow-hidden relative">
                        <AnimatePresence mode="wait">
                            {status === "success" ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="py-16 text-center space-y-6"
                                >
                                    <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle size={40} />
                                    </div>
                                    <h2 className="text-3xl font-bold">Message Received!</h2>
                                    <p className="text-gray-400">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                                    <button
                                        onClick={() => setStatus("idle")}
                                        className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl transition-colors font-bold text-sm"
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
                                    className="space-y-6"
                                >
                                    {status === "error" && (
                                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium px-4 py-3 rounded-xl">
                                            Something went wrong. Please try emailing us directly at{" "}
                                            <a href="mailto:customercare@redber.in" className="underline">customercare@redber.in</a>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe"
                                                className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-gray-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="john@company.com"
                                                className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-gray-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            placeholder="Partnership, Custom Bot, etc."
                                            className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">How can we help?</label>
                                        <textarea
                                            required
                                            rows={5}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Tell us about your needs..."
                                            className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-gray-700 resize-none"
                                        />
                                    </div>
                                    <button
                                        disabled={status === "submitting"}
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-5 rounded-2xl shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg uppercase tracking-wider"
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
