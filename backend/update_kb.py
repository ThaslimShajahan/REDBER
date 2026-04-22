import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

bot_id = "redber-assistant-001"

# Find the pricing row
res = supabase.table("knowledge_base").select("id", "content").eq("bot_id", bot_id).ilike("content", "%pricing plans%").execute()

pricing_correct_content = """Q: What are your pricing plans? How much does Redber cost?
A: At Redber, we offer simple and transparent pricing. You can choose Monthly or Yearly billing (Yearly saves you 15%):

**Monthly Prices:**
- Starter: ₹5,500/month (Up to 1 website, basic KB, CRM setup)
- Growth: ₹9,999/month (Up to 2 websites, PDF training, conversation summaries, analytics)
- Business: ₹18,999/month (Up to 5 websites, unlimited chats, web crawler, lead scoring, multi-language)

**Yearly Prices:**
- Starter: ₹55k/year
- Growth: ₹1L/year
- Business: ₹1.7L/year

Start for free and scale as you grow. No hidden fees, and you can cancel anytime.
"""

if res.data:
    row_id = res.data[0]["id"]
    supabase.table("knowledge_base").update({"content": pricing_correct_content}).eq("id", row_id).execute()
    print("Pricing updated!")
else:
    # Insert new if not found
    supabase.table("knowledge_base").insert({
        "bot_id": bot_id,
        "page_title": "Redber Pricing",
        "content": pricing_correct_content,
        "source_type": "text",
        "source_group": "Documentation"
    }).execute()
    print("Pricing inserted!")
