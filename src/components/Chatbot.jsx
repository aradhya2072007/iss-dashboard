import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage, getChatHistory, saveChatHistory, clearChatHistory } from '../services/chatService';

const Chatbot = ({ issData, newsData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => getChatHistory());
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    saveChatHistory(updated);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await sendMessage(text, issData, newsData);
      const botMsg = { role: 'bot', content: reply, timestamp: Date.now() };
      const withReply = [...updated, botMsg];
      setMessages(withReply);
      saveChatHistory(withReply);
    } catch {
      const errMsg = { role: 'bot', content: 'Sorry, something went wrong.', timestamp: Date.now() };
      setMessages([...updated, errMsg]);
      saveChatHistory([...updated, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    clearChatHistory();
  };

  return (
    <>
      {/* Floating FAB Button */}
      <button
        id="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white cursor-pointer transition-all duration-300 hover:scale-110"
        style={{
          background: 'var(--coral)',
          boxShadow: '0 4px 16px rgba(232,115,90,0.4)',
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className="fixed z-50"
          style={{
            bottom: '88px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 48px)',
            maxHeight: 'calc(100vh - 120px)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'chatSlideUp 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>AI Assistant</h3>
            <button
              onClick={handleClear}
              className="px-4 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition hover:opacity-80"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3" style={{ minHeight: '200px', maxHeight: '340px' }}>
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Ask about ISS, speed, or loaded news.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] px-4 py-2.5 text-sm leading-relaxed"
                  style={msg.role === 'user'
                    ? {
                        background: 'var(--coral-light)',
                        color: 'var(--text-primary)',
                        borderRadius: '16px 16px 4px 16px',
                      }
                    : {
                        background: 'var(--blue-light)',
                        color: 'var(--text-primary)',
                        borderRadius: '16px 16px 16px 4px',
                      }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-2.5 text-sm italic"
                  style={{
                    background: 'var(--blue-light)',
                    color: 'var(--text-muted)',
                    borderRadius: '16px 16px 16px 4px',
                  }}
                >
                  Assistant is typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask from dashboard data only"
                disabled={isTyping}
                className="flex-1 px-4 py-2.5 rounded-full text-sm border"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="px-5 py-2.5 rounded-full text-sm font-medium border cursor-pointer transition hover:opacity-90 disabled:opacity-40"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default Chatbot;
