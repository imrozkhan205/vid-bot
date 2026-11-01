# Podcast Coach

A chatbot that answers questions using only the full transcripts of two YouTube podcasts. No RAG, no database, no auth. Transcripts are loaded directly into the system prompt on every request.

## Setup Steps

1. **Install Node dependencies**:
   ```bash
   npm install
   ```

2. **Install Python dependencies**:
   ```bash
   pip install youtube-transcript-api
   ```

3. **Fetch transcripts**:
   ```bash
   python scripts/fetch_transcripts.py <youtube-url-1> <youtube-url-2>
   ```

4. **Rename transcript files**:
   Rename the generated files in `transcripts/` to the episode titles (e.g., `transcripts/Cold-Calling-Playbook.txt`). The filename without `.txt` is what the model cites as the episode title.

5. **Configure environment variables**:
   Copy `.env.local.example` to `.env.local` and add your OpenRouter API key from [openrouter.ai/keys](https://openrouter.ai/keys):
   ```bash
   cp .env.local.example .env.local
   ```
   Set `OPENROUTER_API_KEY=your-key-here`.

6. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Notes

- **Missing captions**: If captions are missing or disabled on YouTube, transcribe the audio with Whisper (or Deepgram) and save the output in `transcripts/` in the same `[HH:MM:SS] text` format.
- **Model selection & rate limits**: Free OpenRouter models (`openrouter/free`) are rate limited and rotate without notice. If one fails, set a different `OPENROUTER_MODEL` with 128k+ context window in `.env.local` (such as `meta-llama/llama-3.3-70b-instruct:free` or a paid model like `anthropic/claude-3.5-sonnet`).
