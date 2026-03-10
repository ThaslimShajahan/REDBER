import { useState, useEffect } from "react";
import { API_BASE } from "../../../lib/api";

export default function LogsView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/admin/logs`)
            .then(res => res.json())
            .then(data => { setLogs(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const sessions = logs.reduce((acc: Record<string, any[]>, log: any) => {
        if (!acc[log.session_id]) acc[log.session_id] = [];
        acc[log.session_id].push(log);
        return acc;
    }, {});

    const sessionIds = Object.keys(sessions);
    const activeLogs = selectedSession ? sessions[selectedSession] : [];

    const totalLogsCount = logs.length;
    const avgConfidence = logs.filter(l => l.confidence_score && l.confidence_score.toLowerCase() === 'high').length;
    const highConfRatio = totalLogsCount > 0 ? Math.round((avgConfidence / totalLogsCount) * 100) : 0;
    const gapsDetected = logs.filter(l => l.gap_topic).length;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">Total Messages</p>
                    <p className="text-2xl font-black text-white">{totalLogsCount}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-wider">High Confidence</p>
                    <p className="text-2xl font-black text-emerald-400">{highConfRatio}%</p>
                </div>
                <div className="bg-white/5 border border-yellow-500/20 rounded-2xl p-4 text-center">
                    <p className="text-xs text-yellow-400 font-bold mb-1 uppercase tracking-wider">Gaps Found</p>
                    <p className="text-2xl font-black text-yellow-400">{gapsDetected}</p>
                </div>
                <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-4 text-center">
                    <p className="text-xs text-purple-400 font-bold mb-1 uppercase tracking-wider">Avg Session</p>
                    <p className="text-2xl font-black text-purple-400">{sessionIds.length > 0 ? Math.round(totalLogsCount / sessionIds.length) : 0} msgs</p>
                </div>
            </div>

            <div className="flex gap-6 h-[calc(100vh-280px)]">
                <div className="w-72 shrink-0 bg-white/5 border border-white/10 rounded-2xl overflow-y-auto">
                    <div className="p-4 border-b border-white/10">
                        <p className="text-sm font-bold text-gray-300">Sessions ({sessionIds.length})</p>
                    </div>
                    {loading ? (
                        <p className="text-gray-500 text-sm text-center p-8">Loading...</p>
                    ) : sessionIds.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center p-8">No logs yet.</p>
                    ) : sessionIds.map(sid => {
                        const sidLogs = sessions[sid];
                        const first = sidLogs[sidLogs.length - 1];
                        return (
                            <button
                                key={sid}
                                onClick={() => setSelectedSession(sid)}
                                className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${selectedSession === sid ? 'bg-white/10 border-l-2 border-l-purple-500' : ''}`}
                            >
                                <p className="text-xs font-mono text-gray-500 mb-1">{sid.slice(0, 16)}...</p>
                                <p className="text-sm text-gray-300 font-medium truncate">{first?.user_message}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-purple-400">{first?.bot_id}</span>
                                    <span className="text-xs text-gray-600">{sidLogs.length} msgs</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
                    {!selectedSession ? (
                        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Select a session to view chat</div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-white/10 shrink-0">
                                <p className="text-xs font-mono text-gray-500">Session: {selectedSession}</p>
                                <p className="text-sm font-bold">{activeLogs[0]?.bot_id} · {activeLogs.length} exchanges</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {[...activeLogs].reverse().map((log: any, i: number) => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-end">
                                            <div className="bg-[#007AFF] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%] leading-snug">{log.user_message}</div>
                                        </div>
                                        <div className="flex justify-start flex-col items-start gap-1">
                                            <div className="bg-white/10 text-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[80%] leading-snug">{log.bot_reply}</div>
                                            {(log.confidence_score || log.gap_topic) && (
                                                <div className="flex gap-2 pl-2">
                                                    {log.confidence_score && (
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${log.confidence_score.toLowerCase() === 'high' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : log.confidence_score.toLowerCase() === 'medium' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                                            Conf: {log.confidence_score}
                                                        </span>
                                                    )}
                                                    {log.gap_topic && (
                                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                            Gap: {log.gap_topic}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {log.lead_score >= 60 && (
                                            <div className="flex justify-center">
                                                <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-full px-3 py-0.5">🎯 Lead Evaluated · Score: {log.lead_score} · intent: {log.lead_type || "None"}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
