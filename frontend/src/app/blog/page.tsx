"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  .pg-wrap { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #0A0A14; min-height: 100vh; }
  .pg-nav { position: fixed; top: 1.2rem; left: 50%; transform: translateX(-50%); width: calc(100% - 3rem); max-width: 1160px; z-index: 100; background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); border: 1px solid #E5E7EB; border-radius: 14px; padding: 0 1.5rem; box-shadow: 0 4px 24px rgba(37,99,235,0.08); }
  .pg-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 58px; }
  .pg-back { display: inline-flex; align-items: center; gap: 0.5rem; color: #4B5563; font-size: 0.84rem; font-weight: 600; text-decoration: none; transition: color 0.2s; }
  .pg-back:hover { color: #2563EB; }
  .pg-main { max-width: 1100px; margin: 0 auto; padding: 9rem 2.5rem 6rem; }
  .pg-chip { display: inline-flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(37,99,235,0.22); border-radius: 999px; padding: 0.32rem 0.9rem; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2563EB; background: #EFF6FF; margin-bottom: 1.5rem; }
  .pg-h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; color: #0A0A14; margin-bottom: 3rem; }
  .pg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
  .pg-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 20px; padding: 2rem; display: flex; flex-direction: column; text-decoration: none; transition: all 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  .pg-card:hover { border-color: rgba(37,99,235,0.3); box-shadow: 0 8px 32px rgba(37,99,235,0.12); transform: translateY(-2px); }
  .pg-cat { font-size: 0.67rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2563EB; }
  .pg-card-title { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; color: #0A0A14; margin-top: 2.5rem; margin-bottom: 0.5rem; line-height: 1.3; }
  .pg-card-date { font-size: 0.75rem; font-weight: 600; color: #9CA3AF; }
  @media(max-width:640px){ .pg-main{padding:8rem 1.5rem 4rem;} }
`;

const posts = [
  { title: "How AI is Reshaping Customer Service in 2026", date: "April 18, 2026", category: "Trends", slug: "ai-reshaping-customer-service" },
  { title: "The Hidden Cost of Missed Leads (And How to Fix It)", date: "March 24, 2026", category: "Business", slug: "hidden-cost-missed-leads" },
  { title: "Introducing Redber: Your 24/7 Virtual Receptionist", date: "February 10, 2026", category: "Product Update", slug: "introducing-redber" },
];

export default function BlogPage() {
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
          <div className="pg-chip">Blog &amp; Insights</div>
          <h1 className="pg-h1">The latest from Redber.</h1>
        </motion.div>

        <div className="pg-grid">
          {posts.map((post, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <Link href={`/blog/${post.slug}`} className="pg-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="pg-cat">{post.category}</span>
                  <ArrowUpRight size={17} color="#9CA3AF" />
                </div>
                <div className="pg-card-title">{post.title}</div>
                <div className="pg-card-date">{post.date}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
