// NOTE: @n8n/chat package is not installed in this project.
// This component is currently a placeholder.
// To enable the chat widget, install the package:
//   npm install @n8n/chat
// Then restore the original implementation.

import { useEffect } from 'react';

interface N8nChatWidgetProps {
  webhookUrl?: string;
  mode?: 'window' | 'fullscreen';
  initialMessages?: string[];
  title?: string;
  subtitle?: string;
  inputPlaceholder?: string;
}

export const N8nChatWidget = ({
  webhookUrl,
}: N8nChatWidgetProps) => {
  useEffect(() => {
    if (import.meta.env.MODE === 'development' && webhookUrl) {
      console.warn('[N8nChatWidget] Chat widget is disabled. Install @n8n/chat to enable.');
    }
  }, [webhookUrl]);

  return null;
};

export default N8nChatWidget;
