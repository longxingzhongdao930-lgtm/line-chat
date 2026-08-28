import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

const SUPABASE_URL = "https://lmoyxwkrbzsuwdgbwyit.supabase.co";
const SUPABASE_KEY = "sb_publishable_UJGqCLzEH9Z9jsBWafWmqw__PFeudUT";

async function fetchMessages() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/messages?select=*&order=created_at.asc&limit=100`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error("読み込み失敗");
  return res.json();
}

async function postMessage(nickname, content) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ nickname, content }),
  });
  if (!res.ok) throw new Error("送信失敗");
  return res.json();
}

function Avatar({ name }) {
  const colors = ["#06C755", "#00B900", "#FF9500", "#5B8DEF", "#F45B69", "#9B59B6"];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: colors[idx],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 600,
        fontSize: 13,
        flexShrink: 0,
      }}
    >
      {name?.[0] || "?"}
    </div>
  );
}

function NicknameGate({ onSet }) {
  const [val, setVal] = useState("");
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "#f5f5f5",
        padding: 24,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>ニックネームを入力</div>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && val.trim() && onSet(val.trim())}
        placeholder="例: たろう"
        style={{
          width: "80%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid #ddd",
          fontSize: 15,
          outline: "none",
        }}
      />
      <button
        onClick={() => val.trim() && onSet(val.trim())}
        style={{
          background: "#06C755",
          color: "#fff",
          border: "none",
          padding: "10px 28px",
          borderRadius: 20,
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        はじめる
      </button>
    </div>
  );
}

export default function App() {
  const [nickname, setNickname] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const seenIds = useRef(new Set());

  useEffect(() => {
    if (!nickname) return;

    let cancelled = false;

    fetchMessages()
      .then((data) => {
        if (cancelled) return;
        data.forEach((m) => seenIds.current.add(m.id));
        setMessages(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });

    const interval = setInterval(async () => {
      try {
        const data = await fetchMessages();
        const newOnes = data.filter((m) => !seenIds.current.has(m.id));
        if (newOnes.length > 0) {
          newOnes.forEach((m) => seenIds.current.add(m.id));
          setMessages(data);
        }
      } catch (e) {
        // 無視して次回リトライ
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [nickname]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    try {
      const [saved] = await postMessage(nickname, text);
      if (saved) {
        seenIds.current.add(saved.id);
        setMessages((m) => [...m, saved]);
      }
    } catch (e) {
      setError("送信に失敗しました");
    }
  };

  if (!nickname) {
    return (
      <div style={{ width: "100%", maxWidth: 420, height: "100vh", margin: "0 auto" }}>
        <NicknameGate onSet={setNickname} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        height: "100vh",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Hiragino Sans', 'Yu Gothic', sans-serif",
        background: "#9DC8B9",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "12px 16px",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>みんなのトーク</div>
        <div style={{ fontSize: 12, color: "#888" }}>あなた: {nickname}</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 10px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && <div style={{ textAlign: "center", color: "#fff", fontSize: 13 }}>読み込み中...</div>}
        {error && (
          <div style={{ textAlign: "center", color: "#fff", fontSize: 12, background: "rgba(0,0,0,0.3)", padding: 8, borderRadius: 8 }}>
            {error}
          </div>
        )}
        {messages.map((m) => {
          const isMe = m.nickname === nickname;
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: isMe ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: 6,
              }}
            >
              {!isMe && <Avatar name={m.nickname} />}
              <div style={{ maxWidth: "68%" }}>
                {!isMe && (
                  <div style={{ fontSize: 11, color: "#e8f5e9", marginBottom: 2, marginLeft: 2 }}>{m.nickname}</div>
                )}
                <div
                  style={{
                    background: isMe ? "#06C755" : "#fff",
                    color: isMe ? "#fff" : "#111",
                    padding: "8px 12px",
                    borderRadius: 16,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: !isMe ? 4 : 16,
                    fontSize: 14.5,
                    lineHeight: 1.4,
                    boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ background: "#fff", padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            flex: 1,
            background: "#f0f0f0",
            borderRadius: 18,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="メッセージを入力"
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14 }}
          />
        </div>
        <div
          onClick={send}
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: input.trim() ? "#06C755" : "#ccc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <Send size={15} color="#fff" style={{ marginLeft: -1 }} />
        </div>
      </div>
    </div>
  );
}
