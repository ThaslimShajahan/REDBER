# OpenAI Realtime API Voice Calling Feature

## Overview

This document describes the architecture and design for the natural voice calling feature using the OpenAI Realtime API (`gpt-4o-realtime-preview`). The goal is to replace the current Deepgram STT → OpenAI LLM → Deepgram TTS pipeline with a single end-to-end voice model that delivers human-like, low-latency phone conversations with natural fillers ("Hmm", "Got it", "Sure").

---

## Architecture

### Old Pipeline (Deepgram-based)
```
Browser mic (webm/opus via MediaRecorder)
  → Backend WebSocket
  → Deepgram STT (nova-2) — speech_final event
  → OpenAI GPT-4o (text streaming)
  → Deepgram Aura TTS (per sentence, MP3)
  → Browser AudioQueue (decodeAudioData)
```
**Latency:** ~3–5 seconds end-to-end per turn.

### New Pipeline (OpenAI Realtime)
```
Browser mic (raw PCM16 at 24 kHz via AudioWorklet)
  → Backend WebSocket (/api/bots/ws/call/{bot_id})
  → OpenAI Realtime API (wss://api.openai.com/v1/realtime)
  → response.audio.delta events (base64 PCM16)
  → Backend decodes → sends raw bytes to browser
  → Browser PCM16Player (Int16 → Float32 → AudioContext)
```
**Latency:** ~500ms–1s end-to-end per turn (voice-to-voice, no intermediate steps).

---

## Backend — `ws_call.py`

### WebSocket Endpoint
`GET /api/bots/ws/call/{bot_id}?session_id=...`

### OpenAI Realtime Connection
- URL: `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`
- Headers: `Authorization: Bearer {OPENAI_API_KEY}`, `OpenAI-Beta: realtime=v1`

### Session Configuration (sent on connect)
```json
{
  "type": "session.update",
  "session": {
    "modalities": ["audio", "text"],
    "instructions": "<persona + KB context + voice rules>",
    "voice": "shimmer",
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "input_audio_transcription": { "model": "whisper-1" },
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 600
    },
    "temperature": 0.8,
    "max_response_output_tokens": 150
  }
}
```

### Events Handled

| Direction | Event | Action |
|-----------|-------|--------|
| OpenAI → Backend | `session.created` / `session.updated` | Forward `session_ready` to browser |
| OpenAI → Backend | `input_audio_buffer.speech_started` | Forward `speech_started` + send `response.cancel` |
| OpenAI → Backend | `response.audio.delta` | Decode base64 → send raw PCM16 bytes to browser |
| OpenAI → Backend | `response.audio_transcript.done` | Append to `chat_history`, forward `bot_reply` |
| OpenAI → Backend | `response.done` | Forward `bot_complete` |
| OpenAI → Backend | `conversation.item.input_audio_transcription.completed` | Append to `chat_history`, forward `transcript` |
| OpenAI → Backend | `error` | Log + forward error to browser |
| Browser → Backend | Binary bytes | Base64-encode → `input_audio_buffer.append` to OpenAI |
| Browser → Backend | `{ action: "stop" }` | Close OpenAI WebSocket |

### System Prompt Design
Built at session start from:
1. Bot's `persona_prompt` from the database
2. Current date and time (for booking validation)
3. Voice-specific rules (short sentences, natural fillers, no markdown)
4. Industry-specific booking collection rules
5. Top 6 knowledge base chunks (fetched from `documents` table)

### Post-call Processing
After call ends, a background task runs lead detection on `chat_history`:
- Calls GPT-4 to score the lead (0–100) and extract name/phone/email/date/time
- Upserts to `leads` and `customers` tables if score ≥ 30
- Saves booking to `bookings` table if `[SYSTEM_BOOKING_CONFIRMED]` detected
- Logs full transcript to `chat_logs`

---

## Frontend — `Chatbot.tsx`

### Audio Capture (replacing MediaRecorder)

Uses **AudioWorklet** (with ScriptProcessor fallback) to capture raw PCM16 from the mic:

```
getUserMedia({ audio: true })
  → AudioContext({ sampleRate: 24000 })
  → createMediaStreamSource(stream)
  → AudioWorkletNode('pcm16-processor')
    — converts Float32 → Int16 per frame
    — posts Int16Array.buffer via port.onmessage
  → WebSocket.send(pcm16Buffer)
```

The AudioWorklet processor is injected as a Blob URL (no separate file needed).

### Audio Playback (replacing AudioQueue + decodeAudioData)

Uses **PCM16Player** class:
- Receives raw `ArrayBuffer` (Int16 PCM16 at 24 kHz) from WebSocket binary frames
- Converts `Int16Array → Float32Array` (`value / 32768.0`)
- Creates `AudioBuffer` via `AudioContext.createBuffer(1, length, 24000)`
- Schedules each chunk sequentially with `nextStart` pointer
- `onAllDone` callback fires when all queued audio finishes → sets status back to "listening"
- `cancel()` resets `nextStart` and recreates `AudioContext` for barge-in support

### Browser Event Handling

| Message | Action |
|---------|--------|
| Binary `ArrayBuffer` | PCM16Player.enqueue() — set status "speaking" |
| `session_ready` | Set call status "listening" |
| `speech_started` | PCM16Player.cancel() — set status "listening" (barge-in) |
| `transcript` | Add user message bubble |
| `bot_reply` | Add bot message bubble |
| `bot_complete` | If still "thinking", set status "listening" |
| `error` | Log to console |

### Ref Changes

| Old | New |
|-----|-----|
| `mediaRecorderRef: MediaRecorder` | `audioCtxRef: AudioContext` |
| _(none)_ | `workletNodeRef: AudioWorkletNode` |
| `audioQueueRef: AudioQueue` | `audioQueueRef: PCM16Player` |

---

## Voice Options

The `realtime_voice` field in `persona_config` controls the voice. Available OpenAI voices:

| Voice | Character |
|-------|-----------|
| `alloy` | Neutral, balanced |
| `echo` | Male, clear |
| `fable` | Warm, storytelling |
| `onyx` | Deep, authoritative |
| `nova` | Friendly, upbeat |
| `shimmer` | Soft, professional *(default)* |

---

## Key Advantages Over Old Pipeline

| Aspect | Old (Deepgram) | New (OpenAI Realtime) |
|--------|-----------------|----------------------|
| Latency | 3–5s per turn | ~500ms–1s per turn |
| Natural fillers | None (requires prompting TTS) | Native to model |
| Barge-in | Not supported | Server VAD + `response.cancel` |
| Dependencies | Deepgram SDK + API key | Only OpenAI API key |
| Audio format | MP3 (encoded/decoded) | Raw PCM16 (zero codec overhead) |
| Voice quality | Aura TTS (good) | GPT-4o voice (natural) |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Required for Realtime API access | _(none)_ |

The `realtime_voice` per-bot setting lives in `bots.persona_config.realtime_voice`.

---

## Limitations & Notes

- **Cost:** OpenAI Realtime API is billed per audio token (input + output). More expensive than Deepgram + GPT-4o-mini text, but significantly better quality.
- **Knowledge base context:** KB chunks are fetched once at session start (no per-turn RAG). This means very long KBs will be truncated. For bots with large KBs, consider pre-summarizing top chunks.
- **Browser support:** AudioWorklet requires a secure context (HTTPS or localhost). The ScriptProcessor fallback handles older browsers.
- **Sample rate:** AudioContext is created at 24 kHz to match OpenAI's PCM16 format. The browser automatically resamples the mic input.
