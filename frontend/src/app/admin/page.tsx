"use client";

import { useState, useEffect } from "react";
import { Users, Database, LayoutDashboard, Search, ArrowLeft, ScrollText, Mail, TrendingUp, MessageSquare, PenLine, LogOut, Shield, ChevronDown, Crown } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE, authFetch } from "../../lib/api";

import LeadsView from "./components/LeadsView";
import KnowledgeBaseView from "./components/KnowledgeBaseView";
import SettingsView from "./components/SettingsView";
import LogsView from "./components/LogsView";
import ContactsView from "./components/ContactsView";
import ConversionMetrics from "./components/ConversionMetrics";
import WhatsAppConfig from "./components/WhatsAppConfig";
import TrainingStudio from "./components/TrainingStudio";
import SuperAdminPanel from "./components/SuperAdminPanel";

import { AuthProvider, useAuth, hasFeature } from "./context/AuthContext";

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen() {
    const { loginWithEmail, loginWithGoogle } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await loginWithEmail(email, password);
        } catch (err: any) {
            setError(err.message?.replace("Firebase: ", "")?.replace(/\(auth\/.*\)\.?/, "").trim() || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError("");
        try {
            await loginWithGoogle();
        } catch (err: any) {
            setError(err.message?.replace("Firebase: ", "") || "Google sign-in failed.");
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505] to-transparent blur-[120px] opacity-70" />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                        <img src="/redber_logo_transperent.png" alt="Redber" className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">Admin Portal</h1>
                    <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-indigo-500/50 transition-all font-medium"
                            placeholder="you@company.com" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-indigo-500/50 transition-all font-medium"
                            placeholder="••••••••" required />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                className="text-rose-400 text-xs font-bold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <button type="submit" disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all shadow-lg mt-2 disabled:opacity-50">
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                    <div className="relative flex justify-center text-xs text-gray-500 bg-[#050505] px-3 mx-auto w-fit">or</div>
                </div>

                <button onClick={handleGoogle}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-100 active:scale-95 transition-all shadow">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                <p className="text-center text-xs text-gray-600 mt-6">Powered by <span className="text-indigo-400 font-bold">Redber AI</span></p>
            </motion.div>
        </div>
    );
}

// ─── Pending Approval Screen ──────────────────────────────────────────────────
function PendingScreen() {
    const { user, logout } = useAuth();
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md text-center bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Shield size={28} className="text-amber-400" />
                </div>
                <h1 className="text-2xl font-black mb-2">Access Pending</h1>
                <p className="text-gray-400 text-sm mb-2">Your account <strong className="text-white">{user?.email}</strong> is awaiting approval.</p>
                <p className="text-gray-600 text-xs mb-8">The administrator will review and approve your account shortly. You'll have access once approved.</p>
                <button onClick={logout} className="flex items-center gap-2 mx-auto text-gray-500 hover:text-white text-sm font-semibold transition-colors">
                    <LogOut size={14} /> Sign out
                </button>
            </motion.div>
        </div>
    );
}

// ─── Rejected Screen ──────────────────────────────────────────────────────────
function RejectedScreen() {
    const { user, logout } = useAuth();
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md text-center bg-white/[0.03] border border-rose-500/20 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl">
                <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Shield size={28} className="text-rose-400" />
                </div>
                <h1 className="text-2xl font-black mb-2">Access Denied</h1>
                <p className="text-gray-400 text-sm mb-8">Your account <strong className="text-white">{user?.email}</strong> has not been approved. Please contact the administrator.</p>
                <button onClick={logout} className="flex items-center gap-2 mx-auto text-gray-500 hover:text-white text-sm font-semibold transition-colors">
                    <LogOut size={14} /> Sign out
                </button>
            </motion.div>
        </div>
    );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
function Dashboard() {
    const { user, firebaseUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("leads");
    const [unreadCount, setUnreadCount] = useState(0);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const isSuperAdmin = user?.role === "super_admin";
    const features = user?.features || {};

    useEffect(() => {
        if (!firebaseUser) return; // Don't fetch until Firebase auth is ready

        // Request browser notification permissions on load if not set
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        const fetchUnread = async () => {
            try {
                const res = await authFetch(`${API_BASE}/api/admin/contacts`);
                if (res.ok) {
                    const data = await res.json();
                    const currentUnread = data.filter((m: any) => !m.is_read).length;
                    
                    setUnreadCount(prev => {
                        // If new messages arrived
                        if (currentUnread > prev && prev !== 0) {
                            // 1. Play audio
                            const audio = new Audio('/assetsAudio/live-chat.mp3');
                            audio.play().catch(e => console.error("Audio play blocked by browser interaction policy:", e));
                            
                            // 2. Browser Web Notification
                            if ("Notification" in window && Notification.permission === "granted") {
                                new Notification("New Message!", {
                                    body: "You have received a new contact message or lead.",
                                    icon: "/redber_logo_transperent.png"
                                });
                            }
                        }
                        // 3. Document Title Badge
                        if (currentUnread > 0) {
                            document.title = `(${currentUnread}) Admin Console | Redber`;
                            // 4. Browser Navigation App Badge
                            if ('setAppBadge' in navigator && (navigator as any).setAppBadge) {
                                (navigator as any).setAppBadge(currentUnread).catch(console.error);
                            }
                        } else {
                            document.title = "Admin Console | Redber";
                            if ('clearAppBadge' in navigator && (navigator as any).clearAppBadge) {
                                (navigator as any).clearAppBadge().catch(console.error);
                            }
                        }
                        
                        return currentUnread;
                    });
                }
            } catch { }
        };
        
        fetchUnread();
        const interval = setInterval(fetchUnread, 15000); // Check every 15s instead of 30s
        return () => clearInterval(interval);
    }, [firebaseUser]);

    // Build nav items filtered by user features
    const navItems = [
        { id: "settings", label: "Bot Manager", icon: LayoutDashboard, always: true },
        { id: "kb", label: "Knowledge Base", icon: Database, feature: "kb" },
        { id: "training", label: "AI Training Studio", icon: PenLine, feature: "training" },
        { id: "leads", label: "Lead Center", icon: Users, feature: "leads" },
        { id: "metrics", label: "Conversion Metrics", icon: TrendingUp, feature: "metrics" },
        { id: "integrations", label: "Integrations", icon: MessageSquare, feature: "integrations" },
        { id: "contacts", label: "Contact Messages", icon: Mail, feature: "contacts", badge: unreadCount },
        { id: "logs", label: "Chat Logs", icon: ScrollText, feature: "logs" },
        ...(isSuperAdmin ? [{ id: "super", label: "Super Admin", icon: Crown, always: true }] : []),
    ].filter(item => item.always || isSuperAdmin || hasFeature(features, item.feature as string));

    const TITLES: Record<string, string> = {
        leads: "Lead Center", kb: "Knowledge Base", settings: "Bot Manager",
        contacts: "Contact Messages", logs: "Chat Logs", metrics: "Conversion Metrics",
        integrations: "Integrations & Channels", training: "AI Training Studio",
        super: "Super Admin",
    };

    return (
        <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-purple-500/30">
            {/* Sidebar */}
            <aside className="w-64 bg-black/50 border-r border-white/5 backdrop-blur-xl p-6 flex flex-col relative z-20">
                <div className="flex items-center gap-3 mb-8">
                    <img src="/redber_logo_transperent.png" alt="Redber" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-lg tracking-tight">Admin Console</span>
                </div>

                {/* Role badge */}
                <div className="mb-5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                    {isSuperAdmin
                        ? <Crown size={13} className="text-amber-400" />
                        : <Shield size={13} className="text-indigo-400" />
                    }
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
                            {isSuperAdmin ? "Super Admin" : user?.companyName || "Client"}
                        </p>
                        {!isSuperAdmin && user?.planId && (
                            <p className="text-[10px] text-purple-400 font-bold capitalize">{user.planId} Plan</p>
                        )}
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button key={item.id} onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                                    ? "bg-white/10 text-white shadow-inner border border-white/10"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                                <Icon size={17} className={activeTab === item.id ? (item.id === "super" ? "text-amber-400" : "text-purple-400") : ""} />
                                <span className="flex-1 text-left">{item.label}</span>
                                {(item as any).badge > 0 && (
                                    <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">{(item as any).badge}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-auto space-y-2 pt-4 border-t border-white/5">
                    {!isSuperAdmin && user?.limits && (
                        <div className="px-2 py-2 rounded-xl bg-white/5 text-[10px] text-gray-500 space-y-0.5">
                            <p className="font-bold text-gray-400 mb-1">Usage Limits</p>
                            <p>💬 {user.limits.monthlyMessages.toLocaleString()} msg/mo</p>
                            {user.limits.messagesPerDay && <p>📅 {user.limits.messagesPerDay.toLocaleString()}/day</p>}
                            {user.limits.messagesPerHour && <p>⏱ {user.limits.messagesPerHour.toLocaleString()}/hr</p>}
                            <p>🤖 Up to {user.limits.maxBots} bot{user.limits.maxBots !== 1 ? "s" : ""}</p>
                        </div>
                    )}
                    <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors py-2 px-2 font-medium rounded-xl hover:bg-white/5">
                        <ArrowLeft size={16} /> Back to Site
                    </Link>

                    <div className="relative">
                        <button onClick={() => setShowUserMenu(v => !v)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black shrink-0">
                                {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-xs font-bold text-white truncate">{user?.name || "User"}</p>
                                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <ChevronDown size={14} className="text-gray-500 shrink-0" />
                        </button>

                        <AnimatePresence>
                            {showUserMenu && (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                    className="absolute bottom-full left-0 right-0 mb-2 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                    <button onClick={() => { logout(); setShowUserMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors font-semibold">
                                        <LogOut size={15} /> Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black relative z-10">
                <header className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                    <h1 className="text-3xl font-extrabold tracking-tight">{TITLES[activeTab] || ""}</h1>
                    <div className="bg-white/5 p-2 rounded-full border border-white/10 flex items-center px-4 w-64 shadow-inner ring-1 ring-white/5 focus-within:ring-purple-500/50 transition-all">
                        <Search size={16} className="text-gray-400 mr-2" />
                        <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full" />
                    </div>
                </header>

                <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="h-full">
                    {activeTab === "leads" && <LeadsView />}
                    {activeTab === "kb" && <KnowledgeBaseView />}
                    {activeTab === "settings" && <SettingsView />}
                    {activeTab === "contacts" && <ContactsView />}
                    {activeTab === "logs" && <LogsView />}
                    {activeTab === "metrics" && <ConversionMetrics />}
                    {activeTab === "integrations" && <WhatsAppConfig />}
                    {activeTab === "training" && <TrainingStudio />}
                    {activeTab === "super" && <SuperAdminPanel />}
                </motion.div>
            </main>
        </div>
    );
}

// ─── Root with Auth Gate ───────────────────────────────────────────────────────
function AdminApp() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    <p className="text-gray-500 text-sm font-medium">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!user) return <LoginScreen />;
    if (user.status === "pending") return <PendingScreen />;
    if (user.status === "rejected") return <RejectedScreen />;
    return <Dashboard />;
}

export default function AdminDashboard() {
    return (
        <AuthProvider>
            <AdminApp />
        </AuthProvider>
    );
}
