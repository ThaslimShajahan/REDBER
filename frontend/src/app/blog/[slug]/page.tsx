import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Blog | Redber" };

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  .pg-wrap { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #0A0A14; min-height: 100vh; }
  .pg-nav { position: fixed; top: 1.2rem; left: 50%; transform: translateX(-50%); width: calc(100% - 3rem); max-width: 1160px; z-index: 100; background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); border: 1px solid #E5E7EB; border-radius: 14px; padding: 0 1.5rem; box-shadow: 0 4px 24px rgba(37,99,235,0.08); }
  .pg-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 58px; }
  .pg-back { display: inline-flex; align-items: center; gap: 0.5rem; color: #4B5563; font-size: 0.84rem; font-weight: 600; text-decoration: none; transition: color 0.2s; }
  .pg-back:hover { color: #2563EB; }
  .pg-main { max-width: 720px; margin: 0 auto; padding: 9rem 2.5rem 6rem; }
  .pg-chip { display: inline-flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(37,99,235,0.22); border-radius: 999px; padding: 0.32rem 0.9rem; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #2563EB; background: #EFF6FF; margin-bottom: 1.25rem; }
  .pg-h1 { font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 800; letter-spacing: -0.035em; line-height: 1.1; color: #0A0A14; margin-bottom: 1rem; }
  .pg-date { font-size: 0.8rem; font-weight: 600; color: #9CA3AF; padding-bottom: 2rem; border-bottom: 1px solid #E5E7EB; margin-bottom: 2.5rem; }
  .pg-body p { font-size: 1rem; color: #4B5563; line-height: 1.85; margin-bottom: 1.5rem; }
  .pg-body h3 { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; color: #0A0A14; margin: 2.5rem 0 0.75rem; }
  .pg-body ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
  .pg-body ul li { font-size: 1rem; color: #4B5563; line-height: 1.75; margin-bottom: 0.4rem; }
  .pg-cta { margin-top: 4rem; background: #F7F8FF; border: 1px solid #E5E7EB; border-radius: 20px; padding: 2rem; display: flex; flex-direction: column; gap: 1rem; }
  @media(min-width:640px){ .pg-cta{flex-direction:row;align-items:center;justify-content:space-between;} }
  .pg-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: #0A0A14; color: #fff; border: none; border-radius: 10px; padding: 0.75rem 1.5rem; font-size: 0.85rem; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; text-decoration: none; transition: background 0.2s; white-space: nowrap; }
  .pg-btn:hover { background: #1a1a2e; }
  @media(max-width:640px){ .pg-main{padding:8rem 1.5rem 4rem;} }
`;

const blogPosts: Record<string, { title: string; date: string; category: string; content: string }> = {
  "ai-reshaping-customer-service": {
    title: "How AI is Reshaping Customer Service in 2026",
    date: "April 18, 2026",
    category: "Trends",
    content: `Customer service is no longer about call centers and hold music. In 2026, artificial intelligence has fundamentally altered how businesses interact with their audience. The shift from reactive support to proactive relationship management is in full swing.

### Continuous Availability
The concept of "business hours" is increasingly irrelevant. Customers expect immediate answers whether they are browsing at 2 AM or 2 PM. Modern AI agents are not simple decision-tree chatbots that trap users in endless loops; they are sophisticated conversationalists capable of understanding context, nuance, and intent.

### Personalization at Scale
The power of today's AI lies in its memory. When a customer interacts with an enterprise AI assistant, the system recalls past conversations, purchase histories, and stated preferences. This allows businesses to offer highly personalized recommendations without the overhead of massive, human-staffed account management teams.

### Operational Efficiency
By automating routine inquiries—such as pricing, availability, and scheduling—human teams are freed to handle complex, high-value tasks. The result? Lower operational costs and happier, more engaged employees who no longer have to copy-paste the same answers all day long.

At Redber, we've designed our agents not just to answer questions, but to actively listen and guide customers toward meaningful outcomes.`,
  },
  "hidden-cost-missed-leads": {
    title: "The Hidden Cost of Missed Leads (And How to Fix It)",
    date: "March 24, 2026",
    category: "Business",
    content: `Every missed message is a missed opportunity. If a potential client lands on your website, has a question, and cannot find an immediate answer, they will leave. In today's hyper-competitive digital landscape, the friction of "filling out a contact form and waiting 24 hours" is too high.

### The Mathematics of Lost Revenue
Consider a business that receives 500 visitors a month. If 5% attempt to engage outside of business hours and leave because nobody is there to answer, that is 25 lost leads. Regardless of your conversion rate, those are dollars walking out the door simply because of a timing mismatch.

### The Frictionless Alternative
Immediate, conversational engagement captures attention. When a visitor asks a question and receives an instant, intelligent reply, trust is established immediately. An AI assistant can seamlessly transition from answering a basic question to capturing the lead's contact information while the intent is still hot.

### Bridging the Gap
Deploying an AI agent ensures that your top-of-funnel operates round the clock. While your sales team sleeps, your website is actively qualifying leads, scheduling calls, and building pipeline. The ROI isn't just in time saved; it's in the revenue recovered that you never even knew you were losing.`,
  },
  "introducing-redber": {
    title: "Introducing Redber: Your 24/7 Virtual Receptionist",
    date: "February 10, 2026",
    category: "Product Update",
    content: `We are incredibly excited to officially pull back the curtain on Redber. Built to solve the scaling challenges of modern sales and support teams, Redber is not your standard chatbot.

### What Makes Redber Different?
We engineered Redber to think less like software and more like a dedicated employee. By indexing your entire knowledge base—whether that's PDFs, previous chat logs, or your website's content—Redber learns the exact contours of your business.

### Key Features
- **Semantic Understanding:** No more "I didn't understand that." Redber comprehends intent, even when customers use slang or typos.
- **Lead Capture:** Redber is explicitly trained to drive conversions. It knows when a conversation is ripe for capturing a phone number or email address.
- **Plug and Play Integration:** Connecting Redber to your CRM or syncing it to your team's Slack takes seconds, not weeks.

This is just the beginning. The roadmap ahead includes voice capabilities, multi-channel syncing, and deep predictive analytics. We can't wait for you to meet the newest member of your team.`,
  },
};

const formatContent = (text: string) =>
  text.split("\n\n").map((para, idx) => {
    if (para.startsWith("###")) return <h3 key={idx}>{para.replace("### ", "")}</h3>;
    if (para.startsWith("- **")) {
      const items = para.split("\n").filter(Boolean);
      return (
        <ul key={idx}>
          {items.map((li, i) => {
            const html = li.replace("- ", "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
            return <li key={i} dangerouslySetInnerHTML={{ __html: html }} />;
          })}
        </ul>
      );
    }
    return <p key={idx}>{para}</p>;
  });

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>404</div>
          <p style={{ color: "#4B5563" }}>Article not found.</p>
          <Link href="/blog" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>← Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pg-wrap">
      <style>{STYLES}</style>

      <nav className="pg-nav">
        <div className="pg-nav-inner">
          <Link href="/blog" className="pg-back">
            <ArrowLeft size={16} /> Back to Blog
          </Link>
          <img src="/logo/Redber Logo Black.svg" alt="Redber" style={{ width: 96, height: "auto" }}
            onError={e => { (e.target as HTMLImageElement).src = "/logo/Redber Logo white.svg"; (e.target as HTMLImageElement).style.filter = "invert(1)"; }} />
        </div>
      </nav>

      <main className="pg-main">
        <div className="pg-chip">{post.category}</div>
        <h1 className="pg-h1">{post.title}</h1>
        <p className="pg-date">{post.date}</p>

        <div className="pg-body">{formatContent(post.content.trim())}</div>

        <div className="pg-cta">
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0A0A14", marginBottom: "0.35rem" }}>Want to see Redber in action?</div>
            <p style={{ fontSize: "0.875rem", color: "#4B5563", margin: 0 }}>Try our live demo and experience the difference.</p>
          </div>
          <Link href="/#demo" className="pg-btn">Try Live Demo</Link>
        </div>
      </main>
    </div>
  );
}
