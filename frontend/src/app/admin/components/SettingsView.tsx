import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { API_BASE } from "../../../lib/api";
import PageContentEditor from "./PageContentEditor";
import PersonaConfigEditor from "./PersonaConfigEditor";

export default function SettingsView() {
    const [bots, setBots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBot, setEditingBot] = useState<any>(null);
    const [configureTab, setConfigureTab] = useState<"persona_prompt" | "persona_config" | "page">("persona_prompt");
    const [creatingBot, setCreatingBot] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newBot, setNewBot] = useState({
        id: "", name: "", role: "", persona_prompt: "",
        theme_color: "bg-gradient-to-r from-purple-500 to-indigo-600",
        avatar: "", status: "Active"
    });
    const [autoGenFields, setAutoGenFields] = useState({ industry: "", tone: "Friendly" });
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchBots = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/admin/bots`)
            .then(res => res.json())
            .then(data => {
                setBots(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchBots();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/bots/${editingBot.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingBot.name,
                    role: editingBot.role,
                    theme_color: editingBot.theme_color,
                    persona_prompt: editingBot.persona_prompt,
                    avatar: editingBot.avatar || "",
                    status: editingBot.status || "Active",
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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/bots`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBot)
            });
            if (res.ok) {
                setCreatingBot(false);
                setNewBot({ id: "", name: "", role: "", persona_prompt: "", theme_color: "bg-gradient-to-r from-purple-500 to-indigo-600", avatar: "", status: "Active" });
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
        await fetch(`${API_BASE}/api/admin/bots/${botId}`, { method: "DELETE" });
    };

    if (loading && bots.length === 0) return <div className="text-gray-500 text-center p-8">Loading bots...</div>;

    const toggleBotStatus = async (bot: any) => {
        const newStatus = bot.status === "Active" ? "Inactive" : "Active";
        setBots(prev => prev.map(b => b.id === bot.id ? { ...b, status: newStatus } : b));
        try {
            await fetch(`${API_BASE}/api/admin/bots/${bot.id}`, {
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
                                className={`relative w-11 h-6 rounded-full transition-colors duration-300 outline-none ${bot.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-600'}`}
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
                                    {(["persona_prompt", "persona_config", "page"] as const).map(tab => (
                                        <button key={tab} onClick={() => setConfigureTab(tab)}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${configureTab === tab ? "bg-white/15 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                                            {tab === "persona_prompt" ? "🤖 Base Core" : tab === "persona_config" ? "🎛️ Persona Tuning" : "📄 Public Page Config"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => setEditingBot(null)} className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Core Identity Prompt</label>
                                            <textarea value={editingBot.persona_prompt} onChange={e => setEditingBot({ ...editingBot, persona_prompt: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 transition-colors h-48 resize-none" />
                                            <p className="text-xs text-gray-500 mt-2">The fundamental prompt defining how the AI acts. This merges with the Persona Configuration settings.</p>
                                        </div>
                                    </>
                                )}
                                {configureTab === "persona_config" && (
                                    <PersonaConfigEditor config={editingBot.persona_config} onChange={cfg => setEditingBot({ ...editingBot, persona_config: cfg })} />
                                )}
                                {configureTab === "page" && (
                                    <PageContentEditor config={editingBot.page_config} onChange={cfg => setEditingBot({ ...editingBot, page_config: cfg })} />
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
                                        const res = await fetch(`${API_BASE}/api/admin/bots/generate-persona`, {
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
