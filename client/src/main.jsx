import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import "./style.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
const ROOMS = [
  { id: "general", name: "General", icon: "💬", description: "Everyday conversation" },
  { id: "tech", name: "Tech Discussion", icon: "⚡", description: "Code, tools and ideas" },
];

function App() {
  const [username, setUsername] = useState(() => localStorage.getItem("sprint12_name") || "");
  const [nameDraft, setNameDraft] = useState("");
  const [activeRoom, setActiveRoom] = useState("general");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const typingTimer = useRef(null);
  const activeRoomRef = useRef(activeRoom);
  activeRoomRef.current = activeRoom;

  const userId = useMemo(() => {
    let id = localStorage.getItem("sprint12_user_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("sprint12_user_id", id);
    }
    return id;
  }, []);

  useEffect(() => {
    if (!username) return undefined;
    const socket = io(SERVER_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", { room: activeRoomRef.current, userId, username });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {
      setConnected(false);
      setError("Can't connect to the chat server. Check the backend deployment and VITE_SERVER_URL.");
    });
    socket.on("room-joined", () => setError(""));
    socket.on("app-error", (payload) => setError(payload?.message || "Something went wrong."));
    socket.on("chat-message", (message) => {
      if (message.room === activeRoomRef.current) setMessages((current) => [...current, message]);
    });
    socket.on("system-message", (message) => {
      if (message.room === activeRoomRef.current) setMessages((current) => [...current, { ...message, system: true }]);
    });
    socket.on("typing", (payload) => {
      setTypingUsers((current) => payload.isTyping
        ? [...current.filter((user) => user.socketId !== payload.socketId), payload]
        : current.filter((user) => user.socketId !== payload.socketId));
    });

    return () => {
      clearTimeout(typingTimer.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [username, userId]);

  useEffect(() => {
    setMessages([]);
    setTypingUsers([]);
    setText("");
    const socket = socketRef.current;
    if (username && socket?.connected) socket.emit("join-room", { room: activeRoom, userId, username });
  }, [activeRoom, username, userId]);

  const joinWorkspace = (event) => {
    event.preventDefault();
    const name = nameDraft.trim().replace(/\s+/g, " ").slice(0, 32);
    if (!name) return;
    localStorage.setItem("sprint12_name", name);
    setUsername(name);
    setError("");
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const message = text.trim();
    const socket = socketRef.current;
    if (!message || !socket?.connected) {
      if (!socket?.connected) setError("Chat server is not connected yet.");
      return;
    }
    socket.emit("typing", { room: activeRoom, isTyping: false });
    socket.emit("chat-message", { room: activeRoom, text: message });
    setText("");
  };

  const handleTyping = (value) => {
    setText(value);
    const socket = socketRef.current;
    if (!socket?.connected) return;
    socket.emit("typing", { room: activeRoom, isTyping: value.trim().length > 0 });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit("typing", { room: activeRoom, isTyping: false }), 1000);
  };

  const currentRoom = ROOMS.find((room) => room.id === activeRoom) || ROOMS[0];

  if (!username) {
    return (
      <main className="auth">
        <section className="auth-card">
          <div className="logo">⚡</div>
          <p className="eyebrow">PRODESK IT · WEEK 12</p>
          <h1>Real-Time Workspace</h1>
          <p className="auth-copy">A live team chat built with React, Node.js and Socket.IO. Choose a display name to join the conversation.</p>
          <form onSubmit={joinWorkspace}>
            <label htmlFor="display-name">Your display name</label>
            <input id="display-name" autoFocus maxLength={32} value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder="e.g. Harsh" required />
            <button type="submit">Join workspace <span>→</span></button>
          </form>
          <div className="feature-pills"><span>● Live messaging</span><span>● Typing status</span><span>● Private rooms</span></div>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Prodesk workspace home"><span className="brand-mark">⚡</span><span>Prodesk<span className="brand-light"> chat</span></span></a>
        <div className="workspace-label">WORKSPACE <span>WEEK 12</span></div>
        <p className="section-label">CHANNELS <span>2</span></p>
        <nav className="room-list" aria-label="Chat rooms">
          {ROOMS.map((room) => (
            <button type="button" key={room.id} onClick={() => setActiveRoom(room.id)} className={"room " + (activeRoom === room.id ? "active" : "")} aria-current={activeRoom === room.id ? "page" : undefined}>
              <span className="room-icon">{room.icon}</span>
              <span className="room-copy"><strong>{room.name}</strong><small>{room.description}</small></span>
              {activeRoom === room.id && <span className="room-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note"><span>🔒</span><p><strong>Room isolation enabled</strong><small>Messages are delivered only to the selected channel.</small></p></div>
        <div className="user-card">
          <div className="avatar">{username.charAt(0).toUpperCase()}</div>
          <div className="user-details"><strong>{username}</strong><small>Session {userId.slice(0, 8)}</small></div>
          <span className={"connection-dot " + (connected ? "online" : "")} title={connected ? "Connected" : "Disconnected"} />
          <button className="change-user" type="button" title="Change display name" onClick={() => { localStorage.removeItem("sprint12_name"); setUsername(""); setNameDraft(""); }}>↗</button>
        </div>
      </aside>

      <section className="chat">
        <header className="chat-header">
          <div className="room-heading"><span className="heading-icon">{currentRoom.icon}</span><div><h1>{currentRoom.name}</h1><p>{currentRoom.description}</p></div></div>
          <div className={"status-pill " + (connected ? "is-connected" : "")}><span />{connected ? "Live connection" : "Reconnecting…"}</div>
        </header>
        <div className="chat-intro"><div className="intro-icon">#</div><div><strong>Welcome to #{activeRoom}</strong><p>This is the beginning of the conversation in this channel.</p></div></div>
        <div className="messages" aria-live="polite" aria-label="Chat messages">
          {messages.length === 0 ? (
            <div className="empty-state"><div>✦</div><strong>Start the conversation</strong><p>Open this app in another browser tab with a different name to test real-time messaging.</p></div>
          ) : messages.map((message) => message.system ? (
            <div className="system-message" key={message.id}><span />{message.text}</div>
          ) : (
            <article className={"message " + (message.userId === userId ? "mine" : "")} key={message.id}>
              <div className="message-avatar">{message.username.charAt(0).toUpperCase()}</div>
              <div className="message-content"><div className="message-meta"><strong>{message.username}</strong><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>{message.userId === userId && <span className="you-label">YOU</span>}</div><p>{message.text}</p></div>
            </article>
          ))}
        </div>
        <div className="typing-line" aria-live="polite">{typingUsers.length > 0 ? <><span className="typing-dots"><i /><i /><i /></span>{typingUsers.map((user) => user.username).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…</> : " "}</div>
        {error && <div className="error-banner" role="status">{error}</div>}
        <form className="composer" onSubmit={sendMessage}>
          <input value={text} onChange={(event) => handleTyping(event.target.value)} placeholder={"Message #" + activeRoom} aria-label="Message" maxLength={2000} />
          <span className="composer-hint">Enter to send</span>
          <button type="submit" disabled={!text.trim() || !connected} aria-label="Send message">Send <span>↗</span></button>
        </form>
        <footer className="chat-footer"><span>⚡ Powered by Socket.IO</span><span>Prodesk IT · Sprint 12</span></footer>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
