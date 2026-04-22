import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

bot_id = "redber-assistant-001"
res = supabase.table("knowledge_base").select("id", count="exact").eq("bot_id", bot_id).execute()
print(f"Knowledge base count for {bot_id}: {res.count}")

# Check first 5 items
res_items = supabase.table("knowledge_base").select("page_title", "content").eq("bot_id", bot_id).limit(5).execute()
print("\nFirst 5 items:")
for item in res_items.data:
    print(f"- {item.get('page_title')}: {item.get('content')[:100]}...")
