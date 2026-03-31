import { useState } from "react";
import { API_BASE, authFetch } from "../../../lib/api";

const INPUT_CLS = "w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 transition-colors";
const LABEL_CLS = "block text-xs font-semibold text-gray-400 mb-1";
const SECTION_CLS = "bg-white/[0.03] border border-white/8 rounded-2xl p-4 space-y-3";

export default function PageContentEditor({ config, onChange, bot }: { config: any; onChange: (c: any) => void; bot?: any }) {
    const pc = config || {};
    const set = (key: string, val: any) => onChange({ ...pc, [key]: val });
    const [isGeneratingQ, setIsGeneratingQ] = useState(false);

    const generateQuestions = async () => {
        if (!bot) return alert("Please save the bot at least once before auto-generating questions.");
        setIsGeneratingQ(true);
        try {
            const res = await authFetch(`${API_BASE}/api/admin/bots/generate-questions`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    bot_name: bot.name, 
                    role: bot.role, 
                    industry: bot.persona_config?.industry || "General",
                    tone: bot.persona_config?.tone || "Friendly" 
                })
            });
            const data = await res.json();
            if (res.ok) {
                set("suggested_questions", data.questions || []);
            } else {
                alert(data.detail || "Failed to generate questions");
            }
        } catch {
            alert("Network error");
        } finally {
            setIsGeneratingQ(false);
        }
    };

    const features: any[] = pc.about?.features || [];
    const setFeatures = (f: any[]) => set("about", { ...(pc.about || {}), features: f });
    const addFeature = () => setFeatures([...features, { label: "", text: "" }]);
    const updateFeature = (i: number, k: string, v: string) => setFeatures(features.map((f, fi) => fi === i ? { ...f, [k]: v } : f));
    const removeFeature = (i: number) => setFeatures(features.filter((_, fi) => fi !== i));

    const sections: any[] = pc.sections || [];
    const setSections = (s: any[]) => set("sections", s);
    const addSection = (type: string) => setSections([...sections, { type, title: "", items: [], image: "" }]);
    const updateSection = (si: number, k: string, v: any) => setSections(sections.map((s, i) => i === si ? { ...s, [k]: v } : s));
    const removeSection = (si: number) => setSections(sections.filter((_, i) => i !== si));
    const addSectionItem = (si: number) => {
        const s = sections[si];
        const blank = s.type === "steps"
            ? { num: String(s.items.length + 1), title: "", text: "", image: "" }
            : s.type === "benefits" ? { label: "", text: "" }
                : { image: "", text: "" };
        updateSection(si, "items", [...(s.items || []), blank]);
    };
    const updateSectionItem = (si: number, ii: number, k: string, v: string) => {
        const items = [...(sections[si].items || [])];
        items[ii] = { ...items[ii], [k]: v };
        updateSection(si, "items", items);
    };
    const removeSectionItem = (si: number, ii: number) =>
        updateSection(si, "items", sections[si].items.filter((_: any, i: number) => i !== ii));

    return (
        <div className="space-y-5 text-sm">
            <p className="text-xs text-gray-500 bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                Configure what visitors see on the public chat page for this bot. Changes are reflected immediately after saving.
            </p>

            <div className={SECTION_CLS}>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">🏷️ Basic Info</p>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={LABEL_CLS}>Tagline</label>
                        <input className={INPUT_CLS} placeholder="Fine Dining Concierge" value={pc.tagline || ""} onChange={e => set("tagline", e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Hero Image URL</label>
                        <input className={INPUT_CLS} placeholder="https://..." value={pc.hero_image || ""} onChange={e => set("hero_image", e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Location</label>
                        <input className={INPUT_CLS} placeholder="14 Spice Lane, London" value={pc.location || ""} onChange={e => set("location", e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Opening Hours</label>
                        <input className={INPUT_CLS} placeholder="Mon–Sun: 12pm – 11pm" value={pc.hours || ""} onChange={e => set("hours", e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Phone</label>
                        <input className={INPUT_CLS} placeholder="+44 20 7946 0123" value={pc.phone || ""} onChange={e => set("phone", e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL_CLS}>Website</label>
                        <input className={INPUT_CLS} placeholder="yoursite.com" value={pc.website || ""} onChange={e => set("website", e.target.value)} />
                    </div>
                </div>
            </div>

            <div className={SECTION_CLS}>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">👤 About Section</p>
                <div>
                    <label className={LABEL_CLS}>Section Title</label>
                    <input className={INPUT_CLS} placeholder="Meet Priya" value={pc.about?.title || ""} onChange={e => set("about", { ...(pc.about || {}), title: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className={LABEL_CLS}>Feature Bullets</label>
                    {features.map((f, i) => (
                        <div key={i} className="flex gap-2 items-start">
                            <input className={INPUT_CLS} placeholder="Label" value={f.label} onChange={e => updateFeature(i, "label", e.target.value)} style={{ width: "35%" }} />
                            <input className={INPUT_CLS} placeholder="Description text..." value={f.text} onChange={e => updateFeature(i, "text", e.target.value)} style={{ flex: 1 }} />
                            <button type="button" onClick={() => removeFeature(i)} className="text-rose-400 hover:text-rose-300 text-lg leading-none pt-2">×</button>
                        </div>
                    ))}
                    <button type="button" onClick={addFeature} className="text-xs text-red-400 font-semibold border border-red-500/20 px-3 py-1.5 rounded-lg">+ Add feature bullet</button>
                </div>
            </div>

            {/* ===================== SUGGESTED QUESTIONS — PREMIUM SECTION ===================== */}
            <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-white flex items-center gap-2">💬 Suggested Questions</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Shown as quick-tap chips when user opens chat. Drives engagement instantly.</p>
                    </div>
                    <button
                        type="button"
                        onClick={generateQuestions}
                        disabled={isGeneratingQ}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-lg shadow-purple-900/30 hover:scale-[1.02] transition-all disabled:opacity-50 shrink-0"
                    >
                        {isGeneratingQ ? (
                            <><span className="animate-spin">⟳</span> Generating...</>
                        ) : (
                            <>✨ AI Generate</>
                        )}
                    </button>
                </div>

                {/* Live Preview */}
                {(pc.suggested_questions || []).filter((q: string) => q.trim()).length > 0 && (
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                        <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mb-2">Preview (how users see them)</p>
                        <div className="flex flex-wrap gap-2">
                            {(pc.suggested_questions || []).filter((q: string) => q.trim()).map((q: string, i: number) => (
                                <span key={i} className="text-[10px] bg-white/8 border border-white/10 text-gray-300 px-3 py-1.5 rounded-full font-medium">
                                    {q}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Question inputs */}
                <div className="space-y-2">
                    {(pc.suggested_questions || []).map((q: string, i: number) => (
                        <div key={i} className="flex gap-2 items-center group">
                            <div className="flex-1 relative">
                                <input
                                    className="w-full bg-black/50 border border-white/10 focus:border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors pr-10"
                                    placeholder={i === 0 ? "E.g. What are your opening hours?" : i === 1 ? "E.g. What services do you offer?" : "E.g. How can I book an appointment?"}
                                    value={q}
                                    maxLength={60}
                                    onChange={e => {
                                        const next = [...(pc.suggested_questions || [])];
                                        next[i] = e.target.value;
                                        set("suggested_questions", next);
                                    }}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-600">{q.length}/60</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => set("suggested_questions", (pc.suggested_questions || []).filter((_: any, idx: number) => idx !== i))}
                                className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 text-base leading-none shrink-0 w-7 h-7 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-all"
                            >×</button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <button
                        type="button"
                        onClick={() => set("suggested_questions", [...(pc.suggested_questions || []), ""])}
                        disabled={(pc.suggested_questions || []).length >= 6}
                        className="text-[10px] text-indigo-400 font-bold border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors disabled:opacity-40"
                    >
                        + Add Question {(pc.suggested_questions || []).length > 0 ? `(${(pc.suggested_questions || []).length}/6)` : ""}
                    </button>
                    {(pc.suggested_questions || []).length > 0 && (
                        <button
                            type="button"
                            onClick={() => set("suggested_questions", [])}
                            className="text-[10px] text-gray-600 hover:text-rose-400 transition-colors"
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            <div className={SECTION_CLS}>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">📐 Page Sections</p>
                {sections.map((sec, si) => (
                    <div key={si} className="border border-white/10 rounded-xl p-3 space-y-3 bg-white/[0.02]">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-bold uppercase">{sec.type}</span>
                                <input className={INPUT_CLS + " w-64"} placeholder="Section title" value={sec.title} onChange={e => updateSection(si, "title", e.target.value)} />
                            </div>
                            <button type="button" onClick={() => removeSection(si)} className="text-rose-400 hover:text-rose-300 text-xs font-bold">✕ Remove</button>
                        </div>

                        {sec.type === "benefits" && (
                            <div>
                                <label className={LABEL_CLS}>Side Image URL (optional)</label>
                                <input className={INPUT_CLS} placeholder="https://..." value={sec.image || ""} onChange={e => updateSection(si, "image", e.target.value)} />
                            </div>
                        )}

                        <div className="space-y-2">
                            {(sec.items || []).map((item: any, ii: number) => (
                                <div key={ii} className="flex gap-2 items-start bg-black/30 rounded-lg p-2">
                                    {sec.type === "steps" && (
                                        <>
                                            <input className={INPUT_CLS} placeholder="#" value={item.num || ""} onChange={e => updateSectionItem(si, ii, "num", e.target.value)} style={{ width: "32px" }} />
                                            <input className={INPUT_CLS} placeholder="Title" value={item.title || ""} onChange={e => updateSectionItem(si, ii, "title", e.target.value)} style={{ flex: 1 }} />
                                            <input className={INPUT_CLS} placeholder="Description" value={item.text || ""} onChange={e => updateSectionItem(si, ii, "text", e.target.value)} style={{ flex: 2 }} />
                                            <input className={INPUT_CLS} placeholder="Image URL" value={item.image || ""} onChange={e => updateSectionItem(si, ii, "image", e.target.value)} style={{ flex: 1 }} />
                                        </>
                                    )}
                                    {sec.type === "benefits" && (
                                        <>
                                            <input className={INPUT_CLS} placeholder="Label" value={item.label || ""} onChange={e => updateSectionItem(si, ii, "label", e.target.value)} style={{ width: "35%" }} />
                                            <input className={INPUT_CLS} placeholder="Text" value={item.text || ""} onChange={e => updateSectionItem(si, ii, "text", e.target.value)} style={{ flex: 1 }} />
                                        </>
                                    )}
                                    {sec.type === "gallery" && (
                                        <>
                                            <input className={INPUT_CLS} placeholder="Image URL" value={item.image || ""} onChange={e => updateSectionItem(si, ii, "image", e.target.value)} style={{ flex: 2 }} />
                                            <input className={INPUT_CLS} placeholder="Caption" value={item.text || ""} onChange={e => updateSectionItem(si, ii, "text", e.target.value)} style={{ flex: 1 }} />
                                        </>
                                    )}
                                    <button type="button" onClick={() => removeSectionItem(si, ii)} className="text-rose-400 text-lg leading-none pt-1 shrink-0">×</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addSectionItem(si)} className="text-xs text-red-400 font-semibold border border-red-500/20 px-3 py-1 rounded-lg">+ Add item</button>
                        </div>
                    </div>
                ))}

                <div className="flex gap-2 flex-wrap pt-1">
                    <button type="button" onClick={() => addSection("steps")} className="text-xs bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg">+ Steps</button>
                    <button type="button" onClick={() => addSection("benefits")} className="text-xs bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg">+ Benefits</button>
                    <button type="button" onClick={() => addSection("gallery")} className="text-xs bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg">+ Gallery</button>
                </div>
            </div>
        </div>
    );
}
