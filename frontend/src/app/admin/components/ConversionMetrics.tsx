"use client";
import { useState, useEffect } from "react";
import { API_BASE } from "../../../lib/api";
import { TrendingUp, MessageSquare, Target, Zap, AlertTriangle } from "lucide-react";

export default function ConversionMetrics() {
    const [logs, setLogs] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/api/admin/logs`).then(r => r.json()),
            fetch(`${API_BASE}/api/admin/leads`).then(r => r.json()),
        ]).then(([logsData, leadsData]) => {
            setLogs(Array.isArray(logsData) ? logsData : []);
            setLeads(Array.isArray(leadsData) ? leadsData : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

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

    const intentColors: Record<string, string> = {
        reservation: "bg-blue-500",
        product_inquiry: "bg-purple-500",
        complaint: "bg-rose-500",
        lead_opportunity: "bg-emerald-500",
        general_question: "bg-gray-500",
        none: "bg-gray-700",
    };

    if (loading) return <div className="text-gray-500 text-center py-20">Loading metrics...</div>;

    return (
        <div className="space-y-8">
            {/* Top KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Sessions", value: totalSessions, sub: `${totalMessages} messages`, color: "text-white", border: "border-white/10" },
                    { label: "Avg Msgs / Session", value: avgMsgPerSession, sub: "Engagement depth", color: "text-purple-400", border: "border-purple-500/20" },
                    { label: "Lead Conversion Rate", value: `${conversionRate}%`, sub: `${leads.length} leads from ${totalSessions} sessions`, color: "text-emerald-400", border: "border-emerald-500/20" },
                    { label: "AI High Confidence", value: `${highConfPct}%`, sub: `${highConf}/${totalMessages} answers`, color: "text-blue-400", border: "border-blue-500/20" },
                ].map((s, i) => (
                    <div key={i} className={`bg-white/5 border ${s.border} rounded-2xl p-5`}>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{s.label}</p>
                        <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[11px] text-gray-500 mt-1">{s.sub}</p>
                    </div>
                ))}
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
                    <h3 className="font-bold text-white mb-5 flex items-center gap-2"><AlertTriangle size={18} className="text-yellow-400" /> Knowledge Gaps <span className="text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 text-xs font-black px-2 py-0.5 rounded-full ml-1">{gapsDetected}</span></h3>
                    {uniqueGaps.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No gaps detected yet. The AI is performing well!</p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {uniqueGaps.map((gap, i) => (
                                <div key={i} className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl px-3 py-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                                    <span className="text-sm text-yellow-100/80">{gap}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Message Timeline */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-purple-400" /> Recent Activity</h3>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
