"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  .pg-wrap { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #0A0A14; min-height: 100vh; }
  .pg-nav { position: fixed; top: 1.2rem; left: 50%; transform: translateX(-50%); width: calc(100% - 3rem); max-width: 1160px; z-index: 100; background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); border: 1px solid #E5E7EB; border-radius: 14px; padding: 0 1.5rem; box-shadow: 0 4px 24px rgba(37,99,235,0.08); }
  .pg-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 58px; }
  .pg-back { display: inline-flex; align-items: center; gap: 0.5rem; color: #4B5563; font-size: 0.84rem; font-weight: 600; text-decoration: none; transition: color 0.2s; }
  .pg-back:hover { color: #2563EB; }
  .pg-main { max-width: 860px; margin: 0 auto; padding: 9rem 2.5rem 6rem; }
  .pg-chip { display: inline-flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(37,99,235,0.22); border-radius: 999px; padding: 0.32rem 0.9rem; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2563EB; background: #EFF6FF; margin-bottom: 1.5rem; }
  .pg-h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; color: #0A0A14; margin-bottom: 1.5rem; }
  .pg-grad { background: linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .pg-body { font-size: 1rem; color: #4B5563; line-height: 1.8; }
  .pg-h2 { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; color: #0A0A14; margin: 2.5rem 0 0.75rem; }
  .pg-stat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin: 2rem 0; }
  .pg-stat { background: #F7F8FF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 1.5rem; text-align: center; }
  .pg-stat-val { font-size: 2rem; font-weight: 800; letter-spacing: -0.04em; background: linear-gradient(135deg,#2563EB,#0EA5E9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .pg-stat-lbl { font-size: 0.7rem; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.3rem; }
  @media(max-width:640px){ .pg-stat-grid{grid-template-columns:1fr 1fr;} .pg-main{padding:8rem 1.5rem 4rem;} }
`;

export default function AboutPage() {
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="pg-chip">About Us</div>
          <h1 className="pg-h1">We build AI that<br /><span className="pg-grad">works for you.</span></h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12 }}>
          <div className="pg-stat-grid">
            <div className="pg-stat"><div className="pg-stat-val">10M+</div><div className="pg-stat-lbl">Conversations Handled</div></div>
            <div className="pg-stat"><div className="pg-stat-val">24/7</div><div className="pg-stat-lbl">Always Online</div></div>
            <div className="pg-stat"><div className="pg-stat-val">0.25s</div><div className="pg-stat-lbl">Avg Response Time</div></div>
          </div>

          <div className="pg-body">
            <p>At Redber, we believe that every business, regardless of size, deserves access to world-class operational efficiency. Founded by the team at Acenzos, our mission is to democratize artificial intelligence for customer-facing operations.</p>

            <h2 className="pg-h2">Our Vision</h2>
            <p>We envisioned a world where missing a customer message or failing to capture a lead out of hours is a thing of the past. Redber isn't just a chatbot — it's an intelligent agent capable of holding context, closing sales, and driving actual business value without sleeping.</p>

            <h2 className="pg-h2">Built by Acenzos</h2>
            <p>Redber was engineered from the ground up by Acenzos. We specialize in building robust platforms, combining deep technical expertise with a relentless focus on beautiful user experiences.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
