import { useState, useEffect, useRef } from "react";
import { Send, ChevronLeft, Check, CheckCheck, Plus } from "lucide-react";

const SUPABASE_URL = "https://lmoyxwkrbzsuwdgbwyit.supabase.co";
const SUPABASE_KEY = "sb_publishable_UJGqCLzEH9Z9jsBWafWmqw__PFeudUT";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function api(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

const REACTIONS = ["❤️", "😂", "😮", "😢", "👍"];

function Avatar({ name, size = 32 }) {
  const colors = ["#06C755", "#00B900", "#FF9500", "#5B8DEF", "#F45B69", "#9B59B6"];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        background: colors[idx],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 600,
        fontSize: size * 0.4,
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
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#f5f5f5", padding: 24 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>ニックネームを入力</div>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && val.trim() && onSet(val.trim())}
        placeholder="例: たろう"
        style={{ width: "80%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 15, outline: "none" }}
      />
      <button
        onClick={() => val.trim() && onSet(val.trim())}
        style={{ background: "#06C755", color: "#fff", border: "none", padding: "10px 28px", borderRadius: 20, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
      >
        はじめる
      </button>
    </div>
  );
}

function RoomList({ nickname, onOpen }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [partner, setPartner] = useState("");

  const load = async () => {
    try {
      const members = await api(`room_members?nickname=eq.${encodeURIComponent(nickname)}&select=room_id`);
      const roomIds = members.map((m) => m.room_id);
      if (roomIds.length === 0) {
        setRooms([]);
        setLoading(false);
        return;
      }
      const roomsData = await api(`rooms?id=in.(${roomIds.join(",")})&select=*&order=created_at.desc`);
      const withMembers = await Promise.all(
        roomsData.map(async (r) => {
          const mem = await api(`room_members?room_id=eq.${r.id}&select=nickname`);
          const others = mem.map((m) => m.nickname).filter((n) => n !== nickname);
          const lastMsg = await api(`messages?room_id=eq.${r.id}&select=*&order=created_at.desc&limit=1`);
          return { ...r, others, lastMsg: lastMsg[0] || null };
        })
      );
      setRooms(withMembers);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [nickname]);

  const createRoom = async () => {
    if (!partner.trim()) return;
    const roomName = [nickname, partner.trim()].sort().join("_");
    const existing = await api(`rooms?name=eq.${encodeURIComponent(roomName)}`);
    let room;
    if (existing.length > 0) {
      room = existing[0];
    } else {
      const created = await api("rooms", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ name: roomName }) });
      room = created[0];
      await api("room_members", { method: "POST", body: JSON.stringify([{ room_id: room.id, nickname }, { room_id: room.id, nickname: partner.trim() }]) });
    }
    setShowNew(false);
    setPartner("");
    onOpen(room, [nickname, partner.trim()]);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>トーク</div>
        <div onClick={() => setShowNew(true)} style={{ cursor: "pointer" }}>
          <Plus size={22} color="#06C755" />
        </div>
      </div>

      {showNew && (
        <div style={{ padding: 14, borderBottom: "1px solid #f0f0f0", background: "#f9f9f9", display: "flex", gap: 8 }}>
          <input
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
            placeholder="相手のニックネーム"
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
            onKeyDown={(e) => e.key === "Enter" && createRoom()}
          />
          <button onClick={createRoom} style={{ background: "#06C755", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 14 }}>
            開始
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && <div style={{ textAlign: "center", padding: 20, color: "#999", fontSize: 13 }}>読み込み中...</div>}
        {!loading && rooms.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 13 }}>
            右上の + から友達とのトークを始めましょう
          </div>
        )}
        {rooms.map((r) => {
          const partnerName = r.others[0] || "?";
          return (
            <div
              key={r.id}
              onClick={() => onOpen(r, [nickname, ...r.others])}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f7f7f7" }}
            >
              <Avatar name={partnerName} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#111" }}>{partnerName}</div>
                <div style={{ fontSize: 13, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.lastMsg ? r.lastMsg.content : "メッセージはまだありません"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatRoom({ room, nickname, members, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [reads, setReads] = useState({});
  const [reactions, setReactions] = useState({});
  const [pickerFor, setPickerFor] = useState(null);
  const bottomRef = useRef(null);
  const seenIds = useRef(new Set());
  const partnerName = members.find((m) => m !== nickname) || "?";

  const loadAll = async () => {
    const msgs = await api(`messages?room_id=eq.${room.id}&select=*&order=created_at.asc&limit=200`);
    msgs.forEach((m) => seenIds.current.add(m.id));
    setMessages(msgs);

    if (msgs.length > 0) {
      const ids = msgs.map((m) => m.id).join(",");
      const readData = await api(`message_reads?message_id=in.(${ids})&select=*`);
      const readMap = {};
      readData.forEach((r) => {
        if (!readMap[r.message_id]) readMap[r.message_id] = [];
        readMap[r.message_id].push(r.nickname);
      });
      setReads(readMap);

      const reactData = await api(`message_reactions?message_id=in.(${ids})&select=*`);
      const reactMap = {};
      reactData.forEach((r) => {
        if (!reactMap[r.message_id]) reactMap[r.message_id] = [];
        reactMap[r.message_id].push(r);
      });
      setReactions(reactMap);

      // 自分が既読していないメッセージを既読にする
      const unread = msgs.filter((m) => m.nickname !== nickname && !(readMap[m.id] || []).includes(nickname));
      for (const m of unread) {
        api("message_reads", { method: "POST", body: JSON.stringify({ message_id: m.id, nickname }) }).catch(() => {});
      }
    }
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 1500);
    return () => clearInterval(interval);
  }, [room.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    const saved = await api("messages", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ nickname, content: text, room_id: room.id }) });
    if (saved && saved[0]) {
      seenIds.current.add(saved[0].id);
      setMessages((m) => [...m, saved[0]]);
    }
  };

  const toggleReaction = async (messageId, emoji) => {
    const existing = (reactions[messageId] || []).find((r) => r.nickname === nickname);
    if (existing && existing.emoji === emoji) {
      await api(`message_reactions?message_id=eq.${messageId}&nickname=eq.${encodeURIComponent(nickname)}`, { method: "DELETE" });
    } else {
      await api("message_reactions", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ message_id: messageId, nickname, emoji }),
      });
    }
    setPickerFor(null);
    loadAll();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#9DC8B9" }}>
      <div style={{ background: "#fff", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #eee" }}>
        <ChevronLeft size={24} color="#333" style={{ cursor: "pointer" }} onClick={onBack} />
        <Avatar name={partnerName} size={34} />
        <div style={{ flex: 1, fontWeight: 600, fontSize: 15, color: "#111" }}>{partnerName}</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 10px", display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((m) => {
          const isMe = m.nickname === nickname;
          const isRead = isMe && (reads[m.id] || []).includes(partnerName);
          const msgReactions = reactions[m.id] || [];
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
              <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6, width: "100%" }}>
                {isMe && isRead && <span style={{ fontSize: 10, color: "#5b8def" }}>既読</span>}
                {!isMe && <Avatar name={m.nickname} size={28} />}
                <div
                  onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}
                  style={{
                    maxWidth: "62%",
                    background: isMe ? "#06C755" : "#fff",
                    color: isMe ? "#fff" : "#111",
                    padding: "8px 12px",
                    borderRadius: 16,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: !isMe ? 4 : 16,
                    fontSize: 14.5,
                    lineHeight: 1.4,
                    boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
                    cursor: "pointer",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                </div>
              </div>

              {pickerFor === m.id && (
                <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 20, padding: "4px 8px", marginTop: 4, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                  {REACTIONS.map((e) => (
                    <span key={e} onClick={() => toggleReaction(m.id, e)} style={{ fontSize: 18, cursor: "pointer", padding: 2 }}>
                      {e}
                    </span>
                  ))}
                </div>
              )}

              {msgReactions.length > 0 && (
                <div style={{ display: "flex", gap: 2, marginTop: 2, background: "#fff", borderRadius: 10, padding: "2px 6px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                  {msgReactions.map((r, i) => (
                    <span key={i} style={{ fontSize: 12 }}>{r.emoji}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ background: "#fff", padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 18, padding: "8px 12px", display: "flex", alignItems: "center" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="メッセージを入力"
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14 }}
          />
        </div>
        <div onClick={send} style={{ width: 34, height: 34, borderRadius: "50%", background: input.trim() ? "#06C755" : "#ccc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
          <Send size={15} color="#fff" style={{ marginLeft: -1 }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [nickname, setNickname] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [members, setMembers] = useState([]);

  if (!nickname) return <NicknameGate onSet={setNickname} />;

  if (activeRoom) {
    return <ChatRoom room={activeRoom} nickname={nickname} members={members} onBack={() => setActiveRoom(null)} />;
  }

  return (
    <RoomList
      nickname={nickname}
      onOpen={(room, mem) => {
        setActiveRoom(room);
        setMembers(mem);
      }}
    />
  );
}
