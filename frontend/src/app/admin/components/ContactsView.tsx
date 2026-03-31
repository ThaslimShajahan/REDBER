"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Mail, Clock, RefreshCw, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, authFetch } from "../../../lib/api";
import { TopProgressBar, SkeletonRow } from "./PageLoader";

function timeAgo(ts: string) {
    if (!ts) return "—";
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function isToday(ts: string) {
    if (!ts) return false;
    return new Date(ts).toDateString() === new Date().toDateString();
}

import { useAuth } from "../context/AuthContext";

export default function ContactsView() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [selectedMsg, setSelectedMsg] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchContacts = useCallback(async () => {
        if (!user) return;
        try {
            const botIdsParam = user.role === "super_admin" ? "" : `?bot_ids=${user.botIds?.join(",") || "NONE"}`;
            const res = await authFetch(`${API_BASE}/api/admin/contacts${botIdsParam}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (err) {
            console.error("Failed to fetch contacts:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchContacts();
        // Poll every 30s for new messages
        const interval = setInterval(fetchContacts, 30000);
        return () => clearInterval(interval);
    }, [fetchContacts]);

    const markAsRead = async (id: string) => {
        try {
            await authFetch(`${API_BASE}/api/admin/contacts/${id}/read`, { method: "PATCH" });
            setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    const deleteMessage = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this message?")) return;
        try {
            await authFetch(`${API_BASE}/api/admin/contacts/${id}`, { method: "DELETE" });
            setMessages(prev => prev.filter(m => m.id !== id));
            if (selectedMsg?.id === id) setSelectedMsg(null);
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    const unread = messages.filter(m => !m.is_read).length;
    const todayCount = messages.filter(m => isToday(m.created_at)).length;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <p className="text-gray-400 text-sm font-medium mb-1">Total Messages</p>
                    <p className="text-4xl font-extrabold text-blue-400">{messages.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <p className="text-gray-400 text-sm font-medium mb-1">Unread</p>
                    <p className="text-4xl font-extrabold text-amber-400">{unread}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <p className="text-gray-400 text-sm font-medium mb-1">New Today</p>
                    <p className="text-4xl font-extrabold text-emerald-400">{todayCount}</p>
                </div>
            </div>

            {/* Table header row with refresh */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Inbox</h3>
                <button onClick={fetchContacts} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors text-xs font-semibold">
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-sm text-gray-400 uppercase tracking-wider border-b border-white/10">
                            <th className="p-4 font-medium w-12"></th>
                            <th className="p-4 font-medium">Sender</th>
                            <th className="p-4 font-medium">Subject</th>
                            <th className="p-4 font-medium">Date</th>
                            <th className="p-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {loading ? (
                            <>{loading && <TopProgressBar />}<SkeletonRow cols={5} /><SkeletonRow cols={5} /><SkeletonRow cols={5} /><SkeletonRow cols={5} /></>
                        ) : messages.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No messages yet.</td></tr>
                        ) : (
                            messages.map((msg) => (
                                <tr
                                    key={msg.id}
                                    onClick={() => { setSelectedMsg(msg); if (!msg.is_read) markAsRead(msg.id); }}
                                    className={`cursor-pointer transition-colors group ${!msg.is_read ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06] border-l-2 border-l-amber-500/60' : 'hover:bg-white/5'}`}
                                >
                                    <td className="p-4 text-center">
                                        {!msg.is_read ? (
                                            <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] mx-auto" title="Unread" />
                                        ) : (
                                            <div className="w-2 h-2 bg-gray-700 rounded-full mx-auto" />
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className={`font-semibold ${!msg.is_read ? 'text-white' : 'text-gray-300'}`}>{msg.name}</span>
                                            <span className="text-xs text-gray-500 truncate max-w-[150px]">{msg.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`${!msg.is_read ? 'text-white font-medium' : 'text-gray-400'}`}>{msg.subject}</span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs whitespace-nowrap">{timeAgo(msg.created_at)}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={(e) => deleteMessage(msg.id, e)}
                                            className="text-gray-600 hover:text-rose-400 transition-colors p-2 opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Message Detail Modal */}
            <AnimatePresence>
                {selectedMsg && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0f0f11] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/[0.02]">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Mail className="text-purple-400" size={20} />
                                    Message Details
                                </h2>
                                <button onClick={() => setSelectedMsg(null)} className="text-gray-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">From</p>
                                        <h3 className="text-2xl font-bold text-white">{selectedMsg.name}</h3>
                                        <a href={`mailto:${selectedMsg.email}`} className="text-purple-400 font-medium hover:text-purple-300 transition-colors">{selectedMsg.email}</a>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Received</p>
                                        <p className="text-gray-300 flex items-center gap-2 justify-end mt-1">
                                            <Clock size={14} className="text-gray-500" />
                                            {selectedMsg.created_at ? new Date(selectedMsg.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Subject</p>
                                    <p className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">{selectedMsg.subject}</p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Message</p>
                                    <div className="text-gray-200 leading-relaxed whitespace-pre-wrap font-light">
                                        {selectedMsg.message}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setSelectedMsg(null)}
                                        className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold"
                                    >
                                        Close
                                    </button>
                                    <a
                                        href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject}`}
                                        className="px-8 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 transition-all text-sm font-bold flex items-center gap-2"
                                    >
                                        <Mail size={15} /> Reply via Email
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
