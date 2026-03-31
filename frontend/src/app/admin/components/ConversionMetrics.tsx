import { useState, useEffect } from "react";
import { API_BASE, authFetch } from "../../../lib/api";
import { TrendingUp, MessageSquare, Target, Zap, AlertTriangle, Clock, HelpCircle, PlayCircle, X } from "lucide-react";
import { TopProgressBar, SkeletonCard } from "./PageLoader";
import { useAuth } from "../context/AuthContext";

export default function ConversionMetrics() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replaySessionId, setReplaySessionId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const botIdsParam = user.role === "super_admin" ? "" : `?bot_ids=${user.botIds?.join(",") || "NONE"}`;
        
        Promise.all([
            authFetch(`${API_BASE}/api/admin/logs${botIdsParam}`).then(r => r.json()),
            authFetch(`${API_BASE}/api/admin/leads${botIdsParam}`).then(r => r.json()),
        ]).then(([logsData, leadsData]) => {
            setLogs(Array.isArray(logsData) ? logsData : []);
            setLeads(Array.isArray(leadsData) ? leadsData : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [user]);

    const totalSessions = new Set(logs.map(l => l.session_id)).size;
    const totalMessages = logs.length;
    const avgMsgPerSession = totalSessions > 0 ? (totalMessages / totalSessions).toFixed(1) : "0";

    const highConf = logs.filter(l => l.confidence_score?.toLowerCase() === "high").length;
    const medConf = logs.filter(l => l.confidence_score?.toLowerCase() === "medium").length;
    const lowConf = logs.filter(l => l.confidence_score?.toLowerCase() === "low").length;
    const highConfPct = totalMessages > 0 ? Math.round((highConf / totalMessages) * 100) : 0;

    const gapsDetected = logs.filter(l => l.gap_topic).length;
    const uniqueGaps = [...new Set(logs.filter(l => l.gap_topic).map(l => l.gap_topic))];

    const hotLeads = leads.filter(l => l.score > 80).length;
    const warmLeads = leads.filter(l => l.score >= 50 && l.score <= 80).length;
    const coldLeads = leads.filter(l => l.score < 50).length;
    const conversionRate = totalSessions > 0 ? Math.round((leads.length / totalSessions) * 100) : 0;

    const intentBreakdown = leads.reduce((acc: Record<string, number>, l: any) => {
        const t = l.type || "unknown";
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});

    const popularQuestions = Object.entries(logs.reduce((acc: Record<string, number>, log: any) => {
        const msg = (log.user_message || "").trim();
        if (msg.length > 5 && !msg.toLowerCase().match(/^(hi|hello|hey|test)$/i)) {
            acc[msg] = (acc[msg] || 0) + 1;
        }
        return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const peakTimesBlock = logs.reduce((acc: Record<string, number>, log: any) => {
        if (!log.created_at) return acc;
        const d = new Date(log.created_at);
        const h = d.getHours();
        const h12 = h % 12 || 12;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const label = `${h12}:00 ${ampm} - ${h12 === 12 ? 1 : h12 + 1}:00 ${h === 11 ? 'PM' : h === 23 ? 'AM' : ampm}`;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
    }, {});
    const topPeakTimes = Object.entries(peakTimesBlock).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const intentColors: Record<string, string> = {
        reservation: "bg-blue-500",
        product_inquiry: "bg-purple-500",
        complaint: "bg-rose-500",
        lead_opportunity: "bg-emerald-500",
        general_question: "bg-gray-500",
        none: "bg-gray-700",
    };

    if (loading) return (
        <>
            <TopProgressBar />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
        </>
    );

    return (
        <div className="space-y-8">
            {/* Top KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "AI Sessions", value: totalSessions, sub: `${totalMessages} total interactions`, color: "text-white", border: "border-white/10", icon: <MessageSquare size={14} className="text-gray-400" /> },
                    { label: "Lead Velocity", value: `${conversionRate}%`, sub: `${leads.length} qualified leads`, color: "text-emerald-400", border: "border-emerald-500/20", icon: <Target size={14} className="text-emerald-400" /> },
                    { label: "AI Accuracy", value: `${highConfPct}%`, sub: "Proven high-confidence answers", color: "text-blue-400", border: "border-blue-500/20", icon: <Zap size={14} className="text-blue-400" /> },
                    { label: "Gaps Found", value: gapsDetected, sub: "Opportunities to optimize", color: "text-amber-400", border: "border-amber-500/20", icon: <AlertTriangle size={14} className="text-amber-400" /> },
                ].map((s, i) => (
                    <div key={i} className={`bg-white/5 border ${s.border} rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group hover:bg-white/[0.07] transition-all`}>
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:scale-110 transition-transform">{s.icon}</div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">{s.label}</p>
                        <p className={`text-4xl font-black ${s.color} tracking-tighter`}>{s.value}</p>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Stands Out: Business ROI & Impact */}
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-indigo-500/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(79,70,229,0.1)] relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1">
                        <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                            <TrendingUp className="text-indigo-400" /> 
                            Business Impact & ROI
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                            Redber AI is actively converting your traffic into revenue. Based on current lead scores and automated handling, here is your estimated business value.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 min-w-[220px]">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Projected Revenue</p>
                            <p className="text-3xl font-black text-white tracking-tighter">
                                ₹{(leads.reduce((sum, l) => sum + (l.score || 0), 0) * 150).toLocaleString()} 
                                <span className="text-indigo-400 text-sm ml-1">+</span>
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1 italic">Est. value from {leads.length} leads</p>
                        </div>
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 min-w-[220px]">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Operational Savings</p>
                            <p className="text-3xl font-black text-white tracking-tighter">
                                {(totalMessages / 12).toFixed(1)}h 
                                <span className="text-emerald-400 text-sm ml-1">+</span>
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1 italic">Human effort saved 24/7</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lead Funnel + Intent Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lead Funnel */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-5 flex items-center gap-2"><Target size={18} className="text-rose-400" /> Lead Funnel</h3>
                    <div className="space-y-4">
                        {[
                            { label: "🔥 Hot (score >80)", count: hotLeads, total: leads.length || 1, color: "bg-rose-500" },
                            { label: "🟡 Warm (score 50-80)", count: warmLeads, total: leads.length || 1, color: "bg-amber-500" },
                            { label: "⚪ Cold (score <50)", count: coldLeads, total: leads.length || 1, color: "bg-gray-600" },
                        ].map(f => (
                            <div key={f.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-300">{f.label}</span>
                                    <span className="text-white font-bold">{f.count}</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${f.color} rounded-full transition-all`} style={{ width: `${Math.round((f.count / f.total) * 100)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Intent Breakdown */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-5 flex items-center gap-2"><Zap size={18} className="text-purple-400" /> Intent Distribution</h3>
                    {Object.keys(intentBreakdown).length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No intent data yet — conversations will populate this.</p>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(intentBreakdown).map(([intent, count]) => (
                                <div key={intent} className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${intentColors[intent] || "bg-gray-500"}`} />
                                    <span className="text-gray-300 text-sm capitalize flex-1">{intent.replace(/_/g, " ")}</span>
                                    <span className="text-white font-bold text-sm">{count as number}</span>
                                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${intentColors[intent] || "bg-gray-500"} rounded-full`} style={{ width: `${Math.round(((count as number) / leads.length) * 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Quality + Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Confidence Breakdown */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-5 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-400" /> AI Answer Quality</h3>
                    <div className="space-y-3">
                        {[
                            { label: "High Confidence", count: highConf, color: "bg-emerald-500", text: "text-emerald-400" },
                            { label: "Medium Confidence", count: medConf, color: "bg-blue-500", text: "text-blue-400" },
                            { label: "Low Confidence", count: lowConf, color: "bg-orange-500", text: "text-orange-400" },
                        ].map(c => (
                            <div key={c.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className={c.text + " font-semibold"}>{c.label}</span>
                                    <span className="text-white font-bold">{c.count} <span className="text-gray-500 font-normal text-xs">/ {totalMessages}</span></span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${c.color} rounded-full`} style={{ width: `${totalMessages > 0 ? Math.round((c.count / totalMessages) * 100) : 0}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Knowledge Gaps */}
                <div className="bg-white/5 border border-yellow-500/20 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-5 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-yellow-400" /> 
                        Knowledge Gaps 
                        <span className="text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 text-xs font-black px-2 py-0.5 rounded-full ml-1">{gapsDetected}</span>
                    </h3>
                    {uniqueGaps.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No gaps detected yet. The AI is performing well!</p>
                    ) : (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {uniqueGaps.map((gap, i) => (
                                <div key={i} className="flex items-center justify-between gap-3 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl px-4 py-3 group hover:bg-yellow-500/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)] shrink-0" />
                                        <span className="text-sm font-semibold text-yellow-100/90 tracking-tight">{gap}</span>
                                    </div>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-yellow-400">
                                        Train Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Insights & Timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-5 flex items-center gap-2"><HelpCircle size={18} className="text-blue-400" /> Most Asked Questions</h3>
                    {popularQuestions.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">Not enough data to determine popular questions.</p>
                    ) : (
                        <div className="space-y-4">
                            {popularQuestions.map(([question, count], idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">{idx + 1}</div>
                                    <p className="text-sm text-gray-300 flex-1 truncate" title={question}>{question}</p>
                                    <div className="text-xs font-bold bg-white/5 px-2 py-1 rounded text-gray-400">{count}x</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="font-bold text-white mb-5 flex items-center gap-2"><Clock size={18} className="text-orange-400" /> Peak Chat Times</h3>
                    {topPeakTimes.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No chat times recorded recorded.</p>
                    ) : (
                        <div className="space-y-4">
                            {topPeakTimes.map(([timeLabel, count], idx) => (
                                <div key={idx} className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-3 flex justify-between items-center group hover:bg-orange-500/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg"><Clock size={14} /></div>
                                        <span className="text-orange-100 font-bold text-sm tracking-wide">{timeLabel}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xl font-black text-orange-400">{count}</span>
                                        <span className="text-[10px] uppercase font-bold text-orange-500/50">Messages</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Message Timeline & Replay */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2"><MessageSquare size={18} className="text-purple-400" /> Recent Activity</h3>
                    <div className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full flex items-center gap-1">
                        <PlayCircle size={12} /> Conversation Replay
                    </div>
                </div>
                {logs.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No conversations yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                                    <th className="pb-3 pr-4">Session</th>
                                    <th className="pb-3 pr-4">Bot</th>
                                    <th className="pb-3 pr-4">Message</th>
                                    <th className="pb-3 pr-4">Confidence</th>
                                    <th className="pb-3">Lead Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs.slice(0, 10).map((log: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/3 transition-colors">
                                        <td className="py-3 pr-4 font-mono text-gray-500 text-xs">{log.session_id?.slice(-8)}</td>
                                        <td className="py-3 pr-4 text-purple-400 font-semibold">{log.bot_id}</td>
                                        <td className="py-3 pr-4 text-gray-300 max-w-xs truncate">{log.user_message}</td>
                                        <td className="py-3 pr-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${log.confidence_score?.toLowerCase() === "high" ? "bg-emerald-500/15 text-emerald-400" : log.confidence_score?.toLowerCase() === "medium" ? "bg-blue-500/15 text-blue-400" : "bg-orange-500/15 text-orange-400"}`}>
                                                {log.confidence_score || "—"}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            {log.lead_score >= 60 ? (
                                                <span className="text-rose-400 font-bold">{log.lead_score}</span>
                                            ) : (
                                                <span className="text-gray-600">{log.lead_score || 0}</span>
                                            )}
                                        </td>
                                        <td className="py-3 pl-4 text-right">
                                            <button 
                                                onClick={() => setReplaySessionId(log.session_id)}
                                                className="text-xs font-bold bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center ml-auto gap-1"
                                            >
                                                <PlayCircle size={12} /> Replay
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Conversation Replay Modal */}
            {replaySessionId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-purple-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <PlayCircle size={18} className="text-purple-400" />
                                    Conversation Replay
                                </h3>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">Session: {replaySessionId}</p>
                            </div>
                            <button onClick={() => setReplaySessionId(null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Chat Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6 flex flex-col-reverse">
                            {/* We reverse it so it shows chronological if server is desc, or we just sort chronologically */}
                            {[...logs].filter(l => l.session_id === replaySessionId).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((log, idx) => (
                                <div key={idx} className="space-y-4">
                                    {/* User Line */}
                                    <div className="flex flex-col items-end">
                                        <div className="bg-purple-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-md">
                                            {log.user_message}
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1 font-mono">{new Date(log.created_at).toLocaleTimeString()}</p>
                                    </div>
                                    {/* Bot Line */}
                                    <div className="flex flex-col items-start">
                                        <div className="bg-white/10 text-gray-200 border border-white/5 px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[80%] text-sm shadow-sm whitespace-pre-wrap">
                                            {log.bot_reply}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] text-gray-500 font-mono">{new Date(log.created_at).toLocaleTimeString()}</p>
                                            {log.confidence_score && (
                                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                                                    log.confidence_score.toLowerCase() === "high" ? "bg-emerald-500/20 text-emerald-400" :
                                                    log.confidence_score.toLowerCase() === "medium" ? "bg-blue-500/20 text-blue-400" :
                                                    "bg-orange-500/20 text-orange-400"
                                                }`}>{log.confidence_score}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
