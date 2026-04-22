import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Blog | Redber",
};

const blogPosts = {
  "ai-reshaping-customer-service": {
    title: "How AI is Reshaping Customer Service in 2026",
    date: "April 18, 2026",
    category: "Trends",
    content: `
Customer service is no longer about call centers and hold music. In 2026, artificial intelligence has fundamentally altered how businesses interact with their audience. The shift from reactive support to proactive relationship management is in full swing.

### Continuous Availability
The concept of "business hours" is increasingly irrelevant. Customers expect immediate answers whether they are browsing at 2 AM or 2 PM. Modern AI agents are not simple decision-tree chatbots that trap users in endless loops; they are sophisticated conversationalists capable of understanding context, nuance, and intent.

### Personalization at Scale
The power of today’s AI lies in its memory. When a customer interacts with an enterprise AI assistant, the system recalls past conversations, purchase histories, and stated preferences. This allows businesses to offer highly personalized recommendations without the overhead of massive, human-staffed account management teams.

### Operational Efficiency
By automating routine inquiries—such as pricing, availability, and scheduling—human teams are freed to handle complex, high-value tasks. The result? Lower operational costs and happier, more engaged employees who no longer have to copy-paste the same answers all day long.

At Redber, we've designed our agents not just to answer questions, but to actively listen and guide customers toward meaningful outcomes.
    `,
  },
  "hidden-cost-missed-leads": {
    title: "The Hidden Cost of Missed Leads (And How to Fix It)",
    date: "March 24, 2026",
    category: "Business",
    content: `
Every missed message is a missed opportunity. If a potential client lands on your website, has a question, and cannot find an immediate answer, they will leave. In today’s hyper-competitive digital landscape, the friction of "filling out a contact form and waiting 24 hours" is too high.

### The Mathematics of Lost Revenue
Consider a business that receives 500 visitors a month. If 5% attempt to engage outside of business hours and leave because nobody is there to answer, that is 25 lost leads. Regardless of your conversion rate, those are dollars walking out the door simply because of a timing mismatch.

### The Frictionless Alternative
Immediate, conversational engagement captures attention. When a visitor asks a question and receives an instant, intelligent reply, trust is established immediately. An AI assistant can seamlessly transition from answering a basic question to capturing the lead's contact information while the intent is still hot.

### Bridging the Gap
Deploying an AI agent ensures that your top-of-funnel operates round the clock. While your sales team sleeps, your website is actively qualifying leads, scheduling calls, and building pipeline. The ROI isn't just in time saved; it's in the revenue recovered that you never even knew you were losing.
    `,
  },
  "introducing-redber": {
    title: "Introducing Redber: Your 24/7 Virtual Receptionist",
    date: "February 10, 2026",
    category: "Product Update",
    content: `
We are incredibly excited to officially pull back the curtain on Redber. Built to solve the scaling challenges of modern sales and support teams, Redber is not your standard chatbot. 

### What Makes Redber Different?
We engineered Redber to think less like software and more like a dedicated employee. By indexing your entire knowledge base—whether that's PDFs, previous chat logs, or your website's content—Redber learns the exact contours of your business. 

### Key Features
- **Semantic Understanding:** No more "I didn't understand that." Redber comprehends intent, even when customers use slang or typos.
- **Lead Capture:** Redber is explicitly trained to drive conversions. It knows when a conversation is ripe for capturing a phone number or email address.
- **Plug and Play Integration:** Connecting Redber to your CRM or syncing it to your team's Slack takes seconds, not weeks.

This is just the beginning. The roadmap ahead includes voice capabilities, multi-channel syncing, and deep predictive analytics. We can't wait for you to meet the newest member of your team.
    `,
  },
};

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts[slug as keyof typeof blogPosts];

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center">
        <h1>404 - Article Not Found</h1>
      </div>
    );
  }

  // A very simple markdown to HTML parser for our basic content
  const formatContent = (text: string) => {
    return text.split("\n\n").map((paragraph, idx) => {
      if (paragraph.startsWith("###")) {
        return <h3 key={idx} className="text-2xl font-bold text-white mt-10 mb-4">{paragraph.replace("### ", "")}</h3>;
      }
      if (paragraph.startsWith("- **")) {
        // basic bullet parsing
        const listItems = paragraph.split("\n").filter(Boolean);
        return (
          <ul key={idx} className="list-disc pl-5 my-6 space-y-2">
            {listItems.map((li, i) => {
              const content = li.replace("- ", "").replace("**", "<strong>").replace("**", "</strong>");
              return <li key={i} dangerouslySetInnerHTML={{ __html: content }} />;
            })}
          </ul>
        );
      }
      return <p key={idx} className="mb-6">{paragraph}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0] font-sans pb-20">
      <div className="max-w-3xl mx-auto px-6 pt-20">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)] hover:text-white transition-colors mb-12">
          <ArrowLeft size={16} /> Back to blog
        </Link>
        
        <div>
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#C6F432] bg-[rgba(198,244,50,0.12)] px-3 py-1.5 rounded-full inline-flex mb-6">
            {post.category}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
            {post.title}
          </h1>
          <p className="text-sm font-semibold text-[rgba(255,255,255,0.4)] mb-12 border-b border-[rgba(255,255,255,0.1)] pb-8">{post.date}</p>
        </div>

        <div className="prose-lg prose-invert text-[rgba(255,255,255,0.75)] leading-relaxed">
          {formatContent(post.content.trim())}
        </div>
        
        <div className="mt-20 p-8 rounded-3xl bg-[#141414] border border-[rgba(255,255,255,0.06)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h3 className="text-xl font-bold text-white mb-2">Want to see Redber in action?</h3>
                <p className="text-sm text-[rgba(255,255,255,0.5)]">Try our live demo and experience the difference.</p>
            </div>
            <Link href="/#demo" className="shrink-0 bg-[#C6F432] text-[#0d0d0d] font-bold px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
                Try Live Demo
            </Link>
        </div>
      </div>
    </div>
  );
}
