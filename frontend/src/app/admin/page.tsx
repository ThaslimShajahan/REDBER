"use client";

import { useState, useEffect } from "react";
import { Users, Database, LayoutDashboard, Search, ArrowLeft, ScrollText, Mail, TrendingUp, MessageSquare, PenLine } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { API_BASE } from "../../lib/api";

import LeadsView from "./components/LeadsView";
import KnowledgeBaseView from "./components/KnowledgeBaseView";
import SettingsView from "./components/SettingsView";
import LogsView from "./components/LogsView";
import ContactsView from "./components/ContactsView";
import ConversionMetrics from "./components/ConversionMetrics";
import WhatsAppConfig from "./components/WhatsAppConfig";
import TrainingStudio from "./components/TrainingStudio";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("leads");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!isLoggedIn) return;
        const fetchUnread = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/admin/contacts`);
                if (res.ok) {
                    const data = await res.json();
                    setUnreadCount(data.filter((m: any) => !m.is_read).length);
                }
            } catch { /* ignore */ }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [isLoggedIn]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === "admin" && password === "Admin@9633") {
            setIsLoggedIn(true);
            setError("");
        } else {
            setError("Invalid credentials");
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505] to-transparent blur-[120px] opacity-70" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl relative z-10"
                >
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                            <img src="/logo_white.png" alt="Redber" className="w-10 h-10 object-contain" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">Admin Portal</h1>
                        <p className="text-gray-400 text-sm">Secure access required</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                                placeholder="Enter username"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-rose-400 text-xs font-bold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 active:scale-95 transition-all shadow-lg mt-4"
                        >
                            Sign In
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-purple-500/30">
            {/* Sidebar */}
            <aside className="w-64 bg-black/50 border-r border-white/5 backdrop-blur-xl p-6 flex flex-col relative z-20">
                <div className="flex items-center gap-3 mb-12">
                    <img src="/logo_white.png" alt="Redber" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-lg tracking-tight">Admin Console</span>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { id: "settings", label: "Bot Manager", icon: LayoutDashboard },
                        { id: "kb", label: "Knowledge Base", icon: Database },
                        { id: "training", label: "AI Training Studio", icon: PenLine },
                        { id: "leads", label: "Lead Center", icon: Users },
                        { id: "metrics", label: "Conversion Metrics", icon: TrendingUp },
                        { id: "integrations", label: "Integrations", icon: MessageSquare },
                        { id: "contacts", label: "Contact Messages", icon: Mail, badge: unreadCount },
                        { id: "logs", label: "Chat Logs", icon: ScrollText },
                    ].map((item: any) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                                    ? "bg-white/10 text-white shadow-inner border border-white/10"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <Icon size={18} className={activeTab === item.id ? "text-purple-400" : ""} />
                                <span className="flex-1 text-left">{item.label}</span>
                                {item.badge > 0 && (
                                    <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)] animate-pulse">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white mt-auto text-sm transition-colors py-2 font-medium">
                    <ArrowLeft size={16} />
                    Back to Site
                </Link>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black relative z-10">
                <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        {activeTab === "leads" && "Lead Center"}
                        {activeTab === "kb" && "Knowledge Base"}
                        {activeTab === "settings" && "Bot Manager"}
                        {activeTab === "contacts" && "Contact Messages"}
                        {activeTab === "logs" && "Chat Logs"}
                        {activeTab === "metrics" && "Conversion Metrics"}
                        {activeTab === "integrations" && "Integrations & Channels"}
                        {activeTab === "training" && "AI Training Studio"}
                    </h1>
                    <div className="bg-white/5 p-2 rounded-full border border-white/10 flex items-center px-4 w-64 shadow-inner ring-1 ring-white/5 focus-within:ring-purple-500/50 transition-all">
                        <Search size={16} className="text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
                        />
                    </div>
                </header>

                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="h-full"
                >
                    {activeTab === "leads" && <LeadsView />}
                    {activeTab === "kb" && <KnowledgeBaseView />}
                    {activeTab === "settings" && <SettingsView />}
                    {activeTab === "contacts" && <ContactsView />}
                    {activeTab === "logs" && <LogsView />}
                    {activeTab === "metrics" && <ConversionMetrics />}
                    {activeTab === "integrations" && <WhatsAppConfig />}
                    {activeTab === "training" && <TrainingStudio />}
                </motion.div>
            </main>
        </div>
    );
}
