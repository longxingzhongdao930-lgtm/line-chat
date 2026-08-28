import { useState, useEffect, useRef } from "react";
import { Send, ChevronLeft, Plus, Users } from "lucide-react";

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
  const [isGroup, setIsGroup] = useState(false);
  const [partner, setPartner] = useState("");
  const [groupName, setGroupName] = useState("");

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
          const all = mem.map((m) => m.nickname);
          const others = all.filter((n) => n !== nickname);
          const lastMsg = await api(`messages?room_id=eq.${r.id}&select=*&order=created_at.desc&limit=1`);
          return { ...r, others, allMembers: all, lastMsg: lastMsg[0] || null };
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
    if (isGroup) {
      const others = partner.split(",").map((s) => s.trim()).filter(Boolean);
      if (others.length < 2) {
        alert("グループは相手を2人以上、カンマ区切りで入力してください");
        return;
      }
      const allMembers = [nickname, ...others];
      const name = groupName.trim() || allMembers.join("、");
      const created = await api("rooms", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ name, is_group: true }) });
      const room = created[0];
      await api("room_members", { method: "POST", body: JSON.stringify(allMembers.map((n) => ({ room_id: room.id, nickname: n }))) });
      setShowNew(false);
      setPartner("");
      setGroupName("");
      onOpen(room, allMembers);
    } else {
      if (!partner.trim()) return;
      const roomName = [nickname, partner.trim()].sort().join("_");
      const existing = await api(`rooms?name=eq.${encodeURIComponent(roomName)}&is_group=eq.false`);
      let room;
      if (existing.length > 0) {
        room = existing[0];
      } else {
        const created = await api("rooms", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ name: roomName, is_group: false }) });
        room = created[0];
        await api("room_members", { method: "POST", body: JSON.stringify([{ room_id: room.id, nickname }, { room_id: room.id, nickname: partner.trim() }]) });
      }
      setShowNew(false);
      setPartner("");
      onOpen(room, [nickname, partner.trim()]);
    }
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
        <div style={{ padding: 14, borderBottom: "1px solid #f0f0f0", background: "#f9f9f9", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setIsGroup(false)}
              style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: isGroup ? "1px solid #ddd" : "2px solid #06C755", background: isGroup ? "#fff" : "#e9f9ee", fontSize: 13, fontWeight: 600, color: "#111" }}
            >
              1対1
            </button>
            <button
              onClick={() => setIsGroup(true)}
              style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: isGroup ? "2px solid #06C755" : "1px solid #ddd", background: isGroup ? "#e9f9ee" : "#fff", fontSize: 13, fontWeight: 600, color: "#111" }}
            >
              グループ
            </button>
          </div>

          {isGroup && (
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="グループ名(省略可)"
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
            />
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              placeholder={isGroup ? "相手をカンマ区切りで(例: たろう, はなこ)" : "相手のニックネーム"}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
              onKeyDown={(e) => e.key === "Enter" && createRoom()}
            />
            <button onClick={createRoom} style={{ background: "#06C755", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 14 }}>
              開始
            </button>
          </div>
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
          const displayName = r.is_group ? r.name : r.others[0] || "?";
          return (
            <div
              key={r.id}
              onClick={() => onOpen(r, r.allMembers)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f7f7f7" }}
            >
              {r.is_group ? (
                <div style={{ width: 44, height: 44, borderRadius: 14, background: "#5B8DEF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Users size={20} color="#fff" />
                </div>
              ) : (
                <Avatar name={displayName} size={44} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#111" }}>{displayName}</div>
                <div style={{ fontSize: 13, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.lastMsg ? `${r.is_group ? r.lastMsg.nickname + ": " : ""}${r.lastMsg.content}` : "メッセージはまだありません"}
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
  const otherMembers = members.filter((m) => m !== nickname);
  const headerName = room.is_group ? room.name : otherMembers[0] || "?";

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
    const saved = await api("messages", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ n
