"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { API_BASE } from "../../lib/api";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .pg-wrap { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #0A0A14; min-height: 100vh; }
  .pg-nav { position: fixed; top: 1.2rem; left: 50%; transform: translateX(-50%); width: calc(100% - 3rem); max-width: 1160px; z-index: 100; background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); border: 1px solid #E5E7EB; border-radius: 14px; padding: 0 1.5rem; box-shadow: 0 4px 24px rgba(37,99,235,0.08); }
  .pg-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 58px; }
  .pg-back { display: inline-flex; align-items: center; gap: 0.5rem; color: #4B5563; font-size: 0.84rem; font-weight: 600; text-decoration: none; transition: color 0.2s; }
  .pg-back:hover { color: #2563EB; }
  .pg-main { max-width: 1160px; margin: 0 auto; padding: 9rem 2.5rem 6rem; display: grid; grid-template-columns: 1fr 1.1fr; gap: 6rem; align-items: start; }
  .pg-chip { display: inline-flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(37,99,235,0.22); border-radius: 999px; padding: 0.32rem 0.9rem; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2563EB; background: #EFF6FF; margin-bottom: 1.5rem; }
  .pg-h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; color: #0A0A14; margin-bottom: 1.25rem; }
  .pg-grad { background: linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .pg-sub { font-size: 1rem; color: #4B5563; line-height: 1.75; max-width: 420px; margin-bottom: 3rem; }
  .pg-info { display: flex; flex-direction: column; gap: 1.5rem; }
  .pg-info-row { display: flex; align-items: center; gap: 1rem; }
  .pg-info-icon { width: 44px; height: 44px; border-radius: 12px; background: #EFF6FF; border: 1px solid rgba(37,99,235,0.18); display: flex; align-items: center; justify-content: center; color: #2563EB; flex-shrink: 0; }
  .pg-info-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9CA3AF; }
  .pg-info-val { font-size: 1rem; font-weight: 600; color: #0A0A14; margin-top: 0.2rem; text-decoration: none; transition: color 0.2s; }
  .pg-info-val:hover { color: #2563EB; }
  .pg-form-card { background: #F7F8FF; border: 1px solid #E5E7EB; border-radius: 24px; padding: 2.5rem; }
  .pg-field { margin-bottom: 1.25rem; }
  .pg-label { display: block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #6B7280; margin-bottom: 0.5rem; }
  .pg-input { width: 100%; background: #fff; border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 0.875rem 1.1rem; font-size: 0.9rem; color: #0A0A14; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; transition: border-color 0.2s; }
  .pg-input::placeholder { color: #9CA3AF; }
  .pg-input:focus { border-color: #2563EB; }
  .pg-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .pg-btn { width: 100%; background: #0A0A14; color: #fff; border: none; border-radius: 12px; padding: 1rem; font-size: 0.9rem; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; letter-spacing: 0.02em; }
  .pg-btn:hover { background: #1a1a2e; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,0.18); }
  .pg-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
  .pg-err { background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 0.875rem 1rem; font-size: 0.84rem; color: #DC2626; margin-bottom: 1.25rem; }
  .pg-success { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 3rem 1.5rem; gap: 1rem; }
  .pg-success-icon { width: 72px; height: 72px; background: #EFF6FF; border: 1px solid rgba(37,99,235,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #2563EB; }
  .pg-reset { background: #F7F8FF; border: 1.5px solid #E5E7EB; border-radius: 10px; padding: 0.7rem 1.5rem; font-size: 0.84rem; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; color: #4B5563; transition: all 0.2s; }
  .pg-reset:hover { border-color: #2563EB; color: #2563EB; }
  @media(max-width:900px){ .pg-main{grid-template-columns:1fr;gap:3rem;} }
  @media(max-width:640px){ .pg-main{padding:8rem 1.5rem 4rem;} .pg-row2{grid-template-columns:1fr;} }
`;

function ContactFormContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    const subject = searchParams.get("subject");
    const message = searchParams.get("message");
    if (subject || message) {
      setFormData(prev => ({
        ...prev,
        ...(subject && { subject }),
        ...(message && { message }),
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch(`${API_BASE}/api/admin/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="pg-wrap">
      <style>{STYLES}</style>

      <nav className="pg-nav">
        <div className="pg-nav-inner">
          <Link href="/" className="pg-back">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <img src="/logo/Redber Logo Black.svg" alt="Redber" style={{ width: 96, height: "auto" }}
            onError={e => { (e.target as HTMLImageElement).src = "/logo/Redber Logo white.svg"; (e.target as HTMLImageElement).style.filter = "invert(1)"; }} />
        </div>
      </nav>

      <main className="pg-main">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <div className="pg-chip">Get in Touch</div>
          <h1 className="pg-h1">
            Let&apos;s build<br />
            <span className="pg-grad">something iconic.</span>
          </h1>
          <p className="pg-sub">
            Questions about our AI employees? Need a custom solution? Reach out and we&apos;ll get back to you within 24 hours.
          </p>

          <div className="pg-info">
            {[
              { icon: Mail, label: "Email us", val: "customercare@redber.in", href: "mailto:customercare@redber.in" },
              { icon: Phone, label: "Call / WhatsApp", val: "+91 6238910451", href: "tel:+916238910451" },
              { icon: MapPin, label: "Serving clients", val: "India & Globally", href: null },
            ].map((item, i) => (
              <div key={i} className="pg-info-row">
                <div className="pg-info-icon"><item.icon size={18} /></div>
                <div>
                  <div className="pg-info-label">{item.label}</div>
                  {item.href
                    ? <a href={item.href} className="pg-info-val" style={{ display: "block" }}>{item.val}</a>
                    : <div className="pg-info-val">{item.val}</div>
                  }
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
          <div className="pg-form-card">
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pg-success">
                  <div className="pg-success-icon"><CheckCircle size={36} /></div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Message Received!</div>
                  <p style={{ color: "#4B5563", fontSize: "0.9rem", maxWidth: 280 }}>Thanks for reaching out. We&apos;ll get back to you within 24 hours.</p>
                  <button onClick={() => setStatus("idle")} className="pg-reset">Send another message</button>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit}>
                  {status === "error" && (
                    <div className="pg-err">
                      Something went wrong. Please email us at{" "}
                      <a href="mailto:customercare@redber.in" style={{ color: "#DC2626", fontWeight: 700 }}>customercare@redber.in</a>
                    </div>
                  )}
                  <div className="pg-row2">
                    <div className="pg-field">
                      <label className="pg-label">Full Name</label>
                      <input required type="text" className="pg-input" placeholder="Your name"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="pg-field">
                      <label className="pg-label">Email</label>
                      <input required type="email" className="pg-input" placeholder="john@company.com"
                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="pg-field">
                    <label className="pg-label">Subject</label>
                    <input required type="text" className="pg-input" placeholder="Partnership, Custom Bot, etc."
                      value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                  </div>
                  <div className="pg-field">
                    <label className="pg-label">How can we help?</label>
                    <textarea required rows={5} className="pg-input" placeholder="Tell us about your needs…"
                      style={{ resize: "none" }}
                      value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} />
                  </div>
                  <button type="submit" className="pg-btn" disabled={status === "submitting"}>
                    {status === "submitting" ? "Sending…" : <><Send size={16} /> Send Message</>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div style={{ background: "#fff", minHeight: "100vh" }} />}>
      <ContactFormContent />
    </Suspense>
  );
}
