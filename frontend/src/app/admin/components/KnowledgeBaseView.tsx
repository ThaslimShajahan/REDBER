"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Link as LinkIcon, Upload, Eye, X, RefreshCw, Filter, FileText, Send, AlertCircle } from "lucide-react";
import { API_BASE } from "../../../lib/api";

export default function KnowledgeBaseView() {
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

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchSources = useCallback(() => {
        setLoading(true);
        fetch(`${API_BASE}/api/admin/kb/sources`)
            .then(res => res.json())
            .then(data => { setKbSources(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));

        fetch(`${API_BASE}/api/admin/kb/stats`)
            .then(res => res.json())
            .then(data => setKbStats(data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        fetchSources();
        fetch(`${API_BASE}/api/admin/bots`)
            .then(res => res.json())
            .then(data => {
                setBots(Array.isArray(data) ? data : []);
                if (data.length > 0) setSelectedBotId(data[0].id);
            });
    }, [fetchSources]);

    const handleManualIngest = async () => {
        if (!manualTextTitle.trim() || !manualTextInput.trim()) { showToast("Enter title and text body!", "error"); return; }
        if (!selectedBotId) { showToast("Select a bot first!", "error"); return; }
        setIngestingText(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/kb/ingest_text`, {
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBotId) { showToast("Select a bot first!", "error"); return; }
        setUploading(true);
        const formData = new FormData();
        formData.append("bot_id", selectedBotId);
        formData.append("file", file);
        try {
            const res = await fetch(`${API_BASE}/api/admin/kb/upload_pdf`, {
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
        setScraping(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/kb/crawl_website`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bot_id: selectedBotId, url: urlInput }),
            });
            const data = await res.json();
            if (res.ok) {
                const botName = bots.find(b => b.id === selectedBotId)?.name || selectedBotId;
                showToast(`🚀 Crawl started for ${urlInput} → assigned to ${botName}`);
                setUrlInput("");
                // Poll for new sources
                setTimeout(fetchSources, 6000);
                setTimeout(fetchSources, 15000);
            } else {
                showToast(data.detail || "Crawl failed", "error");
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
            const res = await fetch(
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
            const res = await fetch(`${API_BASE}/api/admin/kb/source/chunks?source_group=${encodeURIComponent(sourceGroup)}`);
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
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">Total Sources</p>
                    <p className="text-3xl font-black text-white">{kbStats ? kbStats.total : 0}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-wider">Websites</p>
                    <p className="text-3xl font-black text-blue-400">{kbStats ? kbStats.website : 0}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xs text-rose-400 font-bold mb-1 uppercase tracking-wider">PDF Files</p>
                    <p className="text-3xl font-black text-rose-400">{kbStats ? kbStats.pdf : 0}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-wider">Manual Entries</p>
                    <p className="text-3xl font-black text-emerald-400">{kbStats ? kbStats.manual : 0}</p>
                </div>
                <div className="bg-white/5 border border-yellow-500/20 rounded-2xl p-4 text-center shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                    <p className="flex items-center justify-center gap-1 text-xs text-yellow-400 font-bold mb-1 uppercase tracking-wider">
                        <AlertCircle size={12} /> Gaps Found
                    </p>
                    <p className="text-3xl font-black text-yellow-400">{kbStats ? kbStats.learning_gap : 0}</p>
                </div>
            </div>

            {/* Upload & Crawl */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center border-dashed group hover:border-purple-500/40 transition-colors">
                    <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <Upload size={20} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Upload PDF</h3>
                    <label className={`cursor-pointer mt-auto bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-full font-bold shadow transition-all ${uploading ? "opacity-50 cursor-wait" : ""}`}>
                        {uploading ? "Processing..." : "Select File"}
                        <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg ring-1 ring-blue-500/30"><LinkIcon size={18} /></div>
                        <h3 className="text-lg font-bold">Crawl Website</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 flex-1">Deep-crawls a URL and indexes all pages.</p>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={urlInput}
                            onChange={e => setUrlInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleUrlIngest()}
                            placeholder="https://example.com"
                            className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        />
                        <button
                            onClick={handleUrlIngest}
                            disabled={scraping || !selectedBotId}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50"
                        >
                            {scraping ? "..." : "Crawl"}
                        </button>
                    </div>
                </div>

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
                            placeholder="Type facts, Q&A, or knowledge..."
                            className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 resize-none min-h-[60px]"
                        />
                        <button
                            onClick={handleManualIngest}
                            disabled={ingestingText || !selectedBotId}
                            className="w-full bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {ingestingText ? "Saving..." : <><Send size={14} /> Add Data</>}
                        </button>
                    </div>
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
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading sources...</td></tr>
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
        </div>
    );
}
