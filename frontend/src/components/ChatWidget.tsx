import { useEffect, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { fetchChatHistory, sendChatMessage } from "../api/chat";
import type { ChatTurn } from "../api/chat";
import { useAuth } from "../auth/AuthContext";
import { usePageContext } from "../pageContext/PageContextContext";
import { useChatResults } from "../search/ChatResultsContext";
import yaleY from "../assets/yale-y.png";
import yaleBulldog from "../assets/yale-bulldog.png";
import "./ChatWidget.css";

const WELCOME: ChatTurn = {
  role: "assistant",
  content: "Hi! I'm the Campus Customs shop assistant. Ask me about products, sizes, or stock.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([WELCOME]);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const { showResults } = useChatResults();
  const { user } = useAuth();
  const { viewedProduct } = usePageContext();

  // Reload this shopper's saved conversation whenever who's logged in
  // changes (login, logout, or switching accounts) -- guests always just
  // start fresh since nothing was ever saved for them.
  useEffect(() => {
    setSuggestedReplies([]);
    if (!user) {
      setMessages([WELCOME]);
      return;
    }
    fetchChatHistory(user.id)
      .then((history) => setMessages(history.length > 0 ? history : [WELCOME]))
      .catch(() => setMessages([WELCOME]));
  }, [user]);

  async function submitMessage(text: string) {
    if (!text || sending) return;

    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSuggestedReplies([]);
    setDraft("");
    setSending(true);

    try {
      const pageContext = viewedProduct
        ? { product_id: viewedProduct.productId, product_name: viewedProduct.productName }
        : null;
      const { reply, products, suggested_replies } = await sendChatMessage(
        text,
        history,
        user?.id ?? null,
        pageContext
      );
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setSuggestedReplies(suggested_replies);
      // Matching products show up as full cards on the page itself (see
      // ChatResultsPanel), not just as text in the chat bubble.
      if (products.length > 0) showResults(text, products);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't reach the shop assistant. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submitMessage(draft.trim());
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span className="chat-header-title">
              <img src={yaleY} className="chat-header-mark" alt="" />
              Campus Customs Chat
            </span>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ))}
            {sending && <div className="chat-bubble assistant chat-typing">Thinking…</div>}
            {!sending && suggestedReplies.length > 0 && (
              <div className="chat-suggestions">
                {suggestedReplies.map((suggestion) => (
                  <button key={suggestion} className="chat-suggestion-chip" onClick={() => submitMessage(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form className="chat-input-row" onSubmit={handleSubmit}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about a product..."
              aria-label="Chat message"
              disabled={sending}
            />
            <button type="submit" disabled={sending}>
              Send
            </button>
          </form>
        </div>
      )}
      <div className="chat-launcher">
        {!open && <span className="chat-launcher-label">Chat with us</span>}
        <button
          className="chat-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Chat with our Yale bulldog shop assistant"}
        >
          {open ? (
            "×"
          ) : (
            <>
              <span className="chat-toggle-img-wrap">
                <img src={yaleBulldog} className="chat-toggle-dog" alt="" />
              </span>
              <span className="chat-toggle-badge" aria-hidden="true">
                💬
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
