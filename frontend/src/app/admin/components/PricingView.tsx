"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, authFetch } from "../../../lib/api";
import { type Region, type Plan, CURRENCY_SYMBOLS, DEFAULT_PRICING } from "../../../lib/pricing";

const REGIONS: Region[] = ["INR", "AED", "USD", "GBP"];
const PLANS: Plan[] = ["starter", "growth", "business"];
const PLAN_LABELS: Record<Plan, string> = { starter: "Starter", growth: "Growth", business: "Business" };
const REGION_LABELS: Record<Region, string> = { INR: "India (INR)", AED: "Gulf / GCC (AED)", USD: "USA / Canada (USD)", GBP: "United Kingdom (GBP)" };

type PricingData = Record<Region, Record<Plan, { monthly: number; yearly: number }>>;

export default function PricingView() {
    const [pricing, setPricing] = useState<PricingData>(DEFAULT_PRICING as PricingData);
    const [edited, setEdited] = useState<PricingData>(DEFAULT_PRICING as PricingData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

    const showToast = (type: "ok" | "err", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API_BASE}/api/pricing`);
            const d = await r.json();
            if (d?.INR) { setPricing(d); setEdited(d); }
        } catch {
            showToast("err", "Failed to load pricing.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleChange = (region: Region, plan: Plan, field: "monthly" | "yearly", val: string) => {
        const num = parseFloat(val) || 0;
        setEdited(prev => ({
            ...prev,
            [region]: { ...prev[region], [plan]: { ...prev[region][plan], [field]: num } },
        }));
    };

    const saveRow = async (region: Region, plan: Plan) => {
        const key = `${region}-${plan}`;
        setSaving(key);
        try {
            const body = edited[region][plan];
            const r = await authFetch(`${API_BASE}/api/pricing/${region}/${plan}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!r.ok) throw new Error(await r.text());
            setPricing(prev => ({ ...prev, [region]: { ...prev[region], [plan]: body } }));
            showToast("ok", `${REGION_LABELS[region]} · ${PLAN_LABELS[plan]} saved.`);
        } catch {
            showToast("err", "Save failed. Check your connection.");
        } finally {
            setSaving(null);
        }
    };

    const isDirty = (region: Region, plan: Plan) =>
        edited[region][plan].monthly !== pricing[region][plan].monthly ||
        edited[region][plan].yearly !== pricing[region][plan].yearly;

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black tracking-tight">Regional Pricing</h2>
                    <p className="text-gray-400 text-xs mt-1">Update monthly &amp; yearly prices per region. Changes go live immediately.</p>
                </div>
                <button onClick={load} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all disabled:opacity-50">
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold ${toast.type === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
                        {toast.type === "ok" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pricing tables per region */}
            {REGIONS.map(region => (
                <div key={region} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                    {/* Region header */}
                    <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">{REGION_LABELS[region]}</span>
                        <span className="ml-auto text-[10px] font-bold text-gray-600">{CURRENCY_SYMBOLS[region].trim()}</span>
                    </div>

                    {/* Plan rows */}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-gray-600 border-b border-white/5">
                                <th className="text-left px-5 py-2 w-1/4">Plan</th>
                                <th className="text-left px-3 py-2">Monthly price</th>
                                <th className="text-left px-3 py-2">Yearly price</th>
                                <th className="px-3 py-2 w-24" />
                            </tr>
                        </thead>
                        <tbody>
                            {PLANS.map(plan => {
                                const key = `${region}-${plan}`;
                                const dirty = isDirty(region, plan);
                                return (
                                    <tr key={plan} className={`border-b border-white/5 last:border-0 transition-colors ${dirty ? "bg-amber-500/[0.04]" : ""}`}>
                                        <td className="px-5 py-3 font-bold text-gray-200">{PLAN_LABELS[plan]}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500 text-xs">{CURRENCY_SYMBOLS[region].trim()}</span>
                                                <input
                                                    type="number" min="0" step="1"
                                                    value={edited[region][plan].monthly}
                                                    onChange={e => handleChange(region, plan, "monthly", e.target.value)}
                                                    className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-indigo-500/50 transition-all"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500 text-xs">{CURRENCY_SYMBOLS[region].trim()}</span>
                                                <input
                                                    type="number" min="0" step="1"
                                                    value={edited[region][plan].yearly}
                                                    onChange={e => handleChange(region, plan, "yearly", e.target.value)}
                                                    className="w-28 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-indigo-500/50 transition-all"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <button
                                                onClick={() => saveRow(region, plan)}
                                                disabled={!dirty || saving === key}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ml-auto ${dirty ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-white/5 text-gray-600 cursor-default"} disabled:opacity-60`}>
                                                {saving === key ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
                                                {saving === key ? "Saving…" : "Save"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ))}

            <p className="text-center text-[10px] text-gray-700 pb-4">
                Prices shown on the landing page are fetched live from the backend. Changes take effect immediately on next page load.
            </p>
        </div>
    );
}
