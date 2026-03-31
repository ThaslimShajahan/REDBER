"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Link as LinkIcon, Upload, Eye, X, RefreshCw, Filter, FileText, Send, AlertCircle, HelpCircle, Package, Clock, Database, PenLine, Zap } from "lucide-react";
import { API_BASE, authFetch } from "../../../lib/api";
import { TopProgressBar, SkeletonRow } from "./PageLoader";
import { useAuth } from "../context/AuthContext";

export default function KnowledgeBaseView() {
    const { user } = useAuth();
    const [kbSources, setKbSources] = useState<any[]>([]);
    const [kbStats, setKbStats] = useState<any>(null);
    const [bots, setBots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedBotId, setSelectedBotId] = useState("");
    const [filterBotId, setFilterBotId] = useState("all");
    const [urlInput, setUrlInput] = useState("");
    const [manualTextTitle, setManualTextTitle] = useState("");
    const [manualTextInput, setManualTextInput] = useState("");
    const [uploading, setUploading] = useState(false);
    const [scraping, setScraping] = useState(false);
    const [ingestingText, setIngestingText] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const [viewingSource, setViewingSource] = useState<{ group: string, chunks: any[] } | null>(null);

    const [faqQ, setFaqQ] = useState("");
    const [faqA, setFaqA] = useState("");
    
    const [csvUploading, setCsvUploading] = useState(false);
    const [gapFixMode, setGapFixMode] = useState<"text" | "url">("text");
    const [gapUrlInput, setGapUrlInput] = useState("");
    const [ingestingGapUrl, setIngestingGapUrl] = useState(false);

    const [urlType, setUrlType] = useState<"website" | "page">("website");
    const [syncFreq, setSyncFreq] = useState("Weekly");
    const [activeCrawl, setActiveCrawl] = useState<{ id: string, status: string, pages_done: number, pages_found: number, chunks_inserted?: number, page_statuses?: Record<string, string> } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchSources = useCallback(() => {
        if (!user) return;
        setLoading(true);
        const botIdsParam = user.role === "super_admin" ? "" : `?bot_ids=${user.botIds?.join(",") || "NONE"}`;
        
        authFetch(`${API_BASE}/api/admin/kb/sources${botIdsParam}`)
            .then(res => res.json())
            .then(data => { setKbSources(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));

        authFetch(`${API_BASE}/api/admin/kb/stats${botIdsParam}`)
            .then(res => res.json())
            .then(data => setKbStats(data))
            .catch(err => console.error(err));
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchSources();
        const botIdsParam = user.role === "super_admin" ? "" : `?bot_ids=${user.botIds?.join(",") || "NONE"}`;
        authFetch(`${API_BASE}/api/admin/bots${botIdsParam}`)
            .then(res => res.json())
            .then(data => {
                const filteredBots = Array.isArray(data) ? data : [];
                setBots(filteredBots);
                if (filteredBots.length > 0) setSelectedBotId(filteredBots[0].id);
            });
    }, [user, fetchSources]);

    useEffect(() => {
        if (!selectedBotId) return;
        authFetch(`${API_BASE}/api/admin/kb/active_crawl/${selectedBotId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.status !== "none" && data.id) {
                    // Parse page_statuses JSON string → object on initial load
                    if (data.page_statuses && typeof data.page_statuses === "string") {
                        try { data.page_statuses = JSON.parse(data.page_statuses); } catch { data.page_statuses = {}; }
                    }
                    setActiveCrawl(data);
                }
            })
            .catch(() => {});
    }, [selectedBotId]);

    useEffect(() => {
        if (!activeCrawl || activeCrawl.status === "done") return;
        const interval = setInterval(async () => {
            try {
                const res = await authFetch(`${API_BASE}/api/admin/kb/crawl_status/${activeCrawl.id}`);
                const data = await res.json();
                if (data.id) {
                    // Parse page_statuses JSON string → object
                    if (data.page_statuses && typeof data.page_statuses === "string") {
                        try { data.page_statuses = JSON.parse(data.page_statuses); } catch { data.page_statuses = {}; }
                    }
                    setActiveCrawl(prev => ({ ...prev, ...data }));
                    if (data.status === "done") {
                        showToast(`✅ Crawl finished! ${data.pages_done} pages · ${data.chunks_inserted || 0} chunks`);
                        setTimeout(fetchSources, 1500);
                        clearInterval(interval);
                    }
                }
            } catch (err) { }
        }, 1500);
        return () => clearInterval(interval);
    }, [activeCrawl, fetchSources]);

    const handleManualIngest = async () => {
        if (!manualTextTitle.trim() || !manualTextInput.trim()) { showToast("Enter title and text body!", "error"); return; }
        if (!selectedBotId) { showToast("Select a bot first!", "error"); return; }
        setIngestingText(true);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/kb/ingest_text`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bot_id: selectedBotId, source_name: manualTextTitle, text_content: manualTextInput }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`✅ ${data.chunks_inserted} text chunks permanently added.`);
                setManualTextTitle("");
                setManualTextInput("");
                fetchSources();
            } else {
                showToast(data.detail || "Ingest failed", "error");
            }
        } catch {
            showToast("Network error", "error");
        } finally {
            setIngestingText(false);
        }
    };

    const handleFaqIngest = async () => {
        if (!faqQ.trim() || !faqA.trim()) { showToast("Enter question and answer!", "error"); return; }
        const formatted = `FAQ Question: ${faqQ}\nFAQ Answer: ${faqA}`;
        await ingestTextFormatted(formatted, `FAQ: ${faqQ}`);
        setFaqQ(""); setFaqA("");
    };

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBotId) { showToast("Select a bot first!", "error"); return; }
        setCsvUploading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (text) {
                const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                if (lines.length < 2) {
                    showToast("CSV is empty or missing headers", "error");
                    setCsvUploading(false);
                    return;
                }
                const formattedList = lines.map((line, idx) => {
                    const row = line.split(",").map(c => c.trim().replace(/^"|"$/g, ''));
                    return `Row ${idx}: ${row.join(" | ")}`;
                });
                await ingestTextFormatted(`CSV Upload Data:\n` + formattedList.join("\n"), `CSV Upload: ${file.name}`);
            }
            setCsvUploading(false);
            e.target.value = "";
        };
        reader.readAsText(file);
    };

    const ingestTextFormatted = async (text: string, title: string) => {
        if (!selectedBotId) { showToast("Select a bot first!", "error"); return; }
        setIngestingText(true);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/kb/ingest_text`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bot_id: selectedBotId, source_name: title, text_content: text })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`✅ Added: ${title}`);
                fetchSources();
            } else {
                showToast(data.detail || "Ingest failed", "error");
            }
        } catch { showToast("Network error", "error"); }
        finally { setIngestingText(false); }
    };

    const handleGapUrlIngest = async () => {
        if (!gapUrlInput.trim()) { showToast("Enter a URL first!", "error"); return; }
        if (!selectedBotId) { showToast("Select a bot first!", "error"); return; }
        // Auto-prepend https:// if missing
        const normalizedUrl = gapUrlInput.trim().match(/^https?:\/\//) ? gapUrlInput.trim() : `https://${gapUrlInput.trim()}`;
        
        let isRoot = false;
        try {
            const parsed = new URL(normalizedUrl);
            isRoot = parsed.pathname === "/" || parsed.pathname === "";
        } catch {}

        setIngestingGapUrl(true);
        const endpoint = isRoot ? "crawl_website" : "ingest_url";

        try {
            const res = await authFetch(`${API_BASE}/api/admin/kb/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bot_id: selectedBotId, url: normalizedUrl }),
            });
            const data = await res.json();
            if (res.ok) {
                if (isRoot) {
                    showToast(`🚀 Deep crawl started for parent link: ${normalizedUrl}`);
                    if (data.job_id) {
                        setActiveCrawl({ id: data.job_id, status: "pending", pages_done: 0, pages_found: 0 });
                    }
                } else {
                    showToast(`✅ Crawled single page "${normalizedUrl}" — ${data.chunks_inserted} chunks added.`);
                    fetchSources();
                }
                setGapUrlInput("");
            } else {
                showToast(data.detail || "Failed to crawl URL", "error");
            }
        } catch {
            showToast("Network error during crawl", "error");
        } finally {
            setIngestingGapUrl(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBotId) { showToast("Select a bot first!", "error"); return; }
        setUploading(true);
        const formData = new FormData();
        formData.append("bot_id", selectedBotId);
        formData.append("file", file);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/kb/upload_pdf`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`✅ ${data.chunks_inserted} chunks indexed from "${file.name}"`);
                fetchSources();
            } else {
                showToast(data.detail || "Upload failed", "error");
            }
        } catch {
            showToast("Network error during upload", "error");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const handleUrlIngest = async () => {
        if (!urlInput.trim()) { showToast("Enter a URL first!", "error"); return; }
        if (!selectedBotId) { showToast("Select a bot to assign this URL to!", "error"); return; }
        // Auto-prepend https:// if missing
        const normalizedUrl = urlInput.trim().match(/^https?:\/\//) ? urlInput.trim() : `https://${urlInput.trim()}`;
        setScraping(true);
        const endpoint = urlType === "website" ? "crawl_website" : "ingest_url";
        try {
            const res = await authFetch(`${API_BASE}/api/admin/kb/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bot_id: selectedBotId, url: normalizedUrl }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`🚀 ${urlType === 'website' ? 'Deep crawl started' : 'Page ingest started'} for ${normalizedUrl}`);
                if (urlType === 'website' && data.job_id) {
                    setActiveCrawl({ id: data.job_id, status: "pending", pages_done: 0, pages_found: 0 });
                }
                setUrlInput("");
                setTimeout(fetchSources, 4000);
            } else {
                showToast(data.detail || "Failed", "error");
            }
        } catch {
            showToast("Network error during crawling", "error");
        } finally {
            setScraping(false);
        }
    };

    const handleDeleteSource = async (sourceGroup: string) => {
        if (!confirm(`Delete all knowledge chunks for:\n\n"${sourceGroup}"\n\nThis cannot be undone.`)) return;
        setDeleting(sourceGroup);
        // Optimistic update
        setKbSources(prev => prev.filter(s => s.source_group !== sourceGroup));
        try {
            const res = await authFetch(
                `${API_BASE}/api/admin/kb/source?source_group=${encodeURIComponent(sourceGroup)}`,
                { method: "DELETE" }
            );
            if (res.ok) {
                showToast("✅ Knowledge source deleted.");
            } else {
                showToast("Delete may have failed — refresh to check.", "error");
                fetchSources(); // Refetch on failure
            }
        } catch {
            showToast("Network error during delete.", "error");
            fetchSources();
        } finally {
            setDeleting(null);
        }
    };

    const handleViewSource = async (sourceGroup: string) => {
        setViewingSource({ group: sourceGroup, chunks: [] });
        try {
            const res = await authFetch(`${API_BASE}/api/admin/kb/source/chunks?source_group=${encodeURIComponent(sourceGroup)}`);
            if (!res.ok) { showToast("Failed to load chunks", "error"); setViewingSource(null); return; }
            const data = await res.json();
            setViewingSource({ group: sourceGroup, chunks: Array.isArray(data) ? data : [] });
        } catch {
            showToast("Network error loading chunks", "error");
            setViewingSource(null);
        }
    };

    const getBotName = (botId: string) => bots.find(b => b.id === botId)?.name || botId;

    const filteredSources = filterBotId === "all"
        ? kbSources
        : kbSources.filter(s => s.bot_id === filterBotId);

    const totalSources = kbSources.length;
    const websitePages = kbSources.filter(s => s.source_type === "url" || s.source_type === "website").length;
    const pdfFiles = kbSources.filter(s => s.source_type === "pdf").length;

    return (
        <div className="space-y-8 relative">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-2xl border transition-all ${toast.type === "success" ? "bg-emerald-900/90 border-emerald-500/40 text-emerald-300" : "bg-rose-900/90 border-rose-500/40 text-rose-300"}`}>
                    {toast.msg}
                </div>
            )}

            {/* ── PERSISTENT CRAWL STATUS BANNER ── always visible when crawl is active */}
            {activeCrawl && activeCrawl.status !== "done" && (
                <div className="sticky top-0 z-40 bg-[#0a0a10]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.15)]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-blue-500/20">
                        <div className="flex items-center gap-3">
                            <RefreshCw size={14} className="animate-spin text-blue-400" />
                            <span className="text-sm font-bold text-blue-300">
                                {activeCrawl.status === "pending" ? "Queued — starting soon..." :
                                 activeCrawl.status === "discovering" ? "Phase 1 — Discovering all links..." :
                                 "Phase 2 — Crawling & indexing pages"}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold">
                            <span className="text-blue-400">{activeCrawl.pages_done || 0} / {activeCrawl.pages_found || "?"} pages</span>
                            <span className="text-emerald-400">{activeCrawl.chunks_inserted || 0} chunks</span>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-black/50">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700"
                            style={{ width: `${activeCrawl.pages_found > 0 ? Math.min((activeCrawl.pages_done / activeCrawl.pages_found) * 100, 100) : (activeCrawl.status === "discovering" ? 15 : 5)}%` }}
                        />
                    </div>
                    {/* Per-URL list */}
                    {activeCrawl.page_statuses && Object.keys(activeCrawl.page_statuses).length > 0 && (
                        <div className="max-h-[180px] overflow-y-auto divide-y divide-white/5">
                            {Object.entries(activeCrawl.page_statuses).map(([url, status]) => {
                                const isDone = status.startsWith("done");
                                const isCrawling = status === "crawling";
                                const isFailed = status.startsWith("failed");
                                const isSkipped = status.startsWith("skipped");
                                const chunks = isDone ? status.split(":")[1] : null;
                                const shortUrl = url.replace(/^https?:\/\/[^/]+/, "") || "/";
                                return (
                                    <div key={url} className={`flex items-center gap-3 px-5 py-1.5 text-[11px] font-mono ${
                                        isCrawling ? "bg-yellow-500/10" : isDone ? "bg-emerald-500/5" : isFailed ? "bg-rose-500/5" : ""
                                    }`}>
                                        <span className={`shrink-0 w-4 text-center font-bold ${isCrawling ? "text-yellow-400 animate-pulse" : isDone ? "text-emerald-500" : isFailed ? "text-rose-400" : isSkipped ? "text-gray-600" : "text-gray-700"}`}>
                                            {isCrawling ? "⟳" : isDone ? "✓" : isFailed ? "✗" : isSkipped ? "—" : "·"}
                                        </span>
                                        <span className={`flex-1 truncate ${isCrawling ? "text-yellow-200" : isDone ? "text-emerald-400" : isFailed ? "text-rose-400" : "text-gray-600"}`}>
                                            {shortUrl}
                                        </span>
                                        {isDone && chunks && <span className="shrink-0 text-emerald-600 font-bold">{chunks}c</span>}
                                        {isCrawling && <span className="shrink-0 text-yellow-600">indexing...</span>}
                                        {isFailed && <span className="shrink-0 text-rose-600">failed</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Bot Selector */}
            <div>
                <p className="text-sm font-semibold text-gray-400 mb-3">📎 Assign knowledge to bot:</p>
                <div className="flex flex-wrap gap-3">
                    {bots.map(b => {
                        const isSelected = selectedBotId === b.id;
                        return (
                            <button
                                key={b.id}
                                onClick={() => setSelectedBotId(b.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 ${isSelected ? "bg-purple-500/20 border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.2)]" : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"}`}
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${b.theme_color || "bg-gradient-to-br from-purple-500 to-blue-500"}`}>
                                    {b.name.charAt(0)}
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-bold leading-none mb-0.5 ${isSelected ? "text-white" : "text-gray-200"}`}>{b.name}</p>
                                    <p className="text-[10px] text-gray-500">{b.id}</p>
                                </div>
                                {isSelected && <span className="ml-2 text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
                            </button>
                        );
                    })}
                </div>
                {selectedBotId && (
                    <p className="mt-2 text-xs text-purple-400">
                        ✓ Uploading & crawling will be assigned to: <strong>{getBotName(selectedBotId)}</strong>
                    </p>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[
                    { label: "Total Sources", value: kbStats ? kbStats.total : 0, color: "text-white", border: "border-white/10", icon: <Database size={14} className="text-gray-400" /> },
                    { label: "Web Intelligence", value: kbStats ? kbStats.website : 0, color: "text-blue-400", border: "border-blue-500/20", icon: <LinkIcon size={14} className="text-blue-400" /> },
                    { label: "Hard Documents", value: kbStats ? kbStats.pdf : 0, color: "text-rose-400", border: "border-rose-500/20", icon: <FileText size={14} className="text-rose-400" /> },
                    { label: "Manual Brain", value: kbStats ? kbStats.manual : 0, color: "text-emerald-400", border: "border-emerald-500/20", icon: <PenLine size={14} className="text-emerald-400" /> },
                ].map((s, i) => (
                    <div key={i} className={`bg-white/5 border ${s.border} rounded-2xl p-5 relative overflow-hidden group hover:bg-white/[0.08] transition-all`}>
                        <div className="absolute top-3 right-3 opacity-30">{s.icon}</div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{s.label}</p>
                        <p className={`text-3xl font-black ${s.color} tracking-tighter`}>{s.value}</p>
                    </div>
                ))}
                
                {/* Standout: Critical Knowledge Gaps */}
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-5 relative overflow-hidden group animate-pulse hover:animate-none transition-all cursor-pointer shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                    <div className="absolute top-3 right-3"><AlertCircle size={14} className="text-yellow-400" /></div>
                    <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest mb-1">Learning Gaps</p>
                    <p className="text-3xl font-black text-yellow-400 tracking-tighter">{kbStats ? kbStats.learning_gap : 0}</p>
                    <p className="text-[9px] text-yellow-600/80 font-bold mt-1 uppercase tracking-tighter">Requires Training &rarr;</p>
                </div>
            </div>

            {/* Sources Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg ring-1 ring-blue-500/30"><LinkIcon size={18} /></div>
                            <h3 className="text-lg font-bold">Website Sync</h3>
                        </div>
                        <div className="flex bg-black/50 p-1 rounded-lg">
                            <button onClick={()=>setUrlType('website')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${urlType==='website' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>Deep Crawl</button>
                            <button onClick={()=>setUrlType('page')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${urlType==='page' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>Single Page</button>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">{urlType === 'website' ? "Deep-crawls a URL and indexes all pages automatically." : "Indexes only the specific URL provided, saving processing time."}</p>
                    
                    {urlType === 'website' && (
                        <div className="flex items-center gap-3 mb-4 bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
                            <Clock size={16} className="text-blue-400" />
                            <span className="text-sm font-semibold text-blue-200">Auto Sync Frequency:</span>
                            <select value={syncFreq} onChange={e=>setSyncFreq(e.target.value)} className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-blue-500 ml-auto font-bold">
                                <option>Daily</option>
                                <option>Every 3 Days</option>
                                <option>Weekly</option>
                                <option>Monthly</option>
                            </select>
                        </div>
                    )}
                    
                    <div className="flex gap-2 mt-auto">
                        <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleUrlIngest()} placeholder="https://example.com/..." className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
                        <button onClick={handleUrlIngest} disabled={scraping || !selectedBotId || activeCrawl?.status === "running"} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 whitespace-nowrap">
                            {scraping ? "..." : (urlType === 'website' ? "Start Sync" : "Add Page")}
                        </button>
                    </div>
                    {activeCrawl && activeCrawl.status !== "done" && (
                        <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                            {/* Header row */}
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-blue-300 font-bold flex items-center gap-1">
                                    <RefreshCw size={12} className="animate-spin" />
                                    {activeCrawl.status === "pending" ? "Starting..." :
                                     activeCrawl.status === "discovering" ? `Discovering links...` :
                                     `Crawling ${activeCrawl.pages_found || '?'} pages`}
                                </span>
                                <span className="text-xs text-blue-400 font-bold">
                                    {activeCrawl.pages_done || 0}/{activeCrawl.pages_found || '?'} · {activeCrawl.chunks_inserted || 0} chunks
                                </span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 bg-black/50 rounded-full overflow-hidden mb-3">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${activeCrawl.pages_found > 0 ? (activeCrawl.pages_done / activeCrawl.pages_found) * 100 : 5}%` }} />
                            </div>
                            {/* Per-URL status list */}
                            {activeCrawl.page_statuses && Object.keys(activeCrawl.page_statuses).length > 0 && (
                                <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1">
                                    {Object.entries(activeCrawl.page_statuses).map(([url, status]) => {
                                        const isDone = status.startsWith('done');
                                        const isCrawling = status === 'crawling';
                                        const isFailed = status.startsWith('failed');
                                        const isSkipped = status.startsWith('skipped');
                                        const chunks = isDone ? status.split(':')[1] : null;
                                        const shortUrl = url.replace(/^https?:\/\/[^/]+/, '') || '/';
                                        return (
                                            <div key={url} className={`flex items-center gap-2 px-2 py-1 rounded-lg text-[11px] font-mono ${
                                                isCrawling ? 'bg-yellow-500/10 text-yellow-300' :
                                                isDone ? 'bg-emerald-500/10 text-emerald-400' :
                                                isFailed ? 'bg-rose-500/10 text-rose-400' :
                                                isSkipped ? 'bg-gray-500/10 text-gray-500' :
                                                'text-gray-600'
                                            }`}>
                                                <span className="shrink-0">
                                                    {isCrawling ? '⟳' : isDone ? '✓' : isFailed ? '✗' : isSkipped ? '—' : '·'}
                                                </span>
                                                <span className="truncate flex-1">{shortUrl}</span>
                                                {isDone && chunks && <span className="shrink-0 text-emerald-600">{chunks}c</span>}
                                                {isFailed && <span className="shrink-0 text-rose-600">err</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center border-dashed group hover:border-purple-500/40 transition-colors">
                    <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <Upload size={20} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Upload PDF</h3>
                    <p className="text-xs text-gray-500 mb-4 px-10">Upload menus, brochures, service guides, or product manuals.</p>
                    <label className={`cursor-pointer mt-auto bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-full font-bold shadow transition-all ${uploading ? "opacity-50 cursor-wait" : ""}`}>
                        {uploading ? "Processing..." : "Select File"}
                        <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* Sources Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Manual Text Ingestion */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg ring-1 ring-emerald-500/30"><FileText size={18} /></div>
                        <h3 className="text-lg font-bold">Manual Text</h3>
                    </div>
                    <div className="flex flex-col gap-2 h-full">
                        <input
                            type="text"
                            value={manualTextTitle}
                            onChange={e => setManualTextTitle(e.target.value)}
                            placeholder="Short Title..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                        />
                        <textarea
                            value={manualTextInput}
                            onChange={e => setManualTextInput(e.target.value)}
                            placeholder="Type facts, rules, or knowledge..."
                            className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 resize-none min-h-[60px]"
                        />
                        <button
                            onClick={handleManualIngest}
                            disabled={ingestingText || !selectedBotId}
                            className="w-full bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-auto"
                        >
                            {ingestingText ? "Saving..." : <><Send size={14} /> Add Data</>}
                        </button>
                    </div>
                </div>

                {/* FAQ Ingestion */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg ring-1 ring-amber-500/30"><HelpCircle size={18} /></div>
                        <h3 className="text-lg font-bold">Add FAQ</h3>
                    </div>
                    <div className="flex flex-col gap-2 h-full">
                        <input type="text" value={faqQ} onChange={e => setFaqQ(e.target.value)} placeholder="Question (e.g. Do you offer delivery?)" className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500" />
                        <textarea value={faqA} onChange={e => setFaqA(e.target.value)} placeholder="Answer (e.g. Yes, within 5 km.)" className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500 resize-none min-h-[60px]" />
                        <button onClick={handleFaqIngest} disabled={ingestingText || !selectedBotId} className="w-full bg-amber-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-amber-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-auto">
                            {ingestingText ? "Saving..." : <><Send size={14} /> Add FAQ</>}
                        </button>
                    </div>
                </div>

                {/* Product Catalog */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center border-dashed group hover:border-pink-500/40 transition-colors">
                    <div className="flex items-center gap-3 mb-2 w-full">
                        <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg ring-1 ring-pink-500/30"><Package size={18} /></div>
                        <h3 className="text-lg font-bold">Catalog CSV</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-6 mt-4">Upload a .csv file containing your products and prices to bulk import.</p>
                    <label className={`cursor-pointer mt-auto bg-pink-600 hover:bg-pink-500 text-white px-6 py-2.5 rounded-xl font-bold transition-colors w-full ${csvUploading ? "opacity-50 cursor-wait" : ""}`}>
                        {csvUploading ? "Processing..." : "Select CSV"}
                        <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} disabled={csvUploading} />
                    </label>
                </div>
            </div>

            {/* KB Table */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Knowledge Base Manager</h3>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Filter size={14} className="text-gray-400" />
                            <select
                                value={filterBotId}
                                onChange={e => setFilterBotId(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-purple-500"
                            >
                                <option value="all">All Bots</option>
                                {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <button onClick={fetchSources} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors" title="Refresh">
                            <RefreshCw size={14} className="text-gray-400" />
                        </button>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-sm text-gray-400 uppercase tracking-wider border-b border-white/10">
                                <th className="p-4 font-medium">Source / Title</th>
                                <th className="p-4 font-medium">Bot</th>
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Chunks</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {loading ? (
                                <>{loading && <TopProgressBar />}<SkeletonRow cols={5} /><SkeletonRow cols={5} /><SkeletonRow cols={5} /><SkeletonRow cols={5} /></>
                            ) : filteredSources.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No knowledge indexed{filterBotId !== "all" ? ` for ${getBotName(filterBotId)}` : ""}.</td></tr>
                            ) : (
                                filteredSources.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <p className="font-bold text-gray-200 truncate max-w-sm">{item.page_title || item.source_group}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-sm">{item.source_group}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-1 rounded-full">
                                                {getBotName(item.bot_id)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${item.source_type === 'pdf' ? 'bg-rose-500/20 text-rose-400' : item.source_type === 'learning_gap' ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/50' : item.source_type === 'manual' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {item.source_type === 'learning_gap' ? 'Found Gap' : item.source_type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-emerald-400 text-xs font-semibold">{item.chunks} chunks</td>
                                        <td className="p-4 text-right flex items-center justify-end gap-2">
                                            <button onClick={() => handleViewSource(item.source_group)} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all" title="View Chunks">
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSource(item.source_group)}
                                                disabled={deleting === item.source_group}
                                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-all disabled:opacity-50"
                                                title="Delete Source"
                                            >
                                                {deleting === item.source_group
                                                    ? <RefreshCw size={16} className="animate-spin" />
                                                    : <Trash2 size={16} />
                                                }
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Chunks Modal */}
            {viewingSource && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
                    <div className="bg-[#0f0f12] border border-white/10 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Extracted Knowledge</h3>
                                <p className="text-sm text-gray-400 max-w-2xl truncate">{viewingSource.group}</p>
                            </div>
                            <button onClick={() => setViewingSource(null)} className="p-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white rounded-xl transition-all"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {viewingSource.chunks.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-t-purple-500 border-white/10 rounded-full animate-spin"></div>
                                    Loading extraction data...
                                </div>
                            ) : (
                                viewingSource.chunks.map((chunk, idx) => (
                                    <div key={chunk.id || idx} className="bg-black/50 border border-white/5 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded">CHUNK {idx + 1}</span>
                                            {chunk.page_title && <span className="text-xs text-gray-500 truncate max-w-sm">{chunk.page_title}</span>}
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed font-light">{chunk.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
             {/* Learning Gaps Dashboard (The Standing Out Feature) */}
             <div className="bg-white/5 border border-yellow-500/20 rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <HelpCircle size={200} className="text-yellow-400" />
                </div>
                
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-xl ring-1 ring-yellow-500/30 ring-inset"><Zap size={20} /></div>
                    Smart Training Loop
                </h2>
                <p className="text-gray-400 text-sm max-w-xl mb-8 leading-relaxed">
                    Our AI identifies topics it couldn't answer during live chats. 
                    <strong className="text-yellow-400/80"> Resolve these gaps below to instantly make your bot more intelligent.</strong>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Gap List */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Open Gaps ({kbSources.filter(s => s.source_type === 'learning_gap').length})</p>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
                            {kbSources.filter(s => s.source_type === 'learning_gap').map((gap, gi) => (
                                <div key={gi} className="bg-black/40 border border-white/5 rounded-2xl p-4 group hover:border-yellow-500/30 transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-200">{gap.source_group.replace('[GAP] ', '')}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">Flagged for: {getBotName(gap.bot_id)}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => { setManualTextTitle(`Answer: ${gap.source_group.replace('[GAP] ', '')}`); setManualTextInput(""); setSelectedBotId(gap.bot_id); }}
                                        className="text-[10px] font-black uppercase tracking-widest text-yellow-500 px-3 py-1.5 rounded-lg hover:bg-yellow-500/10 transition-all"
                                    >
                                        Fix & Train
                                    </button>
                                </div>
                            ))}
                            {kbSources.filter(s => s.source_type === 'learning_gap').length === 0 && (
                                <div className="text-center py-10 bg-black/20 rounded-2xl border border-dashed border-white/5 text-gray-500 italic text-sm">
                                    All clear! No current knowledge gaps detected.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Trainer */}
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col relative group">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Quick Brain Fix</p>
                            {/* Mode toggle */}
                            <div className="flex bg-black/50 p-1 rounded-lg gap-1">
                                <button
                                    onClick={() => setGapFixMode("text")}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${gapFixMode === "text" ? "bg-yellow-500 text-black" : "text-gray-400 hover:text-white"}`}
                                >
                                    ✏️ Text
                                </button>
                                <button
                                    onClick={() => setGapFixMode("url")}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${gapFixMode === "url" ? "bg-yellow-500 text-black" : "text-gray-400 hover:text-white"}`}
                                >
                                    🔗 URL
                                </button>
                            </div>
                        </div>

                        {gapFixMode === "text" ? (
                            <div className="space-y-4 flex flex-col">
                                <input
                                    value={manualTextTitle} onChange={e => setManualTextTitle(e.target.value)}
                                    placeholder="Topic or Question Name..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-yellow-500/50 outline-none transition-all shadow-inner"
                                />
                                <textarea
                                    value={manualTextInput} onChange={e => setManualTextInput(e.target.value)}
                                    placeholder="Paste the official answer or new information here..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-yellow-500/50 outline-none transition-all shadow-inner resize-none min-h-[120px]"
                                />
                                <button
                                    onClick={handleManualIngest} disabled={ingestingText || !selectedBotId}
                                    className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 text-black font-black uppercase tracking-widest py-4 rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                                >
                                    {ingestingText ? "Synchronizing..." : "Inject New Knowledge"}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 flex flex-col">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Paste a product page, FAQ page, or any URL. We'll crawl it immediately and inject the content into your bot's knowledge base.
                                </p>
                                <input
                                    type="url"
                                    value={gapUrlInput}
                                    onChange={e => setGapUrlInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && !ingestingGapUrl && handleGapUrlIngest()}
                                    placeholder="https://example.com/product-page"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-yellow-500/50 outline-none transition-all shadow-inner font-mono"
                                />
                                <p className="text-[10px] text-gray-600">Bot: <span className="text-yellow-600 font-bold">{getBotName(selectedBotId) || "— select a bot above —"}</span></p>
                                <button
                                    onClick={handleGapUrlIngest}
                                    disabled={ingestingGapUrl || !selectedBotId || !gapUrlInput.trim()}
                                    className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 text-black font-black uppercase tracking-widest py-4 rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                                >
                                    {ingestingGapUrl ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <RefreshCw size={14} className="animate-spin" /> Crawling Page...
                                        </span>
                                    ) : "🔗 Crawl & Fill Gap"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
}
