"""
One-off script: ingest Acenzos.com page content into Lexa's knowledge base.
Content sourced via browser scraping of the live SPA at https://acenzos.com

Run from: c:\Work\persona-ai-mvp\backend\
  python ingest_acenzos.py
"""
import asyncio
import os
import sys

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ── Page content scraped via live browser from acenzos.com ────────────────────

PAGES = [
    {
        "url": "https://acenzos.com/",
        "title": "Home — Acenzos Digital Products & AI Development Agency",
        "content": """
Acenzos — Digital Products & AI Development Agency

Acenzos is a product-first digital studio that builds AI-powered platforms and custom web applications.
We specialize in clean code, scalable architecture, and seamless AI integrations for businesses that 
demand precision.

Core Disciplines:
- AI & Automation: Custom LLM integrations, 24/7 automation pipelines, intelligent chatbots
- Web Engineering: Scalable full-stack applications built with React and Node.js
- UI/UX Design: Design systems, interaction patterns, and visual identities
- Product Strategy: Roadmaps, technical architecture, and go-to-market planning

Flagship Product: Redber AI
Redber AI is the AI Receptionist That Never Sleeps — built by Acenzos for 24/7 lead capture, 
customer support, and intelligent conversation automation. Redber AI qualifies leads, answers FAQs, 
books appointments, and captures contact details around the clock.

Location: KC Arcade, Kakkanad, Ernakulam - 682037, Kerala, India
Contact Email: info@acenzos.com
""",
    },
    {
        "url": "https://acenzos.com/studio",
        "title": "The Studio | Acenzos",
        "content": """
The Studio — Who We Are

Acenzos is a specialized team of engineers and designers based in Kerala, India.
We architect high-performance digital products and AI-powered solutions for businesses globally.

Our Philosophy:
1. Uncompromising Quality: Meticulous craftsmanship from system architecture to frontend 
   micro-interactions. Rigorous testing and attention to detail in everything we ship.
2. Design as Function: We solve complex problems with intuitive clarity. Aesthetics serve 
   purpose — beauty and usability are not separate concerns.
3. Built for Scale: Every product is built on resilient, secure, and infinitely scalable 
   technical foundations so it can grow with your business.

Our team consists of full-stack engineers, UI/UX designers, and AI integration specialists
operating remotely-first and collaborating with clients worldwide from Kerala, India.

Office: KC Arcade, Kakkanad, Ernakulam - 682037, Kerala, India
Email: info@acenzos.com
""",
    },
    {
        "url": "https://acenzos.com/expertise",
        "title": "Engineering & Expertise | Acenzos",
        "content": """
Engineering & Expertise — What We Build

Practice Area 1: Shopify Development
- Custom Liquid themes tailored to brand identity and conversion goals
- Hydrogen & Headless commerce architecture for maximum performance
- Shopify App integration and custom Shopify app development
- Store Migration — seamlessly moving from other platforms to Shopify
- Shopify Plus enterprise solutions
- Conversion Rate Optimisation (CRO) for Shopify stores

Practice Area 2: Custom Web Development
- React & Next.js full-stack web applications
- Node.js API design and backend services
- Mobile Apps using React Native
- Cloud Infrastructure on AWS and GCP
- Headless CMS integration (Contentful, Sanity, Strapi)
- Database optimization with PostgreSQL and Redis
- WebSocket real-time features

Practice Area 3: AI & Automation
- Redber AI deployment — managed AI receptionist chatbots for any business
- Custom chatbot development with OpenAI GPT-4 and Google Gemini integration
- LLM integration: lead capture, FAQ automation, appointment booking
- Knowledge base training and RAG (Retrieval Augmented Generation)
- AI workflow automation reducing manual repetitive tasks
- Real-time voice AI with ultra-low latency

Our Execution Process:
Step 1 — Discovery & Brief: Deep understanding of your business goals, technical requirements, 
          and success metrics.
Step 2 — Design & Architecture: Blueprint the solution with wireframes and system architecture.
Step 3 — Build & Iterate: Agile development with regular client demos and feedback loops.
Step 4 — Launch & Retain: Smooth deployment, monitoring, and ongoing support and maintenance.

Key Technologies: React, Next.js, Node.js, Python (FastAPI), Shopify Liquid, Shopify Hydrogen,
OpenAI GPT-4, Google Gemini, Supabase, Firebase, PostgreSQL, pgvector, Redis, AWS, GCP,
Tailwind CSS, Framer Motion, React Native.
""",
    },
    {
        "url": "https://acenzos.com/work",
        "title": "Our Work & Case Studies | Acenzos",
        "content": """
Our Work — Build. Launch. Grow.

Acenzos focuses on measurable outcomes and post-launch optimization, not just shipping code.

Case Study 1: Redber AI
Redber AI is an intelligent communication platform built by Acenzos.
It handles customer inquiries, captures leads, and books appointments 24/7 without human intervention.

Technical highlights:
- Low-latency LLM orchestration with response times under 3 seconds
- PostgreSQL with pgvector extension for semantic Knowledge Base search (RAG)
- Real-time streaming chat responses using Server-Sent Events (SSE)
- Voice calling support with Deepgram ultra-low-latency TTS (150ms TTFB)
- WhatsApp channel integration via Meta Cloud API
- Multi-tenant architecture for serving multiple client bots from one platform
- Firebase authentication with role-based access control (super admin + client tenants)

Case Study 2: Architecture Dashboard (Internal Platform)
An internal mission control dashboard for managing software delivery lifecycles.
Tech Stack: React, Node.js, PostgreSQL, Redis, WebSockets, GitHub API, Vercel API.
Features: Real-time project tracking, task management, team notifications, approval workflows.

Methodology: Build. Launch. Grow.
We don't just build and hand off — we monitor, iterate, and optimize post-launch to ensure 
your product continues to grow and perform.
""",
    },
    {
        "url": "https://acenzos.com/contact",
        "title": "Let's Talk | Acenzos",
        "content": """
Let's Talk — Contact Acenzos

Ready to start a project or just want to explore what's possible?

Contact Details:
- Email: info@acenzos.com
- Website: https://acenzos.com
- Redber AI platform: https://redber.in
- Instagram: @acenzos
- Twitter/X: @acenzos  
- LinkedIn: linkedin.com/company/acenzos

Office Address: KC Arcade, Kakkanad, Ernakulam - 682037, Kerala, India

What to include when reaching out:
- Your business name and industry
- What you're looking to build or problem to solve
- Your approximate timeline and budget range

We typically respond within 24 hours on business days.
We work with clients globally — timezone differences are not a barrier.
We offer initial consultations at no cost for qualified projects.
""",
    },
    {
        "url": "https://acenzos.com/",
        "title": "Redber AI — AI Receptionist Product by Acenzos",
        "content": """
Redber AI — The AI Receptionist That Never Sleeps

Redber AI is Acenzos's flagship AI product: a conversational AI receptionist, lead capture 
system, and customer support bot that works around the clock.

Key Capabilities:
- 24/7 Lead Capture: Captures visitor contact details and qualifies leads automatically
- FAQ Automation: Answers common business questions from a trained knowledge base
- Appointment Booking: Helps customers schedule appointments and consultations
- Voice Calling: Real-time AI voice calls with ultra-low latency (Deepgram Aura TTS)
- WhatsApp Integration: Responds to WhatsApp messages using the Meta Cloud API
- Custom Persona: Fully customisable name, personality, tone, and appearance
- Analytics Dashboard: Lead tracking, conversation logs, and conversion metrics
- Knowledge Base: Trainable from PDFs, website crawls, and manual text input
- Multi-Channel: Web widget, WhatsApp, and direct chat link

Industries Served by Redber AI:
- Restaurants and hospitality
- Healthcare clinics and dental practices
- Real estate agencies
- Automotive dealerships  
- E-commerce and retail brands
- IT companies and digital agencies
- Hotels and resorts (SPA bots, concierge bots)

How to Get Redber AI:
Contact Acenzos at info@acenzos.com to get started.
Redber AI is deployed as a managed service — Acenzos handles setup, training, and maintenance.
Pricing is based on plan tier (Starter, Business, Enterprise) and usage requirements.
Custom quotes available — contact info@acenzos.com.

Redber AI Platform: https://redber.in
Built and operated by: Acenzos, KC Arcade, Kakkanad, Ernakulam - 682037, Kerala, India
""",
    },
]

BOT_ID = "lexa"


async def ingest():
    sys.path.insert(0, os.path.dirname(__file__))
    from app.integrations.openai_client import generate_embedding
    from app.integrations.supabase_client import get_supabase_client
    from app.rag.ingestion import chunk_text

    supabase = get_supabase_client()
    if not supabase:
        print("❌ Supabase client not available. Check .env file.")
        return

    # Remove existing acenzos website chunks for Lexa to avoid duplicates
    print(f"🗑️  Removing existing website chunks for bot '{BOT_ID}'...")
    try:
        supabase.table("knowledge_base").delete() \
            .eq("bot_id", BOT_ID) \
            .eq("source_type", "website") \
            .execute()
        print("   ✅ Old chunks removed.")
    except Exception as e:
        print(f"   ⚠️  Could not remove old chunks: {e}")

    total_chunks = 0
    for page in PAGES:
        print(f"\n📄 Ingesting: {page['title']}")
        print(f"   URL: {page['url']}")
        chunks = chunk_text(page["content"].strip())
        records = []
        for chunk in chunks:
            embedding = await generate_embedding(chunk)
            if embedding:
                records.append({
                    "bot_id": BOT_ID,
                    "content": chunk,
                    "embedding": embedding,
                    "metadata": {"source": page["url"], "page_title": page["title"]},
                    "source_type": "website",
                    "page_title": page["title"],
                    "source_group": page["url"],
                })
        if records:
            supabase.table("knowledge_base").insert(records).execute()
            total_chunks += len(records)
            print(f"   ✅ {len(records)} chunks inserted.")
        else:
            print(f"   ⚠️  No embeddings generated — check OpenAI API key.")

    print(f"\n🎉 Done! Total chunks inserted into Lexa's knowledge base: {total_chunks}")


if __name__ == "__main__":
    asyncio.run(ingest())
