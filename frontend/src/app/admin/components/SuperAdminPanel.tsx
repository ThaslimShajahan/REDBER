"use client";

import { useState, useEffect } from "react";
import { 
  collection, getDocs, doc, updateDoc, setDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, CheckCircle, XCircle, Clock, Settings, Package,
  Plus, Trash2, Save, RefreshCw, ChevronDown, ChevronUp,
  Shield, MessageSquare, Database, TrendingUp, ScrollText,
  Mail, PenLine, Zap, Crown, Activity, BarChart2, Globe,
  FileText, Link, HelpCircle, Upload, Lock, Unlock, AlertTriangle
} from "lucide-react";
import { TopProgressBar } from "./PageLoader";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tenant {
  uid: string;
  email: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  role: string;
  planId?: string;
  companyName?: string;
  botIds?: string[];
  features?: Record<string, any>;   // now supports nested sub-features
  limits?: TenantLimits;
  createdAt?: any;
}

interface TenantLimits {
  monthlyMessages: number;
  maxBots: number;
  messagesPerDay?: number;
  messagesPerHour?: number;
  apiCallsPerMinute?: number;
  burstLimit?: number;
}

interface PlanLimits {
  monthlyMessages: number;
  maxBots: number;
  messagesPerDay: number;
  messagesPerHour: number;
  apiCallsPerMinute: number;
  burstLimit: number;
}

interface Plan {
  id: string;
  name: string;
  priceIndia: string;
  features: Record<string, any>;   // now supports nested sub-features
  limits: PlanLimits;
}

// ─── Micro-level Feature Definitions ─────────────────────────────────────────
interface SubFeature {
  key: string;
  label: string;
  icon?: any;
  description?: string;
}

interface FeatureDef {
  label: string;
  icon: any;
  color: string;
  subFeatures: SubFeature[];
}

const FEATURE_MAP: Record<string, FeatureDef> = {
  kb: {
    label: "Knowledge Base",
    icon: Database,
    color: "blue",
    subFeatures: [
      { key: "pdf_upload", label: "PDF Upload", icon: Upload, description: "Upload PDF documents" },
      { key: "website_crawl", label: "Website Deep Crawl", icon: Globe, description: "Crawl entire websites" },
      { key: "single_page", label: "Single Page Ingest", icon: Link, description: "Ingest individual URLs" },
      { key: "manual_text", label: "Manual Text Entry", icon: FileText, description: "Type custom knowledge" },
      { key: "faq_entry", label: "FAQ Entry", icon: HelpCircle, description: "Add Q&A pairs" },
      { key: "csv_catalog", label: "CSV / Catalog Upload", icon: Package, description: "Bulk import product data" },
      { key: "kb_delete", label: "Delete Knowledge", icon: Trash2, description: "Remove indexed sources" },
    ],
  },
  leads: {
    label: "Lead Center",
    icon: Users,
    color: "emerald",
    subFeatures: [
      { key: "view_leads", label: "View Leads", description: "See lead list and details" },
      { key: "export_leads", label: "Export / Download", description: "Export leads as CSV" },
      { key: "delete_leads", label: "Delete Leads", description: "Remove lead records" },
      { key: "lead_notes", label: "Lead Notes & Tags", description: "Add notes to leads" },
    ],
  },
  metrics: {
    label: "Conversion Metrics",
    icon: TrendingUp,
    color: "purple",
    subFeatures: [
      { key: "view_metrics", label: "View Dashboard", description: "Analytics & charts" },
      { key: "funnel_report", label: "Funnel Report", description: "Conversion funnel data" },
      { key: "export_report", label: "Export Reports", description: "Download metric reports" },
    ],
  },
  training: {
    label: "AI Training Studio",
    icon: PenLine,
    color: "indigo",
    subFeatures: [
      { key: "generate_persona", label: "Auto-Generate Persona", description: "AI-generated bot personalities" },
      { key: "edit_prompt", label: "Edit Base Prompt", description: "Edit core identity prompt" },
      { key: "persona_tuning", label: "Persona Tuning", description: "Adjust tone, language, goals" },
      { key: "generate_questions", label: "Generate Starter Questions", description: "AI-suggested questions" },
    ],
  },
  integrations: {
    label: "Integrations & Channels",
    icon: MessageSquare,
    color: "amber",
    subFeatures: [
      { key: "whatsapp", label: "WhatsApp Channel", description: "Connect WhatsApp Business API" },
      { key: "webhook", label: "Webhook / API Access", description: "Custom webhook endpoints" },
      { key: "zapier", label: "Zapier / Automation", description: "Third-party automation" },
      { key: "email_notif", label: "Email Notifications", description: "Email alerts for leads" },
    ],
  },
  contacts: {
    label: "Contact Messages",
    icon: Mail,
    color: "rose",
    subFeatures: [
      { key: "view_contacts", label: "View Messages", description: "Read contact submissions" },
      { key: "mark_read", label: "Mark as Read", description: "Update message status" },
      { key: "delete_contacts", label: "Delete Messages", description: "Remove contact records" },
      { key: "reply_contacts", label: "Reply / Email Out", description: "Send reply emails" },
    ],
  },
  logs: {
    label: "Chat Logs",
    icon: ScrollText,
    color: "gray",
    subFeatures: [
      { key: "view_logs", label: "View Chat History", description: "Read chat sessions" },
      { key: "export_logs", label: "Export Logs", description: "Download log files" },
      { key: "search_logs", label: "Search & Filter", description: "Advanced log search" },
    ],
  },
};

// ─── Color helpers ─────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/30",    text: "text-blue-400",    badge: "bg-blue-500/20" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500/20" },
  purple:  { bg: "bg-purple-500/10",  border: "border-purple-500/30",  text: "text-purple-400",  badge: "bg-purple-500/20" },
  indigo:  { bg: "bg-indigo-500/10",  border: "border-indigo-500/30",  text: "text-indigo-400",  badge: "bg-indigo-500/20" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-400",   badge: "bg-amber-500/20" },
  rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/30",    text: "text-rose-400",    badge: "bg-rose-500/20" },
  gray:    { bg: "bg-gray-500/10",    border: "border-gray-500/30",    text: "text-gray-400",    badge: "bg-gray-500/20" },
};

// Build default features object with all sub-features set to a boolean
function buildDefaultFeatures(enabled: boolean): Record<string, Record<string, boolean>> {
  const result: Record<string, Record<string, boolean>> = {};
  for (const [key, def] of Object.entries(FEATURE_MAP)) {
    result[key] = {};
    for (const sf of def.subFeatures) {
      result[key][sf.key] = enabled;
    }
  }
  return result;
}

// Check if a top-level feature is fully/partially enabled
function featureState(features: Record<string, any>, featureKey: string): "all" | "partial" | "none" {
  const sub = features?.[featureKey];
  if (!sub || typeof sub === "boolean") {
    return sub ? "all" : "none";
  }
  const vals = Object.values(sub) as boolean[];
  const on = vals.filter(Boolean).length;
  if (on === 0) return "none";
  if (on === vals.length) return "all";
  return "partial";
}

const DEFAULT_PLAN_LIMITS: PlanLimits = {
  monthlyMessages: 500,
  maxBots: 1,
  messagesPerDay: 50,
  messagesPerHour: 10,
  apiCallsPerMinute: 5,
  burstLimit: 20,
};

const DEFAULT_PLANS: Plan[] = [
  {
    id: "starter", name: "Starter", priceIndia: "₹5,500/mo · ₹55,000/yr",
    features: {
      kb: { pdf_upload: true, website_crawl: false, single_page: true, manual_text: true, faq_entry: true, csv_catalog: false, kb_delete: true },
      leads: { view_leads: true, export_leads: false, delete_leads: false, lead_notes: false },
      metrics: { view_metrics: false, funnel_report: false, export_report: false },
      training: { generate_persona: false, edit_prompt: true, persona_tuning: false, generate_questions: false },
      integrations: { whatsapp: false, webhook: false, zapier: false, email_notif: false },
      contacts: { view_contacts: true, mark_read: true, delete_contacts: false, reply_contacts: false },
      logs: { view_logs: false, export_logs: false, search_logs: false },
    },
    limits: { monthlyMessages: 500, maxBots: 1, messagesPerDay: 50, messagesPerHour: 10, apiCallsPerMinute: 5, burstLimit: 20 },
  },
  {
    id: "growth", name: "Growth", priceIndia: "₹9,999/mo · ₹1,00,000/yr",
    features: {
      kb: { pdf_upload: true, website_crawl: true, single_page: true, manual_text: true, faq_entry: true, csv_catalog: true, kb_delete: true },
      leads: { view_leads: true, export_leads: true, delete_leads: true, lead_notes: true },
      metrics: { view_metrics: true, funnel_report: true, export_report: false },
      training: { generate_persona: true, edit_prompt: true, persona_tuning: true, generate_questions: true },
      integrations: { whatsapp: false, webhook: false, zapier: false, email_notif: true },
      contacts: { view_contacts: true, mark_read: true, delete_contacts: true, reply_contacts: false },
      logs: { view_logs: false, export_logs: false, search_logs: false },
    },
    limits: { monthlyMessages: 2000, maxBots: 2, messagesPerDay: 200, messagesPerHour: 40, apiCallsPerMinute: 15, burstLimit: 80 },
  },
  {
    id: "business", name: "Business", priceIndia: "₹18,999/mo · ₹1,70,000/yr",
    features: {
      kb: { pdf_upload: true, website_crawl: true, single_page: true, manual_text: true, faq_entry: true, csv_catalog: true, kb_delete: true },
      leads: { view_leads: true, export_leads: true, delete_leads: true, lead_notes: true },
      metrics: { view_metrics: true, funnel_report: true, export_report: true },
      training: { generate_persona: true, edit_prompt: true, persona_tuning: true, generate_questions: true },
      integrations: { whatsapp: true, webhook: true, zapier: false, email_notif: true },
      contacts: { view_contacts: true, mark_read: true, delete_contacts: true, reply_contacts: true },
      logs: { view_logs: true, export_logs: true, search_logs: true },
    },
    limits: { monthlyMessages: 10000, maxBots: 5, messagesPerDay: 1000, messagesPerHour: 150, apiCallsPerMinute: 40, burstLimit: 200 },
  },
  {
    id: "pro", name: "2-Year Plan", priceIndia: "₹2,85,000 total (≈₹11,875/mo)",
    features: buildDefaultFeatures(true),
    limits: { monthlyMessages: 999999, maxBots: 20, messagesPerDay: 9999, messagesPerHour: 999, apiCallsPerMinute: 120, burstLimit: 500 },
  },
];

// ─── MicroFeatureGrid ─────────────────────────────────────────────────────────
function MicroFeatureGrid({
  features,
  onChange,
  compact = false,
}: {
  features: Record<string, any>;
  onChange: (updated: Record<string, any>) => void;
  compact?: boolean;
}) {
  const toggle = (featureKey: string, subKey: string) => {
    const currentSub = features?.[featureKey] ?? {};
    const curVal = typeof currentSub === "boolean" ? currentSub : (currentSub[subKey] ?? false);
    onChange({
      ...features,
      [featureKey]: {
        ...(typeof currentSub === "object" ? currentSub : {}),
        [subKey]: !curVal,
      },
    });
  };

  const toggleAll = (featureKey: string, value: boolean) => {
    const def = FEATURE_MAP[featureKey];
    const newSub: Record<string, boolean> = {};
    def.subFeatures.forEach((sf) => { newSub[sf.key] = value; });
    onChange({ ...features, [featureKey]: newSub });
  };

  return (
    <div className={`space-y-${compact ? "3" : "4"}`}>
      {Object.entries(FEATURE_MAP).map(([key, def]) => {
        const c = COLOR_MAP[def.color];
        const Icon = def.icon;
        const state = featureState(features, key);
        const sub = features?.[key] ?? {};
        return (
          <div key={key} className={`rounded-2xl border ${state === "all" ? `${c.border} ${c.bg}` : state === "partial" ? "border-amber-500/30 bg-amber-500/5" : "border-white/8 bg-white/[0.02]"} overflow-hidden transition-all`}>
            {/* Feature header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className={`p-1.5 rounded-lg ${c.badge} ${c.text}`}>
                <Icon size={14} />
              </div>
              <span className={`text-sm font-bold ${state !== "none" ? "text-white" : "text-gray-500"}`}>{def.label}</span>
              {state === "partial" && (
                <span className="text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">PARTIAL</span>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => toggleAll(key, true)}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                >All On</button>
                <button
                  onClick={() => toggleAll(key, false)}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-all"
                >All Off</button>
              </div>
            </div>
            {/* Sub-features */}
            <div className={`grid ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"} gap-1.5 px-3 pb-3`}>
              {def.subFeatures.map((sf) => {
                const SubIcon = sf.icon;
                const val = typeof sub === "boolean" ? sub : (sub[sf.key] ?? false);
                return (
                  <button
                    key={sf.key}
                    onClick={() => toggle(key, sf.key)}
                    title={sf.description}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all text-left ${
                      val
                        ? `${c.bg} ${c.border} ${c.text}`
                        : "bg-black/30 border-white/8 text-gray-600 hover:border-white/20 hover:text-gray-400"
                    }`}
                  >
                    {SubIcon ? <SubIcon size={11} className="shrink-0" /> : <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${val ? "bg-current" : "bg-gray-700"}`} />}
                    <span className="truncate">{sf.label}</span>
                    <span className={`ml-auto shrink-0 text-[10px] font-black ${val ? "text-current" : "text-gray-700"}`}>{val ? "✓" : "—"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Rate Limit Editor ─────────────────────────────────────────────────────────
function RateLimitEditor({
  limits,
  onChange,
  compact = false,
}: {
  limits: TenantLimits | PlanLimits;
  onChange: (l: any) => void;
  compact?: boolean;
}) {
  const fields = [
    { key: "monthlyMessages", label: "Monthly Messages", icon: MessageSquare, color: "text-indigo-400", suffix: "/mo" },
    { key: "maxBots",         label: "Max Bots",         icon: Zap,           color: "text-amber-400",  suffix: "" },
    { key: "messagesPerDay",  label: "Messages / Day",   icon: Activity,      color: "text-emerald-400", suffix: "/day" },
    { key: "messagesPerHour", label: "Messages / Hour",  icon: Clock,         color: "text-blue-400",   suffix: "/hr" },
    { key: "apiCallsPerMinute", label: "API Calls / Min", icon: Zap,          color: "text-purple-400", suffix: "/min" },
    { key: "burstLimit",      label: "Burst Limit",      icon: AlertTriangle, color: "text-rose-400",   suffix: "" },
  ];

  return (
    <div className={`grid ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"} gap-3`}>
      {fields.map(({ key, label, icon: Icon, color, suffix }) => (
        <div key={key} className="space-y-1">
          <label className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${color}`}>
            <Icon size={10} /> {label}
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              value={(limits as any)[key] ?? 0}
              onChange={e => onChange({ ...limits, [key]: +e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 pr-10"
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-bold">{suffix}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tenant Row ───────────────────────────────────────────────────────────────
function TenantRow({ tenant, plans, onUpdate }: { tenant: Tenant; plans: Plan[], onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState<Tenant>(tenant);
  const [activeTab, setActiveTab] = useState<"basic" | "features" | "limits">("basic");

  const statusColors: Record<string, string> = {
    pending:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    rejected: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };

  const applyPlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    setLocal(prev => ({
      ...prev,
      planId,
      features: JSON.parse(JSON.stringify(plan.features)),
      limits: { ...plan.limits },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", tenant.uid), {
        status: local.status,
        planId: local.planId,
        companyName: local.companyName || "",
        features: local.features,
        limits: local.limits,
        approvedAt: local.status === "approved" ? serverTimestamp() : null,
      });
      onUpdate();
    } finally {
      setSaving(false);
      setExpanded(false);
    }
  };

  // Count enabled sub-features
  const countEnabled = () => {
    let on = 0, total = 0;
    for (const [key, def] of Object.entries(FEATURE_MAP)) {
      for (const sf of def.subFeatures) {
        total++;
        const sub = local.features?.[key];
        if (sub && (typeof sub === "boolean" ? sub : sub[sf.key])) on++;
      }
    }
    return { on, total };
  };
  const { on, total } = countEnabled();

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpanded(v => !v)}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-black shrink-0">
          {(tenant.name || tenant.email || "U").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{tenant.name || tenant.email}</p>
          <p className="text-xs text-gray-500 truncate">{tenant.email}</p>
        </div>
        <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${statusColors[tenant.status] || statusColors.pending}`}>
          {tenant.status}
        </span>
        <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg">{tenant.planId || "—"}</span>
        <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-lg">{on}/{total} features</span>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 p-5 space-y-5">
              {/* Tabs */}
              <div className="flex gap-2 bg-black/30 rounded-xl p-1">
                {([
                  { id: "basic", label: "Basic Info", icon: Settings },
                  { id: "features", label: "Feature Access", icon: Shield },
                  { id: "limits", label: "Rate Limits", icon: Activity },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    <tab.icon size={12} /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Basic Info */}
              {activeTab === "basic" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                    <select
                      value={local.status}
                      onChange={e => setLocal(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan</label>
                    <select
                      value={local.planId || "starter"}
                      onChange={e => applyPlan(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    >
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company Name</label>
                    <input
                      value={local.companyName || ""}
                      onChange={e => setLocal(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Acme Corp..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300">
                    💡 Selecting a plan above will <strong>auto-apply</strong> that plan's features and rate limits. You can then fine-tune them in the other tabs.
                  </div>
                </div>
              )}

              {/* Feature Access */}
              {activeTab === "features" && (
                <MicroFeatureGrid
                  features={local.features ?? {}}
                  onChange={updated => setLocal(prev => ({ ...prev, features: updated }))}
                  compact
                />
              )}

              {/* Rate Limits */}
              {activeTab === "limits" && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">Set custom rate limits for this tenant. These override plan defaults.</p>
                  <RateLimitEditor
                    limits={local.limits ?? DEFAULT_PLAN_LIMITS}
                    onChange={l => setLocal(prev => ({ ...prev, limits: l }))}
                    compact
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                  <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Package Config Tab ───────────────────────────────────────────────────────
function PackageConfig({ plans, setPlans, onSave }: { plans: Plan[]; setPlans: React.Dispatch<React.SetStateAction<Plan[]>>; onSave: () => void }) {
  const [saving, setSaving] = useState(false);
  const [activePlanId, setActivePlanId] = useState(plans[0]?.id ?? "starter");
  const [activeSection, setActiveSection] = useState<"pricing" | "features" | "limits">("pricing");

  const updatePlan = (planId: string, updates: Partial<Plan>) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updates } : p));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const plan of plans) {
        await setDoc(doc(db, "plans", plan.id), {
          name: plan.name,
          priceIndia: plan.priceIndia,
          features: plan.features,
          limits: plan.limits,
        });
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  const activePlan = plans.find(p => p.id === activePlanId) ?? plans[0];

  const planColors: Record<string, string> = {
    starter: "from-gray-500 to-gray-600",
    growth:  "from-blue-600 to-indigo-600",
    business:"from-purple-600 to-violet-600",
    pro:     "from-amber-500 to-orange-500",
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400">Configure plans: features, rate limits, and pricing. Changes apply when assigning plans to tenants.</p>
        <button onClick={saveAll} disabled={saving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
          <Save size={14} /> {saving ? "Saving..." : "Save All Plans"}
        </button>
      </div>

      {/* Plan Selector */}
      <div className="grid grid-cols-4 gap-3">
        {plans.map(plan => {
          // count enabled sub-features
          let on = 0, total = 0;
          for (const [key, def] of Object.entries(FEATURE_MAP)) {
            for (const sf of def.subFeatures) {
              total++;
              const sub = plan.features?.[key];
              if (sub && (typeof sub === "boolean" ? sub : sub[sf.key])) on++;
            }
          }
          return (
            <button
              key={plan.id}
              onClick={() => setActivePlanId(plan.id)}
              className={`relative rounded-2xl p-4 border transition-all text-left ${activePlanId === plan.id ? "border-white/30 bg-white/10" : "border-white/10 bg-white/[0.02] hover:bg-white/5"}`}
            >
              <div className={`flex items-center gap-2 mb-2`}>
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${planColors[plan.id] || "from-gray-500 to-gray-600"} flex items-center justify-center shrink-0`}>
                  <Crown size={11} className="text-white" />
                </div>
                <h3 className="text-sm font-black text-white">{plan.name}</h3>
              </div>
              <p className="text-[10px] text-gray-500 font-bold">{on}/{total} features enabled</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{plan.limits.monthlyMessages.toLocaleString()} msg/mo</p>
              {activePlanId === plan.id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white/20 rotate-45 border border-white/20" />}
            </button>
          );
        })}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 bg-black/30 rounded-xl p-1">
        {([
          { id: "pricing", label: "Pricing", icon: Crown },
          { id: "features", label: "Feature Access", icon: Shield },
          { id: "limits", label: "Rate Limits", icon: Activity },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg text-xs font-bold transition-all ${activeSection === tab.id ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            <tab.icon size={12} /> {tab.label}
          </button>
        ))}
      </div>

      {activePlan && (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
          {/* Pricing */}
          {activeSection === "pricing" && (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm">Pricing — {activePlan.name}</h4>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest">India Price (₹)</label>
                <input
                  value={activePlan.priceIndia}
                  onChange={e => updatePlan(activePlan.id, { priceIndia: e.target.value })}
                  className="w-full mt-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  placeholder="e.g. ₹5,500/mo · ₹55,000/yr"
                />
              </div>
            </div>
          )}

          {/* Feature Access */}
          {activeSection === "features" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">Feature Access — {activePlan.name}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => updatePlan(activePlan.id, { features: buildDefaultFeatures(true) })}
                    className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg hover:bg-emerald-500/20 transition-all"
                  >Enable All</button>
                  <button
                    onClick={() => updatePlan(activePlan.id, { features: buildDefaultFeatures(false) })}
                    className="text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg hover:bg-rose-500/20 transition-all"
                  >Disable All</button>
                </div>
              </div>
              <MicroFeatureGrid
                features={activePlan.features}
                onChange={updated => updatePlan(activePlan.id, { features: updated })}
              />
            </div>
          )}

          {/* Rate Limits */}
          {activeSection === "limits" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white text-sm">API Rate Limits — {activePlan.name}</h4>
                <p className="text-xs text-gray-500 mt-1">These limits control how many messages and API calls tenants on this plan can make.</p>
              </div>
              <div className="grid grid-cols-3 gap-4 bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-indigo-400">{activePlan.limits.monthlyMessages.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Monthly</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-400">{activePlan.limits.messagesPerDay.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Per Day</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-blue-400">{activePlan.limits.messagesPerHour.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Per Hour</p>
                </div>
              </div>
              <RateLimitEditor
                limits={activePlan.limits}
                onChange={l => updatePlan(activePlan.id, { limits: l })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main SuperAdmin Panel ────────────────────────────────────────────────────
export default function SuperAdminPanel() {
  const [tab, setTab] = useState<"tenants" | "packages">("tenants");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Load tenants
      const usersSnap = await getDocs(collection(db, "users"));
      const users: Tenant[] = [];
      usersSnap.forEach(d => {
        const data = d.data();
        if (data.role !== "super_admin") {
          users.push({ uid: d.id, ...data } as Tenant);
        }
      });
      setTenants(users);

      // Load plans
      const plansSnap = await getDocs(collection(db, "plans"));
      if (!plansSnap.empty) {
        const loadedPlans: Plan[] = [];
        plansSnap.forEach(d => loadedPlans.push({ id: d.id, ...d.data() } as Plan));
        const order = ["starter", "growth", "business", "pro"];
        loadedPlans.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        setPlans(loadedPlans.length > 0 ? loadedPlans : DEFAULT_PLANS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const inviteTenant = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const starterPlan = plans.find(p => p.id === "starter") ?? DEFAULT_PLANS[0];
    try {
      await setDoc(doc(db, "invitations", inviteEmail.trim().toLowerCase()), {
        email: inviteEmail.trim().toLowerCase(),
        status: "pending",
        invitedAt: serverTimestamp(),
        planId: "starter",
        features: starterPlan.features,
        limits: starterPlan.limits,
      });
      setInviteEmail("");
      showToast("✅ Invite saved. When they sign up with this email, they'll be auto-linked.");
    } finally {
      setInviting(false);
    }
  };

  const stats = {
    total: tenants.length,
    pendingCount: tenants.filter(t => t.status === "pending").length,
    approvedCount: tenants.filter(t => t.status === "approved").length,
    rejectedCount: tenants.filter(t => t.status === "rejected").length,
  };

  return (
    <div className="space-y-8">
      {loading && <TopProgressBar />}

      {/* Global Command Center Header - Stands Out */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-black/40 border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                  <Crown size={200} className="text-white" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="flex-1">
                      <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Global Command Center</h1>
                      <p className="text-gray-400 text-sm leading-relaxed max-w-lg mb-6">
                          Managing <strong className="text-indigo-400">{tenants.length}</strong> active businesses across your private cloud. Monitor real-time growth, handle approvals, and scale infrastructure from a single pane.
                      </p>
                      <div className="flex flex-wrap gap-4">
                          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
                              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Total Users</p>
                              <p className="text-2xl font-black text-white">{tenants.length}</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
                              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Approved</p>
                              <p className="text-2xl font-black text-white">{stats.approvedCount}</p>
                          </div>
                          <div className="bg-white/5 border border-amber-500/20 rounded-2xl px-5 py-3">
                              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">Awaiting</p>
                              <p className="text-2xl font-black text-white">{stats.pendingCount}</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 shrink-0 shadow-2xl ring-1 ring-white/5">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Activity size={10} className="animate-pulse" /> Platform Health
                      </p>
                      <div className="space-y-5">
                          <div>
                              <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-2">
                                  <span>API CLOUD HEALTH</span>
                                  <span className="text-emerald-400">99.9%</span>
                              </div>
                              <div className="h-1 w-40 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 w-[99.9%]" />
                              </div>
                          </div>
                          <div>
                              <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-2">
                                  <span>MESSAGE THROUGHPUT</span>
                                  <span className="text-blue-400">8.2k msg/hr</span>
                              </div>
                              <div className="h-1 w-40 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 w-[65%]" />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Real-time Activity Pulse Side Panel */}
          <div className="bg-black/40 border border-white/10 rounded-[2.5rem] p-6 flex flex-col h-full shadow-2xl backdrop-blur-sm">
             <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Global Activity Pulse
             </h3>
             <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[300px] lg:max-h-none">
                {[
                  { user: "Acme", action: "Hot Lead Detected", time: "2m ago", color: "text-rose-400", bg: "bg-rose-500/10" },
                  { user: "Glow Salon", action: "Bot Trained", time: "5m ago", color: "text-indigo-400", bg: "bg-indigo-500/10" },
                  { user: "City Clinic", action: "New Booking", time: "12m ago", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { user: "Spice Garden", action: "Webhook Fired", time: "18m ago", color: "text-amber-400", bg: "bg-amber-500/10" },
                  { user: "Maya AI", action: "Source Synced", time: "24m ago", color: "text-blue-400", bg: "bg-blue-500/10" },
                ].map((act, idx) => (
                  <div key={idx} className="flex gap-3 relative before:absolute before:left-2 before:top-8 before:bottom-0 before:w-px before:bg-white/5 last:before:hidden">
                    <div className={`w-4 h-4 rounded-full ${act.bg} border border-white/5 shrink-0 mt-1`} />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400"><strong className="text-gray-200">{act.user}</strong> · {act.time}</p>
                      <p className={`text-[10px] font-bold ${act.color} uppercase tracking-tighter`}>{act.action}</p>
                    </div>
                  </div>
                ))}
             </div>
             <button className="mt-6 w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-gray-500 hover:text-white transition-all border border-white/5">
                VIEW GLOBAL LOGS
             </button>
          </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-white/10 pb-4">
        <button onClick={() => setTab("tenants")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === "tenants" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>
          <Users size={15} /> Tenant Management
        </button>
        <button onClick={() => setTab("packages")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === "packages" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}>
          <Package size={15} /> Package Configuration
        </button>
      </div>

      {tab === "tenants" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Tenants", value: stats.total, color: "text-white" },
              { label: "Pending", value: stats.pendingCount, color: "text-amber-400" },
              { label: "Approved", value: stats.approvedCount, color: "text-emerald-400" },
              { label: "Rejected", value: stats.rejectedCount, color: "text-rose-400" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Invite */}
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Invite New Tenant</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && inviteTenant()}
                placeholder="client@company.com"
                className="w-full bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <button onClick={inviteTenant} disabled={inviting || !inviteEmail.trim()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
              <Plus size={14} /> {inviting ? "Inviting..." : "Send Invite"}
            </button>
          </div>

          {/* Tenant List */}
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-gray-400">{tenants.length} {tenants.length === 1 ? "tenant" : "tenants"} registered</p>
            <button onClick={fetchData} className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs font-semibold transition-colors">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tenants yet. Invite someone above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tenants.map(t => (
                <TenantRow key={t.uid} tenant={t} plans={plans} onUpdate={() => { fetchData(); showToast("✅ Tenant updated!"); }} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "packages" && (
        <PackageConfig
          plans={plans}
          setPlans={setPlans}
          onSave={() => showToast("✅ Plans saved to Firestore!")}
        />
      )}
    </div>
  );
}
