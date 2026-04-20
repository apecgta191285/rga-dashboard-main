import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

interface ChatRequest {
  id?: string;
  tenant_id?: string;
  question?: string;
  message?: string;
  role?: string;
  sessionId?: string;
  timestamp?: string;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  reply?: string;
  output?: any;
  error?: string;
  timestamp: string;
}

// Clean text by removing escape sequences and JSON structure
function cleanText(text: string | any): string {
  if (!text) return '';

  let result = typeof text === 'string' ? text : JSON.stringify(text);

  // Handle JSON.stringify double-encoded strings (e.g., "{\"key\":...}")
  try {
    // If it looks like a JSON string, try to parse it
    if (result.startsWith('"') && result.endsWith('"')) {
      result = JSON.parse(result);
    }
  } catch (e) {
    // Not a JSON string, continue
  }

  // Remove JSON structure - extract just the text content
  // Match patterns like {"parts":[{"text":"..."}]} or similar
  const jsonMatch = result.match(/"text"\s*:\s*"([^"]+(?:\\.[^"]*)*)"/) ||
    result.match(/"text"\s*:\s*"([^"]*)"/);
  if (jsonMatch && jsonMatch[1]) {
    result = JSON.parse('"' + jsonMatch[1] + '"'); // Parse the captured string properly
  }

  // Now clean escape sequences multiple times to handle nested encoding
  for (let i = 0; i < 3; i++) {
    const before = result;

    result = result
      // Handle escaped quotes and backslashes (do this first)
      .replace(/\\\\"/g, '\x00ESCAPED_QUOTE\x00') // Temporarily replace \\"
      .replace(/\\"/g, '"') // Convert \" to "
      .replace(/\\'/g, "'") // Convert \' to '
      // Handle newlines and other whitespace
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      // Handle other escapes
      .replace(/\\\//g, '/')
      .replace(/\\\\/g, '\\') // Handle \\
      // Restore temporarily replaced content
      .replace(/\x00ESCAPED_QUOTE\x00/g, '"')
      // Decode HTML entities
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    // If nothing changed, stop looping
    if (before === result) break;
  }

  // Remove any remaining JSON structure characters
  result = result
    // Remove leading/trailing JSON characters
    .replace(/^[\{\[\"]/, '') // Remove leading {, [, "
    .replace(/[\}\]\""]$/, '') // Remove trailing }, ], "
    // Remove null bytes and control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim whitespace from start and end
    .trim();

  return result;
}

// Simple proxy controller to forward chat messages to external webhook (n8n)
@SkipThrottle()
@Controller('chatbot')
export class ChatbotController {
  @Post()
  async forwardToWebhook(@Body() body: ChatRequest): Promise<ChatResponse> {
    // Build N8N webhook URL from environment variables
    const n8nBaseUrl = process.env.N8N_BASE_URL || 'https://suttipatrga1.app.n8n.cloud';
    // This endpoint is chat-specific; prefer chat env var, keep legacy var as fallback.
    const n8nWebhookPath =
      process.env.N8N_CHAT_WEBHOOK_PATH ||
      process.env.N8N_WEBHOOK_PATH ||
      'webhook/chat-seo';
    // IMPORTANT: do not normalize `//` globally (would break `https://` -> `https:/`)
    const target = `${n8nBaseUrl.replace(/\/+$/, '')}/${n8nWebhookPath.replace(/^\/+/, '')}`;

    const requestPayload = {
      id: body.id || body.sessionId,
      tenant_id: body.tenant_id,
      question: body.question || body.message,
    };

    console.log('[Chatbot] Forwarding to N8N:', target);
    console.log('[Chatbot] Request payload:', JSON.stringify(requestPayload, null, 2));

    try {
      const timeoutMs = parseInt(process.env.N8N_REQUEST_TIMEOUT_MS || '120000', 10);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const resp = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await resp.text();
      const contentType = resp.headers.get('content-type') || '';

      console.log('[Chatbot] N8N Raw Response:', text);
      console.log('[Chatbot] N8N Status:', resp.status);
      console.log('[Chatbot] N8N Content-Type:', contentType);
      console.log('[Chatbot] Target URL:', target);

      if (!resp.ok) {
        console.error('[Chatbot] N8N error response:', text, 'Status:', resp.status);
        console.error('[Chatbot] Check N8N webhook URL and ensure the workflow version is published');
        console.error('[Chatbot] Target URL was:', target);
        return {
          success: false,
          error: `N8N Error (${resp.status}): ${text || 'Unknown error'}`,
          reply: '',
          message: '',
          timestamp: new Date().toISOString(),
        };
      }

      // Validate that response has content
      if (!text || text.trim() === '') {
        console.warn('[Chatbot] N8N returned empty response');
        console.warn('[Chatbot] Response status:', resp.status);
        console.warn('[Chatbot] Response headers:', Object.fromEntries(resp.headers.entries()));
        console.warn('[Chatbot] Target URL:', target);
        console.warn('[Chatbot] Check N8N webhook configuration and ensure workflow is published');
        return {
          success: false,
          error: 'N8N returned empty response - please check webhook configuration',
          reply: '',
          message: '',
          timestamp: new Date().toISOString(),
        };
      }

      let n8nData: any = {};
      if (contentType.includes('application/json')) {
        try {
          n8nData = JSON.parse(text);
          console.log('[Chatbot] Parsed JSON:', JSON.stringify(n8nData, null, 2));
        } catch (parseErr) {
          console.warn('[Chatbot] Failed to parse N8N response as JSON:', parseErr);
          console.warn('[Chatbot] Raw text:', text);
          n8nData = { raw: text };
        }
      } else {
        n8nData = { raw: text };
      }

      console.log('[Chatbot] N8N Status:', resp.status);
      console.log('[Chatbot] N8N Response Headers:', Object.fromEntries(resp.headers.entries()));
      console.log('[Chatbot] N8N Response Raw Text:', text);
      console.log('[Chatbot] N8N Response Data:', JSON.stringify(n8nData, null, 2));

      // Helper: Deep search for text in object
      function findTextInObject(obj: any, depth = 0): string {
        if (depth > 5) return '';
        if (typeof obj === 'string') return obj;
        if (!obj || typeof obj !== 'object') return '';

        // Check common AI response fields (in priority order)
        const commonFields = ['text', 'reply', 'message', 'content', 'answer', 'output', 'response', 'result'];
        for (const field of commonFields) {
          if (obj[field] && typeof obj[field] === 'string' && obj[field].trim().length > 0) {
            return obj[field];
          }
        }

        // Check nested 'parts' array (for Gemini-like responses)
        if (Array.isArray(obj)) {
          for (const item of obj) {
            const found = findTextInObject(item, depth + 1);
            if (found && found.length > 0) return found;
          }
        }

        // Check nested objects for common response structures
        const structureFields = ['candidates', 'content', 'data', 'result', 'output'];
        for (const field of structureFields) {
          if (obj[field] && typeof obj[field] === 'object') {
            const found = findTextInObject(obj[field], depth + 1);
            if (found && found.length > 0) return found;
          }
        }

        // Try all object values as last resort
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && typeof obj[key] !== 'object') {
            if (typeof obj[key] === 'string' && obj[key].trim().length > 10) {
              return obj[key];
            }
          }
        }

        return '';
      }

      // Extract reply - use helper function FIRST
      let rawReply = findTextInObject(n8nData);

      // If helper didn't find anything, try direct paths
      if (!rawReply) {
        rawReply =
          n8nData?.candidates?.[0]?.content?.parts?.[0]?.text ||
          n8nData?.answer ||
          n8nData?.reply ||
          n8nData?.output ||
          n8nData?.response ||
          n8nData?.message ||
          n8nData?.text ||
          n8nData?.raw ||
          n8nData?.result ||
          n8nData?.data?.reply ||
          n8nData?.data?.message ||
          (typeof n8nData === 'string' ? n8nData : '') ||
          text ||
          'ได้รับข้อความแล้ว';
      }

      // Clean the reply text
      const reply = cleanText(rawReply);

      console.log('[Chatbot] Raw Reply Before Cleaning:', rawReply);
      console.log('[Chatbot] Final Extracted Reply After Cleaning:', reply);
      console.log('[Chatbot] Full Response Data:', JSON.stringify(n8nData, null, 2));

      // Validate cleaned reply is not empty and not just error messages
      if (!reply || reply.length === 0) {
        console.warn('[Chatbot] Extracted reply is empty after cleaning');
        return {
          success: false,
          error: 'N8N response was empty after processing',
          reply: '',
          message: '',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        reply,
        message: reply,
        output: n8nData,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[Chatbot] Proxy error:', err?.message || err);
      console.error('[Chatbot] Error stack:', err?.stack);
      console.error('[Chatbot] Failed to reach N8N at:', target);
      return {
        success: false,
        error: `Network error: ${err?.message || 'Failed to call external webhook'}`,
        reply: 'Unable to connect to AI service. Please check your connection and N8N webhook URL.',
        message: 'Unable to connect to AI service. Please check your connection and N8N webhook URL.',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
