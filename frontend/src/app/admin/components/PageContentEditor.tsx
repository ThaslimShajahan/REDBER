const INPUT_CLS = "w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 transition-colors";
const LABEL_CLS = "block text-xs font-semibold text-gray-400 mb-1";
const SECTION_CLS = "bg-white/[0.03] border border-white/8 rounded-2xl p-4 space-y-3";

export default function PageContentEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
    const pc = config || {};
    const set = (key: string, val: any) => onChange({ ...pc, [key]: val });

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
