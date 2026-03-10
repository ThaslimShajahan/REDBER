"use client";
import { useState, useEffect } from "react";
import { API_BASE } from "../../../lib/api";
import { Plus, Send, Trash2, PenLine, Check } from "lucide-react";

type QA = { question: string; answer: string };

export default function TrainingStudio() {
    const [bots, setBots] = useState<any[]>([]);
    const [selectedBotId, setSelectedBotId] = useState("");
    const [entries, setEntries] = useState<QA[]>([{ question: "", answer: "" }]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/admin/bots`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setBots(data);
                    setSelectedBotId(data[0].id);
                }
            });
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4000);
    };

    const handleAddRow = () => setEntries(prev => [...prev, { question: "", answer: "" }]);
    const handleRemoveRow = (i: number) => setEntries(prev => prev.filter((_, idx) => idx !== i));
    const handleChange = (i: number, field: "question" | "answer", value: string) => {
        setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
    };

    const handleSave = async () => {
        const valid = entries.filter(e => e.question.trim() && e.answer.trim());
        if (!valid.length) { showToast("❌ Add at least one Question & Answer pair."); return; }
        if (!selectedBotId) { showToast("❌ Select a Bot first."); return; }

        setSaving(true);
        try {
            // Compose all Q&A into a single rich knowledge text
            const textContent = valid.map(e => `Q: ${e.question.trim()}\nA: ${e.answer.trim()}`).join("\n\n---\n\n");
            const res = await fetch(`${API_BASE}/api/admin/kb/ingest_text`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bot_id: selectedBotId,
                    source_name: `Manual Training — ${new Date().toLocaleDateString()}`,
                    text_content: textContent,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setSaved(true);
                showToast(`✅ ${data.chunks_inserted} training chunks permanently saved to AI brain!`);
                setEntries([{ question: "", answer: "" }]);
                setTimeout(() => setSaved(false), 3000);
            } else {
                showToast(data.detail || "❌ Save failed.");
            }
        } catch {
            showToast("❌ Network error.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            {toast && (
                <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-2xl border bg-[#0a1a0a] border-emerald-500/30 text-emerald-300 animate-in slide-in-from-top-2">
                    {toast}
                </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/20 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-white mb-1 flex items-center gap-3">
                        <PenLine className="text-purple-400" size={24} /> AI Training Studio
                    </h2>
                    <p className="text-purple-100/60 text-sm leading-relaxed max-w-xl">
                        Directly teach your AI custom knowledge. Each Q&A pair you enter is vectorized and permanently ingested into the bot's brain — no PDF required.
                    </p>
                </div>
            </div>

            {/* Bot selector */}
            <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">1. Select the bot to train:</p>
                <div className="flex flex-wrap gap-3">
                    {bots.map(b => (
                        <button
                            key={b.id}
                            onClick={() => setSelectedBotId(b.id)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${selectedBotId === b.id ? "bg-purple-500/20 border-purple-500/60 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}
                        >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${b.theme_color || "bg-purple-600"}`}>{b.name[0]}</div>
                            <span className="text-sm font-semibold">{b.name}</span>
                            {selectedBotId === b.id && <Check size={14} className="text-purple-400" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Q&A Table */}
            <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">2. Enter Question & Answer pairs:</p>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-0 text-xs text-gray-500 uppercase tracking-widest border-b border-white/10 px-4 py-3 bg-white/3">
                        <span>Question</span>
                        <span>Answer</span>
                        <span />
                    </div>
                    <div className="divide-y divide-white/5">
                        {entries.map((entry, i) => (
                            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-0 items-start hover:bg-white/3 transition-colors">
                                <textarea
                                    value={entry.question}
                                    onChange={e => handleChange(i, "question", e.target.value)}
                                    placeholder="e.g. What are your opening hours?"
                                    rows={2}
                                    className="w-full bg-transparent border-r border-white/5 px-4 py-3 text-sm text-white outline-none placeholder-gray-600 resize-none focus:bg-white/5 transition-colors"
                                />
                                <textarea
                                    value={entry.answer}
                                    onChange={e => handleChange(i, "answer", e.target.value)}
                                    placeholder="e.g. We are open 9am – 9pm, 7 days a week."
                                    rows={2}
                                    className="w-full bg-transparent border-r border-white/5 px-4 py-3 text-sm text-white outline-none placeholder-gray-600 resize-none focus:bg-white/5 transition-colors"
                                />
                                <button
                                    onClick={() => handleRemoveRow(i)}
                                    className="p-4 text-gray-600 hover:text-rose-400 transition-colors"
                                    disabled={entries.length === 1}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-white/5">
                        <button onClick={handleAddRow} className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors px-2 py-1">
                            <Plus size={16} /> Add another row
                        </button>
                    </div>
                </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black text-sm transition-all shadow-lg ${saved ? "bg-emerald-500 shadow-emerald-500/30" : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/40"} disabled:opacity-50`}
                >
                    {saving ? (
                        <><span className="animate-spin">⚙️</span> Training AI...</>
                    ) : saved ? (
                        <><Check size={18} /> Saved to Brain!</>
                    ) : (
                        <><Send size={18} /> Train AI Now</>
                    )}
                </button>
            </div>
        </div>
    );
}
