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

const DEFAULT_MESSAGES = ['เธชเธงเธฑเธชเธ”เธตเธเธฃเธฑเธ เธเธกเน€เธเนเธ RGA AI Assistant เธ–เธฒเธกเธญเธฐเนเธฃเนเธ”เนเน€เธฅเธขเธเธฃเธฑเธ'];

export const N8nChatWidget = ({
  webhookUrl,
  mode = 'window',
  initialMessages = DEFAULT_MESSAGES,
  title = 'RGA Chat',
  subtitle = 'Rise Group Asia',
  inputPlaceholder = 'เธเธดเธกเธเนเธเธณเธ–เธฒเธกเธเธญเธเธเธธเธ“...',
}: N8nChatWidgetProps) => {
  useEffect(() => {
    const defaultWebhook = 'https://suttipatrga1.app.n8n.cloud/webhook/chat-general';
    const resolvedWebhookUrl =
      webhookUrl ||
      (typeof import.meta !== 'undefined' ? import.meta.env.VITE_CHATBOT_WEBHOOK_URL : '') ||
      defaultWebhook;

    if (!resolvedWebhookUrl) {
      if (import.meta.env.MODE === 'development') {
        console.warn('[N8nChatWidget] Missing VITE_CHATBOT_WEBHOOK_URL, using default:', defaultWebhook);
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
          footer: '',
          getStarted: '',
          closeButtonTooltip: 'Close chat',
        },
      },
    });

    return () => {
      if (typeof chat?.unmount === 'function') {
        chat.unmount();
      }
    };
  }, [webhookUrl, mode, initialMessages, title, subtitle, inputPlaceholder]);

  return null;
};

export default N8nChatWidget;

