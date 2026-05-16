"use client";

import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronDown, CheckCircle, ArrowUpRight, Bot, Menu, X, ChevronUp, Facebook, Send, Zap, Globe, Calendar, Shield, Link2, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../lib/api";
import { type Region, DEFAULT_PRICING, COUNTRY_TO_REGION, formatPrice } from "../lib/pricing";

const ease = [0.22, 0.61, 0.36, 1] as const;
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.65, delay, ease },
});

const faqs = [
  { q: "Do I need to know how to code?", a: "Not at all! Simply enter your website URL and Redber learns everything automatically. Setup takes about 15 minutes." },
  { q: "How does Redber book appointments?", a: "Redber captures customer preferences directly in the chat and sends it to your inbox instantly." },
  { q: "Can I customize responses?", a: "Yes! Set guardrails, compliance rules, and train Redber with your own content, menus, and pricing." },
  { q: "What languages does it support?", a: "English, Arabic, Spanish, French, and more. Redber automatically detects the customer's language." }
];

const TICKER = ["0.25s Response","24 / 7 Active","50+ Languages","Auto-Booking","Smart Lead Capture","Voice & Chat AI","WhatsApp Ready","Zero-Code Setup","Instant Deploy","Unlimited Scale"];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [bots, setBots] = useState<any[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [isYearly, setIsYearly] = useState(false);
  const [region, setRegion] = useState<Region>("INR");
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 300, damping: 30 });

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatSessionId = useRef(`landing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, chatLoading]);

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const txt = chatInput.trim(); setChatInput("");
    setChatMessages(p => [...p, { sender: "user", text: txt }]);
    setChatLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/bots/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: txt, bot_id: "redber-assistant-001", session_id: chatSessionId.current, history: chatMessages.map(m => ({ sender: m.sender, text: m.text })) }),
      });
      const d = await res.json();
      setChatMessages(p => [...p, { sender: "bot", text: d.reply ?? "Let me think... 🤔" }]);
    } catch {
      setChatMessages(p => [...p, { sender: "bot", text: "Connection issue — please try again!" }]);
    } finally { setChatLoading(false); }
  };

  useEffect(() => { const t = setTimeout(() => setPreloaderDone(true), 2000); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const fn = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    fetch("https://ipapi.co/json/").then(r => r.json()).then(d => { if (d?.country_code) setRegion(COUNTRY_TO_REGION[d.country_code] ?? "USD"); }).catch(() => {});
    fetch(`${API_BASE}/api/pricing`).then(r => r.json()).then(d => { if (d?.INR) setPricing(d); }).catch(() => {});
  }, []);
  useEffect(() => {
    fetch(`${API_BASE}/api/bots/public/list`).then(r => r.json()).then(data => {
      setBots(Array.isArray(data) ? data : (Array.isArray(data?.bots) ? data.bots : [])); setLoadingBots(false);
    }).catch(() => { setBots([]); setLoadingBots(false); });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #ffffff; color: #0A0A14; overflow-x: hidden; }

        :root {
          --accent:        #2563EB;
          --accent-2:      #0EA5E9;
          --gradient:      linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%);
          --gradient-soft: linear-gradient(135deg, rgba(37,99,235,0.09) 0%, rgba(14,165,233,0.09) 100%);
          --accent-light:  #EFF6FF;
          --accent-border: rgba(37,99,235,0.22);

          --bg:            #FFFFFF;
          --bg-alt:        #F7F8FF;
          --bg-dark:       #0A0A14;

          --text:          #0A0A14;
          --text-sec:      #4B5563;
          --text-muted:    #9CA3AF;

          --border:        #E5E7EB;
          --card-shadow:   0 1px 4px rgba(0,0,0,0.05), 0 6px 20px rgba(37,99,235,0.07);
          --card-shadow-h: 0 4px 12px rgba(0,0,0,0.06), 0 12px 36px rgba(37,99,235,0.13);
        }

        .w-container { max-width: 1240px; margin: 0 auto; padding: 0 2.5rem; }
        .w-sec { padding: 8rem 2.5rem; }

        .w-grad-text { background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        .w-chip { display: inline-flex; align-items: center; gap: 0.5rem; border: 1px solid var(--accent-border); border-radius: 999px; padding: 0.32rem 0.9rem; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); background: var(--accent-light); }
        .w-chip-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }

        .w-h1 { font-size: clamp(3rem, 6.5vw, 6.5rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.02; color: var(--text); }
        .w-h2 { font-size: clamp(2rem, 4vw, 3.4rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; color: var(--text); }
        .w-h3 { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text); }
        .w-light { font-weight: 300; color: var(--text-muted); }

        .w-btn { display: inline-flex; align-items: center; gap: 0.5rem; border-radius: 10px; font-weight: 600; font-size: 0.875rem; padding: 0.78rem 1.6rem; cursor: pointer; text-decoration: none; transition: all .18s; border: none; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; }
        .w-btn-primary { background: #0A0A14; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.18); }
        .w-btn-primary:hover { background: #1a1a2e; box-shadow: 0 4px 18px rgba(0,0,0,0.28); transform: translateY(-1px); }
        .w-btn-outline { background: var(--bg); color: var(--text); border: 1.5px solid var(--border); }
        .w-btn-outline:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
        .w-btn-ghost-dark { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
        .w-btn-ghost-dark:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.4); }
        .w-btn-white { background: #fff; color: var(--accent); border: 1.5px solid rgba(255,255,255,0.3); font-weight: 700; }
        .w-btn-white:hover { background: #f0f0ff; }

        .w-nav { position: fixed; top: 1.2rem; left: 50%; transform: translateX(-50%); width: calc(100% - 3rem); max-width: 1160px; z-index: 1000; background: rgba(255,255,255,0.92); backdrop-filter: blur(20px) saturate(160%); border: 1px solid var(--border); border-radius: 14px; padding: 0 1.5rem; box-shadow: 0 4px 24px rgba(37,99,235,0.08); }
        .w-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 58px; }
        .w-nav-links { display: flex; gap: 2.25rem; list-style: none; }
        .w-nav-links a { color: var(--text-sec); font-size: 0.84rem; font-weight: 500; text-decoration: none; transition: color .2s; }
        .w-nav-links a:hover { color: var(--accent); }

        .w-hero { min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 2.5rem 5rem; text-align: center; position: relative; background: var(--bg); overflow: hidden; }
        .w-hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; border: 1px solid var(--accent-border); border-radius: 999px; padding: 0.38rem 1rem; margin-bottom: 2rem; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); background: var(--accent-light); }
        .w-hero-sub { font-size: clamp(1rem, 1.4vw, 1.1rem); color: var(--text-sec); line-height: 1.75; max-width: 520px; margin: 1.75rem auto 0; font-weight: 400; }
        .w-hero-ctas { display: flex; gap: 0.875rem; justify-content: center; margin-top: 2.5rem; flex-wrap: wrap; }
        .w-hero-bar { display: flex; gap: 3rem; justify-content: center; flex-wrap: wrap; margin-top: 5rem; padding-top: 3rem; border-top: 1px solid var(--border); width: 100%; max-width: 560px; }
        .w-stat-val { font-size: 2rem; font-weight: 800; letter-spacing: -0.04em; color: var(--accent); line-height: 1; }
        .w-stat-key { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-top: 0.3rem; }
        .w-hero-blob-1 { position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%); top: -200px; left: 50%; transform: translateX(-60%); pointer-events: none; }
        .w-hero-blob-2 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%); bottom: -100px; right: -100px; pointer-events: none; }

        .w-ticker { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); overflow: hidden; padding: 0.85rem 0; background: var(--bg-alt); position: relative; }
        .w-ticker::before, .w-ticker::after { content: ''; position: absolute; top: 0; bottom: 0; width: 80px; z-index: 1; }
        .w-ticker::before { left: 0; background: linear-gradient(to right, var(--bg-alt), transparent); }
        .w-ticker::after { right: 0; background: linear-gradient(to left, var(--bg-alt), transparent); }
        @keyframes w-marquee { to { transform: translateX(-50%); } }
        .w-ticker-track { display: flex; width: max-content; animation: w-marquee 30s linear infinite; }
        .w-ticker-track:hover { animation-play-state: paused; }
        .w-ticker-item { display: flex; align-items: center; gap: 1.25rem; padding: 0 2rem; white-space: nowrap; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-sec); }
        .w-ticker-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--accent); opacity: 0.5; flex-shrink: 0; }

        .w-card { background: var(--bg); border: 1px solid var(--border); border-radius: 18px; padding: 2rem; transition: border-color 0.2s, box-shadow 0.2s; box-shadow: var(--card-shadow); }
        .w-card:hover { border-color: var(--accent-border); box-shadow: var(--card-shadow-h); }
        .w-card-grad { background: var(--gradient); border-color: transparent; color: #fff; }
        .w-card-grad:hover { box-shadow: 0 8px 40px rgba(37,99,235,0.35); }
        .w-card-alt { background: var(--bg-alt); }
        .w-icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--accent); margin-bottom: 1.25rem; background: var(--accent-light); border: 1px solid var(--accent-border); }
        .w-icon-box-light { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); color: #fff; }

        .w-sec-hd { margin-bottom: 3.5rem; display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem; }

        .w-ind { display: grid; grid-template-columns: 2rem 1fr auto; gap: 2.5rem; align-items: center; padding: 1.6rem 0; border-bottom: 1px solid var(--border); cursor: default; transition: padding-left 0.2s; }
        .w-ind:first-of-type { border-top: 1px solid var(--border); }
        .w-ind:hover { padding-left: 0.6rem; }
        .w-ind:hover .w-ind-name { color: var(--accent); }
        .w-ind-n { font-size: 0.62rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.08em; }
        .w-ind-name { font-size: clamp(1.2rem, 2vw, 1.75rem); font-weight: 700; letter-spacing: -0.025em; color: var(--text); transition: color 0.2s; }
        .w-ind-stat { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); text-align: right; }

        .w-hiw-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.25rem; }
        .w-hiw-n { font-size: 4rem; font-weight: 800; letter-spacing: -0.06em; background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin-bottom: 1.5rem; opacity: 0.35; }
        .w-tag { display: inline-flex; background: var(--accent-light); border: 1px solid var(--accent-border); border-radius: 8px; padding: 0.2rem 0.6rem; font-size: 0.67rem; font-weight: 600; color: var(--accent); margin: 0.18rem; }

        .w-feat { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.25rem; }

        .w-pricing-grid { display: grid; grid-template-columns: 1fr 1.08fr 1fr; gap: 1.25rem; margin-top: 3.5rem; }
        .w-pc { background: var(--bg); border: 1.5px solid var(--border); border-radius: 20px; padding: 2.25rem; display: flex; flex-direction: column; transition: all 0.2s; box-shadow: var(--card-shadow); }
        .w-pc:hover { border-color: var(--accent-border); box-shadow: var(--card-shadow-h); }
        .w-pc-grad { background: var(--gradient); border-color: transparent; box-shadow: 0 8px 40px rgba(37,99,235,0.35); }
        .w-pc-grad:hover { box-shadow: 0 12px 56px rgba(37,99,235,0.45); transform: translateY(-3px); }
        .w-pc-name { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: var(--text-muted); margin-bottom: 0.75rem; }
        .w-pc-name-light { color: rgba(255,255,255,0.55) !important; }
        .w-pc-price { font-size: 2.8rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1; color: var(--text); }
        .w-pc-price-light { color: #fff !important; }
        .w-pc-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem; }
        .w-pc-sub-light { color: rgba(255,255,255,0.45) !important; }
        .w-pc-div { height: 1px; background: var(--border); margin: 1.75rem 0; }
        .w-pc-div-light { background: rgba(255,255,255,0.2) !important; }
        .w-pc-list { list-style: none; display: flex; flex-direction: column; gap: 0.85rem; flex-grow: 1; margin-bottom: 2rem; }
        .w-pc-list li { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; color: var(--text-sec); }
        .w-pc-list-light li { color: rgba(255,255,255,0.75) !important; }
        .w-pc-badge { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 999px; padding: 0.28rem 0.85rem; font-size: 0.58rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.9); margin-bottom: 1.5rem; width: fit-content; }

        .w-cta-dark { background: var(--bg-dark); padding: 7rem 2.5rem; position: relative; overflow: hidden; }
        .w-cta-dark::before { content: ''; position: absolute; width: 800px; height: 800px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 65%); top: 50%; left: 30%; transform: translate(-50%, -50%); pointer-events: none; }
        .w-cta-dark::after { content: ''; position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 65%); top: 20%; right: 5%; pointer-events: none; }
        .w-cta-dark-inner { max-width: 1240px; margin: 0 auto; display: grid; grid-template-columns: 1fr auto; gap: 4rem; align-items: center; position: relative; z-index: 1; }

        .w-ops-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .w-ops-img { width: 100%; height: 280px; object-fit: cover; border-radius: 14px; display: block; filter: grayscale(20%); transition: filter 0.4s, transform 0.4s; }
        .w-ops-img-wrap { overflow: hidden; border-radius: 14px; }
        .w-ops-img-wrap:hover .w-ops-img { filter: grayscale(0%); transform: scale(1.02); }
        .w-ops-card { background: var(--bg-alt); border: 1px solid var(--border); border-radius: 18px; padding: 2.5rem; display: flex; flex-direction: column; justify-content: center; gap: 1rem; box-shadow: var(--card-shadow); }
        .w-ops-col { display: flex; flex-direction: column; gap: 1.25rem; }

        .w-bots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; margin-top: 3.5rem; }
        .w-bot-card { background: var(--bg); border: 1px solid var(--border); border-radius: 18px; padding: 1.75rem; display: flex; flex-direction: column; transition: all 0.2s; box-shadow: var(--card-shadow); }
        .w-bot-card:hover { border-color: var(--accent-border); box-shadow: var(--card-shadow-h); transform: translateY(-2px); }
        .w-bubble { padding: 0.65rem 1rem; border-radius: 14px; font-size: 0.82rem; line-height: 1.45; max-width: 88%; font-weight: 500; }
        .w-bubble-bot { background: var(--bg-alt); border: 1px solid var(--border); color: var(--text-sec); border-bottom-left-radius: 4px; align-self: flex-start; }
        .w-bubble-user { background: var(--gradient); color: #fff; border-bottom-right-radius: 4px; align-self: flex-end; font-weight: 600; }
        .w-chat-preview { background: var(--bg-alt); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: 1.25rem; flex-grow: 1; display: flex; flex-direction: column; gap: 0.65rem; }

        .w-faq-wrap { max-width: 720px; margin: 0 auto; }
        .w-faq-row { border-bottom: 1px solid var(--border); }
        .w-faq-row:first-child { border-top: 1px solid var(--border); }
        .w-faq-btn { width: 100%; padding: 1.4rem 0; text-align: left; display: flex; justify-content: space-between; align-items: center; background: none; border: none; cursor: pointer; font-size: 0.94rem; font-weight: 600; color: var(--text); font-family: 'Plus Jakarta Sans', sans-serif; }
        .w-faq-btn:hover { color: var(--accent); }
        .w-faq-btn svg { color: var(--text-muted); flex-shrink: 0; margin-left: 1rem; transition: transform 0.3s; }
        .w-faq-btn.open svg { transform: rotate(180deg); color: var(--accent); }
        .w-faq-body { padding: 0 0 1.4rem; font-size: 0.875rem; color: var(--text-sec); line-height: 1.75; }

        .w-fcw-trigger { position: fixed; bottom: 2rem; right: 2rem; z-index: 8000; width: 62px; height: 62px; border-radius: 50%; background: radial-gradient(circle at 38% 38%, rgba(139,92,246,0.95) 0%, rgba(37,99,235,0.9) 42%, rgba(14,165,233,0.75) 75%, rgba(8,10,24,0.95) 100%); box-shadow: 0 0 0 10px rgba(37,99,235,0.12), 0 0 36px rgba(37,99,235,0.45), 0 8px 28px rgba(0,0,0,0.35); cursor: pointer; border: none; display: flex; align-items: center; justify-content: center; color: #fff; transition: all 0.25s; animation: w-orb-float 3.5s ease-in-out infinite; }
        .w-fcw-trigger:hover { box-shadow: 0 0 0 14px rgba(37,99,235,0.18), 0 0 52px rgba(37,99,235,0.6), 0 10px 36px rgba(0,0,0,0.4); transform: translateY(-3px) scale(1.06); animation-play-state: paused; }
        @keyframes w-orb-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .w-fcw-panel { position: fixed; bottom: 5.5rem; right: 2rem; z-index: 8001; width: 360px; height: 520px; background: #fff; border: 1px solid var(--border); border-radius: 24px; overflow: hidden; box-shadow: 0 24px 64px rgba(37,99,235,0.16), 0 4px 12px rgba(0,0,0,0.08); display: flex; flex-direction: column; }
        .w-fcw-header { background: #fff; padding: 0.9rem 1.1rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
        .w-fcw-empty { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; padding: 2rem; }
        .w-fcw-empty-title { font-size: 1.1rem; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
        .w-fcw-messages { flex-grow: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.65rem; scroll-behavior: smooth; background: #fff; }
        .w-fcw-messages::-webkit-scrollbar { width: 4px; }
        .w-fcw-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
        .w-fcw-msg { max-width: 82%; font-size: 0.83rem; line-height: 1.5; padding: 0.65rem 0.9rem; border-radius: 16px; font-weight: 500; }
        .w-fcw-msg-bot { background: var(--bg-alt); border: 1px solid var(--border); color: var(--text); border-bottom-left-radius: 4px; align-self: flex-start; }
        .w-fcw-msg-user { background: #0A0A14; color: #fff; border-bottom-right-radius: 4px; align-self: flex-end; }
        .w-fcw-typing { display: flex; gap: 4px; align-items: center; padding: 0.3rem 0; }
        .w-fcw-typing span { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); animation: w-bounce 1.2s infinite; }
        .w-fcw-typing span:nth-child(2) { animation-delay: 0.2s; }
        .w-fcw-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes w-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        .w-fcw-input-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid var(--border); background: #fff; }
        .w-fcw-input { flex-grow: 1; background: transparent; border: none; padding: 0.55rem 0.25rem; font-size: 0.84rem; color: var(--text); outline: none; font-family: 'Plus Jakarta Sans', sans-serif; }
        .w-fcw-input::placeholder { color: var(--text-muted); }
        .w-fcw-send { width: 36px; height: 36px; border-radius: 50%; background: #0A0A14; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; transition: all 0.2s; }
        .w-fcw-send:hover { background: #1a1a2e; transform: scale(1.07); }
        .w-fcw-send:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

        .w-toggle { display: inline-flex; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 12px; padding: 0.22rem; position: relative; }
        .w-toggle-pill { position: absolute; height: calc(100% - 0.44rem); width: calc(50% - 0.22rem); background: #fff; border: 1px solid var(--accent-border); border-radius: 10px; top: 0.22rem; transition: left 0.28s; box-shadow: 0 1px 4px rgba(37,99,235,0.12); }
        .w-toggle-btn { width: 120px; padding: 0.58rem 0; z-index: 1; border: none; background: none; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 0.83rem; cursor: pointer; transition: color 0.25s; position: relative; }

        .w-footer { background: var(--bg-dark); border-top: 1px solid rgba(255,255,255,0.05); position: relative; overflow: hidden; }
        .w-footer::before { content: ''; position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%); top: -200px; left: -150px; pointer-events: none; }
        .w-footer-top { padding: 6rem 2.5rem 4rem; position: relative; z-index: 1; }
        .w-footer-h { font-size: clamp(2.5rem, 6vw, 5.5rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.0; color: #fff; margin: 1rem 0 2rem; }
        .w-footer-muted { -webkit-text-fill-color: transparent; background: linear-gradient(135deg, rgba(37,99,235,0.7), rgba(14,165,233,0.6)); -webkit-background-clip: text; background-clip: text; }
        .w-footer-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 4rem; margin-bottom: 4rem; }
        .w-footer-links-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        .w-footer-col h5 { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; color: rgba(255,255,255,0.2); margin-bottom: 1.25rem; }
        .w-footer-col ul { list-style: none; }
        .w-footer-col li { margin-bottom: 0.75rem; }
        .w-footer-col a { color: rgba(255,255,255,0.4); font-size: 0.84rem; text-decoration: none; transition: color 0.2s; }
        .w-footer-col a:hover { color: #fff; }
        .w-footer-stats { display: flex; gap: 3rem; border-top: 1px solid rgba(255,255,255,0.07); padding-top: 2.5rem; flex-wrap: wrap; align-items: center; }
        .w-footer-stat-n { font-size: 1.6rem; font-weight: 800; color: #fff; letter-spacing: -0.04em; }
        .w-footer-stat-l { font-size: 0.58rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.2); margin-top: 0.2rem; }
        .w-footer-bottom { border-top: 1px solid rgba(255,255,255,0.07); padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; position: relative; z-index: 1; }

        @media (max-width: 1100px) {
          .w-feat > * { grid-column: span 6 !important; }
          .w-pricing-grid, .w-ops-grid, .w-hiw-grid { grid-template-columns: 1fr !important; }
          .w-cta-dark-inner { grid-template-columns: 1fr !important; }
          .w-footer-grid { grid-template-columns: 1fr; gap: 2.5rem; }
          .w-ind-stat { display: none; }
        }
        @media (max-width: 768px) {
          .w-nav-links, .w-nav-desktop-btns { display: none !important; }
          .w-nav-hamburger { display: flex !important; }
          .w-h1 { font-size: clamp(2.6rem, 12vw, 4.5rem) !important; }
          .w-sec { padding: 5rem 1.5rem; }
          .w-feat > * { grid-column: span 12 !important; }
          .w-bots-grid { grid-template-columns: 1fr; }
          .w-nav { top: 0.5rem; width: calc(100% - 1.5rem); padding: 0 1rem; }
          .w-fcw-panel { width: calc(100vw - 2rem); right: 1rem; bottom: 5.5rem; }
          .w-fcw-trigger { right: 1rem; bottom: 1rem; width: 54px; height: 54px; }
          .w-footer-links-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <AnimatePresence>
        {!preloaderDone && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}
            style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "2rem" }}>
            <motion.img src="/logo/Redber Logo Black.svg" alt="Redber" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: 110, height: "auto" }}
              onError={e => { (e.target as HTMLImageElement).src = "/logo/Redber Logo white.svg"; (e.target as HTMLImageElement).style.filter = "invert(1)"; }} />
            <div style={{ width: 160, height: 3, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
              <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.7, ease: "easeInOut" }} style={{ height: "100%", background: "#0A0A14", borderRadius: 999 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "#0A0A14", zIndex: 9999 }} />

      <AnimatePresence>
        {showScrollTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ position: "fixed", bottom: "2rem", left: "2rem", zIndex: 9000, width: 40, height: 40, borderRadius: 10, background: "#0A0A14", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
            <ChevronUp size={17} />
          </motion.button>
        )}
      </AnimatePresence>

      <nav className="w-nav">
        <div className="w-nav-inner">
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/logo/Redber Logo Black.svg" alt="Redber" style={{ width: 108, height: "auto" }}
              onError={e => { (e.target as HTMLImageElement).src = "/logo/Redber Logo white.svg"; (e.target as HTMLImageElement).style.filter = "invert(1)"; }} />
          </Link>
          <ul className="w-nav-links">
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#demo">Live Demo</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
          <div className="w-nav-desktop-btns" style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/contact" className="w-btn w-btn-primary" style={{ padding: "0.6rem 1.3rem", fontSize: "0.82rem" }}>Book a Demo</Link>
          </div>
          <button className="w-nav-hamburger" style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "var(--text)" }} onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 9999, padding: "1.5rem", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
              <img src="/logo/Redber Logo Black.svg" alt="Redber" style={{ width: 100, height: "auto" }}
                onError={e => { (e.target as HTMLImageElement).src = "/logo/Redber Logo white.svg"; (e.target as HTMLImageElement).style.filter = "invert(1)"; }} />
              <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <ul style={{ listStyle: "none", flexGrow: 1 }}>
              {[["#how-it-works","How It Works"],["#pricing","Pricing"],["#faq","FAQ"],["#demo","Live Demo"],["/contact","Contact"]].map(([href, label]) => (
                <li key={href}>
                  <a href={href} onClick={() => setIsMobileMenuOpen(false)}
                    style={{ display: "block", padding: "1rem 0", borderBottom: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <Link href="/contact" className="w-btn w-btn-primary" style={{ display: "flex", justifyContent: "center", marginTop: "2rem", padding: "1rem" }} onClick={() => setIsMobileMenuOpen(false)}>
              Book a Demo <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="w-hero">
        <div className="w-hero-blob-1" />
        <div className="w-hero-blob-2" />
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.55, ease }} style={{ position: "relative", zIndex: 1 }}>
          <div className="w-hero-badge">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gradient)", flexShrink: 0 }} />
            AI Receptionist Platform — Now Live
          </div>
        </motion.div>
        <motion.h1 className="w-h1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.7, ease }} style={{ position: "relative", zIndex: 1 }}>
          Your Business{" "}<span className="w-grad-text">Never</span><br />Misses a Customer
        </motion.h1>
        <motion.p className="w-hero-sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.65, ease }} style={{ position: "relative", zIndex: 1 }}>
          Redber deploys AI agents that handle calls, chats, and bookings so your business stays responsive — 24 hours a day, every single day.
        </motion.p>
        <motion.div className="w-hero-ctas" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.78, duration: 0.6, ease }} style={{ position: "relative", zIndex: 1 }}>
          <Link href="/contact" className="w-btn w-btn-primary" style={{ padding: "0.9rem 2rem", fontSize: "0.95rem" }}>Start Free <ArrowRight size={16} /></Link>
          <a href="#demo" className="w-btn w-btn-outline" style={{ padding: "0.9rem 2rem", fontSize: "0.95rem" }}>See Live Demo</a>
        </motion.div>
        <motion.div className="w-hero-bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0, duration: 0.6 }} style={{ position: "relative", zIndex: 1 }}>
          {[{ v: "0.25s", k: "Response Time" }, { v: "24/7", k: "Always Online" }, { v: "50+", k: "Languages" }].map(({ v, k }) => (
            <div key={k} style={{ textAlign: "center" }}><div className="w-stat-val">{v}</div><div className="w-stat-key">{k}</div></div>
          ))}
        </motion.div>
      </section>

      <AnimatePresence>
        {chatOpen && (
          <motion.div className="w-fcw-panel" initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} transition={{ duration: 0.22, ease }}>
            <div className="w-fcw-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "radial-gradient(circle at 38% 38%, rgba(139,92,246,0.95) 0%, rgba(37,99,235,0.9) 42%, rgba(14,165,233,0.75) 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sparkles size={13} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text)", letterSpacing: "-0.01em" }}>Redber AI</div>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "block" }} /> Online
                  </div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)" }}><X size={13} /></button>
            </div>
            {chatMessages.length === 0 && !chatLoading ? (
              <div className="w-fcw-empty">
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "radial-gradient(circle at 38% 38%, rgba(139,92,246,0.9) 0%, rgba(37,99,235,0.85) 42%, rgba(14,165,233,0.7) 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                  <Sparkles size={20} color="#fff" />
                </div>
                <div className="w-fcw-empty-title">How can I help you?</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", maxWidth: 220, lineHeight: 1.6 }}>Ask me anything about pricing, bookings, or how Redber works.</div>
              </div>
            ) : (
              <div className="w-fcw-messages">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`w-fcw-msg ${m.sender === "bot" ? "w-fcw-msg-bot" : "w-fcw-msg-user"}`}>{m.text}</div>
                ))}
                {chatLoading && <div className="w-fcw-msg w-fcw-msg-bot"><div className="w-fcw-typing"><span /><span /><span /></div></div>}
                <div ref={chatEndRef} />
              </div>
            )}
            <div className="w-fcw-input-row">
              <input className="w-fcw-input" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Type to Ask…" />
              <button className="w-fcw-send" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}><Send size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button className="w-fcw-trigger" onClick={() => setChatOpen(o => !o)} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3, duration: 0.5, ease }}>
        {chatOpen ? <X size={22} /> : <Sparkles size={22} />}
      </motion.button>

      <div className="w-ticker">
        <div className="w-ticker-track">
          {[...TICKER, ...TICKER].map((item, i) => (
            <div key={i} className="w-ticker-item"><span className="w-ticker-sep" />{item}</div>
          ))}
        </div>
      </div>

      <section className="w-sec">
        <div className="w-container">
          <div className="w-sec-hd">
            <div>
              <span className="w-chip"><span className="w-chip-dot" />Industries</span>
              <h2 className="w-h2" style={{ marginTop: "1rem" }}>Built for every<br /><span className="w-light">customer-facing business.</span></h2>
            </div>
            <p style={{ color: "var(--text-sec)", fontSize: "0.875rem", maxWidth: 260, lineHeight: 1.75 }}>Any business that talks to customers can deploy Redber in under 15 minutes — zero code.</p>
          </div>
          {[
            { n: "01", name: "Restaurants & Cafés", stat: "68% research online after hours" },
            { n: "02", name: "Medical Clinics & Spas", stat: "44% book outside business hours" },
            { n: "03", name: "Car Dealerships", stat: "72% research before calling" },
            { n: "04", name: "Salons & Beauty Studios", stat: "$8K+ missed bookings per year" },
            { n: "05", name: "Hotels & Real Estate", stat: "Instant multi-channel support" },
          ].map((item, i) => (
            <motion.div key={i} className="w-ind" {...reveal(i * 0.05)}>
              <span className="w-ind-n">{item.n}</span>
              <span className="w-ind-name">{item.name}</span>
              <span className="w-ind-stat">{item.stat}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" style={{ padding: "8rem 2.5rem", background: "var(--bg-alt)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="w-container">
          <div className="w-sec-hd" style={{ marginBottom: "2.5rem" }}>
            <div>
              <span className="w-chip"><span className="w-chip-dot" />How It Works</span>
              <h2 className="w-h2" style={{ marginTop: "1rem" }}>From zero to AI<br /><span className="w-light">in three steps.</span></h2>
            </div>
          </div>
          <div className="w-hiw-grid">
            {[
              { n: "01", title: "Connect Your Channels", desc: "Link your website, WhatsApp, phone, and social accounts to Redber's central AI brain in one unified dashboard.", tags: ["📱 Phone", "🌐 Web Chat", "💬 WhatsApp", "📊 CRM"], icon: <Link2 size={18} /> },
              { n: "02", title: "Train the Model", desc: "Upload PDFs, paste website URLs, define brand guardrails. The AI processes your entire knowledge base instantly.", tags: ["📄 PDFs", "🔗 Website URL", "🛡️ Guardrails", "🧠 Knowledge Base"], icon: <Sparkles size={18} /> },
              { n: "03", title: "Deploy & Automate 24/7", desc: "Flip the switch. Your AI agents handle infinite concurrent calls, bookings, and chats from day one.", tags: ["⚡ 0.25s Reply", "🔄 24/7 Active", "📅 Auto-Book", "♾️ Unlimited"], icon: <Zap size={18} /> },
            ].map((s, i) => (
              <motion.div key={i} className="w-card" {...reveal(i * 0.1)}>
                <div className="w-hiw-n">{s.n}</div>
                <div className="w-icon-box">{s.icon}</div>
                <h3 className="w-h3" style={{ marginBottom: "0.65rem" }}>{s.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-sec)", lineHeight: 1.7, marginBottom: "1.5rem" }}>{s.desc}</p>
                <div style={{ display: "flex", flexWrap: "wrap", margin: "-0.18rem" }}>{s.tags.map(t => <span key={t} className="w-tag">{t}</span>)}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="w-sec">
        <div className="w-container">
          <div className="w-sec-hd">
            <div>
              <span className="w-chip"><span className="w-chip-dot" />Features</span>
              <h2 className="w-h2" style={{ marginTop: "1rem" }}>Everything your<br /><span className="w-light">business needs.</span></h2>
            </div>
            <Link href="/capabilities" className="w-btn w-btn-outline" style={{ fontSize: "0.85rem" }}>All Capabilities <ArrowUpRight size={14} /></Link>
          </div>
          <div className="w-feat">
            <motion.div className="w-card w-card-grad" style={{ gridColumn: "span 7", minHeight: 280, position: "relative", overflow: "hidden" }} {...reveal(0)}>
              <div className="w-icon-box w-icon-box-light"><Zap size={18} /></div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "0.22rem 0.7rem", width: "fit-content", marginBottom: "0.75rem" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "block" }} />
                <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>Live · Real-Time</span>
              </div>
              <div style={{ marginTop: "auto" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1.4rem", letterSpacing: "-0.02em", color: "#fff", marginBottom: "0.55rem" }}>Instant AI Responses</h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>Replies in under 0.25s across every channel — website, phone, WhatsApp — 24 hours a day.</p>
              </div>
              <div style={{ position: "absolute", right: "1.5rem", bottom: "1rem", fontSize: "6rem", opacity: 0.08, lineHeight: 1 }}>⚡</div>
            </motion.div>
            <motion.div className="w-card w-card-alt" style={{ gridColumn: "span 5" }} {...reveal(0.07)}>
              <div className="w-icon-box"><Globe size={18} /></div>
              <h3 className="w-h3" style={{ marginBottom: "0.6rem" }}>Smart Lead Capture</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-sec)", lineHeight: 1.65, marginBottom: "1.25rem" }}>Automatically collects names, numbers, and intent. Every lead flows into your dashboard instantly.</p>
              <div style={{ marginTop: "auto" }}>
                {["Name collected ✓", "Phone saved ✓", "Intent tagged ✓"].map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.78rem", color: "var(--text-sec)" }}>
                    <CheckCircle size={12} color="var(--accent)" /> {s}
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div className="w-card" style={{ gridColumn: "span 4" }} {...reveal(0.1)}>
              <div className="w-icon-box"><Globe size={18} /></div>
              <h3 className="w-h3" style={{ marginBottom: "0.6rem" }}>50+ Languages</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-sec)", lineHeight: 1.65, marginBottom: "1.25rem" }}>Auto-detects and replies in Arabic, Spanish, French, and more.</p>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {["EN","AR","ES","FR","DE","HI"].map(l => (
                  <span key={l} style={{ fontSize: "0.65rem", fontWeight: 700, background: "var(--accent-light)", border: "1px solid var(--accent-border)", padding: "0.28rem 0.6rem", borderRadius: 8, color: "var(--accent)", letterSpacing: "0.06em" }}>{l}</span>
                ))}
              </div>
            </motion.div>
            <motion.div className="w-card w-card-alt" style={{ gridColumn: "span 4" }} {...reveal(0.14)}>
              <div className="w-icon-box"><Calendar size={18} /></div>
              <h3 className="w-h3" style={{ marginBottom: "0.6rem" }}>Automated Booking</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-sec)", lineHeight: 1.65, marginBottom: "1.25rem" }}>Customers book directly in chat. Syncs with your calendar — zero back-and-forth.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {["Mon 10:00 AM · Confirmed", "Wed 2:00 PM · Confirmed", "Fri 4:00 PM · Pending"].map((s, i) => (
                  <div key={s} style={{ fontSize: "0.72rem", fontWeight: 600, background: "#fff", border: `1px solid ${i < 2 ? "var(--accent-border)" : "var(--border)"}`, padding: "0.4rem 0.8rem", borderRadius: 8, color: i < 2 ? "var(--accent)" : "var(--text-muted)" }}>{s}</div>
                ))}
              </div>
            </motion.div>
            <motion.div className="w-card w-card-grad" style={{ gridColumn: "span 4" }} {...reveal(0.18)}>
              <div className="w-icon-box w-icon-box-light"><Shield size={18} /></div>
              <div style={{ marginTop: "auto" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.02em", color: "#fff", marginBottom: "0.55rem" }}>Custom Guardrails</h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>Set rules, compliance limits, and persona — Redber stays strictly on-script, every time.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="w-cta-dark">
        <div className="w-cta-dark-inner">
          <motion.div {...reveal(0)}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "0.3rem 0.9rem", marginBottom: "1.75rem" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "block" }} />
              <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Now Live</span>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(2.5rem, 5.5vw, 5.5rem)", color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
              Ready to stop missing<br />
              <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>customers?</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", lineHeight: 1.75, marginTop: "1.5rem", maxWidth: 440 }}>Redber deploys in minutes. No code needed. Your AI receptionist starts handling calls, chats, and bookings from day one.</p>
            <div style={{ display: "flex", gap: "0.875rem", marginTop: "2.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/contact" className="w-btn w-btn-primary" style={{ padding: "0.9rem 2.2rem", fontSize: "0.95rem" }}>Start Free Trial <ArrowRight size={16} /></Link>
              <Link href="/contact" className="w-btn w-btn-ghost-dark" style={{ padding: "0.9rem 2.2rem", fontSize: "0.95rem" }}>Book a Demo</Link>
            </div>
            <span style={{ display: "block", fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", fontWeight: 600, marginTop: "1rem" }}>No credit card required</span>
          </motion.div>
          <motion.div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", alignItems: "flex-end" }} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            {[{ v: "0.25s", k: "Avg Response Time" }, { v: "24/7", k: "Always Online" }, { v: "∞", k: "Concurrent Calls" }].map(({ v, k }) => (
              <div key={k} style={{ textAlign: "right" }}>
                <div style={{ fontSize: "2.8rem", fontWeight: 800, letterSpacing: "-0.04em", background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginTop: "0.25rem" }}>{k}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <section id="pricing" className="w-sec">
        <div className="w-container">
          <div style={{ textAlign: "center" }}>
            <span className="w-chip" style={{ margin: "0 auto" }}><span className="w-chip-dot" />Pricing</span>
            <h2 className="w-h2" style={{ marginTop: "1rem", marginBottom: "1rem" }}>Simple, <span className="w-grad-text">transparent</span> pricing</h2>
            <p style={{ color: "var(--text-sec)", fontSize: "0.9rem", maxWidth: 340, margin: "0 auto 2rem" }}>Start free, scale as you grow. No hidden fees.</p>

            {/* Region switcher */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
              {([["INR","🇮🇳","India"],["AED","🇦🇪","Gulf / GCC"],["USD","🇺🇸","USA & Canada"],["GBP","🇬🇧","United Kingdom"]] as const).map(([r, flag, label]) => (
                <button key={r} onClick={() => setRegion(r as Region)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.32rem 0.85rem", borderRadius: 999, border: `1.5px solid ${region === r ? "var(--accent)" : "var(--border)"}`, background: region === r ? "var(--accent-light)" : "transparent", color: region === r ? "var(--accent)" : "var(--text-muted)", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.18s" }}>
                  <span>{flag}</span>{r}
                </button>
              ))}
            </div>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "2rem" }}>
              Prices shown for{" "}
              {region === "INR" ? "India" : region === "AED" ? "Gulf / GCC" : region === "USD" ? "USA & Canada" : "United Kingdom"}{" "}
              setup &amp; billing
            </p>

            <div className="w-toggle" style={{ margin: "0 auto" }}>
              <div className="w-toggle-pill" style={{ left: isYearly ? "calc(50% + 0.22rem)" : "0.22rem" }} />
              <button className="w-toggle-btn" onClick={() => setIsYearly(false)} style={{ color: !isYearly ? "var(--accent)" : "var(--text-muted)" }}>Monthly</button>
              <button className="w-toggle-btn" onClick={() => setIsYearly(true)} style={{ color: isYearly ? "var(--accent)" : "var(--text-muted)", position: "relative" }}>
                Yearly
                {!isYearly && <span style={{ position: "absolute", top: -15, right: 4, background: "var(--gradient)", color: "#fff", fontSize: "0.54rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: 999, whiteSpace: "nowrap" }}>Save 15%</span>}
              </button>
            </div>
          </div>
          <div className="w-pricing-grid">
            <motion.div className="w-pc" {...reveal(0)}>
              <div style={{ height: "1.5rem", marginBottom: "1.5rem" }} />
              <div className="w-pc-name">Starter</div>
              <div className="w-pc-price">{formatPrice(region, isYearly ? pricing[region].starter.yearly : pricing[region].starter.monthly)}</div>
              <div className="w-pc-sub">per {isYearly ? "year" : "month"}</div>
              <div className="w-pc-div" />
              <ul className="w-pc-list">
                {["Up to 1 website","Website chat widget","Basic knowledge base","Lead capture","CRM lead dashboard"].map(f => (
                  <li key={f}><CheckCircle size={14} color="var(--accent-2)" style={{ flexShrink: 0 }} />{f}</li>
                ))}
              </ul>
              <Link href="/contact" className="w-btn w-btn-outline" style={{ justifyContent: "center", marginTop: "auto" }}>Get Started</Link>
            </motion.div>
            <motion.div className="w-pc w-pc-grad" {...reveal(0.08)} style={{ position: "relative", overflow: "hidden" }}>
              <div className="w-pc-badge"><span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.8)", display: "block" }} /> Most Popular</div>
              <div className="w-pc-name w-pc-name-light">Growth</div>
              <div className="w-pc-price w-pc-price-light">{formatPrice(region, isYearly ? pricing[region].growth.yearly : pricing[region].growth.monthly)}</div>
              <div className="w-pc-sub w-pc-sub-light">per {isYearly ? "year" : "month"}</div>
              <div className="w-pc-div w-pc-div-light" />
              <ul className="w-pc-list w-pc-list-light">
                {["Up to 2 websites","PDF document training","Product catalog training","Conversation summaries","Analytics dashboard","Priority support"].map(f => (
                  <li key={f}><CheckCircle size={14} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />{f}</li>
                ))}
              </ul>
              <Link href="/contact" className="w-btn w-btn-white" style={{ justifyContent: "center", marginTop: "auto" }}>Start Free Trial</Link>
            </motion.div>
            <motion.div className="w-pc" {...reveal(0.16)}>
              <div style={{ height: "1.5rem", marginBottom: "1.5rem" }} />
              <div className="w-pc-name">Business</div>
              <div className="w-pc-price">{formatPrice(region, isYearly ? pricing[region].business.yearly : pricing[region].business.monthly)}</div>
              <div className="w-pc-sub">per {isYearly ? "year" : "month"}</div>
              <div className="w-pc-div" />
              <ul className="w-pc-list">
                {["Up to 5 websites","Unlimited conversations","Advanced web crawler","Lead scoring insights","Multi-language support"].map(f => (
                  <li key={f}><CheckCircle size={14} color="var(--accent-2)" style={{ flexShrink: 0 }} />{f}</li>
                ))}
              </ul>
              <Link href="/contact" className="w-btn w-btn-outline" style={{ justifyContent: "center", marginTop: "auto" }}>Contact Us</Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trial Period Section */}
      <section style={{ padding: "5rem 2.5rem", background: "var(--bg-dark)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 50%, rgba(37,99,235,0.18) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div className="w-container" style={{ position: "relative", zIndex: 1 }}>
          <motion.div {...reveal(0)} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4rem", alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 999, padding: "0.3rem 0.9rem", marginBottom: "1.5rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "block" }} />
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>Zero Risk</span>
              </div>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, color: "#fff", marginBottom: "1rem" }}>
                Try Redber free for <span style={{ background: "linear-gradient(135deg,#2563EB,#0EA5E9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>14 days.</span>
              </h2>
              <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 480, marginBottom: "2.5rem" }}>
                We set it up on your website for you — no code, no credit card. See real customers engaging with your AI receptionist before you pay a single rupee.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", maxWidth: 480, marginBottom: "2.5rem" }}>
                {[
                  { icon: "🚀", title: "Live in 24 hours", sub: "We handle the full setup for you" },
                  { icon: "💳", title: "No credit card", sub: "No payment details required" },
                  { icon: "🤝", title: "We train the AI", sub: "Using your menus, FAQs & pricing" },
                  { icon: "❌", title: "Cancel anytime", sub: "No contracts, no lock-in" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.1rem", lineHeight: 1, marginTop: "0.1rem" }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", marginBottom: "0.15rem" }}>{item.title}</div>
                      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", alignItems: "center" }}>
                <Link href="/contact?subject=14-Day Free Trial&message=I'd like to start my free 14-day trial of Redber." className="w-btn w-btn-primary" style={{ padding: "0.9rem 2rem", fontSize: "0.9rem" }}>
                  Start My Free Trial <ArrowRight size={15} />
                </Link>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>No card · No code · We set it up</span>
              </div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              style={{ display: "flex", flexDirection: "column", gap: "0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2rem", minWidth: 220 }}>
              {[
                { day: "Day 1", action: "We go live on your site" },
                { day: "Day 3", action: "First leads captured" },
                { day: "Day 7", action: "Review your dashboard" },
                { day: "Day 14", action: "Decide — no pressure" },
              ].map((item, i, arr) => (
                <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", paddingBottom: i < arr.length - 1 ? "1.25rem" : 0, position: "relative" }}>
                  {i < arr.length - 1 && <div style={{ position: "absolute", left: "1.6rem", top: "2rem", bottom: 0, width: 1, background: "rgba(255,255,255,0.08)" }} />}
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: i === 3 ? "linear-gradient(135deg,#2563EB,#0EA5E9)" : "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                    <span style={{ fontSize: "0.58rem", fontWeight: 800, color: i === 3 ? "#fff" : "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>{i + 1}</span>
                  </div>
                  <div style={{ paddingTop: "0.35rem" }}>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.25)", marginBottom: "0.2rem" }}>{item.day}</div>
                    <div style={{ fontSize: "0.84rem", fontWeight: 600, color: i === 3 ? "#fff" : "rgba(255,255,255,0.55)" }}>{item.action}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: "8rem 2.5rem", background: "var(--bg-alt)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="w-container">
          <div className="w-sec-hd">
            <div>
              <span className="w-chip"><span className="w-chip-dot" />Capabilities</span>
              <h2 className="w-h2" style={{ marginTop: "1rem" }}>Powering every part<br /><span className="w-light">of your ops.</span></h2>
            </div>
            <Link href="/contact" className="w-btn w-btn-outline" style={{ fontSize: "0.85rem" }}>All Capabilities <ArrowUpRight size={14} /></Link>
          </div>
          <div className="w-ops-grid">
            <div className="w-ops-col">
              <motion.div className="w-ops-img-wrap" {...reveal(0)}>
                <img src="/img_assets/leads.jpg" alt="AI lead capture" className="w-ops-img" />
              </motion.div>
              <motion.div className="w-ops-card" {...reveal(0.08)}>
                <h3 style={{ fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.02em", color: "var(--text)" }}>24/7 Appointment Booking</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-sec)", lineHeight: 1.7 }}>Customers book in the chat. Redber captures date, time, name, and contact — no back-and-forth.</p>
                <Link href="/contact" className="w-btn w-btn-outline" style={{ alignSelf: "flex-start", fontSize: "0.82rem" }}>Learn More</Link>
              </motion.div>
            </div>
            <div className="w-ops-col">
              <motion.div className="w-ops-card" {...reveal(0.12)}>
                <h3 style={{ fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.02em", color: "var(--text)" }}>Instant Smart Lead Capture</h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-sec)", lineHeight: 1.7 }}>Automatically asks for name, phone, and requirements at exactly the right moment. Every lead goes straight into your dashboard.</p>
                <Link href="/contact" className="w-btn w-btn-outline" style={{ alignSelf: "flex-start", fontSize: "0.82rem" }}>Learn More</Link>
              </motion.div>
              <motion.div className="w-ops-img-wrap" style={{ position: "relative", flexGrow: 1 }} {...reveal(0.18)}>
                <img src="/img_assets/multi_ling.jpg" alt="Multi-language" className="w-ops-img" style={{ height: "100%", minHeight: 260, objectFit: "cover" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, var(--bg-alt) 45%, transparent)", padding: "3rem 2rem 2rem", borderRadius: "0 0 14px 14px" }}>
                  <h3 style={{ fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.02em", color: "var(--text)", marginBottom: "0.5rem" }}>Always-On Multi-Language</h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-sec)", marginBottom: "1rem", lineHeight: 1.6 }}>Responds in English, Arabic, Spanish, French, and more.</p>
                  <Link href="/contact" className="w-btn w-btn-outline" style={{ fontSize: "0.78rem" }}>Learn More</Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="w-sec">
        <div className="w-container">
          <span className="w-chip"><span className="w-chip-dot" />Live Demos</span>
          <h2 className="w-h2" style={{ marginTop: "1rem", marginBottom: "0.75rem" }}>Take Redber for <span className="w-grad-text">a spin.</span></h2>
          <p style={{ color: "var(--text-sec)", fontSize: "0.9rem" }}>Try these live AI receptionists to see the capabilities in action.</p>
          <div className="w-bots-grid">
            {loadingBots ? (
              <div style={{ padding: "3rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading receptionists…</div>
            ) : bots.filter(b => b.status === "Active").length === 0 ? (
              <div style={{ padding: "3rem", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: 18, textAlign: "center" }}>
                <Bot size={36} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
                <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: "0.4rem" }}>No Live Bots Yet</p>
                <p style={{ color: "var(--text-sec)", fontSize: "0.82rem" }}>Create your first AI receptionist in the admin panel.</p>
              </div>
            ) : bots.filter(b => b.status === "Active" && b.id !== "redber-assistant-001" && !b.name.toLowerCase().includes("redber")).map((bot, idx) => {
              const industry = (bot.persona_config?.industry || bot.role || "").toLowerCase();
              const { userQ, botA } = (() => {
                if (industry.includes("restaurant") || industry.includes("cafe")) return { userQ: "Can I book a table for 2 tonight?", botA: "Of course! 🍽️ We have spots at 7pm and 8:30pm. May I get your name?" };
                if (industry.includes("auto") || industry.includes("car")) return { userQ: "Is the 2024 SUV still available?", botA: "Yes, 2 left! 🚗 Want to schedule a test drive this weekend?" };
                if (industry.includes("medical") || industry.includes("clinic")) return { userQ: "I need to see a dermatologist", botA: "Dr. Patel is available Tuesday 11am or Thursday 3pm. 👨‍⚕️" };
                if (industry.includes("salon") || industry.includes("beauty")) return { userQ: "How much is a keratin treatment?", botA: "Starts from ₹1,800 ✨ Want me to book with Maya?" };
                return { userQ: "What are your business hours?", botA: "Open Mon–Sat, 9am–6pm! 😊 I can book you right now if you'd like." };
              })();
              return (
                <motion.div key={bot.id} className="w-bot-card" {...reveal(idx * 0.07)}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1rem" }}>
                    {bot.avatar
                      ? <img src={bot.avatar} alt={bot.name} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} />
                      : <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--gradient)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem" }}>{bot.name.charAt(0)}</div>
                    }
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--text)" }}>{bot.name}</div>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginTop: "0.15rem" }}>{bot.role}</div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "block" }} />
                      <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.06em" }}>ONLINE</span>
                    </div>
                  </div>
                  <div className="w-chat-preview">
                    <div className="w-bubble w-bubble-bot">Hi! I&apos;m {bot.name}. How can I help you today?</div>
                    <div className="w-bubble w-bubble-user">{userQ}</div>
                    <div className="w-bubble w-bubble-bot">{botA}</div>
                  </div>
                  <Link href={`/chat/${bot.name.toLowerCase()}`} className="w-btn w-btn-primary" style={{ display: "flex", justifyContent: "center", fontSize: "0.85rem" }}>
                    Chat with {bot.name} <ArrowUpRight size={14} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="faq" style={{ padding: "8rem 2.5rem", background: "var(--bg-alt)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="w-container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <span className="w-chip" style={{ margin: "0 auto" }}><span className="w-chip-dot" />FAQ</span>
            <h2 className="w-h2" style={{ marginTop: "1rem" }}>Frequently asked <span className="w-grad-text">questions</span></h2>
            <p style={{ color: "var(--text-sec)", fontSize: "0.875rem", maxWidth: 380, margin: "1rem auto 0", lineHeight: 1.75 }}>Got questions? We&apos;ve got answers. Can&apos;t find what you need? Get in touch.</p>
          </div>
          <div className="w-faq-wrap">
            {faqs.map((faq, i) => (
              <motion.div key={i} className="w-faq-row" {...reveal(i * 0.06)}>
                <button className={`w-faq-btn${openFaq === i ? " open" : ""}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q} <ChevronDown size={17} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                      <div className="w-faq-body">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <Link href="/contact" className="w-btn w-btn-primary">Contact Us <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      <footer className="w-footer">
        <div className="w-footer-top">
          <div className="w-container">
            <div className="w-footer-grid">
              <div>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gradient)", display: "block" }} />Get Started
                </span>
                <h2 className="w-footer-h">Ready to put<br /><span className="w-footer-muted">AI to work?</span></h2>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", lineHeight: 1.75, marginBottom: "2rem", maxWidth: 340 }}>
                  Join businesses using Redber to automate customer conversations, capture leads, and grow — 24/7.
                </p>
                <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
                  <Link href="/contact" className="w-btn w-btn-primary">Start Free Trial <ArrowRight size={14} /></Link>
                  <a href="#demo" className="w-btn w-btn-ghost-dark">See Live Demo</a>
                </div>
              </div>
              <div className="w-footer-links-grid w-footer-col">
                {[
                  ["Product", [["#how-it-works","How It Works"],["#features","Features"],["#pricing","Pricing"],["#demo","Live Demo"],["#faq","FAQ"]]],
                  ["Company", [["/about","About Us"],["/blog","Blog"],["/contact","Contact"]]],
                  ["Legal", [["/privacy-policy","Privacy"],["/terms-of-service","Terms"],["/cookies","Cookies"]]]
                ].map(([col, links]) => (
                  <div key={col as string}>
                    <h5>{col as string}</h5>
                    <ul>{(links as string[][]).map(([href, label]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-footer-stats">
              {[{n:"0.25s",l:"Avg Response"},{n:"24/7",l:"Always Online"},{n:"∞",l:"Concurrent"},{n:"<1min",l:"Setup"}].map(({n,l}) => (
                <div key={l}><div className="w-footer-stat-n">{n}</div><div className="w-footer-stat-l">{l}</div></div>
              ))}
              <div style={{ marginLeft: "auto" }}>
                <a href="#" aria-label="Facebook" style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "all 0.2s" }}
                  onMouseOver={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                  onMouseOut={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
                  <Facebook size={15} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="w-footer-bottom">
          <div className="w-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "1rem" }}>
            <img src="/logo/Redber Logo white.svg" alt="Redber" style={{ width: 82, height: "auto" }} />
            <span style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.75rem" }}>
              © 2026 Redber AI · Built by <a href="https://acenzos.com" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Acenzos</a>
            </span>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {[["Privacy","/privacy-policy"],["Terms","/terms-of-service"],["Cookies","/cookies"]].map(([l,h]) => (
                <Link key={h} href={h} style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.75rem", textDecoration: "none" }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
