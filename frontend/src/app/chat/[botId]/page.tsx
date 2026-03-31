"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Chatbot from "../../../components/Chatbot";
import { Loader2, ArrowLeft, MapPin, Clock, Phone, Globe, MessageCircle } from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { API_BASE } from "../../../lib/api";

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const botId = params.botId as string;
    const [bot, setBot] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const leftRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!botId) return;
        fetch(`${API_BASE}/api/bots/public/list`)
            .then(res => res.json())
            .then(data => {
                // Public API returns data directly as array
                const list = Array.isArray(data) ? data : (Array.isArray(data?.bots) ? data.bots : []);
                const found = list.find((b: any) =>
                    b.name.toLowerCase() === botId.toLowerCase() || b.id === botId
                );
                if (found) setBot(found);
                else router.push("/");
            })
            .catch(() => router.push("/"))
            .finally(() => setLoading(false));
    }, [botId, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#080808] flex items-center justify-center">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }
    if (!bot) return null;

    const pc = bot.page_config || {};
    const isRestaurant = bot.id?.includes("restaurant") || bot.persona_config?.industry?.toLowerCase().includes("restaurant");
    const isResort = bot.id?.includes("resort") || bot.id?.includes("hotel") || bot.persona_config?.industry?.toLowerCase().includes("resort") || bot.persona_config?.industry?.toLowerCase().includes("hospitality");
    const accentColor = isResort ? "text-emerald-400" : isRestaurant ? "text-rose-400" : "text-red-400";
    const accentGrad = isResort ? "from-emerald-600 to-teal-600" : isRestaurant ? "from-rose-500 to-orange-400" : "from-red-600 to-rose-500";
    const accentBorder = isResort ? "border-emerald-500/30" : isRestaurant ? "border-rose-500/30" : "border-red-500/30";
    const accentGlow = isResort ? "shadow-emerald-500/20" : isRestaurant ? "shadow-rose-500/20" : "shadow-red-500/20";

    const heroImage = pc.hero_image || (isResort
        ? "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=85"
        : isRestaurant
        ? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=85"
        : "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&q=85"
    );

    const infoItems = [
        pc.location && { icon: MapPin, text: pc.location },
        pc.hours && { icon: Clock, text: pc.hours },
        pc.phone && { icon: Phone, text: pc.phone },
        pc.website && { icon: Globe, text: pc.website },
    ].filter(Boolean) as { icon: any; text: string }[];

    const handleOpenChat = () => {
        setIsChatOpen(true);
    };

    const handleCloseChat = () => {
        setIsChatOpen(false);
    };

    return (
        <div className="bg-[#080808] text-white min-h-screen">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className={`absolute top-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full opacity-[0.07] blur-[160px] ${isResort ? "bg-emerald-500" : isRestaurant ? "bg-rose-500" : "bg-red-500"}`} />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full opacity-[0.05] blur-[120px] bg-white" />
            </div>

            {/* ============================================================
                TWO-COLUMN PAGE SHELL
                Left: scrolls normally inside this container
                Right: sticky — stays fixed while left scrolls
            ============================================================ */}
            <div className="relative z-10 flex h-screen overflow-hidden">

                {/* ===== LEFT — scrollable ===== */}
                <div
                    ref={leftRef}
                    className="flex-1 h-full overflow-y-auto"
                    style={{ scrollbarWidth: "none" }}
                >
                    {/* Back nav */}
                    <div className="absolute top-5 left-5 z-30">
                        <Link href="/"
                            className="flex items-center gap-2 text-gray-400 hover:text-white bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-sm font-medium transition-colors">
                            <ArrowLeft size={13} /> Back
                        </Link>
                    </div>

                    {/* --- HERO --- */}
                    <div className="relative h-[70vh] w-full overflow-hidden">
                        <img src={heroImage} alt={bot.name}
                            className="w-full h-full object-cover object-center scale-105" />
                        {/* Multi-layer fade to dark */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] from-10% via-black/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/60 via-transparent to-transparent" />

                        {/* Bot identity card at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 px-10 pb-10 pt-24 bg-gradient-to-t from-[#080808] to-transparent">
                            <div className="flex items-end gap-6 max-w-2xl">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    {bot.avatar ? (
                                        <img src={bot.avatar} alt={bot.name}
                                            className={`w-28 h-28 rounded-2xl object-cover border-2 ${accentBorder} shadow-2xl ${accentGlow}`} />
                                    ) : (
                                        <div className={`w-28 h-28 rounded-2xl flex items-center justify-center text-4xl font-black bg-gradient-to-br ${accentGrad} shadow-2xl`}>
                                            {bot.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-emerald-400 border-[3px] border-[#080808] rounded-full shadow-lg" />
                                </div>
                                {/* Name block */}
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6 }}
                                        className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-1 leading-tight"
                                    >
                                        {bot.name}
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className={`text-sm font-bold uppercase tracking-[0.18em] ${accentColor}`}
                                    >
                                        {pc.tagline || bot.role}
                                    </motion.p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- PAGE CONTENT --- */}
                    <div className="pb-28 pt-8">

                        {/* Info strip */}
                        {infoItems.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="px-5 md:px-10 mb-10"
                            >
                                <div className="flex flex-wrap gap-2">
                                    {infoItems.map(({ icon: Icon, text }, i) => (
                                        <div key={i}
                                            className="flex items-center gap-2 bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2 backdrop-blur-sm">
                                            <Icon size={13} className={`shrink-0 ${accentColor}`} />
                                            <span className="text-xs sm:text-sm text-gray-300 leading-none">{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* --- ABOUT section --- */}
                        {pc.about && (
                            <motion.section
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                className="px-5 md:px-10 mb-14"
                            >
                                <SectionLabel accent={accentColor}>About</SectionLabel>
                                <h2 className="text-3xl md:text-4xl font-black mb-6 mt-2">
                                    {pc.about.title || `Meet ${bot.name}`}
                                </h2>
                                <div className="flex flex-col sm:flex-row gap-8 items-start">
                                    {bot.avatar && (
                                        <div className="shrink-0">
                                            <img src={bot.avatar} alt={bot.name}
                                                className="w-full sm:w-44 h-52 sm:h-56 object-cover rounded-2xl border border-white/10 shadow-xl" />
                                        </div>
                                    )}
                                    <div className="space-y-5 flex-1 pt-1">
                                        {(pc.about.features || []).map((f: any, i: number) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.08 }}
                                            >
                                                <p className="font-black text-white text-sm mb-0.5">{f.label}</p>
                                                <p className="text-gray-400 text-sm leading-relaxed">{f.text}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.section>
                        )}

                        {/* --- DYNAMIC sections --- */}
                        {(pc.sections || []).map((section: any, si: number) => (
                            <motion.section
                                key={si}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.05 }}
                                className="px-5 md:px-10 mb-14"
                            >
                                <SectionLabel accent={accentColor}>{section.type}</SectionLabel>
                                <h2 className="text-3xl md:text-4xl font-black mb-6 mt-2">{section.title}</h2>

                                {/* STEPS */}
                                {section.type === "steps" && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {(section.items || []).map((item: any, ii: number) => (
                                            <motion.div
                                                key={ii}
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: ii * 0.1 }}
                                                className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden group hover:border-white/15 transition-all"
                                            >
                                                {item.image ? (
                                                    <div className="h-36 overflow-hidden">
                                                        <img src={item.image} alt={item.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    </div>
                                                ) : (
                                                    <div className={`h-12 bg-gradient-to-br ${accentGrad} opacity-30`} />
                                                )}
                                                <div className="p-4">
                                                    <p className={`text-xs font-black uppercase tracking-widest ${accentColor} mb-1`}>
                                                        Step {item.num}
                                                    </p>
                                                    <p className="font-black text-white text-sm mb-1.5">{item.title}</p>
                                                    <p className="text-gray-500 text-xs leading-relaxed">{item.text}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* BENEFITS */}
                                {section.type === "benefits" && (
                                    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-center">
                                        <div className="flex-1 space-y-5">
                                            {(section.items || []).map((item: any, ii: number) => (
                                                <motion.div
                                                    key={ii}
                                                    initial={{ opacity: 0, x: -12 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: ii * 0.08 }}
                                                    className="flex gap-3 items-start"
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-gradient-to-br ${accentGrad}`} />
                                                    <div>
                                                        <p className="font-black text-white text-sm mb-0.5">{item.label}</p>
                                                        <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        {section.image && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true }}
                                                className="shrink-0 self-center"
                                            >
                                                <img src={section.image} alt="benefits"
                                                    className={`w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 ${accentBorder} shadow-2xl ${accentGlow}`} />
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* GALLERY */}
                                {section.type === "gallery" && (
                                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                                        {(section.items || []).map((item: any, ii: number) => (
                                            <motion.div
                                                key={ii}
                                                initial={{ opacity: 0, scale: 0.96 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: ii * 0.07 }}
                                                className={`overflow-hidden rounded-2xl ${ii === 0 ? "col-span-2 h-48 md:h-60" : "h-36 md:h-44"} group`}
                                            >
                                                <img src={item.image} alt={item.text || ""}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.section>
                        ))}

                        {/* Empty state */}
                        {!pc.about && (!pc.sections || pc.sections.length === 0) && (
                            <div className="text-center py-24 text-gray-600 px-10">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-2xl">✨</div>
                                <p className="font-semibold text-gray-500 mb-1">No page content configured</p>
                                <p className="text-sm">Admin → Configure → 📄 Page Content</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== FLOATING CHAT WIDGET & POPUP ===== */}
            <AnimatePresence>
                {!isChatOpen && (
                    <motion.button
                        key="chat-btn"
                        onClick={handleOpenChat}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center gap-3 bg-gradient-to-br ${accentGrad} text-white px-5 sm:px-6 py-4 rounded-full font-black text-sm md:text-base shadow-[0_10px_40px_rgba(244,63,94,0.4)]`}
                    >
                        <MessageCircle size={24} className="animate-pulse" />
                        <span className="hidden sm:block">Chat with {bot.name}</span>
                    </motion.button>
                )}

                {isChatOpen && (
                    <motion.div
                        key="chat-popup"
                        initial={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] w-[calc(100vw-32px)] sm:w-[420px] h-[600px] max-h-[85vh] flex flex-col bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                        <div className="flex-1 w-full h-full relative">
                            {/* Stretch Chatbot purely so it controls its own layout */}
                            <Chatbot
                                botId={bot.id}
                                botName={bot.name}
                                botRole={bot.role}
                                botAvatar={bot.avatar}
                                themeColor={`bg-gradient-to-br ${accentGrad}`}
                                fullScreen={true}
                                suggestedQuestions={bot.page_config?.suggested_questions || []}
                                voiceEnabled={!!bot.persona_config?.voice_enabled}
                                onClose={handleCloseChat}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Small reusable section label
function SectionLabel({ accent, children }: { accent: string; children: React.ReactNode }) {
    return (
        <p className={`text-xs font-black uppercase tracking-[0.2em] ${accent} flex items-center gap-2`}>
            <span className="inline-block w-4 h-px bg-current opacity-60" />
            {children}
        </p>
    );
}
