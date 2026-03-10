-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create leads table for auto-detection
create table leads (
  id uuid primary key default gen_random_uuid(),
  bot_id text not null,
  session_id text,
  score int not null,
  type text not null,
  summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create knowledge base table for RAG
create table knowledge_base (
  id uuid primary key default gen_random_uuid(),
  bot_id text not null,
  content text not null,
  embedding vector(3072), -- text-embedding-3-large outputs 3072 dimensions
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for vector similarity search
create index on knowledge_base using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Function to query the knowledge base based on similarity
create or replace function match_documents (
  query_embedding vector(3072),
  match_threshold float,
  match_count int,
  filter_bot_id text
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    knowledge_base.id,
    knowledge_base.content,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where knowledge_base.bot_id = filter_bot_id
    and 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by knowledge_base.embedding <=> query_embedding
  limit match_count;
end;
$$;
