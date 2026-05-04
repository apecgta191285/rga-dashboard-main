import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  requestId?: string; // Track which request this came from
}

interface ChatbotProps {
  webhookUrl?: string;
  buttonSize?: 'default' | 'small';
}

const ROLE_OPTIONS = [
  { id: 'general', label: 'ทั่วไป' },
  { id: 'ads', label: 'Ads' },
  { id: 'seo', label: 'SEO' },
  { id: 'social', label: 'Social' },
  { id: 'strategy', label: 'Strategy' },
] as const;

type RoleId = (typeof ROLE_OPTIONS)[number]['id'];

// Simple UUID generator (lightweight alternative)
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const ChatbotWidget: React.FC<ChatbotProps> = ({ webhookUrl, buttonSize = 'default' }) => {
  const { user } = useAuthStore();
  const DEBUG = import.meta.env.MODE === 'development';
  const logger = (tag: string, message: any, data?: any) => {
    if (DEBUG) {
      console.log(`[ChatbotWidget] ${tag}: ${message}`, data || '');
    }
  };

  const defaultGeneralWebhook = 'https://suttipatrga1.app.n8n.cloud/webhook/chat-general';
  const defaultSeoWebhook = 'https://suttipatrga1.app.n8n.cloud/webhook/chat-seo';
  const defaultFallbackWebhook = 'https://suttipatrga1.app.n8n.cloud/webhook/chat-general';

  const generalWebhookUrl =
    (typeof import.meta !== 'undefined' ? import.meta.env.VITE_CHATBOT_WEBHOOK_URL_GENERAL : '') ||
    defaultGeneralWebhook;

  const seoWebhookUrl =
    (typeof import.meta !== 'undefined' ? import.meta.env.VITE_CHATBOT_WEBHOOK_URL_SEO : '') ||
    defaultSeoWebhook;

  const globalWebhookUrl =
    webhookUrl ||
    (typeof import.meta !== 'undefined' ? import.meta.env.VITE_CHATBOT_WEBHOOK_URL : '');

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeRole, setActiveRole] = useState<RoleId>('general');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  const resolvedWebhookUrl =
    activeRole === 'general'
      ? generalWebhookUrl
      : activeRole === 'seo'
      ? seoWebhookUrl
      : globalWebhookUrl || defaultFallbackWebhook;

  const appendMessage = (newMsg: Message) => {
    setMessages((prev) => {
      const newText = newMsg.text.trim();

      // If this is a bot response and the same text already exists, keep only first occurrence.
      // This guarantees that the exact same bot answer will never repeat.
      if (!newMsg.isUser) {
        const alreadyHasSame = prev.some(
          (m) => !m.isUser && m.text.trim() === newText
        );
        if (alreadyHasSame) {
          logger('DEDUPE', 'Prevented duplicate bot message', { text: newText, requestId: newMsg.requestId });
          return prev;
        }
      }

      // For user message, still prevent exact consecutive duplicate to avoid accidental double-submit.
      const last = prev[prev.length - 1];
      if (last && last.isUser === newMsg.isUser && last.text.trim() === newText) {
        logger('DEDUPE', 'Prevented consecutive duplicate', { text: newText, isUser: newMsg.isUser });
        return prev;
      }

      logger('APPEND', 'Adding new message', { id: newMsg.id, text: newText, isUser: newMsg.isUser, requestId: newMsg.requestId });
      return [...prev, newMsg];
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log('[ChatbotWidget] Resolved webhook URL:', resolvedWebhookUrl || '(empty)');
    }
  }, [resolvedWebhookUrl, activeRole, generalWebhookUrl, seoWebhookUrl, globalWebhookUrl]);

  const sendMessage = async () => {
    if (isSendingRef.current || !input.trim()) return;

    const requestId = generateId();
    logger('SEND', 'Starting new request', { requestId, input: input.trim(), role: activeRole });

    if (!resolvedWebhookUrl) {
      const botMsg: Message = {
        id: generateId(),
        text: 'Webhook is not configured. Please set VITE_CHATBOT_WEBHOOK_URL.',
        isUser: false,
        requestId,
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    const userMsg: Message = {
      id: generateId(),
      text: input,
      isUser: true,
      requestId,
    };

    appendMessage(userMsg);
    setInput('');
    isSendingRef.current = true;
    setIsSending(true);
    setIsTyping(true);

    try {
      // Build request body based on active role
      let requestBody: any = {
        timestamp: new Date().toISOString(),
      };

      if (activeRole === 'general' || activeRole === 'seo') {
        // For chat-general and chat-seo, send tenant_id and question
        requestBody.tenant_id = user?.tenantId || 'default_tenant';
        requestBody.question = input;
      } else {
        // For other roles, use the default message format
        requestBody.message = input;
        requestBody.role = activeRole;
      }

      const response = await fetch(resolvedWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      logger('RESPONSE', 'Received response', { requestId, status: response.status, contentType: response.headers.get('content-type') });

      const contentType = response.headers.get('content-type') || '';
      let botText = '';

      if (contentType.includes('application/json')) {
        const data = await response.json();
        logger('PARSE', 'Parsed JSON response', { requestId, data });
        if (!response.ok) {
          throw new Error(data?.error || data?.message || `HTTP ${response.status}`);
        }

        // Support multiple formats:
        // - {reply: string}
        // - {reply: [string]}
        // - {response: string}
        // - [{message: string}]
        // - array of simple strings
        if (Array.isArray(data)) {
          if (
            data.length > 0 &&
            data.every(
              (item) =>
                item &&
                typeof item === 'object' &&
                (item.hasOwnProperty('message') || item.hasOwnProperty('reply') || item.hasOwnProperty('response') || item.hasOwnProperty('output'))
            )
          ) {
            botText = data
              .map((item: any) => item.message || item.reply || item.response || item.output || '')
              .filter(Boolean)
              .join('\n');
          } else {
            botText = data
              .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
              .join('\n');
          }
        } else if (Array.isArray(data.reply)) {
          botText = data.reply.join('\n');
        } else {
          botText = data.reply || data.response || data.message || data.output || '';
        }
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || `HTTP ${response.status}`);
        }
        botText = text;
      }

      // Normalize to a single string message
      if (Array.isArray(botText)) {
        botText = botText
          .map((item) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
              return item.message || item.reply || item.response || item.output || JSON.stringify(item);
            }
            return String(item);
          })
          .filter(Boolean)
          .join(' ');
      }

      if (botText && typeof botText === 'object') {
        botText = JSON.stringify(botText);
      }

      botText = (botText || 'ได้รับข้อความแล้วค่ะ').toString().replace(/\s+/g, ' ').trim();

      logger('FINALIZE', 'Final bot text', { requestId, botText });

      const botMsg: Message = {
        id: generateId(),
        text: botText,
        isUser: false,
        requestId,
      };

      appendMessage(botMsg);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger('ERROR', 'Request failed', { requestId, error: errorMessage });
      const errorMsg: Message = {
        id: generateId(),
        text: 'ขออภัย เกิดข้อผิดพลาด',
        isUser: false,
        requestId,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
      setIsTyping(false);
      logger('COMPLETE', 'Request finished', { requestId });
    }
  };

  return (
    <>
      <style>{`
        .chatbot-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .chatbot-btn:hover {
          transform: scale(1.1);
        }
        .chatbot-btn svg {
          width: 28px;
          height: 28px;
          fill: white;
        }
        .chatbot-btn[data-size='small'] {
          width: 44px;
          height: 44px;
          bottom: 1.25rem;
          right: 1.25rem;
        }
        .chatbot-btn[data-size='small'] svg {
          width: 20px;
          height: 20px;
        }
        .chatbot-panel {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 380px;
          height: 550px;
          background: #1e293b;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          z-index: 9998;
          display: flex;
          flex-direction: column;
          opacity: 0;
          pointer-events: none;
          transform: translateY(20px);
          transition: all 0.3s;
        }
        .chatbot-panel.open {
          opacity: 1;
          pointer-events: all;
          transform: translateY(0);
        }
        .chatbot-panel[data-size='small'] {
          bottom: 1.25rem;
          right: 1.25rem;
        }
        .chatbot-header {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          padding: 1rem 1.25rem;
          border-radius: 16px 16px 0 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .chatbot-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chatbot-header h3 {
          margin: 0;
          color: white;
          font-size: 1rem;
          font-weight: 600;
        }
        .chatbot-roles {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .chatbot-role {
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
          border-radius: 999px;
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chatbot-role:hover {
          background: rgba(255, 255, 255, 0.28);
        }
        .chatbot-role.active {
          background: #ffffff;
          color: #14532d;
          border-color: #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .chatbot-close {
          background: rgba(255,255,255,0.2);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chatbot-close:hover {
          background: rgba(255,255,255,0.3);
        }
        .chatbot-close svg {
          width: 18px;
          height: 18px;
          fill: white;
        }
        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .chatbot-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chatbot-messages::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
        .chatbot-msg {
          display: flex;
          gap: 0.5rem;
          animation: slideIn 0.3s;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chatbot-msg.user {
          flex-direction: row-reverse;
        }
        .chatbot-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .chatbot-msg.bot .chatbot-avatar {
          background: linear-gradient(135deg, #22c55e, #16a34a);
        }
        .chatbot-msg.user .chatbot-avatar {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        .chatbot-bubble {
          max-width: 70%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        .chatbot-msg.bot .chatbot-bubble {
          background: #334155;
          color: #e2e8f0;
        }
        .chatbot-msg.user .chatbot-bubble {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }
        .chatbot-typing {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .chatbot-typing-dots {
          display: flex;
          gap: 4px;
          padding: 0.75rem 1rem;
          background: #334155;
          border-radius: 12px;
        }
        .chatbot-typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          animation: typing 1.4s infinite;
        }
        .chatbot-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .chatbot-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
        .chatbot-input-box {
          padding: 1rem;
          border-top: 1px solid #334155;
          display: flex;
          gap: 0.5rem;
        }
        .chatbot-input {
          flex: 1;
          background: #334155;
          border: 1px solid #475569;
          border-radius: 8px;
          padding: 0.75rem;
          color: #e2e8f0;
          font-size: 0.9rem;
          outline: none;
        }
        .chatbot-input:focus {
          border-color: #22c55e;
        }
        .chatbot-input::placeholder {
          color: #94a3b8;
        }
        .chatbot-send {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chatbot-send:hover:not(:disabled) {
          transform: scale(1.05);
        }
        .chatbot-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .chatbot-send svg {
          width: 18px;
          height: 18px;
          fill: white;
        }
        .chatbot-welcome {
          text-align: center;
          padding: 2rem 1rem;
          color: #94a3b8;
        }
        .chatbot-welcome h4 {
          color: #e2e8f0;
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
        }
        @media (max-width: 768px) {
          .chatbot-panel {
            width: calc(100vw - 2rem);
            height: calc(100vh - 2rem);
            bottom: 1rem;
            right: 1rem;
          }
        }
      `}</style>

      {/* ปุ่มแชท */}
      <button
        className="chatbot-btn"
        data-size={buttonSize}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chat"
      >
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      </button>

      {/* แผงแชท */}
      <div className={`chatbot-panel ${isOpen ? 'open' : ''}`} data-size={buttonSize}>
        <div className="chatbot-header">
          <div className="chatbot-header-row">
            <h3>💬 Chat</h3>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              <svg viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div className="chatbot-roles">
            {ROLE_OPTIONS.map((role) => (
              <button
                key={role.id}
                type="button"
                className={`chatbot-role ${activeRole === role.id ? 'active' : ''}`}
                onClick={() => setActiveRole(role.id)}
                aria-pressed={activeRole === role.id}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.length === 0 ? (
            <div className="chatbot-welcome">
              <h4>👋 สวัสดีค่ะ</h4>
              <p>มีอะไรให้ช่วยไหมคะ?</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`chatbot-msg ${msg.isUser ? 'user' : 'bot'}`}>
                <div className="chatbot-avatar">{msg.isUser ? '👤' : '🤖'}</div>
                <div className="chatbot-bubble">{msg.text}</div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="chatbot-typing">
              <div className="chatbot-avatar">🤖</div>
              <div className="chatbot-typing-dots">
                <div className="chatbot-typing-dot"></div>
                <div className="chatbot-typing-dot"></div>
                <div className="chatbot-typing-dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-box">
          <input
            className="chatbot-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="พิมพ์ข้อความ..."
            disabled={isSending || isTyping}
          />
          <button
            className="chatbot-send"
            onClick={sendMessage}
            disabled={!input.trim() || isSending || isTyping}
          >
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatbotWidget;
