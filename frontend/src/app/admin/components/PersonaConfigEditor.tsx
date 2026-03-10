const INPUT_CLS = "w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition-colors";
const LABEL_CLS = "block text-xs font-semibold text-gray-400 mb-1";
const SECTION_CLS = "bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-4 mb-5";

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
                    <div className="col-span-2">
                        <label className={LABEL_CLS}>Ask for contact details after X messages</label>
                        <input type="number" min="1" max="10" className={INPUT_CLS} value={p.ask_contact_after || 3} onChange={e => set("ask_contact_after", parseInt(e.target.value))} />
                    </div>
                    <div className="col-span-2">
                        <label className={LABEL_CLS}>Primary Goals (comma separated)</label>
                        <input className={INPUT_CLS} placeholder="e.g. Table reservations, Email capture"
                            value={(p.goals || []).join(', ')} onChange={e => handleArray("goals", e.target.value)} />
                    </div>
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
