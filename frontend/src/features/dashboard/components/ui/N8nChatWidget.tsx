import { useEffect } from 'react';
import { createChat } from '@n8n/chat';
import '@n8n/chat/dist/style.css';

interface N8nChatWidgetProps {
  webhookUrl?: string;
  mode?: 'window' | 'fullscreen';
  initialMessages?: string[];
  title?: string;
  subtitle?: string;
  inputPlaceholder?: string;
}

const DEFAULT_MESSAGES = ['สวัสดีครับ ผมเป็น RGA AI Assistant ถามอะไรได้เลยครับ'];

export const N8nChatWidget = ({
  webhookUrl,
  mode = 'window',
  initialMessages = DEFAULT_MESSAGES,
  title = 'RGA Chat',
  subtitle = 'Rise Group Asia',
  inputPlaceholder = 'พิมพ์คำถามของคุณ...',
}: N8nChatWidgetProps) => {
  useEffect(() => {
    const resolvedWebhookUrl =
      webhookUrl || (typeof import.meta !== 'undefined' ? import.meta.env.VITE_CHATBOT_WEBHOOK_URL : '');

    if (!resolvedWebhookUrl) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[N8nChatWidget] Missing VITE_CHATBOT_WEBHOOK_URL');
      }
      return;
    }

    const chat = createChat({
      webhookUrl: resolvedWebhookUrl,
      mode,
      initialMessages,
      i18n: {
        en: {
          title,
          subtitle,
          inputPlaceholder,
        },
      },
    });

    return () => {
      if (typeof chat?.destroy === 'function') {
        chat.destroy();
      }
    };
  }, [webhookUrl, mode, initialMessages, title, subtitle, inputPlaceholder]);

  return null;
};

export default N8nChatWidget;
