import { useState, useEffect } from "react";
import { X, ArrowUpDown, ArrowDown, ArrowUp, RefreshCw } from "lucide-react";
import { API_BASE } from "../../../lib/api";

type SortKey = "created_at" | "score";
type SortDir = "asc" | "desc";

function timeAgo(dateStr: string): string {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

function isNew(dateStr: string): boolean {
    if (!dateStr) return false;
    return Date.now() - new Date(dateStr).getTime() < 24 * 60 * 60 * 1000; // within 24 hours
}

export default function LeadsView() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [sortKey, setSortKey] = useState<SortKey>("created_at");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const fetchLeads = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/admin/leads`)
            .then(res => res.json())
            .then(data => { setLeads(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchLeads(); }, []);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("desc"); }
    };

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ArrowUpDown size={12} className="text-gray-600" />;
        return sortDir === "desc" ? <ArrowDown size={12} className="text-purple-400" /> : <ArrowUp size={12} className="text-purple-400" />;
    };

    const filtered = leads
        .filter(l => filterStatus === "all" ? true : (l.status || "new") === filterStatus)
        .sort((a, b) => {
            if (sortKey === "created_at") {
                const ta = new Date(a.created_at || 0).getTime();
                const tb = new Date(b.created_at || 0).getTime();
                return sortDir === "desc" ? tb - ta : ta - tb;
            }
            return sortDir === "desc" ? (b.score || 0) - (a.score || 0) : (a.score || 0) - (b.score || 0);
        });

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Leads", value: leads.length, color: "text-blue-400" },
                    { label: "🔥 Hot Leads", value: leads.filter(l => l.score > 80).length, color: "text-rose-400" },
                    { label: "🟡 Warm Leads", value: leads.filter(l => l.score >= 50 && l.score <= 80).length, color: "text-amber-400" },
                    { label: "⚪ Cold Leads", value: leads.filter(l => l.score < 50).length, color: "text-gray-400" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                        <p className={`text-4xl font-extrabold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Controls: filter + sort + refresh */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Filter:</span>
                {["all", "new", "contacted", "closed"].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${filterStatus === s
                            ? s === "all" ? "bg-white/15 text-white border border-white/20"
                                : s === "new" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                    : s === "contacted" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-white/5 text-gray-500 border border-white/5 hover:border-white/20 hover:text-gray-300"
                            }`}
                    >
                        {s}
                    </button>
                ))}
                <span className="text-gray-700 mx-1">|</span>
                <button
                    onClick={() => toggleSort("created_at")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${sortKey === "created_at" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-white/5 text-gray-500 border-white/5 hover:text-gray-300"
                        }`}
                >
                    <SortIcon col="created_at" /> Date
                </button>
                <button
                    onClick={() => toggleSort("score")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${sortKey === "score" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-white/5 text-gray-500 border-white/5 hover:text-gray-300"
                        }`}
                >
                    <SortIcon col="score" /> Score
                </button>
                <button onClick={fetchLeads} className="ml-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors text-xs font-semibold">
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-xs text-gray-400 uppercase tracking-wider border-b border-white/10">
                            <th className="p-4 font-medium">User</th>
                            <th className="p-4 font-medium">Type</th>
                            <th className="p-4 font-medium">Score</th>
                            <th className="p-4 font-medium">Summary</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                                <span className="flex items-center gap-1">Date <SortIcon col="created_at" /></span>
                            </th>
                            <th className="p-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading leads...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">No leads match this filter.</td></tr>
                        ) : (
                            filtered.map((lead) => {
                                const nameMatch = lead.summary?.match(/Name:\s*([^\n]+)/i);
                                const phoneMatch = lead.summary?.match(/Phone:\s*([^\n]+)/i);
                                const displayName = lead.name?.trim() || nameMatch?.[1]?.trim() || phoneMatch?.[1]?.trim() || `Session ${lead.session_id?.slice(-6) || '—'}`;
                                const fresh = isNew(lead.created_at);

                                return (
                                    <tr key={lead.id} className={`hover:bg-white/5 transition-colors group ${fresh && !lead.status || lead.status === 'new' ? 'border-l-2 border-l-purple-500/60' : ''}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">{displayName.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <span className="font-medium text-white text-sm block">{displayName}</span>
                                                    {lead.phone && <span className="text-[10px] text-gray-500">{lead.phone}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-gray-300 capitalize">{(lead.type || 'unknown').replace(/_/g, ' ')}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${lead.score > 80 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                                                : lead.score > 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                                }`}>{lead.score}/100</span>
                                        </td>
                                        <td className="p-4 text-gray-400 group-hover:text-gray-300 transition-colors max-w-xs truncate">{lead.summary?.split('\n').find((l: string) => !l.startsWith('Name:') && !l.startsWith('Phone:') && !l.startsWith('Email:') && l.trim()) || '—'}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${lead.status === 'closed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : lead.status === 'contacted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                                }`}>
                                                {lead.status || 'New'}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs text-gray-300 font-medium">{timeAgo(lead.created_at)}</span>
                                                {fresh && <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/25 px-1.5 py-0.5 rounded-full font-bold w-fit">NEW</span>}
                                            </div>
                                        </td>
                                        <td className="p-4"><button onClick={() => setSelectedLead(lead)} className="text-purple-400 hover:text-purple-300 font-medium text-sm">View</button></td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold">Lead Details</h2>
                            <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {(() => {
                                const nameMatch = selectedLead.summary?.match(/Name:\s*([^\n]+)/i);
                                const phoneMatch = selectedLead.summary?.match(/Phone:\s*([^\n]+)/i);
                                const emailMatch = selectedLead.summary?.match(/Email:\s*([^\n]+)/i);
                                const dateMatch = selectedLead.summary?.match(/Date:\s*([^\n]+)/i);
                                const timeMatch = selectedLead.summary?.match(/Time:\s*([^\n]+)/i);
                                const sizeMatch = selectedLead.summary?.match(/Party Size:\s*([^\n]+)/i);

                                const displayName = selectedLead.name && selectedLead.name !== "Unknown" ? selectedLead.name : (nameMatch ? nameMatch[1].trim() : "Unknown User");
                                const displayPhone = selectedLead.phone || phoneMatch?.[1]?.trim();
                                const displayEmail = selectedLead.email || emailMatch?.[1]?.trim();

                                return (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-300 text-lg font-bold flex items-center justify-center border border-purple-500/20">{displayName.charAt(0).toUpperCase()}</div>
                                            <div className="flex-1">
                                                <p className="font-bold text-lg">{displayName}</p>
                                                <p className="text-gray-400 text-sm capitalize">{selectedLead.type.replace('_', ' ')} · via {selectedLead.bot_id}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedLead.score > 80 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>{selectedLead.score}/100</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: "Phone", val: displayPhone },
                                                { label: "Email", val: displayEmail },
                                                { label: "Date", val: dateMatch?.[1]?.trim() },
                                                { label: "Time", val: timeMatch?.[1]?.trim() },
                                                { label: "Party Size", val: sizeMatch?.[1]?.trim() }
                                            ].filter(f => f.val).map((f) => (
                                                <div key={f.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                                    <p className="text-gray-500 text-xs mb-0.5">{f.label}</p>
                                                    <p className="text-white font-semibold text-sm">{f.val}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm mb-2 mt-4">Full AI Summary</p>
                                            <div className="bg-white/5 p-4 rounded-xl text-gray-200 text-sm leading-relaxed border border-white/5 whitespace-pre-wrap">{selectedLead.summary}</div>

                                            {/* Status Update (Mock implementation for UI, real logic requires a PUT endpoint) */}
                                            <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
                                                <button onClick={() => { selectedLead.status = 'contacted'; setSelectedLead({ ...selectedLead }) }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedLead.status === 'contacted' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>Mark Contacted</button>
                                                <button onClick={() => { selectedLead.status = 'closed'; setSelectedLead({ ...selectedLead }) }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedLead.status === 'closed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>Mark Closed</button>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
