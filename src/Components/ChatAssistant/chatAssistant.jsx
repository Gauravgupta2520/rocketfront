import { useState, useRef, useEffect } from "react";
import "./ChatAssistant.css";

function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBodyRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Error: Please login to use the chat assistant." }
      ]);
      return;
    }

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "https://protien-backend-1.onrender.com"}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Failed to fetch AI response";
        
        if (res.status === 401 || res.status === 403) {
          errorMessage = "Authentication failed. Please login again.";
        } else if (res.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Something went wrong");
      }

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.data || data.reply || "No response received" }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(!open)}>
        💬
      </button>

      {open && (
        <div className="chat-window">
          <div className="chat-header">🥗 AI Health Assistant</div>

          <div className="chat-body" ref={chatBodyRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`msg ${m.role === "user" ? "user-msg" : "ai-msg"}`}
              >
                {m.content}
              </div>
            ))}
            {loading && <div className="msg ai-msg">Typing...</div>}
          </div>

          <div className="chat-footer">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={e => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button className="send-btn" onClick={sendMessage} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatAssistant;
