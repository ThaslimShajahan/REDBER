import { useState, useCallback } from "react";
import { API_BASE, authFetch } from "../../../lib/api";

const INPUT_CLS = "w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors";
const LABEL_CLS = "block text-xs font-semibold text-gray-400 mb-1";
const SECTION_CLS = "bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-4 mb-5";

// ─── ElevenLabs Voice Picker ──────────────────────────────────────────────────
function ElevenVoicePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
    const [voices, setVoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    const loadVoices = useCallback(async () => {
        if (loaded) { setOpen(true); return; }
        setLoading(true);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/elevenlabs/voices`);
            const data = await res.json();
            setVoices(Array.isArray(data) ? data : []);
            setLoaded(true);
            setOpen(true);
        } catch {
            alert("Failed to load ElevenLabs voices. Check your API key.");
        } finally {
            setLoading(false);
        }
    }, [loaded]);

    const playPreview = (url: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (audio) { audio.pause(); setAudio(null); setPreviewUrl(""); }
        if (previewUrl === url) return;
        const a = new Audio(url);
        a.play();
        a.onended = () => { setAudio(null); setPreviewUrl(""); };
        setAudio(a);
        setPreviewUrl(url);
    };

    const filtered = voices.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.labels?.accent?.toLowerCase().includes(search.toLowerCase()) ||
        v.labels?.language?.toLowerCase().includes(search.toLowerCase())
    );

    const selected = voices.find(v => v.voice_id === value);

    return (
        <div className="relative">
            <label className={LABEL_CLS}>ElevenLabs Voice</label>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={loadVoices}
                    disabled={loading}
                    className="flex-1 flex items-center justify-between bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white hover:border-purple-500/60 transition-colors text-left"
                >
                    <span className={selected ? "text-white font-semibold" : "text-gray-500"}>
                        {loading ? "Loading voices…" : selected ? selected.name : "Select a voice…"}
                    </span>
                    <span className="text-gray-500 ml-2">{loading ? "⟳" : "▾"}</span>
                </button>
                {value && (
                    <button type="button" onClick={() => onChange("")}
                        className="px-2 text-gray-600 hover:text-rose-400 transition-colors text-sm">✕</button>
                )}
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-white/5">
                        <input
                            autoFocus
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                            placeholder="Search by name, accent, language…"
                            value={search} onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                        {filtered.length === 0 && (
                            <div className="px-4 py-3 text-xs text-gray-500">No voices found</div>
                        )}
                        {filtered.map(v => (
                            <div
                                key={v.voice_id}
                                onClick={() => { onChange(v.voice_id); setOpen(false); setSearch(""); }}
                                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/5 transition-colors ${value === v.voice_id ? "bg-purple-900/30" : ""}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{v.name}</p>
                                    <p className="text-[10px] text-gray-500 truncate">
                                        {[v.labels?.accent, v.labels?.language, v.category].filter(Boolean).join(" · ")}
                                    </p>
                                </div>
                                {value === v.voice_id && <span className="text-purple-400 text-xs shrink-0">✓</span>}
                                {v.preview_url && (
                                    <button
                                        type="button"
                                        onClick={e => playPreview(v.preview_url, e)}
                                        className={`shrink-0 text-[10px] px-2 py-1 rounded-lg border transition-colors ${previewUrl === v.preview_url ? "bg-purple-600 text-white border-purple-500" : "bg-white/5 text-gray-400 border-white/10 hover:text-white"}`}
                                    >
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
            {value && !selected && loaded && (
                <p className="text-[10px] text-gray-600 mt-1 font-mono">{value}</p>
            )}
            {!loaded && value && (
                <p className="text-[10px] text-gray-600 mt-1 font-mono">ID: {value}</p>
            )}
        </div>
    );
}

export default function PersonaConfigEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
    const p = config || {};
    const set = (key: string, val: any) => onChange({ ...p, [key]: val });

    const handleArray = (key: string, val: string) => {
        const arr = val.split(',').map(s => s.trim()).filter(s => s);
        set(key, arr);
    };

    return (
        <div className="text-sm">
            <p className="text-xs text-gray-500 bg-white/5 rounded-xl px-3 py-2 border border-white/5 mb-5">
                These settings drive the AI's core instructions and behavior pattern dynamically.
            </p>

            {/* Basic Info */}
            <div className={SECTION_CLS}>
                <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2">Basic Profile</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL_CLS}>Industry / Vertical</label>
                        <input className={INPUT_CLS} placeholder="Restaurant, Dealership, Clinic..." value={p.industry || ""} onChange={e => set("industry", e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Primary Language</label>
                        <select className={INPUT_CLS + " appearance-none"} value={p.language || "English"} onChange={e => set("language", e.target.value)}>
                            <option value="English">English</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="Arabic">Arabic</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Behavior Controls */}
            <div className={SECTION_CLS}>
                <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2">Behavior & Tone</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL_CLS}>Tone of Voice</label>
                        <select className={INPUT_CLS + " appearance-none"} value={p.tone || "Friendly"} onChange={e => set("tone", e.target.value)}>
                            <option value="Friendly & Warm">Friendly & Warm</option>
                            <option value="Formal & Professional">Formal & Professional</option>
                            <option value="Sales-oriented & Enthusiastic">Sales-oriented & Enthusiastic</option>
                            <option value="Empathetic & Caring">Empathetic & Caring</option>
                        </select>
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Conversation Length</label>
                        <select className={INPUT_CLS + " appearance-none"} value={p.conversation_length || "Medium"} onChange={e => set("conversation_length", e.target.value)}>
                            <option value="Short & Direct">Short & Direct</option>
                            <option value="Medium Balanced">Medium Balanced</option>
                            <option value="Detailed & Descriptive">Detailed & Descriptive</option>
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className={LABEL_CLS}>Personality Strength (1-10)</label>
                        <div className="flex items-center gap-3">
                            <input type="range" min="1" max="10" value={p.personality_level || 5} onChange={e => set("personality_level", parseInt(e.target.value))} className="flex-1 accent-purple-500" />
                            <span className="text-xs font-bold w-6 text-center">{p.personality_level || 5}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">1 = Very robotic/factual, 10 = Highly expressive/roleplay</p>
                    </div>
                </div>
            </div>

            {/* Sales & Conversion */}
            <div className={SECTION_CLS}>
                <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2">Sales & Conversion</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                        <input type="checkbox" checked={p.lead_capture_mode ?? true} onChange={e => set("lead_capture_mode", e.target.checked)} className="w-4 h-4 accent-purple-500" />
                        <div>
                            <p className="text-sm font-semibold">Lead Capture Mode</p>
                            <p className="text-[10px] text-gray-400">Actively try to get name/phone</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                        <input type="checkbox" checked={p.upsell_suggestions ?? false} onChange={e => set("upsell_suggestions", e.target.checked)} className="w-4 h-4 accent-purple-500" />
                        <div>
                            <p className="text-sm font-semibold">Upsell Suggestions</p>
                            <p className="text-[10px] text-gray-400">Offer complementary items</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                        <input type="checkbox" checked={p.allow_bookings ?? true} onChange={e => set("allow_bookings", e.target.checked)} className="w-4 h-4 accent-purple-500" />
                        <div>
                            <p className="text-sm font-semibold">Accept Bookings & Reservations</p>
                            <p className="text-[10px] text-gray-400">Bot can capture booking requests from chat</p>
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label className={LABEL_CLS}>Ask for contact details after X messages</label>
                        <input type="number" min="1" max="10" className={INPUT_CLS} value={p.ask_contact_after || 3} onChange={e => set("ask_contact_after", parseInt(e.target.value))} />
                    </div>
                    <div className="col-span-2">
                        <label className={LABEL_CLS}>Primary Goals (comma separated)</label>
                        <input className={INPUT_CLS} placeholder="e.g. Table reservations, Email capture"
                            value={(p.goals || []).join(', ')} onChange={e => handleArray("goals", e.target.value)} />
                    </div>
                    <div className="col-span-2">
                        <label className={LABEL_CLS}>Notification Email</label>
                        <input type="email" className={INPUT_CLS} placeholder="admin@yourdomain.com"
                            value={p.admin_email || ""} onChange={e => set("admin_email", e.target.value)} />
                        <p className="text-[10px] text-gray-500 mt-1">Lead & booking alerts will be sent here</p>
                    </div>
                </div>
            </div>

            {/* Voice Call Settings */}
            <div className={SECTION_CLS}>
                <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2">🎙️ Voice Call</h4>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                        <input type="checkbox" checked={p.voice_enabled ?? false} onChange={e => set("voice_enabled", e.target.checked)} className="w-4 h-4 accent-purple-500" id="voice-enabled-toggle" />
                        <label htmlFor="voice-enabled-toggle" className="cursor-pointer">
                            <p className="text-sm font-semibold">Enable AI Voice Call</p>
                            <p className="text-[10px] text-gray-400">Shows the phone button on the chatbot</p>
                        </label>
                    </div>
                    {p.voice_enabled && (
                        <div className="space-y-3 pl-1">
                            <div>
                                <label className={LABEL_CLS}>Voice Provider</label>
                                <select className={INPUT_CLS + " appearance-none"} value={p.voice_provider || "openai"} onChange={e => set("voice_provider", e.target.value)}>
                                    <option value="openai">OpenAI Realtime (English voices)</option>
                                    <option value="elevenlabs">ElevenLabs (Hindi, Indian & 30+ languages)</option>
                                </select>
                            </div>
                            {(!p.voice_provider || p.voice_provider === "openai") && (
                                <div>
                                    <label className={LABEL_CLS}>OpenAI Voice</label>
                                    <select className={INPUT_CLS + " appearance-none"} value={p.realtime_voice || "alloy"} onChange={e => set("realtime_voice", e.target.value)}>
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
                            {p.voice_provider === "elevenlabs" && (
                                <>
                                    <div>
                                        <label className={LABEL_CLS}>ElevenLabs Agent ID</label>
                                        <input className={INPUT_CLS} placeholder="e.g. abc123xyz..."
                                            value={p.elevenlabs_agent_id || ""} onChange={e => set("elevenlabs_agent_id", e.target.value)} />
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Create an agent at <strong className="text-purple-400">elevenlabs.io → ElevenAgents</strong> → copy the Agent ID
                                        </p>
                                    </div>
                                    <ElevenVoicePicker
                                        value={p.elevenlabs_voice_id || ""}
                                        onChange={id => set("elevenlabs_voice_id", id)}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Restrictions */}
            <div className={SECTION_CLS}>
                <h4 className="text-sm font-bold text-rose-400 border-b border-rose-500/10 pb-2">Guardrails & Restrictions</h4>
                <div className="space-y-4 pt-2">
                    <div>
                        <label className={LABEL_CLS}>Topics AI Must Avoid (comma separated)</label>
                        <input className={INPUT_CLS} placeholder="Politics, competitor pricing, medical advice..."
                            value={(p.restricted_topics || []).join(', ')} onChange={e => handleArray("restricted_topics", e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Compliance / Safety Rules (comma separated)</label>
                        <input className={INPUT_CLS} placeholder="Do not promise discounts, Do not guarantee dates..."
                            value={(p.compliance_rules || []).join(', ')} onChange={e => handleArray("compliance_rules", e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Out of Scope Response</label>
                        <textarea className={INPUT_CLS + " h-16 resize-none"} placeholder="What the AI says when declining a topic..."
                            value={p.out_of_scope_response || ""} onChange={e => set("out_of_scope_response", e.target.value)} />
                    </div>
                </div>
            </div>
        </div>
    );
}
