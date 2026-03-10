import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(override=True)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

def get_supabase_client() -> Client:
    # Initialize only if credentials exist, else return a dummy or raise
    if SUPABASE_URL and SUPABASE_KEY:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    return None
