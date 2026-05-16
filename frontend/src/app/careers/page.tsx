"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  .pg-h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; color: #0A0A14; margin-bottom: 1.25rem; }
  .pg-sub { font-size: 1.05rem; color: #4B5563; line-height: 1.75; max-width: 560px; margin-bottom: 3.5rem; }
  .pg-h2 { font-size: 1.15rem; font-weight: 700; letter-spacing: -0.02em; color: #0A0A14; margin-bottom: 1.25rem; }
  .pg-job { display: flex; flex-direction: column; gap: 0; padding: 1.5rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; margin-bottom: 0.875rem; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.04); cursor: pointer; }
  .pg-job:hover { border-color: rgba(37,99,235,0.3); box-shadow: 0 6px 24px rgba(37,99,235,0.1); }
  .pg-job-inner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .pg-job-title { font-size: 1.05rem; font-weight: 700; color: #0A0A14; letter-spacing: -0.02em; margin-bottom: 0.3rem; }
  .pg-job-meta { font-size: 0.78rem; color: #9CA3AF; font-weight: 600; display: flex; gap: 0.5rem; }
  .pg-job-cta { font-size: 0.8rem; font-weight: 700; color: #2563EB; display: flex; align-items: center; gap: 0.3rem; white-space: nowrap; flex-shrink: 0; }
  .pg-cta-box { margin-top: 3rem; background: #F7F8FF; border: 1px solid #E5E7EB; border-radius: 20px; padding: 2.5rem; text-align: center; }
  .pg-cta-h { font-size: 1.2rem; font-weight: 700; color: #0A0A14; margin-bottom: 0.5rem; }
  .pg-cta-p { font-size: 0.875rem; color: #4B5563; max-width: 440px; margin: 0 auto 1.5rem; line-height: 1.7; }
  .pg-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: #0A0A14; color: #fff; border: none; border-radius: 10px; padding: 0.78rem 1.6rem; font-size: 0.875rem; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; text-decoration: none; transition: background 0.2s; }
  .pg-btn:hover { background: #1a1a2e; }
  @media(max-width:640px){ .pg-main{padding:8rem 1.5rem 4rem;} }
`;

const jobs = [
  { title: "Senior AI Engineer", loc: "Remote / Kochi", type: "Full-time" },
  { title: "Product Designer", loc: "Remote", type: "Full-time" },
  { title: "Growth Marketer", loc: "Remote / Kochi", type: "Full-time" },
];

export default function CareersPage() {
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
          <div className="pg-chip">Join the Team</div>
          <h1 className="pg-h1">Build the future of<br />AI agents with us.</h1>
          <p className="pg-sub">We are looking for passionate builders, thinkers, and tinkerers who want to push the boundaries of what conversational AI can achieve for businesses globally.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12 }}>
          <div className="pg-h2">Open Positions</div>
          {jobs.map((job, i) => (
            <div key={i} className="pg-job">
              <div className="pg-job-inner">
                <div>
                  <div className="pg-job-title">{job.title}</div>
                  <div className="pg-job-meta"><span>{job.loc}</span><span>·</span><span>{job.type}</span></div>
                </div>
                <div className="pg-job-cta">Apply Now <ArrowRight size={14} /></div>
              </div>
            </div>
          ))}

          <div className="pg-cta-box">
            <div className="pg-cta-h">Don't see a fit?</div>
            <p className="pg-cta-p">We're moving fast and always looking for exceptional talent. Send your resume and a bit about yourself to our team.</p>
            <Link href="/contact" className="pg-btn">Contact Us</Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
