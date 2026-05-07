"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE, authFetch } from "../../../lib/api";
import { Radio, UserCheck, UserX, Send, AlertTriangle, Bot, User, Shield, RefreshCw, Wifi, WifiOff } from "lucide-react";

const WS_BASE = API_BASE.replace(/^http/, "ws");

type Msg = { role: "user" | "bot" | "admin"; content: string; ts: number; confidence?: string; action?: string; takeover?: boolean };
type Session = {
    session_id: string;
    bot_id: string;
    started_at: number;
    last_active: number;
    message_count: number;
    is_taken_over: boolean;
    messages: Msg[];
};

function timeAgo(ts: number) {
    const diff = (Date.now() / 1000 - ts);
    if (diff < 5) return "just now";
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}

export default function LiveChatView() {
    const [sessions, setSessions] = useState<Record<string, Session>>({});
    const [selected, setSelected] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [adminMsg, setAdminMsg] = useState("");
    const [sending, setSending] = useState(false);
    const [newSessionCount, setNewSessionCount] = useState(0);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [, setTick] = useState(0);
    const wsRef = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const knownSessions = useRef<Set<string>>(new Set());
    const selectedRef = useRef<string | null>(null);

    // Keep selectedRef in sync
    useEffect(() => { selectedRef.current = selected; }, [selected]);

    // Clear unread when session is selected
    useEffect(() => {
        if (selected) setUnreadCounts(prev => ({ ...prev, [selected]: 0 }));
    }, [selected]);

    const alertNewSession = (sessionId: string) => {
        const isNew = !knownSessions.current.has(sessionId);
        knownSessions.current.add(sessionId);
        if (isNew) {
            setNewSessionCount(n => n + 1);
            // Sound alert
            try { new Audio("/assetsAudio/live-chat.mp3").play(); } catch { /* ok */ }
            // Browser notification
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification("New Live Chat Session", {
                    body: `A user just started chatting on ${sessionId.split("-")[0]}`,
                    icon: "/redber_logo_transperent.png",
                });
            }
        }
        // Increment unread if this session is not currently selected
        if (selectedRef.current !== sessionId) {
            setUnreadCounts(prev => ({ ...prev, [sessionId]: (prev[sessionId] || 0) + 1 }));
            // Update tab title with total unread
            const totalUnread = Object.values({ ...unreadCounts, [sessionId]: (unreadCounts[sessionId] || 0) + 1 }).reduce((a, b) => a + b, 0);
            if (totalUnread > 0) document.title = `(${totalUnread}) Live Monitor | Redber`;
        }
    };

    const scrollBottom = () => {
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 60);
    };

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        const ws = new WebSocket(`${WS_BASE}/api/admin/live/ws`);
        wsRef.current = ws;

        ws.onopen = () => { setConnected(true); };
        ws.onclose = () => {
            setConnected(false);
            reconnectTimer.current = setTimeout(connect, 4000);
        };
        ws.onerror = () => ws.close();

        ws.onmessage = (e) => {
            try {
                const event = JSON.parse(e.data);
                if (event.type === "ping") return;

                if (event.type === "init") {
                    const map: Record<string, Session> = {};
                    for (const s of event.sessions || []) {
                        map[s.session_id] = s;
                        knownSessions.current.add(s.session_id);
                    }
                    setSessions(map);
                    return;
                }

                if (event.type === "message") {
                    if (event.role === "user") alertNewSession(event.session_id);
                    setSessions(prev => {
                        const existing = prev[event.session_id];
                        const newMsg: Msg = {
                            role: event.role,
                            content: event.content,
                            ts: event.ts,
                            confidence: event.confidence,
                            action: event.action,
                            takeover: event.takeover,
                        };
                        return {
                            ...prev,
                            [event.session_id]: {
                                session_id: event.session_id,
                                bot_id: event.bot_id || existing?.bot_id || "",
                                started_at: existing?.started_at || event.ts,
                                last_active: event.ts,
                                message_count: (existing?.message_count || 0) + 1,
                                is_taken_over: existing?.is_taken_over || false,
                                messages: [...(existing?.messages || []), newMsg],
                            },
                        };
                    });
                    scrollBottom();
                    return;
                }

                if (event.type === "takeover" || event.type === "release") {
                    setSessions(prev => {
                        const s = prev[event.session_id];
                        if (!s) return prev;
                        return { ...prev, [event.session_id]: { ...s, is_taken_over: event.type === "takeover" } };
                    });
                }
            } catch { /* ignore */ }
        };
    }, []);

    useEffect(() => {
        // Request browser notification permission
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission();
        }
        connect();
        const timer = setInterval(() => setTick(t => t + 1), 10000);
        return () => {
            clearInterval(timer);
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            wsRef.current?.close();
            document.title = "Admin Console | Redber";
        };
    }, [connect]);

    useEffect(() => { if (selected) scrollBottom(); }, [selected]);

    const sessionList = Object.values(sessions).sort((a, b) => b.last_active - a.last_active);
    const activeSession = selected ? sessions[selected] : null;

    const handleTakeover = async () => {
        if (!selected) return;
        await authFetch(`${API_BASE}/api/admin/live/sessions/${selected}/takeover`, { method: "POST" });
        setSessions(prev => prev[selected] ? { ...prev, [selected]: { ...prev[selected], is_taken_over: true } } : prev);
    };

    const handleRelease = async () => {
        if (!selected) return;
        await authFetch(`${API_BASE}/api/admin/live/sessions/${selected}/release`, { method: "POST" });
        setSessions(prev => prev[selected] ? { ...prev, [selected]: { ...prev[selected], is_taken_over: false } } : prev);
    };

    const handleSend = async () => {
        if (!selected || !adminMsg.trim()) return;
        setSending(true);
        try {
            await authFetch(`${API_BASE}/api/admin/live/sessions/${selected}/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: adminMsg.trim() }),
            });
            setAdminMsg("");
        } finally {
            setSending(false);
        }
    };

    const handleFetchRest = async () => {
        const res = await authFetch(`${API_BASE}/api/admin/live/sessions`);
        const data = await res.json();
        const map: Record<string, Session> = {};
        for (const s of data || []) map[s.session_id] = s;
        setSessions(map);
    };

    return (
        <div className="space-y-4 h-[calc(100vh-200px)] min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                    <span className="text-sm font-bold text-white">{connected ? "Live" : "Reconnecting..."}</span>
                    <span className="text-xs text-gray-500">{sessionList.length} active session{sessionList.length !== 1 ? "s" : ""}</span>
                    {newSessionCount > 0 && (
                        <button onClick={() => setNewSessionCount(0)} className="text-[9px] font-black bg-amber-500 text-black px-2 py-0.5 rounded-full animate-pulse">
                            {newSessionCount} new
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleFetchRest} title="Refresh sessions" className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                        <RefreshCw size={13} />
                    </button>
                    {connected ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-red-400" />}
                </div>
            </div>

            <div className="flex gap-4 flex-1 overflow-hidden">
                {/* Session List */}
                <div className="w-72 shrink-0 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Active Sessions</p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {sessionList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                                <Radio size={24} className="text-gray-600" />
                                <p className="text-xs text-gray-600 text-center">No active sessions yet.<br />Sessions appear here as users chat.</p>
                            </div>
                        ) : sessionList.map(s => {
                            const lastMsg = s.messages[s.messages.length - 1];
                            const isUrgent = s.messages.some(m => m.action === "urgent_escalation");
                            return (
                                <button
                                    key={s.session_id}
                                    onClick={() => setSelected(s.session_id)}
                                    className={`w-full text-left p-3.5 border-b border-white/5 hover:bg-white/5 transition-colors ${selected === s.session_id ? "bg-white/10 border-l-2 border-l-purple-500" : ""}`}
                                >
                                    <div className="flex items-center gap-1.5 mb-1">
                                        {s.is_taken_over && <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full uppercase">Human</span>}
                                        {isUrgent && <span className="text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full uppercase">🚨 Urgent</span>}
                                        {(unreadCounts[s.session_id] || 0) > 0 && (
                                            <span className="text-[9px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded-full animate-pulse">
                                                {unreadCounts[s.session_id]}
                                            </span>
                                        )}
                                        <span className="text-[9px] text-gray-600 ml-auto">{timeAgo(s.last_active)}</span>
                                    </div>
                                    <p className="text-xs text-purple-400 font-bold truncate">{s.bot_id}</p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{lastMsg?.content?.slice(0, 55) || "—"}</p>
                                    <p className="text-[9px] text-gray-600 mt-1">{s.message_count} messages · {s.session_id.slice(-8)}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Chat Viewer */}
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                    {!activeSession ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                            <Radio size={32} className="text-gray-600" />
                            <p className="text-gray-600 text-sm text-center">Select a session to monitor it live</p>
                        </div>
                    ) : (
                        <>
                            {/* Session Header */}
                            <div className="p-4 border-b border-white/10 flex items-center gap-3 shrink-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-purple-400 font-bold truncate">{activeSession.bot_id}</p>
                                    <p className="text-[10px] text-gray-500 font-mono truncate">Session: {activeSession.session_id}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {activeSession.is_taken_over ? (
                                        <button onClick={handleRelease} className="flex items-center gap-1.5 text-[11px] font-black bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-xl transition-all">
                                            <UserX size={12} /> Release to AI
                                        </button>
                                    ) : (
                                        <button onClick={handleTakeover} className="flex items-center gap-1.5 text-[11px] font-black bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all">
                                            <UserCheck size={12} /> Take Over
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Takeover Banner */}
                            {activeSession.is_taken_over && (
                                <div className="mx-4 mt-3 shrink-0 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
                                    <Shield size={13} className="text-blue-400 shrink-0" />
                                    <p className="text-xs text-blue-300 font-bold">You have taken over this conversation. AI is paused. Your messages below will be delivered to the user.</p>
                                </div>
                            )}

                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {activeSession.messages.length === 0 ? (
                                    <p className="text-gray-600 text-xs text-center mt-8">Waiting for messages...</p>
                                ) : activeSession.messages.map((msg, i) => {
                                    const isUser = msg.role === "user";
                                    const isAdmin = msg.role === "admin";
                                    const isAgentReply = msg.role === "bot" && msg.takeover;
                                    const isUrgent = msg.action === "urgent_escalation";
                                    return (
                                        <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                                            <div className="max-w-[78%] space-y-1">
                                                <div className={`flex items-center gap-1.5 ${isUser ? "justify-end" : ""}`}>
                                                    {!isUser && (
                                                        <span className={`text-[9px] font-black uppercase ${isAdmin || isAgentReply ? "text-blue-400" : "text-purple-400"}`}>
                                                            {isAdmin ? "You (Admin)" : isAgentReply ? "Agent Reply ↗" : "AI Bot"}
                                                        </span>
                                                    )}
                                                    {isUrgent && <AlertTriangle size={10} className="text-red-400" />}
                                                    <span className="text-[9px] text-gray-600">{timeAgo(msg.ts)}</span>
                                                    {isUser && <span className="text-[9px] font-black text-gray-400">User</span>}
                                                </div>
                                                <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${isUser
                                                    ? "bg-[#7c3aed] text-white rounded-tr-sm"
                                                    : isAdmin
                                                        ? "bg-blue-600/30 text-blue-200 border border-blue-500/30 rounded-tl-sm"
                                                        : isAgentReply
                                                            ? "bg-teal-600/25 text-teal-200 border border-teal-500/30 rounded-tl-sm"
                                                            : isUrgent
                                                                ? "bg-red-500/20 text-red-200 border border-red-500/30 rounded-tl-sm"
                                                                : "bg-white/10 text-gray-200 border border-white/5 rounded-tl-sm"
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                                {msg.confidence && ["high", "medium", "low"].includes(msg.confidence.toLowerCase()) && (
                                                    <div className={`flex ${isUser ? "justify-end" : ""}`}>
                                                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${msg.confidence.toLowerCase() === "high" ? "bg-emerald-500/10 text-emerald-400" : msg.confidence.toLowerCase() === "medium" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}>
                                                            {msg.confidence} conf
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Admin Message Input */}
                            {activeSession.is_taken_over && (
                                <div className="p-4 border-t border-white/10 shrink-0">
                                    <div className="flex gap-2">
                                        <input
                                            value={adminMsg}
                                            onChange={e => setAdminMsg(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                                            placeholder="Type your reply as agent..."
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600"
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={sending || !adminMsg.trim()}
                                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-all"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-gray-600 mt-1.5">Message will be delivered to user on their next chat request.</p>
                                </div>
                            )}

                            {!activeSession.is_taken_over && (
                                <div className="p-3 border-t border-white/10 shrink-0">
                                    <p className="text-[10px] text-gray-600 text-center">AI is responding · <button onClick={handleTakeover} className="text-emerald-400 hover:underline">Take over to reply as agent</button></p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
