"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Trash2, Link as LinkIcon, Upload, Eye, X, RefreshCw,
    FileText, Send, AlertCircle, HelpCircle, Package, Database,
    CheckCircle, XCircle, Loader2, Globe, ChevronDown
} from "lucide-react";
import { API_BASE, authFetch } from "../../../lib/api";
import { useAuth } from "../context/AuthContext";

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
    return (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-sm shadow-2xl border backdrop-blur-xl transition-all
            ${type === "success" ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-300" : "bg-rose-950/90 border-rose-500/40 text-rose-300"}`}>
            {type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {msg}
        </div>
    );
}

// ─── Crawl Progress ────────────────────────────────────────────────────────────
function CrawlProgress({ crawl, onDismiss }: { crawl: any; onDismiss: () => void }) {
    const pct = crawl.pages_found > 0 ? Math.round((crawl.pages_done / crawl.pages_found) * 100) : 0;
    const statusText =
        crawl.status === "pending" ? "Starting crawl…" :
        crawl.status === "discovering" ? "Discovering pages…" :
        `Indexing pages (${crawl.pages_done}/${crawl.pages_found || "?"})`;

    return (
        <div className="bg-blue-950/60 border border-blue-500/30 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <Loader2 size={14} className="animate-spin text-blue-400 shrink-0" />
                    <span className="text-sm font-semibold text-blue-200">{statusText}</span>
                    <span className="text-xs text-blue-400/70 font-mono">{crawl.chunks_inserted || 0} chunks indexed</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-400">{pct}%</span>
                    {crawl.status === "done" && (
                        <button onClick={onDismiss} className="text-gray-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
            <div className="h-1 bg-black/40">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                    style={{ width: `${crawl.status === "discovering" ? 8 : pct}%` }}
                />
            </div>
            {/* Page list */}
            {crawl.page_statuses && Object.keys(crawl.page_statuses).length > 0 && (
                <div className="max-h-40 overflow-y-auto divide-y divide-white/5">
                    {Object.entries(crawl.page_statuses as Record<string, string>).map(([url, st]) => {
                        const done = st.startsWith("done");
                        const crawling = st === "crawling";
                        const failed = st.startsWith("failed");
                        const skipped = st.startsWith("skipped");
                        const chunks = done ? st.split(":")[1] : null;
                        const path = url.replace(/^https?:\/\/[^/]+/, "") || "/";
                        return (
                            <div key={url} className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-mono ${crawling ? "bg-yellow-500/10" : ""}`}>
                                <span className={`shrink-0 w-3 font-bold ${crawling ? "text-yellow-400 animate-pulse" : done ? "text-emerald-500" : failed ? "text-rose-400" : "text-gray-600"}`}>
                                    {crawling ? "●" : done ? "✓" : failed ? "✗" : "·"}
                                </span>
                                <span className={`flex-1 truncate ${crawling ? "text-yellow-200" : done ? "text-emerald-400/80" : failed ? "text-rose-400/70" : skipped ? "text-gray-600" : "text-gray-500"}`}>{path}</span>
                                {done && chunks && <span className="shrink-0 text-emerald-600">{chunks}c</span>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Main ───────────────────────────────────────────────────────────────────────
type Tab = "website" | "pdf" | "text" | "faq" | "csv";

export default function KnowledgeBaseView() {
    const { user } = useAuth();
    const [sources, setSources] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [bots, setBots] = useState<any[]>([]);
    const [botId, setBotId] = useState("");
    const [filterBot, setFilterBot] = useState("all");
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("website");
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [viewing, setViewing] = useState<{ group: string; chunks: any[] } | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [activeCrawl, setActiveCrawl] = useState<any | null>(null);

    // Input states
    const [urlInput, setUrlInput] = useState("");
    const [urlMode, setUrlMode] = useState<"website" | "page">("website");
    const [busy, setBusy] = useState(false);
    const [textTitle, setTextTitle] = useState("");
    const [textBody, setTextBody] = useState("");
    const [faqQ, setFaqQ] = useState("");
    const [faqA, setFaqA] = useState("");

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchSources = useCallback(() => {
        if (!user) return;
        setLoading(true);
        const q = user.role === "super_admin" ? "" : `?bot_ids=${user.botIds?.join(",") || "NONE"}`;
        authFetch(`${API_BASE}/api/admin/kb/sources${q}`)
            .then(r => r.json()).then(d => { setSources(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => setLoading(false));
        authFetch(`${API_BASE}/api/admin/kb/stats${q}`)
            .then(r => r.json()).then(setStats).catch(() => {});
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchSources();
        const q = user.role === "super_admin" ? "" : `?bot_ids=${user.botIds?.join(",") || "NONE"}`;
        authFetch(`${API_BASE}/api/admin/bots${q}`)
            .then(r => r.json()).then((d: any[]) => {
                const list = Array.isArray(d) ? d : [];
                setBots(list);
                if (list.length > 0) setBotId(list[0].id);
            });
    }, [user, fetchSources]);

    // Resume active crawl on bot change
    useEffect(() => {
        if (!botId) return;
        authFetch(`${API_BASE}/api/admin/kb/active_crawl/${botId}`)
            .then(r => r.json()).then(d => {
                if (d?.id && d.status !== "none") {
                    if (typeof d.page_statuses === "string") {
                        try { d.page_statuses = JSON.parse(d.page_statuses); } catch { d.page_statuses = {}; }
                    }
                    setActiveCrawl(d);
                }
            }).catch(() => {});
    }, [botId]);

    // Poll crawl status
    useEffect(() => {
        if (!activeCrawl?.id || activeCrawl.status === "done") return;
        const iv = setInterval(async () => {
            try {
                const r = await authFetch(`${API_BASE}/api/admin/kb/crawl_status/${activeCrawl.id}`);
                const d = await r.json();
                if (!d?.id) return;
                if (typeof d.page_statuses === "string") {
                    try { d.page_statuses = JSON.parse(d.page_statuses); } catch { d.page_statuses = {}; }
                }
                setActiveCrawl((p: any) => ({ ...p, ...d }));
                if (d.status === "done") {
                    showToast(`✅ Crawl done — ${d.pages_done} pages · ${d.chunks_inserted || 0} chunks`);
                    setTimeout(fetchSources, 1500);
                    clearInterval(iv);
                }
            } catch { }
        }, 2000);
        return () => clearInterval(iv);
    }, [activeCrawl, fetchSources]);

    const botName = (id: string) => bots.find(b => b.id === id)?.name || id;

    // ── Actions ─────────────────────────────────────────────────────────────────
    const addUrl = async () => {
        if (!urlInput.trim() || !botId) { showToast(!botId ? "Select a bot first" : "Enter a URL", "error"); return; }
        const url = urlInput.trim().match(/^https?:\/\//) ? urlInput.trim() : `https://${urlInput.trim()}`;
        setBusy(true);
        try {
            const endpoint = urlMode === "website" ? "crawl_website" : "ingest_url";
            const r = await authFetch(`${API_BASE}/api/admin/kb/${endpoint}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bot_id: botId, url }),
            });
            const d = await r.json();
            if (!r.ok) { showToast(d.detail || "Failed", "error"); return; }
            if (urlMode === "website" && d.job_id) {
                setActiveCrawl({ id: d.job_id, status: "pending", pages_done: 0, pages_found: 0, chunks_inserted: 0 });
                showToast("🚀 Crawl started — watch progress below");
            } else {
                showToast(`✅ Page indexed — ${d.chunks_inserted} chunks`);
                fetchSources();
            }
            setUrlInput("");
        } catch { showToast("Network error", "error"); }
        finally { setBusy(false); }
    };

    const addText = async () => {
        if (!textTitle.trim() || !textBody.trim()) { showToast("Enter title and content", "error"); return; }
        if (!botId) { showToast("Select a bot first", "error"); return; }
        setBusy(true);
        try {
            const r = await authFetch(`${API_BASE}/api/admin/kb/ingest_text`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bot_id: botId, source_name: textTitle, text_content: textBody }),
            });
            const d = await r.json();
            if (r.ok) { showToast(`✅ ${d.chunks_inserted} chunks saved`); setTextTitle(""); setTextBody(""); fetchSources(); }
            else showToast(d.detail || "Failed", "error");
        } catch { showToast("Network error", "error"); }
        finally { setBusy(false); }
    };

    const addFaq = async () => {
        if (!faqQ.trim() || !faqA.trim()) { showToast("Enter question and answer", "error"); return; }
        if (!botId) { showToast("Select a bot first", "error"); return; }
        setBusy(true);
        try {
            const r = await authFetch(`${API_BASE}/api/admin/kb/ingest_text`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bot_id: botId, source_name: `FAQ: ${faqQ}`, text_content: `FAQ Question: ${faqQ}\nFAQ Answer: ${faqA}` }),
            });
            const d = await r.json();
            if (r.ok) { showToast("✅ FAQ saved"); setFaqQ(""); setFaqA(""); fetchSources(); }
            else showToast(d.detail || "Failed", "error");
        } catch { showToast("Network error", "error"); }
        finally { setBusy(false); }
    };

    const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: "pdf" | "csv") => {
        const file = e.target.files?.[0];
        if (!file || !botId) { showToast("Select a bot first", "error"); return; }
        e.target.value = "";
        setBusy(true);
        if (type === "pdf") {
            const fd = new FormData(); fd.append("bot_id", botId); fd.append("file", file);
            try {
                const r = await authFetch(`${API_BASE}/api/admin/kb/upload_pdf`, { method: "POST", body: fd });
                const d = await r.json();
                if (r.ok) { showToast(`✅ ${d.chunks_inserted} chunks from "${file.name}"`); fetchSources(); }
                else showToast(d.detail || "Upload failed", "error");
            } catch { showToast("Network error", "error"); }
        } else {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const text = ev.target?.result as string;
                const lines = text.split(/\r?\n/).filter(l => l.trim());
                const formatted = "CSV Upload Data:\n" + lines.map((l, i) => `Row ${i}: ${l.split(",").map(c => c.trim().replace(/^"|"$/g, "")).join(" | ")}`).join("\n");
                try {
                    const r = await authFetch(`${API_BASE}/api/admin/kb/ingest_text`, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ bot_id: botId, source_name: `CSV: ${file.name}`, text_content: formatted }),
                    });
                    const d = await r.json();
                    if (r.ok) { showToast(`✅ ${d.chunks_inserted} chunks from "${file.name}"`); fetchSources(); }
                    else showToast(d.detail || "Failed", "error");
                } catch { showToast("Network error", "error"); }
                setBusy(false);
            };
            reader.readAsText(file);
            return;
        }
        setBusy(false);
    };

    const deleteSource = async (group: string) => {
        if (!confirm(`Delete all knowledge for:\n"${group}"\n\nThis cannot be undone.`)) return;
        setDeleting(group);
        setSources(p => p.filter(s => s.source_group !== group));
        try {
            await authFetch(`${API_BASE}/api/admin/kb/source?source_group=${encodeURIComponent(group)}`, { method: "DELETE" });
            showToast("✅ Source deleted");
        } catch { showToast("Delete failed", "error"); fetchSources(); }
        finally { setDeleting(null); }
    };

    const viewChunks = async (group: string) => {
        setViewing({ group, chunks: [] });
        const r = await authFetch(`${API_BASE}/api/admin/kb/source/chunks?source_group=${encodeURIComponent(group)}`);
        const d = await r.json();
        setViewing({ group, chunks: Array.isArray(d) ? d : [] });
    };

    const filtered = filterBot === "all" ? sources : sources.filter(s => s.bot_id === filterBot);
    const gaps = sources.filter(s => s.source_type === "learning_gap");

    const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: "website", label: "Website", icon: <Globe size={14} /> },
        { id: "pdf",     label: "PDF",     icon: <FileText size={14} /> },
        { id: "text",    label: "Text",    icon: <FileText size={14} /> },
        { id: "faq",     label: "FAQ",     icon: <HelpCircle size={14} /> },
        { id: "csv",     label: "CSV",     icon: <Package size={14} /> },
    ];

    return (
        <div className="space-y-6 max-w-5xl">
            {toast && <Toast {...toast} />}

            {/* ── Top bar: Bot selector + Stats ── */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bot</span>
                    <div className="relative">
                        <select
                            value={botId}
                            onChange={e => setBotId(e.target.value)}
                            className="appearance-none bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-xl pl-3 pr-8 py-2 outline-none focus:border-purple-500 cursor-pointer"
                        >
                            {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="flex items-center gap-3 ml-auto flex-wrap">
                    {[
                        { label: "Total", value: stats?.total ?? 0, color: "text-white" },
                        { label: "Web", value: stats?.website ?? 0, color: "text-blue-400" },
                        { label: "PDF", value: stats?.pdf ?? 0, color: "text-rose-400" },
                        { label: "Manual", value: stats?.manual ?? 0, color: "text-emerald-400" },
                        { label: "Gaps", value: stats?.learning_gap ?? 0, color: "text-amber-400" },
                    ].map(s => (
                        <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center min-w-[60px]">
                            <p className={`text-lg font-black leading-none ${s.color}`}>{s.value}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">{s.label}</p>
                        </div>
                    ))}
                    <button onClick={fetchSources} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors" title="Refresh">
                        <RefreshCw size={14} className="text-gray-400" />
                    </button>
                </div>
            </div>

            {/* ── Add Knowledge ── */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                {/* Tab bar */}
                <div className="flex border-b border-white/10 bg-black/20">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all ${tab === t.id ? "text-white border-b-2 border-purple-500 bg-white/5" : "text-gray-500 hover:text-gray-300"}`}
                        >
                            {t.icon}{t.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="p-5">

                    {tab === "website" && (
                        <div className="space-y-3">
                            <div className="flex gap-1 bg-black/30 p-1 rounded-lg w-fit">
                                {(["website", "page"] as const).map(m => (
                                    <button key={m} onClick={() => setUrlMode(m)}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${urlMode === m ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
                                        {m === "website" ? "Deep Crawl" : "Single Page"}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">
                                {urlMode === "website" ? "Crawls your entire website and indexes all pages automatically." : "Indexes only this specific URL."}
                            </p>
                            <div className="flex gap-2">
                                <input
                                    value={urlInput} onChange={e => setUrlInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && !busy && addUrl()}
                                    placeholder="https://yoursite.com"
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 font-mono"
                                />
                                <button onClick={addUrl} disabled={busy || !botId}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2 transition-colors">
                                    {busy ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                                    {urlMode === "website" ? "Crawl" : "Index"}
                                </button>
                            </div>
                            {activeCrawl && (
                                <CrawlProgress crawl={activeCrawl} onDismiss={() => setActiveCrawl(null)} />
                            )}
                        </div>
                    )}

                    {tab === "pdf" && (
                        <div className="flex flex-col items-center justify-center py-6 gap-4">
                            <div className="w-12 h-12 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center">
                                <FileText size={22} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-white mb-1">Upload PDF</p>
                                <p className="text-xs text-gray-500">Menus, brochures, service guides, manuals</p>
                            </div>
                            <label className={`cursor-pointer bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${busy ? "opacity-50 pointer-events-none" : ""}`}>
                                {busy ? "Processing…" : "Select PDF"}
                                <input type="file" accept=".pdf" className="hidden" onChange={e => uploadFile(e, "pdf")} disabled={busy} />
                            </label>
                        </div>
                    )}

                    {tab === "text" && (
                        <div className="space-y-3">
                            <input value={textTitle} onChange={e => setTextTitle(e.target.value)}
                                placeholder="Title (e.g. Opening Hours)"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500" />
                            <textarea value={textBody} onChange={e => setTextBody(e.target.value)}
                                placeholder="Paste any facts, policies, product details, or custom knowledge here…"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 resize-none h-28" />
                            <button onClick={addText} disabled={busy || !botId}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2 transition-colors">
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Save to Knowledge Base
                            </button>
                        </div>
                    )}

                    {tab === "faq" && (
                        <div className="space-y-3">
                            <input value={faqQ} onChange={e => setFaqQ(e.target.value)}
                                placeholder="Question (e.g. Do you offer delivery?)"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500" />
                            <textarea value={faqA} onChange={e => setFaqA(e.target.value)}
                                placeholder="Answer (e.g. Yes, we deliver within 5 km for orders over $30.)"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500 resize-none h-24" />
                            <button onClick={addFaq} disabled={busy || !botId}
                                className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2 transition-colors">
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Add FAQ
                            </button>
                        </div>
                    )}

                    {tab === "csv" && (
                        <div className="flex flex-col items-center justify-center py-6 gap-4">
                            <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center">
                                <Package size={22} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-white mb-1">Product Catalog CSV</p>
                                <p className="text-xs text-gray-500">Upload products, prices, and descriptions in bulk</p>
                            </div>
                            <label className={`cursor-pointer bg-pink-600 hover:bg-pink-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${busy ? "opacity-50 pointer-events-none" : ""}`}>
                                {busy ? "Processing…" : "Select CSV"}
                                <input type="file" accept=".csv" className="hidden" onChange={e => uploadFile(e, "csv")} disabled={busy} />
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Sources Table ── */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Database size={16} className="text-gray-400" />
                        <span className="font-bold text-white">Knowledge Sources</span>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{filtered.length}</span>
                    </div>
                    <select value={filterBot} onChange={e => setFilterBot(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white text-xs font-semibold rounded-lg px-3 py-1.5 outline-none focus:border-purple-500">
                        <option value="all">All Bots</option>
                        {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>

                {loading ? (
                    <div className="p-8 flex items-center justify-center gap-2 text-gray-500">
                        <Loader2 size={16} className="animate-spin" /> Loading…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 text-sm">No knowledge indexed yet. Add a website, PDF, or text above.</div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filtered.map((item, i) => {
                            const typeStyles: Record<string, string> = {
                                pdf: "bg-rose-500/15 text-rose-400",
                                learning_gap: "bg-amber-500/15 text-amber-400",
                                manual: "bg-emerald-500/15 text-emerald-400",
                                faq: "bg-amber-500/15 text-amber-400",
                            };
                            const style = typeStyles[item.source_type] || "bg-blue-500/15 text-blue-400";
                            return (
                                <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03] transition-colors group">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-200 text-sm truncate">{item.page_title || item.source_group}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${style}`}>
                                                {item.source_type === "learning_gap" ? "gap" : item.source_type}
                                            </span>
                                            <span className="text-[11px] text-gray-600">{botName(item.bot_id)}</span>
                                            <span className="text-[11px] text-emerald-700 font-semibold">{item.chunks} chunks</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => viewChunks(item.source_group)}
                                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 transition-colors" title="Preview">
                                            <Eye size={14} />
                                        </button>
                                        <button onClick={() => deleteSource(item.source_group)} disabled={deleting === item.source_group}
                                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition-colors disabled:opacity-50" title="Delete">
                                            {deleting === item.source_group ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Learning Gaps ── */}
            {gaps.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-500/20 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/10">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={15} className="text-amber-400" />
                            <span className="font-bold text-amber-300">Training Gaps ({gaps.length})</span>
                        </div>
                        <span className="text-xs text-amber-600">Questions the bot couldn't answer</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {gaps.map((g, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-amber-500/5 transition-colors">
                                <div>
                                    <p className="text-sm font-semibold text-gray-200">{g.source_group.replace("[GAP] ", "")}</p>
                                    <p className="text-xs text-gray-500">{botName(g.bot_id)}</p>
                                </div>
                                <button
                                    onClick={() => { setTab("text"); setTextTitle(`Answer: ${g.source_group.replace("[GAP] ", "")}`); }}
                                    className="text-xs font-bold text-amber-500 hover:text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-all">
                                    Fix →
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Chunks Modal ── */}
            {viewing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-[#0f0f12] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <div>
                                <h3 className="font-bold text-white">Extracted Knowledge</h3>
                                <p className="text-xs text-gray-500 truncate mt-0.5 max-w-sm">{viewing.group}</p>
                            </div>
                            <button onClick={() => setViewing(null)} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            {viewing.chunks.length === 0 ? (
                                <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
                                    <Loader2 size={16} className="animate-spin" /> Loading…
                                </div>
                            ) : viewing.chunks.map((c, i) => (
                                <div key={c.id || i} className="bg-black/40 border border-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">#{i + 1}</span>
                                        {c.page_title && <span className="text-xs text-gray-500 truncate">{c.page_title}</span>}
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed">{c.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
