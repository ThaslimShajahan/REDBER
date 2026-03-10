import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Force override to prevent global OS env variables from interfering
load_dotenv(override=True)

# Get key and strip any accidental whitespace that causes 401s
api_key = os.environ.get("OPENAI_API_KEY", "").strip()

client = AsyncOpenAI(api_key=api_key) if api_key else None

async def generate_chat_response(messages: list, model: str = "gpt-4o", max_tokens: int = 800):
    if not client:
        return "OpenAI API missing. Cannot generate response."
    
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.7,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content

async def generate_agentic_response(messages: list, tools: list = None, model: str = "gpt-4o", max_tokens: int = 800):
    if not client:
        return None
    
    kwargs = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": max_tokens
    }
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = "auto"
        
    response = await client.chat.completions.create(**kwargs)
    return response

async def generate_embedding(text: str, model: str = "text-embedding-3-large"):
    if not client:
        return []
    
    response = await client.embeddings.create(input=[text], model=model, dimensions=1536)
    return response.data[0].embedding


async def transcribe_audio(file_tuple):
    if not client:
        return ""
    response = await client.audio.transcriptions.create(
        model="whisper-1", 
        file=file_tuple,
        prompt="User may have an Indian accent and be inquiring about local businesses, restaurants, Kerala, biryani, or car dealerships like Mahindra Thar. Respond accurately."
    )
    return response.text

async def generate_speech(text: str, voice="nova"):
    if not client:
        return b""
    response = await client.audio.speech.create(model="tts-1", voice=voice, input=text)
    return response.read()
