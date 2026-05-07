import { useState, useEffect, useCallback, useRef } from "react";
import { X, Trash2, Activity, MessageSquare, Zap, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE, authFetch } from "../../../lib/api";
import PageContentEditor from "./PageContentEditor";
import PersonaConfigEditor from "./PersonaConfigEditor";
import { useAuth } from "../context/AuthContext";

// ─── Shared ElevenLabs Voice Picker ──────────────────────────────────────────
function ElevenVoicePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
    const [voices, setVoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const loadVoices = useCallback(async () => {
        if (loaded && !loadError) { setOpen(true); return; }
        setLoading(true);
        setLoadError("");
        try {
            const res = await authFetch(`${API_BASE}/api/admin/elevenlabs/voices`);
            const data = await res.json();
            if (!res.ok) {
                setLoadError(data.detail || `Error ${res.status}`);
                setOpen(true);
                return;
            }
            setVoices(Array.isArray(data) ? data : []);
            setLoaded(true);
            setOpen(true);
        } catch (e: any) {
            setLoadError(e.message || "Network error");
            setOpen(true);
        } finally { setLoading(false); }
    }, [loaded, loadError]);

    const playPreview = (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPreviewUrl(""); }
        if (previewUrl === url) return;
        const a = new Audio(url);
        a.play();
        a.onended = () => { audioRef.current = null; setPreviewUrl(""); };
        audioRef.current = a;
        setPreviewUrl(url);
    };

    const filtered = voices.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        (v.labels?.accent || "").toLowerCase().includes(search.toLowerCase()) ||
        (v.labels?.language || "").toLowerCase().includes(search.toLowerCase())
    );
    const selected = voices.find(v => v.voice_id === value);

    return (
        <div className="relative">
            <div className="flex gap-2">
                <button type="button" onClick={loadVoices} disabled={loading}
                    className="flex-1 flex items-center justify-between bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white hover:border-purple-500/60 transition-colors text-left">
                    <span className={selected ? "font-semibold" : "text-gray-500"}>
                        {loading ? "Loading voices…" : selected ? selected.name : "Select a voice…"}
                    </span>
                    <span className="text-gray-500 ml-2 text-xs">{loading ? "⟳" : "▾"}</span>
                </button>
                {value && (
                    <button type="button" onClick={() => onChange("")}
                        className="px-3 text-gray-600 hover:text-rose-400 transition-colors">✕</button>
                )}
            </div>
            {value && !selected && <p className="text-[10px] text-gray-600 mt-1 font-mono">ID: {value}</p>}

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-[#12121e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-white/5">
                        <input autoFocus
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                            placeholder="Search by name, accent, language…"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    {loadError && (
                        <div className="px-3 py-2.5 bg-rose-950/60 border-b border-rose-500/20">
                            <p className="text-[11px] text-rose-300 font-semibold">Failed to load voices</p>
                            <p className="text-[10px] text-rose-400/80 mt-0.5">{loadError}</p>
                            {loadError.includes("voices_read") && (
                                <p className="text-[10px] text-amber-400 mt-1">→ Go to elevenlabs.io → Settings → API Keys → enable <strong>voices_read</strong> permission</p>
                            )}
                            <div className="mt-2">
                                <p className="text-[10px] text-gray-400 mb-1">Or enter voice ID manually:</p>
                                <input
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                                    placeholder="Paste voice ID e.g. 4O1sYUnmtThcBoSBrri7"
                                    onKeyDown={e => { if (e.key === "Enter") { onChange((e.target as HTMLInputElement).value.trim()); setOpen(false); } }}
                                />
                                <p className="text-[9px] text-gray-600 mt-0.5">Press Enter to confirm</p>
                            </div>
                        </div>
                    )}
                    <div className="max-h-56 overflow-y-auto divide-y divide-white/5">
                        {!loadError && filtered.length === 0 && <div className="px-4 py-3 text-xs text-gray-500">No voices found</div>}
                        {filtered.map(v => (
                            <div key={v.voice_id}
                                onClick={() => { onChange(v.voice_id); setOpen(false); setSearch(""); }}
                                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors ${value === v.voice_id ? "bg-purple-900/30" : ""}`}>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{v.name}</p>
                                    <p className="text-[10px] text-gray-500 truncate">
                                        {[v.labels?.accent, v.labels?.language, v.category].filter(Boolean).join(" · ")}
                                    </p>
                                </div>
                                {value === v.voice_id && <span className="text-purple-400 text-xs">✓</span>}
                                {v.preview_url && (
                                    <button type="button" onClick={e => playPreview(v.preview_url, e)}
                                        className={`shrink-0 text-[10px] px-2 py-1 rounded-lg border transition-colors ${previewUrl === v.preview_url ? "bg-purple-600 text-white border-purple-500" : "bg-white/5 text-gray-400 border-white/10 hover:text-white"}`}>
                                        {previewUrl === v.preview_url ? "▐▐" : "▶"}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t border-white/5">
                        <button type="button" onClick={() => setOpen(false)}
                            className="w-full text-[10px] text-gray-500 hover:text-white transition-colors py-1">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SettingsView() {
    const { user } = useAuth();
    const [bots, setBots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBot, setEditingBot] = useState<any>(null);
    const [configureTab, setConfigureTab] = useState<"persona_prompt" | "persona_config" | "page" | "rate_limits" | "voice" | "embed">("persona_prompt");
    const [botUsage, setBotUsage] = useState<any>(null);
    const [spikeProtectionEnabled, setSpikeProtectionEnabled] = useState<boolean>(true);
    const [creatingBot, setCreatingBot] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newBot, setNewBot] = useState({
        id: "", name: "", role: "", persona_prompt: "",
        theme_color: "bg-gradient-to-r from-purple-500 to-indigo-600",
        avatar: "", status: "Active", is_public: false
    });
    const [autoGenFields, setAutoGenFields] = useState({ industry: "", tone: "Friendly" });
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchBots = () => {
        if (!user) return;
        setLoading(true);
        const botIdsParam = user.role === "super_admin" ? "" : `?bot_ids=${user.botIds?.join(",") || "NONE"}`;
        authFetch(`${API_BASE}/api/admin/bots${botIdsParam}`)
            .then(res => res.json())
            .then(data => {
                setBots(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchBots();
    }, [user]);

    const fetchBotUsage = async (botId: string) => {
        try {
            const res = await authFetch(`${API_BASE}/api/bots/${botId}/rate-limits`);
            const data = await res.json();
            setBotUsage(data);
        } catch (error) {
            console.error("Failed to fetch bot usage", error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/bots/${editingBot.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingBot.name,
                    role: editingBot.role,
                    theme_color: editingBot.theme_color,
                    persona_prompt: editingBot.persona_prompt,
                    avatar: editingBot.avatar || "",
                    status: editingBot.status || "Active",
                    is_public: editingBot.is_public || false,
                    allowed_domains: editingBot.allowed_domains || [],
                    page_config: editingBot.page_config || {},
                    persona_config: editingBot.persona_config || {}
                })
            });
            if (res.ok) {
                setEditingBot(null);
                fetchBots();
            } else {
                const err = await res.json();
                alert(err.detail || "Save failed");
            }
        } catch (error) {
            console.error("Failed to save bot", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveRateLimits = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const primaryLimit = editingBot.rate_limits?.primaryLimit;
            const secondaryLimit = editingBot.rate_limits?.secondaryLimit;
            
            if (!primaryLimit || !primaryLimit.value) {
                alert("Please set at least a Primary Limit value");
                setIsSaving(false);
                return;
            }

            const res = await authFetch(`${API_BASE}/api/bots/${editingBot.id}/rate-limits`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    primaryLimit: {
                        value: primaryLimit.value,
                        duration: primaryLimit.duration || "month"
                    },
                    secondaryLimit: secondaryLimit && secondaryLimit.value ? {
                        value: secondaryLimit.value,
                        duration: secondaryLimit.duration || "day"
                    } : null,
                    burstLimit: editingBot.rate_limits?.burstLimit || null,
                    maxBots: editingBot.rate_limits?.maxBots || null
                })
            });
            
            if (res.ok) {
                alert("Rate limits saved successfully!");
                setEditingBot(null);
                fetchBots();
            } else {
                const err = await res.json();
                alert(err.detail || "Save failed");
            }
        } catch (error) {
            console.error("Failed to save rate limits", error);
            alert("Error saving rate limits");
        } finally {
            setIsSaving(false);
        }
    };


    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/bots`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBot)
            });
            if (res.ok) {
                setCreatingBot(false);
                setNewBot({ id: "", name: "", role: "", persona_prompt: "", theme_color: "bg-gradient-to-r from-purple-500 to-indigo-600", avatar: "", status: "Active", is_public: false });
                fetchBots();
            } else {
                const err = await res.json();
                alert(err.detail || "Create failed");
            }
        } catch { alert("Network error"); }
        finally { setIsSaving(false); }
    };

    const handleDeleteBot = async (botId: string, botName: string) => {
        if (!confirm(`Are you sure you want to delete "${botName}"? This cannot be undone.`)) return;
        setBots(prev => prev.filter(b => b.id !== botId));
        await authFetch(`${API_BASE}/api/admin/bots/${botId}`, { method: "DELETE" });
    };

    if (loading && bots.length === 0) return <div className="text-gray-500 text-center p-8">Loading bots...</div>;

    const toggleBotStatus = async (bot: any) => {
        const newStatus = bot.status === "Active" ? "Inactive" : "Active";
        setBots(prev => prev.map(b => b.id === bot.id ? { ...b, status: newStatus } : b));
        try {
            await authFetch(`${API_BASE}/api/admin/bots/${bot.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: bot.name,
                    role: bot.role,
                    theme_color: bot.theme_color || "",
                    persona_prompt: bot.persona_prompt,
                    avatar: bot.avatar || "",
                    status: newStatus,
                    page_config: bot.page_config || {},
                    persona_config: bot.persona_config || {}
                })
            });
        } catch {
            setBots(prev => prev.map(b => b.id === bot.id ? { ...b, status: bot.status } : b));
        }
    };

    const toggleVoiceAgent = async (bot: any) => {
        const newVoiceEnabled = !bot.persona_config?.voice_enabled;
        const updatedPersonaConfig = { ...bot.persona_config, voice_enabled: newVoiceEnabled };
        setBots(prev => prev.map(b => b.id === bot.id ? { ...b, persona_config: updatedPersonaConfig } : b));
        try {
            await authFetch(`${API_BASE}/api/admin/bots/${bot.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: bot.name,
                    role: bot.role,
                    theme_color: bot.theme_color || "",
                    persona_prompt: bot.persona_prompt,
                    avatar: bot.avatar || "",
                    status: bot.status || "Active",
                    is_public: bot.is_public || false,
                    page_config: bot.page_config || {},
                    persona_config: updatedPersonaConfig
                })
            });
        } catch {
            setBots(prev => prev.map(b => b.id === bot.id ? { ...b, persona_config: bot.persona_config } : b));
        }
    };

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <p className="text-gray-400 text-sm">{bots.length} bot{bots.length !== 1 ? "s" : ""} configured</p>
                <button
                    onClick={() => setCreatingBot(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-700/20 transition-all"
                >
                    + Create New Bot
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {bots.length === 0 ? (
                    <div className="col-span-2 text-center text-gray-500 p-8 border border-dashed border-white/10 rounded-2xl">No bots detected.</div>
                ) : bots.map((bot: any, i: number) => (
                    <div key={i} className={`bg-white/5 border rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group flex flex-col transition-all duration-300 ${bot.status === 'Active' ? 'border-white/10' : 'border-rose-500/20 opacity-60'}`}>
                        <div className="absolute top-5 right-5 flex items-center gap-2">
                            <span className={`text-xs font-semibold ${bot.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {bot.status === 'Active' ? 'Live' : 'Off'}
                            </span>
                            <button
                                onClick={() => toggleBotStatus(bot)}
                                className={`relative w-12 h-7 rounded-full transition ${bot.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-600'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${bot.status === 'Active' ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-4 pr-20">
                            {bot.avatar ? (
                                <img src={bot.avatar} alt={bot.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/10 shadow-lg" />
                            ) : (
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${bot.theme_color || 'bg-gradient-to-br from-purple-500 to-blue-500'}`}>{bot.name.charAt(0)}</div>
                            )}
                            <div>
                                <h3 className="text-xl font-bold mb-0.5">{bot.name}</h3>
                                <p className="text-sm text-purple-400 font-semibold">{bot.role}</p>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm text-gray-400 flex-1">
                            <div className="flex justify-between border-b border-white/5 pb-2"><span>Engine</span> <span className="text-white font-medium">{bot.engine}</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-2"><span>Knowledge Base</span> <span className="text-white font-medium">Auto-Synced</span></div>
                            <div className="flex justify-between border-b border-white/5 pb-2 items-center">
                                <span className="flex items-center gap-1.5">🎙️ Voice Agent</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold ${bot.persona_config?.voice_enabled ? 'text-purple-400' : 'text-gray-600'}`}>
                                        {bot.persona_config?.voice_enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                    <button
                                        onClick={() => toggleVoiceAgent(bot)}
                                        className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${bot.persona_config?.voice_enabled ? 'bg-purple-500' : 'bg-gray-700'}`}
                                        title={bot.persona_config?.voice_enabled ? 'Disable voice agent' : 'Enable voice agent'}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${bot.persona_config?.voice_enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between pt-2"><span>Bot ID</span> <span className="text-gray-500 font-mono text-xs">{bot.id}</span></div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => { setEditingBot({ ...bot }); setConfigureTab("persona_prompt"); }} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-semibold transition-colors">Configure</button>
                            <button onClick={() => handleDeleteBot(bot.id, bot.name)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/20"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {editingBot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
                            <div className="flex items-center gap-6 w-full pr-12">
                                <h2 className="text-xl font-bold whitespace-nowrap">Configure: {editingBot.name}</h2>
                                <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                                    {(["persona_prompt", "persona_config", "voice", "page", "rate_limits", "embed"] as const).map(tab => (
                                        <button key={tab} onClick={() => {
                                            setConfigureTab(tab);
                                            if (tab === "rate_limits") {
                                                fetchBotUsage(editingBot.id);
                                                setSpikeProtectionEnabled(!!editingBot.rate_limits?.secondaryLimit?.value);
                                            }
                                        }}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${configureTab === tab ? "bg-white/15 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                                            {tab === "persona_prompt" ? "🤖 Base Core" : tab === "persona_config" ? "🎛️ Persona Tuning" : tab === "voice" ? "🎙️ Voice & Calling" : tab === "page" ? "📄 Public Page Config" : tab === "embed" ? "💻 Embed Widget" : "⏱️ Rate Limits"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => setEditingBot(null)} className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={configureTab === "rate_limits" ? handleSaveRateLimits : handleSave} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {configureTab === "persona_prompt" && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
                                                <input type="text" value={editingBot.name} onChange={e => setEditingBot({ ...editingBot, name: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Role Title</label>
                                                <input type="text" value={editingBot.role} onChange={e => setEditingBot({ ...editingBot, role: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Theme Gradient / Hex</label>
                                                <input type="text" value={editingBot.theme_color || ""} onChange={e => setEditingBot({ ...editingBot, theme_color: e.target.value })}
                                                    placeholder="e.g. bg-gradient-to-r from-rose-500 to-orange-500"
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Avatar Image URL</label>
                                                <input type="text" value={editingBot.avatar || ""} onChange={e => setEditingBot({ ...editingBot, avatar: e.target.value })}
                                                    placeholder="https://..."
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Bot Status</label>
                                            <select value={editingBot.status || "Active"} onChange={e => setEditingBot({ ...editingBot, status: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500 transition-colors appearance-none">
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-white">Show in Redber Live Demo</h3>
                                                <p className="text-xs text-gray-500">Display this bot in the public showcase on redber.in — does NOT affect client embed widgets</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditingBot({ ...editingBot, is_public: !editingBot.is_public })}
                                                className={`relative w-12 h-7 rounded-full transition ${editingBot.is_public ? 'bg-purple-500' : 'bg-gray-600'}`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${editingBot.is_public ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Core Identity Prompt</label>
                                            <textarea value={editingBot.persona_prompt} onChange={e => setEditingBot({ ...editingBot, persona_prompt: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors h-48 resize-none" />
                                            <p className="text-xs text-gray-500 mt-2">The fundamental prompt defining how the AI acts. This merges with the Persona Configuration settings.</p>
                                        </div>
                                    </>
                                )}
                                 {configureTab === "voice" && (
                                    <div className="space-y-5">
                                        {/* Enable toggle */}
                                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-white">Enable Real-time Voice Calling</h3>
                                                <p className="text-xs text-gray-500">Show the phone button on this bot's chat</p>
                                            </div>
                                            <button type="button"
                                                onClick={() => setEditingBot({ ...editingBot, persona_config: { ...editingBot.persona_config, voice_enabled: !editingBot.persona_config?.voice_enabled } })}
                                                className={`relative w-12 h-7 rounded-full transition ${editingBot.persona_config?.voice_enabled ? 'bg-purple-500' : 'bg-gray-600'}`}>
                                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${editingBot.persona_config?.voice_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        {editingBot.persona_config?.voice_enabled && (<>
                                            {/* Provider selector */}
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-400">Voice Provider</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: "openai", label: "OpenAI Realtime", sub: "English voices, ultra-low latency" },
                                                        { id: "elevenlabs", label: "ElevenLabs", sub: "Hindi, Indian & 30+ language voices" },
                                                    ].map(opt => (
                                                        <button key={opt.id} type="button"
                                                            onClick={() => setEditingBot({ ...editingBot, persona_config: { ...editingBot.persona_config, voice_provider: opt.id } })}
                                                            className={`p-3 rounded-xl border text-left transition-all ${(editingBot.persona_config?.voice_provider || "openai") === opt.id ? "border-purple-500 bg-purple-500/15" : "border-white/10 bg-black/30 hover:border-white/20"}`}>
                                                            <p className="text-sm font-bold text-white">{opt.label}</p>
                                                            <p className="text-[10px] text-gray-500 mt-0.5">{opt.sub}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* OpenAI config */}
                                            {(!editingBot.persona_config?.voice_provider || editingBot.persona_config?.voice_provider === "openai") && (
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-400">OpenAI Voice</label>
                                                    <select
                                                        value={editingBot.persona_config?.realtime_voice || "alloy"}
                                                        onChange={e => setEditingBot({ ...editingBot, persona_config: { ...editingBot.persona_config, realtime_voice: e.target.value } })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors appearance-none">
                                                        <option value="alloy">Alloy (neutral)</option>
                                                        <option value="shimmer">Shimmer (warm female)</option>
                                                        <option value="echo">Echo (male)</option>
                                                        <option value="verse">Verse (expressive)</option>
                                                        <option value="ballad">Ballad (calm)</option>
                                                        <option value="ash">Ash (direct)</option>
                                                        <option value="coral">Coral (warm female)</option>
                                                        <option value="sage">Sage (thoughtful)</option>
                                                    </select>
                                                </div>
                                            )}

                                            {/* ElevenLabs config */}
                                            {editingBot.persona_config?.voice_provider === "elevenlabs" && (
                                                <div className="space-y-4">
                                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                                                        <p className="text-[11px] text-emerald-400 font-semibold">Agent auto-provisioned</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">A dedicated ElevenLabs agent is created automatically on first call. No manual setup needed.</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-medium text-gray-400">Voice</label>
                                                        <ElevenVoicePicker
                                                            value={editingBot.persona_config?.elevenlabs_voice_id || ""}
                                                            onChange={id => setEditingBot({ ...editingBot, persona_config: { ...editingBot.persona_config, elevenlabs_voice_id: id } })}
                                                        />
                                                        <p className="text-[10px] text-gray-500">Click to load your ElevenLabs voices — includes preview playback.</p>
                                                    </div>
                                                    <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between text-[10px]">
                                                        <span className="text-gray-500 font-bold uppercase tracking-widest">Latency</span>
                                                        <span className="text-emerald-400 font-bold">eleven_turbo_v2_5 · optimize=4 · ~300ms</span>
                                                    </div>
                                                </div>
                                            )}
                                        </>)}

                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-4">
                                            <div className="p-2 bg-amber-500/20 rounded-xl h-fit"><Zap size={18} className="text-amber-400" /></div>
                                            <div>
                                                <h4 className="text-sm font-bold text-amber-400">Voice Usage Warning</h4>
                                                <p className="text-xs text-gray-400 leading-relaxed mt-1">Real-time voice calls use significantly more compute. Each minute ≈ 30–50 text messages in cost.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {configureTab === "persona_config" && (
                                    <PersonaConfigEditor config={editingBot.persona_config} onChange={cfg => setEditingBot({ ...editingBot, persona_config: cfg })} />
                                )}
                                {configureTab === "page" && (
                                    <PageContentEditor config={editingBot.page_config} onChange={cfg => setEditingBot({ ...editingBot, page_config: cfg })} bot={editingBot} />
                                )}
                                {configureTab === "rate_limits" && (
                                    <div className="space-y-6">
                                        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                                            <p className="text-sm text-indigo-300"><strong>Rate Limit Configuration</strong><br />Set message limits per time window. Use 999999 for unlimited.</p>
                                        </div>

                                        {botUsage && (
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-bold text-gray-300">📊 Current Usage</h3>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-black/50 border border-white/10 rounded-lg p-3">
                                                        <p className="text-xs text-gray-500">This Month</p>
                                                        <p className="text-lg font-bold text-white">{botUsage.current_usage?.month || 0}</p>
                                                    </div>
                                                    <div className="bg-black/50 border border-white/10 rounded-lg p-3">
                                                        <p className="text-xs text-gray-500">Today</p>
                                                        <p className="text-lg font-bold text-white">{botUsage.current_usage?.day || 0}</p>
                                                    </div>
                                                    <div className="bg-black/50 border border-white/10 rounded-lg p-3">
                                                        <p className="text-xs text-gray-500">This Hour</p>
                                                        <p className="text-lg font-bold text-white">{botUsage.current_usage?.hour || 0}</p>
                                                    </div>
                                                    <div className="bg-black/50 border border-white/10 rounded-lg p-3">
                                                        <p className="text-xs text-gray-500">This Minute</p>
                                                        <p className="text-lg font-bold text-white">{botUsage.current_usage?.minute || 0}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-300">📨 Message Limits</h3>
                                            <div className="space-y-3">
                                                {/* Primary Limit */}
                                                <div className="bg-black/30 border border-white/10 rounded-lg p-3 space-y-2">
                                                    <label className="text-xs font-bold text-gray-400">Primary Limit</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            placeholder="500"
                                                            value={editingBot.rate_limits?.primaryLimit?.value ?? ""}
                                                            onChange={e => setEditingBot({
                                                                ...editingBot,
                                                                rate_limits: {
                                                                    ...editingBot.rate_limits,
                                                                    primaryLimit: { ...(editingBot.rate_limits?.primaryLimit || {}), value: +e.target.value }
                                                                }
                                                            })}
                                                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                                                        />
                                                        <select
                                                            value={editingBot.rate_limits?.primaryLimit?.duration ?? "month"}
                                                            onChange={e => setEditingBot({
                                                                ...editingBot,
                                                                rate_limits: {
                                                                    ...editingBot.rate_limits,
                                                                    primaryLimit: { ...(editingBot.rate_limits?.primaryLimit || {}), duration: e.target.value }
                                                                }
                                                            })}
                                                            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 appearance-none"
                                                        >
                                                            <option value="minute">/ Minute</option>
                                                            <option value="hour">/ Hour</option>
                                                            <option value="day">/ Day</option>
                                                            <option value="month">/ Month</option>
                                                        </select>
                                                    </div>
                                                    <p className="text-xs text-gray-500">e.g., 500 messages per month for Starter plan</p>
                                                </div>

                                                {/* Spike Protection Toggle */}
                                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-bold text-blue-400">🛡️ Enable Spike Protection</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSpikeProtectionEnabled(!spikeProtectionEnabled);
                                                                if (!spikeProtectionEnabled && !editingBot.rate_limits?.secondaryLimit) {
                                                                    // Initialize secondary limit if enabling
                                                                    setEditingBot({
                                                                        ...editingBot,
                                                                        rate_limits: {
                                                                            ...editingBot.rate_limits,
                                                                            secondaryLimit: { value: 50, duration: "day" }
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                            className={`relative w-11 h-6 rounded-full transition-colors duration-300 outline-none ${spikeProtectionEnabled || (editingBot.rate_limits?.secondaryLimit?.value) ? 'bg-emerald-500' : 'bg-gray-600'}`}
                                                        >
                                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${spikeProtectionEnabled || (editingBot.rate_limits?.secondaryLimit?.value) ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-blue-300">Prevent customers from abusing the system with rapid-fire requests</p>
                                                </div>

                                                {/* Secondary Limit (Conditional) */}
                                                {(spikeProtectionEnabled || editingBot.rate_limits?.secondaryLimit?.value) && (
                                                    <div className="bg-black/30 border border-emerald-500/30 rounded-lg p-3 space-y-2">
                                                        <label className="text-xs font-bold text-emerald-400">Secondary Limit (Spike Protection)</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                placeholder="e.g., 50 for daily"
                                                                value={editingBot.rate_limits?.secondaryLimit?.value ?? ""}
                                                                onChange={e => setEditingBot({
                                                                    ...editingBot,
                                                                    rate_limits: {
                                                                        ...editingBot.rate_limits,
                                                                        secondaryLimit: { ...(editingBot.rate_limits?.secondaryLimit || {}), value: +e.target.value }
                                                                    }
                                                                })}
                                                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                                                            />
                                                            <select
                                                                value={editingBot.rate_limits?.secondaryLimit?.duration ?? "day"}
                                                                onChange={e => setEditingBot({
                                                                    ...editingBot,
                                                                    rate_limits: {
                                                                        ...editingBot.rate_limits,
                                                                        secondaryLimit: { ...(editingBot.rate_limits?.secondaryLimit || {}), duration: e.target.value }
                                                                    }
                                                                })}
                                                                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 appearance-none"
                                                            >
                                                                <option value="minute">/ Minute</option>
                                                                <option value="hour">/ Hour</option>
                                                                <option value="day">/ Day</option>
                                                                <option value="month">/ Month</option>
                                                            </select>
                                                        </div>
                                                        <p className="text-xs text-emerald-400">e.g., 50/day prevents abuse while allowing 500/month total</p>
                                                    </div>
                                                )}

                                                {/* Burst Limit */}
                                                <div className="bg-black/30 border border-white/10 rounded-lg p-3 space-y-2">
                                                    <label className="text-xs font-bold text-gray-400">Burst Limit (Optional)</label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        placeholder="e.g., 50 for immediate spike protection"
                                                        value={editingBot.rate_limits?.burstLimit ?? ""}
                                                        onChange={e => setEditingBot({
                                                            ...editingBot,
                                                            rate_limits: { ...editingBot.rate_limits, burstLimit: +e.target.value }
                                                        })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-rose-500"
                                                    />
                                                    <p className="text-xs text-gray-500">Max consecutive messages in one second</p>
                                                </div>

                                                {/* Max Bots */}
                                                <div className="bg-black/30 border border-white/10 rounded-lg p-3 space-y-2">
                                                    <label className="text-xs font-bold text-gray-400">Max Bots (Optional)</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        placeholder="e.g., 1 for Starter, 5 for Business"
                                                        value={editingBot.rate_limits?.maxBots ?? ""}
                                                        onChange={e => setEditingBot({
                                                            ...editingBot,
                                                            rate_limits: { ...editingBot.rate_limits, maxBots: +e.target.value }
                                                        })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                                                    />
                                                    <p className="text-xs text-gray-500">Maximum number of bots this account can create</p>
                                                </div>
                                            </div>

                                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                                <p className="text-xs text-purple-300">💡 <strong>Example Plans:</strong></p>
                                                <p className="text-xs text-purple-200 mt-1">
                                                  • <strong>Starter:</strong> 500/month (primary), 50/day spike protection<br/>
                                                  • <strong>Business:</strong> 5000/month + 100/day spike protection<br/>
                                                  • <strong>Enterprise:</strong> 50000/month + no spike protection
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {configureTab === "embed" && (
                                    <div className="space-y-6">
                                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 relative overflow-hidden">
                                            <div className="relative z-10">
                                                <h3 className="text-sm font-bold text-white mb-2">Embed this Bot on Your Website</h3>
                                                <p className="text-xs text-purple-200 mb-4 max-w-lg">Copy and paste this snippet just before the closing <code>&lt;/body&gt;</code> tag on your website to display the floating chat widget on your own site.</p>
                                                
                                                <div className="relative bg-[#050505] border border-white/20 rounded-xl p-5 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap shadow-inner leading-relaxed">
                                                    {`<script \n  src="https://redber.in/widget.js" \n  data-bot-id="${editingBot.id}" \n  async\n></script>`}
                                                    
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            navigator.clipboard.writeText(`<script src="https://redber.in/widget.js" data-bot-id="${editingBot.id}" async></script>`);
                                                            alert("Copied directly to clipboard!");
                                                        }}
                                                        className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-white/10 shadow-lg"
                                                    >
                                                        Copy Script
                                                    </button>
                                                </div>
                                                
                                                <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">The widget will automatically attach itself to the bottom right corner of the screen when loaded. Ensure your website allows embedded third-party iframes.</p>
                                            </div>
                                            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />
                                        </div>

                                        {/* ── Domain Allowlist ─────────────────────────────────────────── */}
                                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                                            <div>
                                                <h3 className="text-sm font-bold text-amber-400">🔒 Domain Allowlist</h3>
                                                <p className="text-xs text-gray-400 mt-1">Restrict this bot to only work on specific client domains. Leave empty to allow all websites (default).</p>
                                            </div>
                                            <div className="space-y-2">
                                                {(editingBot.allowed_domains || []).map((domain: string, idx: number) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={domain}
                                                            onChange={e => {
                                                                const updated = [...(editingBot.allowed_domains || [])];
                                                                updated[idx] = e.target.value;
                                                                setEditingBot({ ...editingBot, allowed_domains: updated });
                                                            }}
                                                            placeholder="e.g. acenzos.com"
                                                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-amber-500 transition-colors"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = (editingBot.allowed_domains || []).filter((_: string, i: number) => i !== idx);
                                                                setEditingBot({ ...editingBot, allowed_domains: updated });
                                                            }}
                                                            className="px-3 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors text-xs font-bold"
                                                        >✕</button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingBot({ ...editingBot, allowed_domains: [...(editingBot.allowed_domains || []), ""] })}
                                                    className="text-xs text-amber-400 hover:text-amber-300 font-bold border border-amber-500/30 rounded-lg px-3 py-1.5 transition-colors w-full hover:bg-amber-500/10"
                                                >+ Add Domain</button>
                                            </div>
                                            <p className="text-[10px] text-gray-500">Example: <code className="text-amber-400/80">acenzos.com</code> — do not include https:// or trailing slash. The check ignores www automatically.</p>
                                        </div>
                                        
                                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                            <h3 className="text-sm font-bold text-blue-400 mb-2">Direct Sharing Link</h3>
                                            <p className="text-xs text-blue-200 mb-4 max-w-lg">Share this link to give users direct access to the chatbot's landing page (great for social media, WhatsApp, or email signatures).</p>
                                            
                                            <div className="relative bg-black/50 border border-white/10 rounded-xl p-4 pr-32 font-mono text-xs text-blue-300 break-all select-all flex items-center">
                                                https://redber.in/chat/{editingBot.id}
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`https://redber.in/chat/${editingBot.id}`);
                                                        alert("Copied direct link!");
                                                    }}
                                                    className="absolute top-2.5 right-3 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-colors shadow"
                                                >
                                                    Copy Link
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end p-6 border-t border-white/5 gap-3 shrink-0">
                                <button type="button" onClick={() => setEditingBot(null)} className="px-6 py-2.5 rounded-xl font-semibold text-gray-300 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" disabled={isSaving} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50">
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {creatingBot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
                            <h2 className="text-xl font-bold">✨ Create New Bot</h2>
                            <button onClick={() => setCreatingBot(false)} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Bot ID <span className="text-gray-600">(unique)</span></label>
                                    <input type="text" required value={newBot.id} onChange={e => setNewBot(p => ({ ...p, id: e.target.value.replace(/\s/g, "_").toLowerCase() }))}
                                        placeholder="e.g. spa_ai" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
                                    <input type="text" required value={newBot.name} onChange={e => setNewBot(p => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. Aria" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition-colors" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Role / Title</label>
                                    <input type="text" required value={newBot.role} onChange={e => setNewBot(p => ({ ...p, role: e.target.value }))}
                                        placeholder="e.g. Concierge" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition-colors" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 col-span-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Industry <span className="text-gray-600">(for Auto-Training)</span></label>
                                        <div className="flex gap-2 mb-2">
                                            <button type="button" onClick={() => { setNewBot(p => ({ ...p, role: 'Receptionist' })); setAutoGenFields({ industry: 'Restaurant', tone: 'Friendly' }); }} className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded hover:bg-purple-500/30">🍽️ Restaurant</button>
                                            <button type="button" onClick={() => { setNewBot(p => ({ ...p, role: 'Sales Agent' })); setAutoGenFields({ industry: 'Automotive Dealership', tone: 'Persuasive' }); }} className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-500/30">🚗 Car Dealer</button>
                                            <button type="button" onClick={() => { setNewBot(p => ({ ...p, role: 'Front Desk' })); setAutoGenFields({ industry: 'Dental Clinic', tone: 'Empathetic' }); }} className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded hover:bg-emerald-500/30">🏥 Clinic</button>
                                        </div>
                                        <input type="text" value={autoGenFields.industry} onChange={e => setAutoGenFields(p => ({ ...p, industry: e.target.value }))}
                                            placeholder="e.g. Restaurant, Healthcare" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Tone of Voice</label>
                                        <select value={autoGenFields.tone} onChange={e => setAutoGenFields(p => ({ ...p, tone: e.target.value }))}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition-colors appearance-none">
                                            <option value="Friendly">Friendly</option>
                                            <option value="Professional">Professional</option>
                                            <option value="Casual">Casual</option>
                                            <option value="Empathetic">Empathetic</option>
                                            <option value="Persuasive">Persuasive (Sales)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    if (!newBot.name || !newBot.role || !autoGenFields.industry) { alert("Please fill Name, Role, and Industry first!"); return; }
                                    setIsGenerating(true);
                                    try {
                                        const res = await authFetch(`${API_BASE}/api/admin/bots/generate-persona`, {
                                            method: "POST", headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ bot_name: newBot.name, role: newBot.role, industry: autoGenFields.industry, tone: autoGenFields.tone, restricted_topics: [] })
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            setNewBot(p => ({ ...p, persona_prompt: data.persona_prompt }));
                                            alert(`Generated! Also extracted ${data.suggested_knowledge?.length || 0} suggested knowledge facts. (They will be active when bot is created).`);
                                        } else alert(data.detail);
                                    } catch { alert("Failed to connect") }
                                    finally { setIsGenerating(false); }
                                }}
                                disabled={isGenerating}
                                className="w-full bg-gradient-to-r flex items-center justify-center gap-2 from-purple-600 to-indigo-600 outline-none text-white px-4 py-3 rounded-xl font-bold shadow-lg shadow-purple-900/40 hover:scale-[1.01] transition-all disabled:opacity-50"
                            >
                                {isGenerating ? "🧠 AI Auto-Training..." : "✨ Auto-Train AI Persona Base"}
                            </button>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Basic Prompt (Auto-filled or Manual)</label>
                                <textarea required value={newBot.persona_prompt} onChange={e => setNewBot(p => ({ ...p, persona_prompt: e.target.value }))}
                                    placeholder="You are [Name], a [role]... (Generate above or type here)"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition-colors h-32 resize-none" />
                            </div>
                            <div className="flex justify-end pt-4 border-t border-white/5 gap-3">
                                <button type="button" onClick={() => setCreatingBot(false)} className="px-6 py-2.5 rounded-xl font-semibold text-gray-300 hover:text-white transition-colors">Cancel</button>
                                <button type="submit" disabled={isSaving} className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white px-8 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-700/20">
                                    {isSaving ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
