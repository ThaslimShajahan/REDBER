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
  .pg-main { max-width: 780px; margin: 0 auto; padding: 9rem 2.5rem 6rem; }
  .pg-chip { display: inline-flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(37,99,235,0.22); border-radius: 999px; padding: 0.32rem 0.9rem; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2563EB; background: #EFF6FF; margin-bottom: 1.25rem; }
  .pg-h1 { font-size: clamp(2rem, 4.5vw, 3.2rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.1; color: #0A0A14; margin-bottom: 0.5rem; }
  .pg-date { font-size: 0.8rem; font-weight: 600; color: #9CA3AF; margin-bottom: 3rem; display: block; }
  .pg-body h2 { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; color: #0A0A14; margin: 2.5rem 0 0.75rem; padding-top: 2rem; border-top: 1px solid #E5E7EB; }
  .pg-body p { font-size: 0.95rem; color: #4B5563; line-height: 1.8; margin-bottom: 1.25rem; }
  .pg-body ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
  .pg-body ul li { font-size: 0.95rem; color: #4B5563; line-height: 1.75; margin-bottom: 0.35rem; }
  .pg-body a { color: #2563EB; text-decoration: none; }
  .pg-body a:hover { text-decoration: underline; }
  @media(max-width:640px){ .pg-main{padding:8rem 1.5rem 4rem;} }
`;

export default function CookiesPage() {
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
          <div className="pg-chip">Legal</div>
          <h1 className="pg-h1">Cookie Policy</h1>
          <span className="pg-date">Last Updated: April 19, 2026</span>

          <div className="pg-body">
            <h2>1. What are cookies?</h2>
            <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.</p>

            <h2>2. How we use cookies</h2>
            <p>We use cookies to understand how you use our site and to improve your experience. This includes personalizing content and advertising. By continuing to use our site, you accept our use of cookies, revised Privacy Policy and Terms of Service.</p>

            <h2>3. Types of Cookies We Use</h2>
            <ul>
              <li><strong>Essential Cookies:</strong> These cookies are strictly necessary to provide you with services available through our website and to use some of its features.</li>
              <li><strong>Analytics / Performance Cookies:</strong> These cookies are used to collect information about traffic to our website and how users use our website.</li>
              <li><strong>Functionality Cookies:</strong> These are used to recognize you when you return to our website.</li>
            </ul>

            <h2>4. Managing Cookies</h2>
            <p>You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.</p>

            <h2>5. Contact Us</h2>
            <p>If you have any questions about our use of cookies or other technologies, please email us at <a href="mailto:privacy@redber.in">privacy@redber.in</a>.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
