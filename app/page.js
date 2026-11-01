"use client";
import { useState, useRef, useEffect } from "react";

const STARTERS = [
  "How should I open a cold call?",
  "What objections come up most, and how do I handle them?",
  "Write a 5-step cold call script from these episodes.",
];

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text) {
    const q = text.trim();
    if (!q || busy) return;
    const history = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        throw new Error((await res.text()) || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: reply }]);
      }
    } catch (e) {
      setMessages([
        ...history,
        { role: "assistant", content: `Something went wrong: ${e.message}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <header>
        <h1>Podcast Coach</h1>
        <p>Answers come only from your two podcast transcripts, with timestamps.</p>
      </header>

      <section className="thread" aria-live="polite">
        {messages.length === 0 && (
          <div className="starters">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => send(s)} type="button">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.content || (busy && i === messages.length - 1 ? "Reading the transcripts..." : "")}
          </div>
        ))}
        <div ref={endRef} />
      </section>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          value={input}
          rows={2}
          disabled={busy}
          placeholder="Ask about cold calling, objections, openers..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          Ask
        </button>
      </form>
    </main>
  );
}
