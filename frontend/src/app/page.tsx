"use client";

import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import Image from "next/image";
import Hero3DModel from "@/components/Hero3DModel";
import Link from "next/link";
import { ArrowRight, ChevronDown, CheckCircle, ArrowUpRight, MessageCircle, Bot, Menu, X, ChevronUp, Facebook } from "lucide-react";
import { useState, useEffect } from "react";
import { API_BASE } from "../lib/api";
import RedberMascot from "@/components/RedberMascot";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, delay, ease: "easeOut" } as const,
});

const faqs = [
  { q: "Do I need to know how to code?", a: "Not at all! Simply enter your website URL and Redber learns everything automatically. Setup takes about 15 minutes." },
  { q: "How does Redber book appointments?", a: "Redber captures customer preferences directly in the chat and sends it to your inbox instantly." },
  { q: "Can I customize responses?", a: "Yes! Set guardrails, compliance rules, and train Redber with your own content, menus, and pricing." },
  { q: "What languages does it support?", a: "English, Arabic, Spanish, French, and more. Redber automatically detects the customer's language." }
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [bots, setBots] = useState<any[]>([]);
  const [loadingBots, setLoadingBots] = useState(true);
  const [isYearly, setIsYearly] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const t = setTimeout(() => setPreloaderDone(true), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/bots/public/list`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (Array.isArray(data?.bots) ? data.bots : []);
        setBots(list);
        setLoadingBots(false);
      })
      .catch(() => { setBots([]); setLoadingBots(false); });
  }, []);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Redber",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "AI-powered receptionist platform that handles reservations, captures leads, and engages customers 24/7 via chat and voice.",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "120" }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background: #0d0d0d; color: #f0f0f0; overflow-x: hidden; }

        .section { padding: 8rem 2rem; }
        .inner { max-width: 1280px; width: 100%; margin: 0 auto; }

        .gf-tag { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #C6F432; background: rgba(198,244,50,0.12); padding: 0.35rem 0.8rem; border-radius: 999px; display: inline-flex; margin-bottom: 1.5rem; }

        /* Nav */
        .gf-nav { position: fixed; top: 1.5rem; left: 50%; transform: translateX(-50%); width: calc(100% - 2rem); max-width: 1200px; z-index: 100; background: rgba(13,13,13,0.85); backdrop-filter: blur(20px); border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 40px rgba(0,0,0,0.4); padding: 0.5rem 1.5rem; }
        .gf-nav-inner { width: 100%; display: flex; align-items: center; justify-content: space-between; height: 64px; }
        .gf-nav-links { display: flex; gap: 3rem; list-style: none; }
        .gf-nav-links a { color: rgba(255,255,255,0.55); font-size: 0.95rem; font-weight: 600; text-decoration: none; transition: color .2s; }
        .gf-nav-links a:hover { color: #fff; }
        .gf-btn-pill { border-radius: 999px; font-weight: 800; font-size: 0.95rem; padding: 0.75rem 1.75rem; cursor: pointer; text-decoration: none; transition: all .2s; display: inline-flex; align-items: center; gap: 0.4rem; border: none; }
        .gf-btn-amber { background: #C6F432; color: #0d0d0d; }
        .gf-btn-amber:hover { background: #aad424; }
        .gf-btn-dark { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.12); }
        .gf-btn-dark:hover { background: rgba(255,255,255,0.18); }
        .nav-logo { height: auto; width: 150px; }

        /* Hero */
        .hero { position: relative; padding: 180px 2rem 6rem; background: #0d0d0d; text-align: center; overflow: hidden; }
        .hero-glow-tl { position: absolute; top: -15%; left: -10%; width: 700px; height: 700px; background: radial-gradient(circle, rgba(100,220,255,0.12) 0%, transparent 65%); border-radius: 50%; pointer-events: none; z-index: 0; }
        .hero-glow-tr { position: absolute; top: -5%; right: -8%; width: 600px; height: 600px; background: radial-gradient(circle, rgba(180,100,255,0.1) 0%, transparent 65%); border-radius: 50%; pointer-events: none; z-index: 0; }
        .hero-glow-b { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 900px; height: 400px; background: radial-gradient(ellipse, rgba(198,244,50,0.08) 0%, transparent 65%); border-radius: 50%; pointer-events: none; z-index: 0; }
        h1.hero-h1 { position: relative; z-index: 2; font-size: clamp(3.2rem, 7vw, 6.5rem); font-weight: 900; line-height: 1.15; letter-spacing: -0.04em; margin-bottom: 3rem; color: #fff; }
        .hero-h1-top { display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.25em; }
        @keyframes shimmer-sweep {
          0%   { background-position: -100% center; }
          100% { background-position: 200% center; }
        }
        .metallic-text { display: block; background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.75) 20%, #C6F432 38%, #64dcff 50%, #C6F432 62%, rgba(255,255,255,0.75) 80%, #fff 100%); background-size: 300% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer-sweep 6s linear infinite; }
        .hero-shimmer { display: inline; background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.75) 20%, #C6F432 38%, #64dcff 50%, #C6F432 62%, rgba(255,255,255,0.75) 80%, #fff 100%); background-size: 300% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer-sweep 6s linear infinite; }

        /* Hero 3-column grid */
        .hero-grid { display: grid; grid-template-columns: 1fr 480px 1fr; gap: 2rem; align-items: center; max-width: 1280px; margin: 0 auto; }
        .hero-left-col { display: flex; flex-direction: column; gap: 1.5rem; align-items: flex-start; }
        .hero-right-col { display: flex; flex-direction: column; gap: 1.5rem; align-items: flex-end; }
        .hero-mascot-col { display: flex; justify-content: center; align-items: flex-end; }
        .hero-stat-card { background: rgba(255,255,255,0.04); border-radius: 20px; padding: 1.5rem 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.07); text-align: left; width: 100%; backdrop-filter: blur(8px); }
        .hero-stat-card .stat-num { font-size: 3rem; font-weight: 900; line-height: 1; color: #fff; }
        .hero-stat-card .stat-num span { color: #C6F432; }
        .hero-stat-card .stat-label { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.4); margin-top: 0.4rem; line-height: 1.4; }
        .hero-pill-card { background: rgba(255,255,255,0.05); border-radius: 999px; padding: 0.75rem 1.25rem; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 0.75rem; width: fit-content; backdrop-filter: blur(8px); }
        .hero-cta-block { text-align: left; }

        .logo-band { padding: 3rem 2rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .logo-band-title { font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5rem; }
        .logo-band-inner { display: flex; justify-content: center; align-items: center; gap: clamp(2rem, 6vw, 5rem); flex-wrap: wrap; opacity: 0.2; filter: grayscale(100%) invert(1); }
        .logo-band-inner img { height: 28px; width: auto; }

        /* Results */
        .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
        .results-img { border-radius: 1.5rem; overflow: hidden; height: 420px; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
        .results-h2 { font-size: clamp(2.5rem, 5vw, 3.2rem); font-weight: 900; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 1.5rem; color: #fff; }
        .results-portraits { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
        .results-portraits img { width: 44px; height: 44px; border-radius: 0.5rem; object-fit: cover; }
        
        /* Features Grid */
        .features-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.25rem; }
        .feat-card { border-radius: 1.75rem; overflow: hidden; position: relative; padding: 2.5rem; background: #141414; box-shadow: 0 4px 24px rgba(0,0,0,0.3); display: flex; flex-direction: column; min-height: 220px; border: 1px solid rgba(255,255,255,0.06); transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; }
        .feat-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(198,244,50,0.08); border-color: rgba(198,244,50,0.2); }
        .feat-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 1.5rem; flex-shrink: 0; }
        .feat-title { font-size: 1.3rem; font-weight: 800; line-height: 1.25; margin-bottom: 0.6rem; letter-spacing: -0.01em; color: #fff; }
        .feat-desc { font-size: 0.875rem; color: rgba(255,255,255,0.45); line-height: 1.6; }
        .feat-badge { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.3rem 0.8rem; border-radius: 999px; margin-bottom: 1rem; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
        
        /* Full Width CTA */
        .cta-fullwidth { background: #111; padding: 7rem 2rem; text-align: left; position: relative; overflow: hidden; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .cta-fullwidth-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1fr auto; gap: 4rem; align-items: center; position: relative; z-index: 2; }
        .cta-fullwidth-bg { position: absolute; inset: 0; background-image: radial-gradient(circle at 10% 50%, rgba(198,244,50,0.1) 0%, transparent 50%), radial-gradient(circle at 90% 20%, rgba(100,220,255,0.07) 0%, transparent 40%); }
        @media(max-width: 768px) { .cta-fullwidth-inner { grid-template-columns: 1fr; } }
        
        /* Pricing */
        .pricing-grid { display: grid; grid-template-columns: 1fr 1.15fr 1fr; gap: 1.5rem; margin-top: 3rem; align-items: stretch; }
        .pc { border-radius: 2rem; padding: 2.5rem; display: flex; flex-direction: column; }
        .pc-plain { background: #141414; border: 1px solid rgba(255,255,255,0.07); }
        .pc-featured { background: linear-gradient(145deg, #1a1a1a, #0f1a0f); color: #fff; box-shadow: 0 30px 80px rgba(198,244,50,0.12); border: 1px solid rgba(198,244,50,0.25); }
        .pc-outline { background: #141414; border: 1px solid rgba(255,255,255,0.07); }
        .pc-badge { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 0.4rem 1rem; border-radius: 999px; margin-bottom: 1.5rem; width: fit-content; }
        .pc-name { font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.35); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.08em; }
        .pc-price { font-size: 3.5rem; font-weight: 900; line-height: 1; letter-spacing: -0.04em; color: #fff; }
        .pc-price-sub { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.35); margin-top: 0.5rem; }
        .pc-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 2rem 0; }
        .pc-list { list-style: none; display: flex; flex-direction: column; gap: 0.9rem; flex-grow: 1; margin-bottom: 2.5rem; }
        .pc-list li { font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 0.75rem; }
        .pc-check { width: 20px; height: 20px; border-radius: 50%; background: rgba(198,244,50,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        
        /* Operations Matrix */
        .ops-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 3rem; }
        .ops-col { display: flex; flex-direction: column; gap: 1.5rem; }
        .ops-card { border-radius: 1.2rem; overflow: hidden; position: relative; }
        .ops-yellow { background: linear-gradient(135deg, #1a2a0a, #141414); padding: 3rem; display: flex; flex-direction: column; justify-content: center; border: 1px solid rgba(198,244,50,0.2); }
        .ops-yellow h3 { font-size: 1.8rem; font-weight: 900; line-height: 1.1; margin-bottom: 1rem; color: #fff; }
        .ops-yellow p { font-size: 0.9rem; color: rgba(255,255,255,0.5); margin-bottom: 2rem; line-height: 1.5; }
        .ops-img { width: 100%; height: 100%; object-fit: cover; min-height: 250px; }
        .ops-img-tall { height: 100%; min-height: 400px; }
        
        /* Bots Grid */
        .bots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; margin-top: 3rem; }
        .bot-card { background: #141414; border-radius: 1.5rem; border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; display: flex; flex-direction: column; position: relative; overflow: hidden; filter: saturate(0.12) brightness(0.55); transition: filter 0.5s ease, transform 0.5s ease, box-shadow 0.5s ease, border-color 0.5s ease; box-shadow: 0 4px 24px rgba(0,0,0,0.5); }
        .bot-card:hover { transform: translateY(-8px); filter: saturate(1) brightness(1); box-shadow: 0 0 0 1px var(--card-border, rgba(198,244,50,0.5)), 0 8px 32px var(--card-glow, rgba(198,244,50,0.3)), 0 20px 60px var(--card-glow, rgba(198,244,50,0.2)); border-color: var(--card-border, rgba(198,244,50,0.5)); }

        .chat-preview-box { background: #0d0d0d; border: 1px solid rgba(255,255,255,0.06); border-radius: 1rem; padding: 1.25rem 1rem; margin-bottom: 1.5rem; flex-grow: 1; display: flex; flex-direction: column; gap: 0.8rem; }
        .chat-bubble { padding: 0.75rem 1rem; border-radius: 1rem; font-size: 0.85rem; line-height: 1.4; max-width: 85%; font-weight: 500; }
        .chat-bubble.left { background: #1e1e1e; border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); border-bottom-left-radius: 0.25rem; align-self: flex-start; }
        .chat-bubble.right { background: #C6F432; color: #0d0d0d; border-bottom-right-radius: 0.25rem; align-self: flex-end; font-weight: 700; }

        /* FAQ */
        .faq-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 4rem; align-items: start; }
        .faq-left h2 { font-size: 3rem; font-weight: 900; line-height: 1.1; margin-bottom: 1.5rem; letter-spacing: -0.02em; color: #fff; }
        .faq-item { background: #141414; border: 1px solid rgba(255,255,255,0.07); border-radius: 1rem; margin-bottom: 0.75rem; overflow: hidden; transition: border-color 0.2s; }
        .faq-item:hover { border-color: rgba(198,244,50,0.2); }
        .faq-btn { width: 100%; padding: 1.5rem; text-align: left; display: flex; justify-content: space-between; align-items: center; background: none; border: none; cursor: pointer; font-size: 1rem; font-weight: 700; color: #fff; }
        .faq-btn svg { color: rgba(255,255,255,0.3); transition: transform 0.3s; }
        .faq-btn.open svg { transform: rotate(180deg); color: #C6F432; }
        .faq-content { padding: 0 1.5rem 1.5rem; font-size: 0.95rem; color: rgba(255,255,255,0.5); line-height: 1.6; }
        
        /* Footer */
        .gf-footer { background: #0a0a0a; border-top: 1px solid rgba(255,255,255,0.06); padding: 0; margin-top: 0; }
        .footer-top { padding: 6rem 2rem 4rem; position: relative; overflow: hidden; }
        .footer-top::before { content: ''; position: absolute; bottom: -30%; left: -5%; width: 700px; height: 600px; background: radial-gradient(circle, rgba(198,244,50,0.05) 0%, transparent 60%); border-radius: 50%; }
        .footer-top::after { content: ''; position: absolute; top: -20%; right: -5%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(100,220,255,0.04) 0%, transparent 60%); border-radius: 50%; }
        .footer-cta h2 { font-size: 3.5rem; font-weight: 900; line-height: 1.1; margin-bottom: 2rem; letter-spacing: -0.03em; color: #fff; }
        .footer-links h4 { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 1.5rem; color: rgba(255,255,255,0.3); }
        .footer-links ul { list-style: none; }
        .footer-links li { margin-bottom: 0.9rem; }
        .footer-links a { color: rgba(255,255,255,0.5); font-size: 0.9rem; text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .footer-links a:hover { color: #C6F432; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.05); padding: 1.75rem 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        
        .footer-grid-top { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; margin-bottom: 5rem; }
        .footer-grid-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; padding-top: 0.5rem; }
        .footer-stats-row { display: flex; gap: 3rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 3rem; flex-wrap: wrap; }

        @media(max-width: 1100px) {
          .hero-grid { grid-template-columns: 1fr; text-align: center; }
          .hero-left-col, .hero-right-col { align-items: center; flex-direction: row; flex-wrap: wrap; justify-content: center; }
          .hero-stat-card { max-width: 300px; }
          .hero-cta-block { text-align: center; }
          .hero-mascot-col { order: -1; height: 350px; }
        }
        @media(max-width: 900px) {
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .features-grid .feat-card { grid-column: span 1 !important; }
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 440px; margin-inline: auto; }
          .ops-grid { grid-template-columns: 1fr !important; }
          .results-grid { grid-template-columns: 1fr !important; }
          .cta-fullwidth-inner { grid-template-columns: 1fr !important; text-align: center; }
          .cta-fullwidth-inner > div:last-child { align-items: center !important; }
        }
        @media(max-width: 768px) {
          .gf-nav-links, .gf-nav-desktop-btns { display: none !important; }
          .gf-nav-hamburger { display: flex !important; }
          h1.hero-h1 { font-size: 2.4rem !important; }
          .hero-grid { gap: 1.5rem; }
          .hero-stat-card { max-width: 100% !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .features-grid .feat-card { grid-column: span 1 !important; min-height: 180px; }
          .results-grid, .ops-grid, .faq-grid { grid-template-columns: 1fr !important; }
          .faq-grid { gap: 2rem; }
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 380px; margin-inline: auto; }
          .section { padding: 4rem 1.25rem !important; }
          .logo-band-inner { gap: 1.5rem !important; }
          .cta-fullwidth { padding: 4rem 1.25rem !important; }
          .cta-fullwidth-inner { grid-template-columns: 1fr !important; text-align: center; }
          .cta-fullwidth-inner > div:last-child { align-items: center !important; }
          .ops-grid .ops-col { display: flex; flex-direction: column; }
          .hero { padding: 100px 1.5rem 4rem !important; }
          .bots-grid { grid-template-columns: 1fr !important; }
          .footer-cta h2 { font-size: 2.2rem !important; }
          .footer-grid-top { grid-template-columns: 1fr !important; gap: 2.5rem; }
          .footer-grid-links { grid-template-columns: 1fr 1fr !important; }
          .gf-nav { top: 0.75rem !important; width: calc(100% - 1.5rem) !important; padding: 0.25rem 1rem !important; }
          .gf-nav-inner { height: 44px !important; }
          .nav-logo { width: 112px !important; }
        }
      `}</style>

      {/* REDBER PRELOADER */}
      <AnimatePresence>
        {!preloaderDone && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } }}
            style={{ position: "fixed", inset: 0, background: "#000", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}
          >
            {/* Logo */}
            <div style={{ position: "relative", zIndex: 2, marginBottom: "0.5rem" }}>
              <img src="/logo/Redber Logo white.svg" alt="Redber" style={{ width: 140, height: "auto" }} />
            </div>

            {/* Glowing line progress bar */}
            <div style={{ position: "relative", width: 220, height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 1 }}>
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.4, ease: "easeInOut" }}
                style={{ position: "relative", height: "100%", background: "linear-gradient(90deg, rgba(198,244,50,0) 0%, rgba(198,244,50,1) 100%)", borderRadius: 1 }}
              >
                {/* Neon tip */ }
                <div style={{ position: "absolute", top: "50%", right: 0, transform: "translateY(-50%)", width: 20, height: 2, background: "#fff", boxShadow: "0 0 10px 4px rgba(198, 244, 50, 0.9), 0 0 20px 8px rgba(198, 244, 50, 0.6)", borderRadius: "50%" }} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCROLL PROGRESS BAR */}
      <motion.div style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(to right, #C6F432, #64dcff)", zIndex: 9999 }} />

      {/* SCROLL TO TOP */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9000, width: 48, height: 48, borderRadius: "50%", background: "#111", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
          >
            <ChevronUp size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* NAV */}
      <nav className="gf-nav">
        <div className="gf-nav-inner">
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src="/logo/Redber Logo white.svg" alt="Redber" className="nav-logo" />
          </Link>
          <ul className="gf-nav-links" style={{ display: "flex", gap: "2.5rem", listStyle: "none" }}>
            <li><Link href="#how-it-works">How It Works</Link></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#demo">Live Demo</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
          <div className="gf-nav-desktop-btns" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Link href="/contact" className="gf-btn-pill gf-btn-amber">Book Demo</Link>
          </div>
          <button className="gf-nav-hamburger" style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "#fff", padding: "0.5rem" }} onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={32} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ position: "fixed", top: 0, left: 0, right: 0, background: "#0d0d0d", zIndex: 9999, padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center" }}>
                <img src="/logo/Redber Logo white.svg" alt="Redber" style={{ height: 40, width: "auto" }} onError={(e) => { (e.target as HTMLImageElement).src = "/logo/Redber Logo Black.svg"; (e.target as HTMLImageElement).style.filter = "invert(1)"; }} />
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={24}/></button>
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1.5rem", fontSize: "1.2rem", fontWeight: 700 }}>
              <li><a href="#features" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#fff", textDecoration: "none" }}>Features</a></li>
              <li><a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#fff", textDecoration: "none" }}>Pricing</a></li>
              <li><a href="#faq" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#fff", textDecoration: "none" }}>FAQ</a></li>
              <li><a href="#demo" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#fff", textDecoration: "none" }}>Live Demo</a></li>
              <li><a href="/contact" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#fff", textDecoration: "none" }}>Contact</a></li>
              <li><Link href="/contact" className="gf-btn-pill gf-btn-amber" style={{ width: "100%", justifyContent: "center", marginTop: "1rem", padding: "1rem", color: "#0d0d0d" }} onClick={() => setIsMobileMenuOpen(false)}>Book Demo</Link></li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO */}
      <section className="hero">
        {/* Ambient glow orbs */}
        <div className="hero-glow-tl" />
        <div className="hero-glow-tr" />
        <div className="hero-glow-b" />

        <h1 className="hero-h1">
          <span className="hero-h1-top">
            <span className="hero-shimmer">AI Agents</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, margin: "0 0.5rem" }}>
              {[12, 20, 32, 40, 32, 20, 12].map((h, i) => (
                <span key={i} style={{ display: "block", width: 6, height: h/2, borderRadius: 3, background: "#C6F432", opacity: 0.5 + i * 0.07 }} />
              ))}
            </span>
            <span className="hero-shimmer">That</span>
          </span>
          <span className="metallic-text">Run Operations</span>
        </h1>

        <div className="hero-grid">
          {/* LEFT COLUMN */}
          <motion.div className="hero-left-col" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <div className="hero-stat-card">
              <div className="stat-num"><span>24</span>/7</div>
              <div className="stat-label">Always on — never<br/>misses a customer</div>
            </div>
            <div className="hero-cta-block">
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "1.5rem", fontWeight: 500, maxWidth: 320 }}>
                Redber automates complex operations through AI agents that think, learn, and act seamlessly.
              </p>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <Link href="/contact" className="gf-btn-pill gf-btn-dark">Try for Free</Link>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#C6F432", color: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 15px rgba(198,244,50,0.25)" }}>
                  <ArrowUpRight size={22} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* CENTER / MASCOT */}
          <motion.div className="hero-mascot-col" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 80 }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 480, height: 520, zIndex: 10 }}>
              <Hero3DModel />
            </div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <motion.div className="hero-right-col" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <div className="hero-pill-card">
              <span style={{ color: "#C6F432", fontSize: "1.3rem" }}>⚡</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: "1.1rem", lineHeight: 1, color: "#fff" }}>0.25s</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>First reply, every time</div>
              </div>
              <div style={{ display: "flex", marginLeft: "0.25rem" }}>
                <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face" alt="" style={{width: 32, height: 32, borderRadius: "50%", border: "2px solid #1e1e1e", marginLeft: -10, zIndex: 2}} />
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face" alt="" style={{width: 32, height: 32, borderRadius: "50%", border: "2px solid #1e1e1e", marginLeft: -10, zIndex: 1}} />
              </div>
            </div>

            <div className="hero-stat-card" style={{ textAlign: "right", alignSelf: "flex-end" }}>
              <div className="stat-num">0.25<span>s</span></div>
              <div className="stat-label">Real-Time Intelligent<br/>Responses</div>
            </div>

            <div className="hero-stat-card" style={{ background: "rgba(198,244,50,0.08)", border: "1px solid rgba(198,244,50,0.2)", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(198,244,50,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>⚡</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>Auto-Booking</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Captures appointments in chat</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Logo Band Hidden */}
      </section>

      {/* ── INDUSTRIES ── */}
      <section className="section">
        <div className="inner">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Restaurant */}
            <motion.div style={{ background: "#0d0505", borderRadius: "1.5rem", padding: "2.5rem", border: "1px solid rgba(255,100,100,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 0 60px rgba(255,50,50,0.02)" }} {...fadeUp(0)}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "2rem" }}>🍽️</div>
                <div>
                  <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Restaurant & Café</h3>
                  <div style={{ color: "#ff4d4d", fontSize: "0.75rem", fontWeight: 700 }}>68% of diners look for info online after hours</div>
                </div>
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, letterSpacing: "0.08em", marginBottom: "1.2rem" }}>REDBER ANSWERS THESE INSTANTLY:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {["What are your opening hours?", "Do you have vegan options?", "Can I make a reservation?", "Do you offer delivery?"].map(q => (
                  <div key={q} style={{ background: "rgba(255,255,255,0.03)", padding: "0.8rem 1.25rem", borderRadius: "999px", color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #ff4d4d", opacity: 0.6 }} /> {q}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Card 2: Auto */}
            <motion.div style={{ background: "#050b12", borderRadius: "1.5rem", padding: "2.5rem", border: "1px solid rgba(100,150,255,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 0 60px rgba(50,100,255,0.02)" }} {...fadeUp(0.1)}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "2rem" }}>🚗</div>
                <div>
                  <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Car Dealership</h3>
                  <div style={{ color: "#4d94ff", fontSize: "0.75rem", fontWeight: 700 }}>72% of car buyers research online before calling</div>
                </div>
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, letterSpacing: "0.08em", marginBottom: "1.2rem" }}>REDBER ANSWERS THESE INSTANTLY:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {["Is the 2024 SUV still available?", "Can I book a test drive?", "What finance options do you offer?", "What's your trade-in process?"].map(q => (
                  <div key={q} style={{ background: "rgba(255,255,255,0.03)", padding: "0.8rem 1.25rem", borderRadius: "999px", color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #4d94ff", opacity: 0.6 }} /> {q}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Card 3: Medical */}
            <motion.div style={{ background: "#05100a", borderRadius: "1.5rem", padding: "2.5rem", border: "1px solid rgba(50,200,150,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 0 60px rgba(50,200,150,0.02)" }} {...fadeUp(0.2)}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "2rem" }}>🏥</div>
                <div>
                  <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Medical Clinic & Spa</h3>
                  <div style={{ color: "#32c896", fontSize: "0.75rem", fontWeight: 700 }}>44% of patients book outside of business hours</div>
                </div>
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, letterSpacing: "0.08em", marginBottom: "1.2rem" }}>REDBER ANSWERS THESE INSTANTLY:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {["Are you accepting new patients?", "How do I book an appointment?", "What insurance do you accept?", "What are your consultation fees?"].map(q => (
                  <div key={q} style={{ background: "rgba(255,255,255,0.03)", padding: "0.8rem 1.25rem", borderRadius: "999px", color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #32c896", opacity: 0.6 }} /> {q}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Card 4: Salon */}
            <motion.div style={{ background: "#100510", borderRadius: "1.5rem", padding: "2.5rem", border: "1px solid rgba(200,50,200,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 0 60px rgba(200,50,200,0.02)" }} {...fadeUp(0.3)}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "2rem" }}>💆‍♀️</div>
                <div>
                  <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Salon, Spa & Beauty</h3>
                  <div style={{ color: "#c832c8", fontSize: "0.75rem", fontWeight: 700 }}>Missed bookings cost salons $8K+ per year</div>
                </div>
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 800, letterSpacing: "0.08em", marginBottom: "1.2rem" }}>REDBER ANSWERS THESE INSTANTLY:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {["What services do you offer?", "How much is a haircut?", "Can I book online?", "Do you offer gift vouchers?"].map(q => (
                  <div key={q} style={{ background: "rgba(255,255,255,0.03)", padding: "0.8rem 1.25rem", borderRadius: "999px", color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #c832c8", opacity: 0.6 }} /> {q}
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ background: "#090909", padding: "7rem 0", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(198,244,50,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="inner" style={{ maxWidth: 1100 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            style={{ textAlign: "center", marginBottom: "5rem" }}
          >
            <div className="gf-tag" style={{ marginBottom: "1.5rem" }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", marginBottom: "1.25rem", lineHeight: 1.1 }}>
              From zero to AI workforce<br />
              <span style={{ color: "#C6F432" }}>in three steps.</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1.1rem", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              Deploying Redber is seamless — no engineering team required.
            </p>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {[
              { step: "01", title: "Connect Your Channels", desc: "Link your business phone number, website widget, WhatsApp, and social media accounts to the central Redber brain in one unified dashboard.", tags: ["📱 Phone", "🌐 Web Chat", "💬 WhatsApp", "📊 CRM"], color: "#C6F432", dir: -1 },
              { step: "02", title: "Train The Model", desc: "Upload your PDFs, paste website URLs, and define your brand guardrails. The AI instantly processes your entire business knowledge base.", tags: ["📄 PDFs", "🔗 Website URL", "🛡️ Guardrails", "🧠 Knowledge Base"], color: "#64dcff", dir: 1 },
              { step: "03", title: "Deploy & Automate 24/7", desc: "Flip the switch. Your AI agents begin handling infinite concurrent calls, bookings, and chats from day one — completely on autopilot.", tags: ["⚡ 0.25s Response", "🔄 24/7 Active", "📅 Auto-Book", "♾️ Unlimited Scale"], color: "#ff7eb3", dir: -1 }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: item.dir * 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2rem", alignItems: "flex-start", background: "#111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2rem", padding: "2.5rem", position: "relative", overflow: "hidden" }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: `radial-gradient(ellipse at ${item.dir === -1 ? "0%" : "100%"} 50%, ${item.color}08 0%, transparent 60%)`, pointerEvents: "none" }} />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 70, height: 70, borderRadius: "50%", background: "#1a1a1a", border: `1.5px solid ${item.color}`, boxShadow: `0 0 24px ${item.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 900, color: item.color, flexShrink: 0 }}>
                    {item.step}
                  </div>
                  {i < 2 && <motion.div initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }} style={{ width: 2, height: 32, background: `linear-gradient(to bottom, ${item.color}50, transparent)`, borderRadius: 99, transformOrigin: "top" }} />}
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <h3 style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.65rem)", fontWeight: 800, color: "#fff", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>{item.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7, fontSize: "1rem", marginBottom: "1.25rem", maxWidth: 580 }}>{item.desc}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {item.tags.map(tag => (
                      <span key={tag} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: "0.3rem 0.85rem", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* FEATURES GRID */}
      <section id="features" className="section" style={{ paddingTop: 0 }}>
        <div className="inner">
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3.5rem", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <div className="gf-tag">FEATURES</div>
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, marginBottom: "0.75rem", letterSpacing: "-0.02em", color: "#fff" }}>Everything your business needs</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.05rem" }}>Purpose-built tools for modern AI receptionists.</p>
            </div>
            <Link href="/capabilities" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.8rem 1.5rem", borderRadius: "999px", color: "#fff", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none", transition: "all 0.2s" }} onMouseOver={e=>{e.currentTarget.style.background="rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.2)"}} onMouseOut={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"}}>
               Read All Capabilities <ArrowUpRight size={18} />
            </Link>
          </div>
          
          <div className="features-grid text-left">
            {/* Row 1: Large card + 2 small */}
            <motion.div className="feat-card" style={{ gridColumn: "span 5", background: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)", color: "#fff", minHeight: 280 }} {...fadeUp(0)}>
              <div className="feat-icon" style={{ background: "rgba(198,244,50,0.15)" }}>⚡</div>
              <div className="feat-badge" style={{ background: "rgba(198,244,50,0.15)", color: "#C6F432" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C6F432", display: "block" }} /> Live
              </div>
              <div style={{ marginTop: "auto" }}>
                <h3 className="feat-title" style={{ color: "#fff", fontSize: "1.8rem" }}>Instant AI Responses</h3>
                <p className="feat-desc" style={{ color: "rgba(255,255,255,0.65)" }}>Respond in under 0.25 seconds across every channel — website, phone, and WhatsApp — 24 hours a day.</p>
              </div>
              <div style={{ position: "absolute", top: "2rem", right: "2rem", opacity: 0.06, fontSize: "8rem", lineHeight: 1 }}>⚡</div>
            </motion.div>

            <motion.div className="feat-card" style={{ gridColumn: "span 4", background: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)" }} {...fadeUp(0.1)}>
              <div className="feat-icon" style={{ background: "rgba(198,244,50,0.15)" }}>📅</div>
              <h3 className="feat-title">Automated Booking</h3>
              <p className="feat-desc">Customers book appointments directly in chat. Syncs with Google Calendar instantly — zero back-and-forth.</p>
              <div style={{ marginTop: "auto", paddingTop: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["Mon 10am ✓", "Wed 2pm ✓", "Fri 4pm ✓"].map(s => (
                  <span key={s} style={{ fontSize: "0.72rem", fontWeight: 700, background: "rgba(255,255,255,0.1)", padding: "0.3rem 0.8rem", borderRadius: "999px", color: "#eee" }}>{s}</span>
                ))}
              </div>
            </motion.div>

            <motion.div className="feat-card" style={{ gridColumn: "span 3", background: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)" }} {...fadeUp(0.15)}>
              <div className="feat-icon" style={{ background: "rgba(198,244,50,0.15)" }}>🌐</div>
              <h3 className="feat-title">50+ Languages</h3>
              <p className="feat-desc">Auto-detects and replies in Arabic, Spanish, French, and more.</p>
              <div style={{ marginTop: "auto", display: "flex", gap: "0.4rem", flexWrap: "wrap", paddingTop: "1rem" }}>
                {["EN","AR","ES","FR","DE"].map(l => (
                  <span key={l} style={{ fontSize: "0.68rem", fontWeight: 800, background: "rgba(198,244,50,0.15)", padding: "0.35rem 0.6rem", borderRadius: "6px", color: "#C6F432" }}>{l}</span>
                ))}
              </div>
            </motion.div>

            {/* Row 2: 3 + wide */}
            <motion.div className="feat-card" style={{ gridColumn: "span 4", background: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)" }} {...fadeUp(0.2)}>
              <div className="feat-icon" style={{ background: "rgba(198,244,50,0.15)" }}>🎯</div>
              <h3 className="feat-title">Smart Lead Capture</h3>
              <p className="feat-desc">Automatically collects names, numbers, and intent. Every lead flows straight into your dashboard — no missed opportunities.</p>
            </motion.div>

            <motion.div className="feat-card" style={{ gridColumn: "span 4", background: "linear-gradient(135deg, #0d0d0d 0%, #1a1a0f 100%)", color: "#fff", position: "relative", overflow: "hidden" }} {...fadeUp(0.25)}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 70% 30%, rgba(198,244,50,0.15) 0%, transparent 60%)" }} />
              <div className="feat-icon" style={{ background: "rgba(198,244,50,0.15)", position: "relative", zIndex: 2 }}>🛡️</div>
              <div style={{ position: "relative", zIndex: 2, marginTop: "auto" }}>
                <h3 className="feat-title" style={{ color: "#fff" }}>Custom Guardrails</h3>
                <p className="feat-desc" style={{ color: "rgba(255,255,255,0.6)" }}>Stays strictly on-topic. Set rules, compliance limits, and persona — Redber never goes off-script.</p>
              </div>
            </motion.div>

            <motion.div className="feat-card" style={{ gridColumn: "span 4", background: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)" }} {...fadeUp(0.3)}>
              <div className="feat-icon" style={{ background: "rgba(198,244,50,0.15)" }}>🔗</div>
              <h3 className="feat-title">Seamless Integrations</h3>
              <p className="feat-desc">Connects with your Website, Phone, WhatsApp, and CRM platforms. Deploy everywhere in minutes.</p>
              <div style={{ marginTop: "auto", paddingTop: "1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                {["🌐 Web", "📱 Phone", "💬 WA", "📊 CRM"].map(i => (
                  <span key={i} style={{ fontSize: "0.72rem", fontWeight: 700, background: "rgba(198,244,50,0.12)", padding: "0.35rem 0.75rem", borderRadius: "999px", color: "#C6F432" }}>{i}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FULL WIDTH CTA */}
      <div className="cta-fullwidth">
        <div className="cta-fullwidth-bg" />
        <div className="cta-fullwidth-inner">
          <motion.div {...fadeUp(0)}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(198,244,50,0.15)", border: "1px solid rgba(198,244,50,0.3)", borderRadius: "999px", padding: "0.4rem 1rem", marginBottom: "2rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#C6F432", display: "block", boxShadow: "0 0 8px #C6F432" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C6F432" }}>Now Live — AI Powered</span>
            </div>
            <h2 style={{ fontSize: "clamp(2.8rem, 5vw, 4.5rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#fff", maxWidth: 680 }}>
              Ready to stop missing
              <span style={{ color: "#C6F432" }}> customers?</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.1rem", lineHeight: 1.7, marginTop: "1.5rem", maxWidth: 520, fontWeight: 500 }}>
              Redber deploys in minutes. No code needed. Your AI receptionist starts handling calls, chats, and bookings from day one.
            </p>
          </motion.div>

          <motion.div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "flex-end" }} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div style={{ textAlign: "right", marginBottom: "1rem" }}>
              {[
                { num: "0.25s", label: "Avg Response Time" },
                { num: "24/7", label: "Always Online" },
                { num: "∞", label: "Concurrent Calls" },
              ].map(({ num, label }) => (
                <div key={num} style={{ marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, marginTop: "0.2rem" }}>{label}</div>
                </div>
              ))}
            </div>
            <Link href="/contact" className="gf-btn-pill gf-btn-amber" style={{ fontSize: "1.1rem", padding: "1.1rem 2.8rem", boxShadow: "0 8px 30px rgba(198,244,50,0.15)", whiteSpace: "nowrap" }}>
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>No credit card required</span>
          </motion.div>
        </div>
      </div>

      {/* PRICING */}
      <section id="pricing" className="section" style={{ background: "#0a0a0a" }}>
        <div className="inner">
          <div className="text-center" style={{ marginBottom: "3.5rem" }}>
            <div className="gf-tag">PRICING</div>
            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 900, marginBottom: "1rem", letterSpacing: "-0.03em" }}>Simple, transparent pricing</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem", maxWidth: 480, margin: "0 auto 2rem" }}>Start for free, scale as you grow. No hidden fees.</p>
            
            {/* Toggle */}
            <div style={{ display: "inline-flex", background: "#141414", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "999px", padding: "0.3rem", alignItems: "center", position: "relative", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              <div style={{ position: "absolute", left: isYearly ? "50%" : "0.3rem", width: "calc(50% - 0.3rem)", height: "calc(100% - 0.6rem)", background: "rgba(255,255,255,0.1)", borderRadius: "999px", transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }} />
              <button onClick={() => setIsYearly(false)} style={{ width: 130, padding: "0.65rem 0", zIndex: 1, border: "none", background: "none", color: isYearly ? "rgba(255,255,255,0.5)" : "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", transition: "color 0.3s" }}>Monthly</button>
              <button onClick={() => setIsYearly(true)} style={{ width: 130, padding: "0.65rem 0", zIndex: 1, border: "none", background: "none", color: isYearly ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", transition: "color 0.3s", position: "relative" }}>
                Yearly
                {!isYearly && <span style={{ position: "absolute", top: -18, right: 4, background: "#C6F432", color: "#0d0d0d", fontSize: "0.6rem", fontWeight: 800, padding: "0.2rem 0.5rem", borderRadius: "999px", whiteSpace: "nowrap" }}>Save 15%</span>}
              </button>
            </div>
          </div>

          <div className="pricing-grid">
            {/* STARTER */}
            <motion.div className="pc pc-plain" {...fadeUp(0)}>
              {/* Spacer to match featured badge height */}
              <div style={{ height: "2.1rem", marginBottom: "1.5rem" }} />
              <div className="pc-name">Starter</div>
              <div className="pc-price">{isYearly ? "₹55k" : "₹5,500"}</div>
              <div className="pc-price-sub">per {isYearly ? "year" : "month"} · billed {isYearly ? "annually" : "monthly"}</div>
              <div className="pc-divider" />
              <ul className="pc-list">
                {["Up to 1 website","Website chat widget","Basic knowledge base","Lead capture","CRM lead dashboard"].map(f => (
                  <li key={f}>
                    <span className="pc-check"><CheckCircle size={13} color="#C6F432" /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="gf-btn-pill" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, justifyContent: "center", marginTop: "auto" }}>Get Started</Link>
            </motion.div>

            {/* GROWTH - Featured */}
            <motion.div className="pc pc-featured" style={{ position: "relative", overflow: "hidden" }} {...fadeUp(0.1)}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "radial-gradient(circle at 100% 0%, rgba(198,244,50,0.15) 0%, transparent 60%)" }} />
              <div className="pc-badge" style={{ background: "rgba(198,244,50,0.15)", color: "#C6F432" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C6F432", display: "block" }} />
                Most Popular
              </div>
              <div className="pc-name" style={{ color: "rgba(255,255,255,0.5)" }}>Growth</div>
              <div className="pc-price" style={{ color: "#fff" }}>{isYearly ? "₹1L" : "₹9,999"}</div>
              <div className="pc-price-sub">per {isYearly ? "year" : "month"} · billed {isYearly ? "annually" : "monthly"}</div>
              <div className="pc-divider" />
              <ul className="pc-list">
                {["Up to 2 websites","PDF document training","Product catalog training","Conversation summaries","Analytics dashboard","Priority support"].map(f => (
                  <li key={f}>
                    <span className="pc-check"><CheckCircle size={13} color="#C6F432" /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="gf-btn-pill gf-btn-amber" style={{ justifyContent: "center", marginTop: "auto", fontSize: "1rem", padding: "0.9rem", boxShadow: "0 8px 24px rgba(198,244,50,0.15)" }}>Start Free Trial</Link>
            </motion.div>

            {/* BUSINESS */}
            <motion.div className="pc pc-plain" {...fadeUp(0.2)}>
              {/* Spacer to match featured badge height */}
              <div style={{ height: "2.1rem", marginBottom: "1.5rem" }} />
              <div className="pc-name">Business</div>
              <div className="pc-price">{isYearly ? "₹1.7L" : "₹18,999"}</div>
              <div className="pc-price-sub">per {isYearly ? "year" : "month"} · billed {isYearly ? "annually" : "monthly"}</div>
              <div className="pc-divider" />
              <ul className="pc-list">
                {["Up to 5 websites","Unlimited conversations","Advanced web crawler","Lead scoring insights","Multi-language support"].map(f => (
                  <li key={f}>
                    <span className="pc-check"><CheckCircle size={13} color="#C6F432" /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="gf-btn-pill" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, justifyContent: "center", marginTop: "auto" }}>Contact Us</Link>
            </motion.div>
          </div>

          {/* Trust strip */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2.5rem", marginTop: "3rem", flexWrap: "wrap" }}>
            {["✓ 15-minute setup","✓ No credit card required","✓ Cancel anytime","✓ Free onboarding call"].map(t => (
              <span key={t} style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPERATIONS (CAPABILITIES) ── */}
      <section className="section" style={{ paddingTop: "4rem" }}>
        <div className="inner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="gf-tag">CAPABILITIES</div>
              <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, lineHeight: 1.1 }}>Powering every part of<br/>your operations</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginTop: "0.5rem" }}>More than just a chatbot. Redber is a full AI receptionist built for conversions.</p>
            </div>
            <Link href="/contact" className="gf-btn-pill gf-btn-dark">Read All Capabilities <ArrowUpRight size={16}/></Link>
          </div>

          <div className="ops-grid">
            <div className="ops-col">
              <motion.div className="ops-card" {...fadeUp(0)}>
                <img src="/img_assets/leads.jpg" alt="AI lead capture dashboard" className="ops-img" />
              </motion.div>
              <motion.div className="ops-card ops-yellow" {...fadeUp(0.1)}>
                <h3>24/7 Appointment Booking</h3>
                <p>Customers can book directly in the chat. Redber captures date, time, name, and contact — no back-and-forth.</p>
                <Link href="/contact" className="gf-btn-pill gf-btn-dark" style={{ alignSelf: "flex-start" }}>Learn More</Link>
              </motion.div>
            </div>
            <div className="ops-col">
              <motion.div className="ops-card ops-yellow" {...fadeUp(0.2)}>
                <h3>Instant Smart Lead Capture</h3>
                <p>Automatically asks for name, phone, and requirements at the right moment. Every lead goes straight into your dashboard.</p>
                <Link href="/contact" className="gf-btn-pill gf-btn-dark" style={{ alignSelf: "flex-start" }}>Learn More</Link>
              </motion.div>
              <motion.div className="ops-card" {...fadeUp(0.3)}>
                <img src="/img_assets/multi_ling.jpg" alt="Multi-language AI receptionist" className="ops-img ops-img-tall" />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, #141414 60%, transparent)", padding: "5rem 2rem 2rem" }}>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: "0.5rem", color: "#fff" }}>Always-On Multi-Language</h3>
                  <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginBottom: "1rem" }}>Your business never closes. Redber responds instantly in English, Arabic, Spanish, French, and more — perfectly interpreting user intent.</p>
                  <Link href="/contact" className="gf-btn-pill gf-btn-dark px-6">Learn More</Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE BOTS / CHAT BOT LISTING ── */}
      <section id="demo" className="section" style={{ background: "#0d0d0d" }}>
        <div className="inner">
          <div className="text-center mb-10">
            <div className="gf-tag">LIVE DEMOS</div>
            <h2 style={{ fontSize: "3rem", fontWeight: 900 }}>Take Redber for a spin</h2>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Try interacting with these live AI receptionists to see the capabilities.</p>
          </div>

          <div className="bots-grid">
            {loadingBots ? (
              <div className="col-span-full py-10 text-center text-gray-500">Loading receptionists...</div>
            ) : bots.filter(b => b.status === "Active").length === 0 ? (
              <div className="col-span-full text-center p-10 bg-white/5 rounded-2xl border border-white/10">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="font-bold text-xl mb-2">No Live Bots Yet</p>
                <p className="text-gray-500">Create your first AI receptionist in the admin panel.</p>
              </div>
            ) : (
              bots.filter(b => b.status === "Active" && b.id !== "redber-assistant-001" && !b.name.toLowerCase().includes("redber")).map((bot, idx) => {
                const industry = (bot.persona_config?.industry || bot.role || "").toLowerCase();

                type BotTheme = { accent: string; textColor: string; borderColor: string; bgGlow: string; userQ: string; botA: string; btnStyle: React.CSSProperties };
                const theme: BotTheme = (() => {
                  if (industry.includes("restaurant") || industry.includes("food") || industry.includes("cafe") || industry.includes("dining"))
                    return { accent: "#ff7043", textColor: "#fff", borderColor: "rgba(255,112,67,0.35)", bgGlow: "rgba(255,112,67,0.08)", btnStyle: { background: "#ff7043", color: "#fff" }, userQ: "Can I book a table for 2 tonight?", botA: "Of course! 🍽️ We have spots at 7pm and 8:30pm. May I get your name to confirm the reservation?" };
                  if (industry.includes("auto") || industry.includes("car") || industry.includes("dealer") || industry.includes("vehicle"))
                    return { accent: "#4a9eff", textColor: "#fff", borderColor: "rgba(74,158,255,0.35)", bgGlow: "rgba(74,158,255,0.08)", btnStyle: { background: "#4a9eff", color: "#fff" }, userQ: "Is the 2024 SUV still available?", botA: "Yes, we have 2 left! 🚗 Would you like to schedule a test drive this weekend? I can book it right now." };
                  if (industry.includes("medical") || industry.includes("clinic") || industry.includes("health") || industry.includes("doctor"))
                    return { accent: "#26c6a2", textColor: "#fff", borderColor: "rgba(38,198,162,0.35)", bgGlow: "rgba(38,198,162,0.08)", btnStyle: { background: "#26c6a2", color: "#fff" }, userQ: "I need to see a dermatologist", botA: "Absolutely! 👨‍⚕️ Dr. Patel is available Tuesday at 11am or Thursday at 3pm. Which works best for you?" };
                  if (industry.includes("salon") || industry.includes("beauty") || industry.includes("hair") || industry.includes("spa") || industry.includes("nail"))
                    return { accent: "#c77dff", textColor: "#fff", borderColor: "rgba(199,125,255,0.35)", bgGlow: "rgba(199,125,255,0.08)", btnStyle: { background: "#c77dff", color: "#fff" }, userQ: "How much is a keratin hair treatment?", botA: "Our keratin treatments start from ₹1,800 ✨ Want me to book you in with Maya, our senior stylist?" };
                  if (industry.includes("real estate") || industry.includes("property") || industry.includes("realty"))
                    return { accent: "#7986cb", textColor: "#fff", borderColor: "rgba(121,134,203,0.35)", bgGlow: "rgba(121,134,203,0.08)", btnStyle: { background: "#7986cb", color: "#fff" }, userQ: "Can I view the 3BHK apartment?", botA: "Sure! 🏠 We have viewings Saturday morning and Sunday afternoon. Which day works for you?" };
                  if (industry.includes("retail") || industry.includes("shop") || industry.includes("ecommerce") || industry.includes("store"))
                    return { accent: "#26c6da", textColor: "#0d0d0d", borderColor: "rgba(38,198,218,0.35)", bgGlow: "rgba(38,198,218,0.08)", btnStyle: { background: "#26c6da", color: "#0d0d0d" }, userQ: "Do you offer free returns?", botA: "Yes! 📦 We offer hassle-free 30-day returns on all orders. Need help with a specific purchase?" };
                  return { accent: "#C6F432", textColor: "#0d0d0d", borderColor: "rgba(198,244,50,0.25)", bgGlow: "rgba(198,244,50,0.06)", btnStyle: { background: "#C6F432", color: "#0d0d0d" }, userQ: "What are your business hours?", botA: "We're open Mon–Sat, 9am to 6pm! 😊 I can also book an appointment for you right now if you'd like." };
                })();

                return (
                  <motion.div key={bot.id} className="bot-card" style={{ '--card-glow': `${theme.accent}50`, '--card-border': `${theme.accent}70` } as React.CSSProperties} {...fadeUp(idx * 0.1)}>
                    {/* Accent top bar */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: theme.accent, borderRadius: "1.5rem 1.5rem 0 0" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                      {bot.avatar ? (
                        <img src={bot.avatar} alt={bot.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", textTransform: "uppercase", color: theme.textColor, background: theme.accent, fontWeight: 800, fontSize: "1.2rem", boxShadow: `0 4px 16px ${theme.bgGlow}` }}>
                          {bot.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 style={{ fontWeight: 800, fontSize: "1.2rem", lineHeight: 1.1 }}>{bot.name}</h3>
                        <p style={{ fontSize: "0.7rem", color: theme.accent, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginTop: "0.2rem" }}>{bot.role}</p>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "block", boxShadow: "0 0 8px rgba(16,185,129,0.6)" }} />
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#10b981" }}>ONLINE</span>
                      </div>
                    </div>

                    <div className="chat-preview-box">
                      <div className="chat-bubble left">
                        Hi! I&apos;m {bot.name}. How can I help you today?
                      </div>
                      <div className="chat-bubble right" style={{ background: theme.accent, color: theme.textColor }}>
                        {theme.userQ}
                      </div>
                      <div className="chat-bubble left">
                        {theme.botA}
                      </div>
                    </div>

                    <Link href={`/chat/${bot.name.toLowerCase()}`} className="gf-btn-pill" style={{ ...theme.btnStyle, width: "100%", justifyContent: "center", paddingTop: "0.8rem", paddingBottom: "0.8rem", fontSize: "0.95rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", borderRadius: "999px", fontWeight: 800, textDecoration: "none" }}>
                      Chat with {bot.name} <ArrowUpRight size={18} />
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="section" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4rem" }}>
        <div className="inner">
          <div className="faq-grid">
            <div className="faq-left">
              <div className="gf-tag">FAQ</div>
              <h2>Frequently<br/>Asked<br/>Questions</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "2rem" }}>Got questions? We've got answers. If you can't find what you need here, get in touch.</p>
              <Link href="/contact" className="gf-btn-pill gf-btn-dark">Contact Us</Link>
            </div>
            <div>
              {faqs.map((faq, i) => (
                <motion.div key={i} className="faq-item" {...fadeUp(i * 0.1)}>
                  <button className={`faq-btn ${openFaq === i ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    {faq.q}
                    <ChevronDown size={20} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                        <div className="faq-content">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="gf-footer">
        {/* Top section — big CTA + links */}
        <div className="footer-top">
          <div className="inner" style={{ position: "relative", zIndex: 2 }}>
            <div className="footer-grid-top">
              {/* Left: Big CTA */}
              <div>
                <div className="gf-tag" style={{ marginBottom: "1.5rem" }}>GET STARTED</div>
                <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#fff", marginBottom: "1.5rem" }}>
                  Ready to put AI<br/>to work?
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2rem", maxWidth: 400 }}>
                  Join businesses using Redber to automate customer conversations, capture leads, and grow — 24/7.
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <Link href="/contact" className="gf-btn-pill gf-btn-amber" style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}>Start Free Trial <ArrowRight size={16} /></Link>
                  <Link href="#demo" className="gf-btn-pill gf-btn-dark" style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}>See Live Demo</Link>
                </div>
              </div>

              {/* Right: Links */}
              <div className="footer-links footer-grid-links">
                <div>
                  <h4>Product</h4>
                  <ul>
                    <li><Link href="#how-it-works">How It Works</Link></li>
                    <li><Link href="#features">Features</Link></li>
                    <li><Link href="#pricing">Pricing</Link></li>
                    <li><Link href="#demo">Live Demo</Link></li>
                    <li><Link href="#faq">FAQ</Link></li>
                  </ul>
                </div>
                <div>
                  <h4>Company</h4>
                  <ul>
                    <li><Link href="/about">About Us</Link></li>
                    <li><Link href="/blog">Blog</Link></li>
                    <li><Link href="/careers">Careers</Link></li>
                    <li><Link href="/contact">Contact</Link></li>
                  </ul>
                </div>
                <div>
                  <h4>Legal</h4>
                  <ul>
                    <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                    <li><Link href="/terms-of-service">Terms of Service</Link></li>
                    <li><Link href="/cookies">Cookie Policy</Link></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="footer-stats-row">
              {[{n:"0.25s",l:"Avg Response Time"},{n:"24/7",l:"Always Online"},{n:"∞",l:"Concurrent Calls"},{n:"< 1 min",l:"Setup Time"}].map(({n,l}) => (
                <div key={l}>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#C6F432", letterSpacing: "-0.02em" }}>{n}</div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", fontWeight: 600, marginTop: "0.2rem" }}>{l}</div>
                </div>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                {[
                  { icon: <Facebook size={18} />, href: "#", label: "Facebook" }
                ].map((item, i) => (
                  <a key={i} href={item.href} aria-label={item.label} style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "all 0.2s" }}
                     onMouseOver={(e) => { e.currentTarget.style.color = "#C6F432"; e.currentTarget.style.borderColor = "rgba(198,244,50,0.3)"; }}
                     onMouseOut={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "1rem" }}>
            <img src="/logo/Redber Logo white.svg" alt="Redber" style={{ height: "auto", width: 100 }}
              onError={(e) => { (e.target as HTMLImageElement).src = "/logo/Redber Logo Black.svg"; (e.target as HTMLImageElement).style.filter = "invert(1)"; }}
            />
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.82rem", fontWeight: 600 }}>© 2026 Redber AI · Built by <a href="https://acenzos.com" style={{ color: "#C6F432", textDecoration: "none" }}>Acenzos</a></span>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/privacy-policy" style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.82rem", textDecoration: "none", fontWeight: 600 }}>Privacy</Link>
              <Link href="/terms-of-service" style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.82rem", textDecoration: "none", fontWeight: 600 }}>Terms</Link>
              <Link href="/cookies" style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.82rem", textDecoration: "none", fontWeight: 600 }}>Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
      <RedberMascot />
    </>
  );
}
