import { useState, useEffect, useMemo } from "react";
import { API_BASE, authFetch } from "../../../lib/api";
import { TopProgressBar } from "./PageLoader";
import { useAuth } from "../context/AuthContext";
import { MessageSquare, TrendingUp, AlertCircle, BarChart2, Phone, Search, Download, RefreshCw, X, CheckCircle } from "lucide-react";

function timeAgo(dateStr: string): string {
    if (!dateStr) return "—";
    const diff = (Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function LogsView() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filterConf, setFilterConf] = useState("all");

    const fetchLogs = () => {
        if (!user) return;
        setLoading(true);
        const botIdsParam = user.role === "super_admin" ? "" : `?bot_ids=${user.botIds?.join(",") || "NONE"}`;
        authFetch(`${API_BASE}/api/admin/logs${botIdsParam}`)
            .then(res => res.json())
            .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchLogs(); }, [user]);

    const sessions = useMemo(() => logs.reduce((acc: Record<string, any[]>, log: any) => {
        if (!acc[log.session_id]) acc[log.session_id] = [];
        acc[log.session_id].push(log);
        return acc;
    }, {}), [logs]);

    const sessionIds = useMemo(() => {
        let ids = Object.keys(sessions);
        if (search.trim()) {
            ids = ids.filter(sid => {
                const sessionLogs = sessions[sid];
                return sessionLogs.some((l: any) =>
                    (l.user_message || "").toLowerCase().includes(search.toLowerCase()) ||
                    (l.bot_id || "").toLowerCase().includes(search.toLowerCase())
                );
            });
        }
        if (filterConf !== "all") {
            ids = ids.filter(sid => {
                const sessionLogs = sessions[sid];
                if (filterConf === "voice") return sessionLogs.some((l: any) => l.user_message === "[VOICE CALL SESSION START]");
                return sessionLogs.some((l: any) => l.confidence_score?.toLowerCase() === filterConf);
            });
        }
        // Sort by most recent log
        ids.sort((a, b) => {
            const lastA = sessions[a][0];
            const lastB = sessions[b][0];
            return new Date(lastB?.created_at || 0).getTime() - new Date(lastA?.created_at || 0).getTime();
        });
        return ids;
    }, [sessions, search, filterConf]);

    const activeLogs = selectedSession ? [...sessions[selectedSession]].reverse() : [];

    const totalLogsCount = logs.length;
    const highConf = logs.filter(l => l.confidence_score?.toLowerCase() === 'high').length;
    const highConfRatio = totalLogsCount > 0 ? Math.round((highConf / totalLogsCount) * 100) : 0;
    const gapsDetected = logs.filter(l => l.gap_topic).length;
    const voiceCalls = Object.values(sessions).filter((sLogs: any) => sLogs.some((l: any) => l.user_message === "[VOICE CALL SESSION START]")).length;

    const handleExport = () => {
        if (!selectedSession || activeLogs.length === 0) return;
        const rows = ["Timestamp,Role,Message,Confidence,Lead Score"];
        activeLogs.forEach(l => {
            rows.push(`"${l.created_at}","Customer","${(l.user_message || "").replace(/"/g, '""')}","${l.confidence_score || ""}","${l.lead_score || 0}"`);
            rows.push(`"${l.created_at}","AI","${(l.bot_reply || "").replace(/"/g, '""').replace(/\n/g, " ")}","${l.confidence_score || ""}",""`);
        });
        const blob = new Blob([rows.join("\n")], { type: "text/csv" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = `session_${selectedSession?.slice(-8)}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    return (
        <div className="space-y-6">
            {/* KPI Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Messages", value: totalLogsCount, color: "text-white", border: "border-white/10", icon: <MessageSquare size={14} className="text-gray-400" /> },
                    { label: "High Accuracy Rate", value: `${highConfRatio}%`, color: "text-emerald-400", border: "border-emerald-500/20", icon: <TrendingUp size={14} className="text-emerald-400" /> },
                    { label: "Knowledge Gaps", value: gapsDetected, color: "text-yellow-400", border: "border-yellow-500/20", icon: <AlertCircle size={14} className="text-yellow-400" /> },
                    { label: "Voice Calls", value: voiceCalls, color: "text-purple-400", border: "border-purple-500/20", icon: <Phone size={14} className="text-purple-400" /> },
                ].map((stat, i) => (
                    <div key={i} className={`bg-white/5 border ${stat.border} rounded-2xl p-5 relative overflow-hidden group hover:bg-white/[0.08] transition-all`}>
                        <div className="absolute top-3 right-3 opacity-30">{stat.icon}</div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Panel */}
            <div className="flex gap-4 h-[calc(100vh-320px)] min-h-[500px]">
                {/* Session List (Left) */}
                <div className="w-80 shrink-0 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                    {/* Search + Filter */}
                    <div className="p-4 border-b border-white/10 space-y-3">
                        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                            <Search size={13} className="text-gray-500 shrink-0" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search sessions..."
                                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                            />
                            {search && <button onClick={() => setSearch("")}><X size={12} className="text-gray-500 hover:text-white" /></button>}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            {["all", "high", "medium", "low", "voice"].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilterConf(f)}
                                    className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filterConf === f
                                        ? f === "high" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                            : f === "medium" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                : f === "low" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                                    : f === "voice" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                                        : "bg-white/15 text-white border border-white/20"
                                        : "bg-black/30 text-gray-500 border border-white/5 hover:border-white/20 hover:text-gray-300"}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gray-600 font-bold">{sessionIds.length} sessions</p>
                            <button onClick={fetchLogs} className="text-gray-600 hover:text-gray-300 transition-colors"><RefreshCw size={12} /></button>
                        </div>
                    </div>

                    {/* Session Items */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <TopProgressBar />
                                <p className="text-gray-600 text-sm animate-pulse">Loading...</p>
                            </div>
                        ) : sessionIds.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center p-8 italic">No sessions match.</p>
                        ) : sessionIds.map(sid => {
                            const sidLogs = sessions[sid];
                            const first = sidLogs[sidLogs.length - 1];
                            const isVoice = sidLogs.some(l => l.user_message === "[VOICE CALL SESSION START]");
                            const hasGap = sidLogs.some(l => l.gap_topic);
                            const confMap = sidLogs.reduce((a: Record<string, number>, l: any) => {
                                const c = l.confidence_score?.toLowerCase();
                                if (c) a[c] = (a[c] || 0) + 1;
                                return a;
                            }, {});
                            const topConf = Object.entries(confMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

                            return (
                                <button
                                    key={sid}
                                    onClick={() => setSelectedSession(sid)}
                                    className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${selectedSession === sid ? "bg-white/10 border-l-2 border-l-purple-500" : ""}`}
                                >
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        {isVoice && <span className="text-[9px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-widest">📞 Voice</span>}
                                        {hasGap && <span className="text-[9px] font-black bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Gap</span>}
                                        <span className="text-[9px] text-gray-600 font-mono ml-auto">{timeAgo(first?.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-gray-200 font-medium truncate">{isVoice ? "📞 Voice Conversation" : first?.user_message}</p>
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className="text-[10px] text-purple-400 font-medium">{first?.bot_id}</span>
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${topConf === "high" ? "bg-emerald-500/10 text-emerald-400" : topConf === "medium" ? "bg-blue-500/10 text-blue-400" : "bg-gray-500/10 text-gray-500"}`}>{topConf} conf</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Chat Viewer (Right) */}
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                    {!selectedSession ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <MessageSquare size={24} className="text-gray-600" />
                            </div>
                            <p className="text-gray-600 text-sm text-center">Select a conversation session from the left panel</p>
                        </div>
                    ) : (
                        <>
                            {/* Session Header */}
                            <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 gap-4">
                                <div>
                                    <p className="text-xs font-mono text-gray-500">Session: {selectedSession}</p>
                                    <p className="text-sm font-bold text-white mt-0.5">
                                        {activeLogs[0]?.bot_id} &nbsp;·&nbsp;
                                        <span className="text-gray-400 font-normal">{activeLogs.length} exchanges</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 ml-auto">
                                    <div className="flex gap-1.5 flex-wrap">
                                        {["high", "medium", "low"].map(conf => {
                                            const count = activeLogs.filter(l => l.confidence_score?.toLowerCase() === conf).length;
                                            if (count === 0) return null;
                                            return (
                                                <span key={conf} className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${conf === "high" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : conf === "medium" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"}`}>
                                                    {count} {conf}
                                                </span>
                                            );
                                        })}
                                    </div>
                                    <button onClick={handleExport} className="flex items-center gap-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-gray-400 hover:text-white transition-all">
                                        <Download size={11} /> Export
                                    </button>
                                    <button onClick={() => setSelectedSession(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {activeLogs.map((log: any, i: number) => (
                                    <div key={i} className="space-y-3">
                                        {/* User Message */}
                                        <div className="flex justify-end">
                                            <div className={`${log.user_message === "[VOICE CALL SESSION START]"
                                                ? "bg-purple-600/20 border border-purple-500/30 text-purple-300 italic"
                                                : "bg-[#7c3aed] text-white"
                                                } rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%] leading-snug font-medium shadow-md`}>
                                                {log.user_message === "[VOICE CALL SESSION START]" ? "📞 Voice Call Session" : log.user_message}
                                            </div>
                                        </div>

                                        {/* Bot Reply */}
                                        <div className="flex justify-start flex-col items-start gap-1.5">
                                            <div className={`${log.user_message === "[VOICE CALL SESSION START]"
                                                ? "bg-white/5 border border-white/10 text-gray-300 whitespace-pre-wrap italic text-xs"
                                                : "bg-white/10 text-gray-200"
                                                } rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[80%] leading-snug border border-white/5 shadow-sm`}>
                                                {log.bot_reply}
                                            </div>
                                            {/* Confidence + Gap Tags */}
                                            <div className="flex flex-wrap gap-1.5 pl-2">
                                                {log.confidence_score && (
                                                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${log.confidence_score.toLowerCase() === "high" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : log.confidence_score.toLowerCase() === "medium" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"}`}>
                                                        <CheckCircle size={8} className="inline mr-0.5" /> {log.confidence_score} Confidence
                                                    </span>
                                                )}
                                                {log.gap_topic && (
                                                    <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                        ⚠ Gap: {log.gap_topic}
                                                    </span>
                                                )}
                                                {log.lead_score >= 60 && (
                                                    <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                        🎯 Lead Score: {log.lead_score}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Session Summary Footer */}
                            <div className="p-4 border-t border-white/10 bg-white/[0.02] shrink-0 flex items-center gap-6">
                                <div>
                                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">High Conf</p>
                                    <p className="text-sm font-black text-emerald-400">{activeLogs.filter(l => l.confidence_score?.toLowerCase() === "high").length}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Gaps</p>
                                    <p className="text-sm font-black text-yellow-400">{activeLogs.filter(l => l.gap_topic).length}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Lead Score</p>
                                    <p className="text-sm font-black text-rose-400">{Math.max(...activeLogs.map(l => l.lead_score || 0), 0)}</p>
                                </div>
                                <div className="ml-auto">
                                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Session Started</p>
                                    <p className="text-[10px] text-gray-400">{activeLogs[0]?.created_at ? new Date(activeLogs[0].created_at).toLocaleString() : "—"}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
