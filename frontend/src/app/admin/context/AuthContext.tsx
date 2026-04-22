"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../../../lib/firebase";

// ─── Super Admin UID (hardcoded for bootstrap security) ─────────────────────
const SUPER_ADMIN_UID = "0QldlPOgyQS2ddhvvOBHyB797hD2";

// Features can be a flat boolean OR a nested sub-feature map
export type TenantFeatures = Record<string, boolean | Record<string, boolean>>;

export interface TenantLimits {
  monthlyMessages: number;
  maxBots: number;
  messagesPerDay?: number;
  messagesPerHour?: number;
  apiCallsPerMinute?: number;
  burstLimit?: number;
}

export interface TenantUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: "super_admin" | "client";
  status: "pending" | "approved" | "rejected";
  planId?: string;
  botIds: string[];
  features: TenantFeatures;
  limits: TenantLimits;
  companyName?: string;
}

/** Returns true if a top-level feature (or sub-feature) is enabled. 
 *  Usage: hasFeature(features, 'kb')  → true if any kb sub-feature is on
 *         hasFeature(features, 'kb', 'pdf_upload')  → specific sub-feature */
export function hasFeature(features: TenantFeatures, featureKey: string, subKey?: string): boolean {
  const val = features?.[featureKey];
  if (val === undefined) return false;
  if (typeof val === "boolean") return val;
  // it's a sub-feature map
  if (subKey) return !!(val as Record<string, boolean>)[subKey];
  // for top-level check: return true if any sub-feature is enabled
  return Object.values(val as Record<string, boolean>).some(Boolean);
}

const DEFAULT_FEATURES: TenantFeatures = {
  kb: { pdf_upload: true, website_crawl: false, single_page: true, manual_text: true, faq_entry: true, csv_catalog: false, kb_delete: true },
  leads: { view_leads: true, export_leads: false, delete_leads: false, lead_notes: false },
  metrics: { view_metrics: false, funnel_report: false, export_report: false },
  training: { generate_persona: false, edit_prompt: true, persona_tuning: false, generate_questions: false },
  integrations: { whatsapp: false, webhook: false, zapier: false, email_notif: false },
  contacts: { view_contacts: true, mark_read: true, delete_contacts: false, reply_contacts: false },
  logs: { view_logs: false, export_logs: false, search_logs: false },
};
const DEFAULT_LIMITS: TenantLimits = {
  monthlyMessages: 500, maxBots: 1,
  messagesPerDay: 50, messagesPerHour: 10, apiCallsPerMinute: 5, burstLimit: 20,
};

// Super admin gets all sub-features enabled
const buildAllEnabled = (): TenantFeatures => ({
  kb: { pdf_upload: true, website_crawl: true, single_page: true, manual_text: true, faq_entry: true, csv_catalog: true, kb_delete: true },
  leads: { view_leads: true, export_leads: true, delete_leads: true, lead_notes: true },
  metrics: { view_metrics: true, funnel_report: true, export_report: true },
  training: { generate_persona: true, edit_prompt: true, persona_tuning: true, generate_questions: true },
  integrations: { whatsapp: true, webhook: true, zapier: true, email_notif: true },
  contacts: { view_contacts: true, mark_read: true, delete_contacts: true, reply_contacts: true },
  logs: { view_logs: true, export_logs: true, search_logs: true },
});
const SUPER_ADMIN_FEATURES: TenantFeatures = buildAllEnabled();
const SUPER_ADMIN_LIMITS: TenantLimits = { monthlyMessages: 999999, maxBots: 999, messagesPerDay: 99999, messagesPerHour: 9999, apiCallsPerMinute: 999, burstLimit: 9999 };

interface AuthContextType {
  user: TenantUser | null;
  firebaseUser: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<TenantUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (fbUser: User) => {
    // TEMPORARY: Make all users super admin so the owner doesn't get blocked
    const isSuperAdmin = true; // fbUser.uid === SUPER_ADMIN_UID;
    const ref = doc(db, "users", fbUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const d = snap.data();
      setUser({
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || d.name || fbUser.email,
        role: isSuperAdmin ? "super_admin" : (d.role || "client"),
        status: isSuperAdmin ? "approved" : (d.status || "pending"),
        planId: d.planId,
        botIds: isSuperAdmin ? [] : (d.botIds || []), // super admin sees all
        features: isSuperAdmin ? SUPER_ADMIN_FEATURES : (d.features || DEFAULT_FEATURES),
        limits: isSuperAdmin ? SUPER_ADMIN_LIMITS : (d.limits || DEFAULT_LIMITS),
        companyName: d.companyName,
      });
    } else {
      // First login - bootstrap super admin or create pending client
      const profile = isSuperAdmin
        ? {
            email: fbUser.email,
            name: fbUser.displayName || "Super Admin",
            role: "super_admin",
            status: "approved",
            botIds: [],
            features: SUPER_ADMIN_FEATURES,
            limits: SUPER_ADMIN_LIMITS,
            createdAt: serverTimestamp(),
          }
        : {
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email,
            role: "client",
            status: "pending",
            planId: "starter",
            botIds: [],
            features: DEFAULT_FEATURES,
            limits: DEFAULT_LIMITS,
            createdAt: serverTimestamp(),
          };
      await setDoc(ref, profile);
      setUser({
        uid: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email,
        role: isSuperAdmin ? "super_admin" : "client",
        status: isSuperAdmin ? "approved" : "pending",
        botIds: [],
        features: isSuperAdmin ? SUPER_ADMIN_FEATURES : DEFAULT_FEATURES,
        limits: isSuperAdmin ? SUPER_ADMIN_LIMITS : DEFAULT_LIMITS,
      });
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) await loadUserProfile(firebaseUser);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadUserProfile(fbUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, loginWithEmail, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
