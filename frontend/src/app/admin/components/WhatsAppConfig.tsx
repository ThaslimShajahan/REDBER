"use client";
import { useState } from "react";
import { Copy, CheckCircle2, MessageSquare, Globe } from "lucide-react";

export default function WhatsAppConfig() {
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"whatsapp" | "web">("whatsapp");

    const webhookUrl = typeof window !== "undefined"
        ? `${window.location.origin.replace("3000", "8000")}/api/bots/whatsapp`
        : "https://api.your-domain.com/api/bots/whatsapp";

    const handleCopy = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    const CopyBox = ({ text, idx }: { text: string; idx: number }) => (
        <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-green-300 overflow-x-auto whitespace-nowrap block">
                {text}
            </code>
            <button onClick={() => handleCopy(text, idx)} className={`shrink-0 px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${copiedIdx === idx ? "bg-emerald-500 text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}>
                {copiedIdx === idx ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copiedIdx === idx ? "Copied" : "Copy"}
            </button>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Tabs */}
            <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
                {[
                    { id: "whatsapp" as const, label: "WhatsApp", icon: MessageSquare, color: "text-green-400" },
                    { id: "web" as const, label: "Website Widget", icon: Globe, color: "text-blue-400" },
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-white/10 text-white border border-white/10" : "text-gray-400 hover:text-white"}`}
                        >
                            <Icon size={16} className={activeTab === tab.id ? tab.color : ""} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* WhatsApp Setup */}
            {activeTab === "whatsapp" && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-3xl p-8">
                        <h2 className="text-2xl font-black text-white mb-2">WhatsApp Cloud API Integration</h2>
                        <p className="text-green-100/60 text-sm">Connect your AI agent to WhatsApp. Your bot's phone number becomes a memory key — no manual session tracking needed.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                step: 1, title: "Create a Meta Business App",
                                desc: "Go to developers.facebook.com → Create App → Business → Add the WhatsApp product. You'll get a test number instantly.",
                                link: { label: "Open Meta for Developers →", href: "https://developers.facebook.com" }
                            },
                            {
                                step: 2, title: "Configure Webhook",
                                desc: "In the WhatsApp dashboard, navigate to Configuration → Webhooks. Paste the Webhook URL below and enter any Verify Token (e.g. 'spa_token'). Subscribe to messages.",
                            },
                            {
                                step: 3, title: "Go Live!",
                                desc: "Add the phone numbers you want to test. Send a message to your WhatsApp test number — the AI will respond in real time. Phone number = session ID for persistent memory.",
                            }
                        ].map(s => (
                            <div key={s.step} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center font-black text-lg text-green-400 border border-green-500/20 mb-4">{s.step}</div>
                                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                                {s.link && <a href={s.link.href} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs text-green-400 hover:text-green-300 font-semibold">{s.link.label}</a>}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-white">Your Webhook Endpoint</h3>
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 block">Webhook URL</label>
                            <CopyBox text={webhookUrl} idx={0} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 block">Verify Token (example)</label>
                            <CopyBox text="spa_verify_token" idx={1} />
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200 mt-2">
                            ⚠️ Make sure your backend is deployed and accessible from the internet. For local testing, use <strong>ngrok</strong>: <code className="bg-black/30 px-1 rounded text-amber-300">ngrok http 8000</code>
                        </div>
                    </div>
                </div>
            )}

            {/* Web Widget Setup */}
            {activeTab === "web" && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-3xl p-8">
                        <h2 className="text-2xl font-black text-white mb-2">Website Chat Widget</h2>
                        <p className="text-blue-100/60 text-sm">Embed the PersonaAI chatbot on any website with a single script tag. Replace the Bot ID with yours.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-white">Embed Script</h3>
                        <p className="text-sm text-gray-400">Paste this before the closing <code className="bg-white/10 px-1 rounded text-blue-300">&lt;/body&gt;</code> tag of your HTML page:</p>
                        <CopyBox
                            text={`<script src="https://your-domain.com/widget.js" data-bot-id="YOUR_BOT_ID" defer></script>`}
                            idx={10}
                        />
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200 mt-2">
                            ℹ️ Replace <code className="bg-black/30 px-1 rounded text-blue-300">YOUR_BOT_ID</code> with the Bot ID from your Bot Manager tab (e.g. <code className="bg-black/30 px-1 rounded text-blue-300">ara-121</code>).
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
