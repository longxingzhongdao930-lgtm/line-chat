import { useState, useEffect, useRef } from "react";
import { Send, ChevronLeft, Plus, Users, Image as ImageIcon, Settings, Volume2, VolumeX, EyeOff, Eye, Trash2 } from "lucide-react";

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

function playNotifySound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // 無視
  }
}

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
        style={{ width: "80%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 16, outline: "none" }}
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

function SettingsPanel({ nickname, settings, onChangeSettings, onDeleteAccount, onClose }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", width: "100%", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: "20px 18px 28px" }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: "#111" }}>設定</div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {settings.notification_sound ? <Volume2 size={19} color="#333" /> : <VolumeX size={19} color="#999" />}
            <span style={{ fontSize: 15, color: "#111" }}>通知音</span>
          </div>
          <div
            onClick={() => onChangeSettings({ ...settings, notification_sound: !settings.notification_sound })}
            style={{ width: 44, height: 26, borderRadius: 13, background: settings.notification_sound ? "#06C755" : "#ddd", position: "relative", cursor: "pointer" }}
          >
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: settings.notification_sound ? 20 : 2, transition: "left 0.15s" }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {settings.hide_read ? <EyeOff size={19} color="#999" /> : <Eye size={19} color="#333" />}
            <div>
              <div style={{ fontSize: 15, color: "#111" }}>既読をつけない</div>
              <div style={{ fontSize: 11, color: "#999" }}>相手に既読が表示されなくなります</div>
            </div>
          </div>
          <div
            onClick={() => onChangeSettings({ ...settings, hide_read: !settings.hide_read })}
            style={{ width: 44, height: 26, borderRadius: 13, background: settings.hide_read ? "#06C755" : "#ddd", position: "relative", cursor: "pointer", flexShrink: 0 }}
          >
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: settings.hide_read ? 20 : 2, transition: "left 0.15s" }} />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #F45B69", background: "#fff", color: "#F45B69", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Trash2 size={16} /> アカウントを削除
            </button>
          ) : (
            <div style={{ background: "#fff5f5", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, color: "#c33", marginBottom: 10 }}>
                本当に削除しますか?トーク履歴・メッセージが全て消え、元に戻せません。
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirming(false)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", fontSize: 13 }}>
                  キャンセル
                </button>
                <button onClick={onDeleteAccount} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#F45B69", color: "#fff", fontSize: 13, fontWeight: 600 }}>
                  削除する
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function RoomList({ nickname, settings, onChangeSettings, onDeleteAccount, onOpen }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div onClick={() => setShowSettings(true)} style={{ cursor: "pointer" }}>
            <Settings size={20} color="#666" />
          </div>
          <div onClick={() => setShowNew(true)} style={{ cursor: "pointer" }}>
            <Plus size={22} color="#06C755" />
          </div>
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
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16 }}
            />
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              placeholder={isGroup ? "相手をカンマ区切りで(例: たろう, はなこ)" : "相手のニックネーム"}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16 }}
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
                  {r.lastMsg ? (r.lastMsg.image_url ? `${r.is_group ? r.lastMsg.nickname + ": " : ""}📷 画像` : `${r.is_group ? r.lastMsg.nickname + ": " : ""}${r.lastMsg.content}`) : "メッセージはまだありません"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showSettings && (
        <SettingsPanel
          nickname={nickname}
          settings={settings}
          onChangeSettings={onChangeSettings}
          onDeleteAccount={onDeleteAccount}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
function ChatRoom({ room, nickname, members, settings, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [reads, setReads] = useState({});
  const [reactions, setReactions] = useState({});
  const [pickerFor, setPickerFor] = useState(null);
  const bottomRef = useRef(null);
  const seenIds = useRef(new Set());
  const firstLoad = useRef(true);
  const otherMembers = members.filter((m) => m !== nickname);
  const headerName = room.is_group ? room.name : otherMembers[0] || "?";

  const loadAll = async () => {
    const msgs = await api(`messages?room_id=eq.${room.id}&select=*&order=created_at.asc&limit=200`);

    if (!firstLoad.current) {
      const newOnes = msgs.filter((m) => !seenIds.current.has(m.id) && m.nickname !== nickname);
      if (newOnes.length > 0 && settings.notification_sound) {
        playNotifySound();
      }
    }
    firstLoad.current = false;

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

      if (!settings.hide_read) {
        const unread = msgs.filter((m) => m.nickname !== nickname && !(readMap[m.id] || []).includes(nickname));
        for (const m of unread) {
          api("message_reads", { method: "POST", body: JSON.stringify({ message_id: m.id, nickname }) }).catch(() => {});
        }
      }
    }
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 1500);
    return () => clearInterval(interval);
  }, [room.id, settings.hide_read, settings.notification_sound]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendImage = async (file) => {
    const fileName = `${Date.now()}_${file.name}`;
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/chat-images/${fileName}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: file,
    });
    if (!uploadRes.ok) {
      alert("画像のアップロードに失敗しました");
      return;
    }
    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/chat-images/${fileName}`;
    const saved = await api("messages", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ nickname, content: "", image_url: imageUrl, room_id: room.id }),
    });
    if (saved && saved[0]) {
      seenIds.current.add(saved[0].id);
      setMessages((m) => [...m, saved[0]]);
    }
  };

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

  const readCountFor = (messageId) => {
    const readers = (reads[messageId] || []).filter((n) => n !== nickname && otherMembers.includes(n));
    return readers.length;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#9DC8B9" }}>
      <div style={{ background: "#fff", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #eee" }}>
        <ChevronLeft size={24} color="#333" style={{ cursor: "pointer" }} onClick={onBack} />
        {room.is_group ? (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#5B8DEF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={16} color="#fff" />
          </div>
        ) : (
          <Avatar name={headerName} size={34} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#111" }}>{headerName}</div>
          {room.is_group && <div style={{ fontSize: 11, color: "#999" }}>{members.join("、")}</div>}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 10px", display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((m) => {
          const isMe = m.nickname === nickname;
          const readCount = isMe ? readCountFor(m.id) : 0;
          const msgReactions = reactions[m.id] || [];
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
              {room.is_group && !isMe && (
                <div style={{ fontSize: 11, color: "#e8f5e9", marginBottom: 2, marginLeft: 36 }}>{m.nickname}</div>
              )}
              <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6, width: "100%" }}>
                {isMe && readCount > 0 && (
                  <span style={{ fontSize: 10, color: "#5b8def" }}>
                    {room.is_group ? `既読${readCount}` : "既読"}
                  </span>
                )}
                {!isMe && <Avatar name={m.nickname} size={28} />}
                <div
                  onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}
                  style={{
                    maxWidth: "62%",
                    background: isMe ? "#06C755" : "#fff",
                    color: isMe ? "#fff" : "#111",
                    padding: m.image_url ? 4 : "8px 12px",
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
                  {m.image_url ? (
                    <img src={m.image_url} alt="" style={{ maxWidth: "100%", borderRadius: 12, display: "block" }} />
                  ) : (
                    m.content
                  )}
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
        <label style={{ cursor: "pointer", flexShrink: 0 }}>
          <ImageIcon size={22} color="#666" />
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files[0]) sendImage(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
        <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 18, padding: "8px 12px", display: "flex", alignItems: "center" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="メッセージを入力"
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 16 }}
          />
        </div>
        <div onClick={send} style={{ width: 34, height: 34, borderRadius: "50%", background: input.trim() ? "#06C755" : "#ccc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
          <Send size={15} color="#fff" style={{ marginLeft: -1 }} />
        </div>
      </div>
    </div>
  );
}
const DEFAULT_SETTINGS = { notification_sound: true, hide_read: false };

export default function App() {
  const [nickname, setNickname] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!nickname) return;
    api(`user_settings?nickname=eq.${encodeURIComponent(nickname)}`)
      .then((rows) => {
        if (rows[0]) {
          setSettings({ notification_sound: rows[0].notification_sound, hide_read: !!rows[0].hide_read });
        } else {
          api("user_settings", { method: "POST", body: JSON.stringify({ nickname, notification_sound: true }) }).catch(() => {});
        }
      })
      .catch(() => {});
  }, [nickname]);

  const changeSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      await api(`user_settings?nickname=eq.${encodeURIComponent(nickname)}`, {
        method: "PATCH",
        body: JSON.stringify({ notification_sound: newSettings.notification_sound, hide_read: newSettings.hide_read }),
      });
    } catch (e) {
      api(`user_settings?nickname=eq.${encodeURIComponent(nickname)}`, {
        method: "PATCH",
        body: JSON.stringify({ notification_sound: newSettings.notification_sound }),
      }).catch(() => {});
    }
  };

  const deleteAccount = async () => {
    try {
      const myMsgs = await api(`messages?nickname=eq.${encodeURIComponent(nickname)}&select=id`);
      const msgIds = myMsgs.map((m) => m.id);
      if (msgIds.length > 0) {
        await api(`message_reactions?message_id=in.(${msgIds.join(",")})`, { method: "DELETE" });
        await api(`message_reads?message_id=in.(${msgIds.join(",")})`, { method: "DELETE" });
      }
      await api(`message_reads?nickname=eq.${encodeURIComponent(nickname)}`, { method: "DELETE" });
      await api(`message_reactions?nickname=eq.${encodeURIComponent(nickname)}`, { method: "DELETE" });
      await api(`messages?nickname=eq.${encodeURIComponent(nickname)}`, { method: "DELETE" });
      await api(`room_members?nickname=eq.${encodeURIComponent(nickname)}`, { method: "DELETE" });
      await api(`user_settings?nickname=eq.${encodeURIComponent(nickname)}`, { method: "DELETE" });
    } catch (e) {
      console.error(e);
    }
    setNickname(null);
    setActiveRoom(null);
    setSettings(DEFAULT_SETTINGS);
  };

  if (!nickname) return <NicknameGate onSet={setNickname} />;

  if (activeRoom) {
    return <ChatRoom room={activeRoom} nickname={nickname} members={members} settings={settings} onBack={() => setActiveRoom(null)} />;
  }

  return (
    <RoomList
      nickname={nickname}
      settings={settings}
      onChangeSettings={changeSettings}
      onDeleteAccount={deleteAccount}
      onOpen={(room, mem) => {
        setActiveRoom(room);
        setMembers(mem);
      }}
    />
  );
}
