/**
 * AI Service Integration Layer
 * 
 * Communicates with the Express backend service:
 * - Base URL: configurable via VITE_API_BASE_URL (defaults to http://localhost:5181)
 * - Chat endpoint: POST /api/chat
 * - Request payload: { "message": "user's message" }
 * - Success response: { "success": true, "data": { "reply": "AI response", "model": "gpt-oss-20b" } }
 * - Error response: { "success": false, "error": { "code": "AI_SERVICE_UNAVAILABLE", "message": "error details" } }
 */

// Local default backend URL
export const DEFAULT_API_BASE_URL = 'http://localhost:5181';

// Read backend URL from Vite environment variable with local default fallback
const ENV_API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_AI_API_BASE_URL ||
  DEFAULT_API_BASE_URL
).trim();

/**
 * Returns effective engine/backend configuration factoring in runtime overrides (e.g., from settings modal).
 */
export function getEngineConfig(runtimeOverrides = {}) {
  const baseUrl = (runtimeOverrides.customEndpoint?.trim() || ENV_API_BASE_URL).replace(/\/+$/, '');
  const modelName = (runtimeOverrides.customModel?.trim() || 'gpt-oss-20b').trim();

  return {
    baseUrl: baseUrl || DEFAULT_API_BASE_URL,
    chatPath: '/api/chat',
    modelName,
    isDemoMode: false,
    isConfigured: true,
  };
}

/**
 * Resolves the chat endpoint URL, utilizing Vite's dev server proxy in development
 * to avoid browser CORS preflight blocks.
 */
export function getEndpointUrl(runtimeOverrides = {}) {
  if (runtimeOverrides.customEndpoint?.trim()) {
    return `${runtimeOverrides.customEndpoint.trim().replace(/\/+$/, '')}/api/chat`;
  }

  // In development, route via Vite's proxy (/api/chat) to eliminate browser CORS blocks
  if (import.meta.env.DEV) {
    return '/api/chat';
  }

  const config = getEngineConfig(runtimeOverrides);
  const baseUrl = (config.baseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
  return `${baseUrl}/api/chat`;
}

/**
 * Compatibility helper: transforms messages into simple prompt text or payload
 */
export function mapRequestPayload(messages) {
  if (Array.isArray(messages) && messages.length > 0) {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    return {
      message: lastUserMessage?.content || ''
    };
  }
  return { message: '' };
}

/**
 * Compatibility helper: extracts reply from backend data response
 */
export function mapResponsePayload(data) {
  if (data?.data?.reply) return data.data.reply;
  if (data?.reply) return data.reply;
  return typeof data === 'string' ? data : JSON.stringify(data);
}

/**
 * Sends the user's message to the Express backend chat endpoint:
 * POST http://localhost:5181/api/chat
 *
 * @param {Object} params
 * @param {Array} [params.messages] - Conversation history array [{ role, content }]
 * @param {string} [params.message] - Direct user message text
 * @param {AbortSignal} [params.signal] - Signal for request cancellation
 * @param {Function} [params.onChunk] - Callback for UI update
 * @param {Object} [params.runtimeOverrides] - Optional settings overrides
 * @returns {Promise<{ content: string, reply: string, model: string, isDemo: boolean }>}
 */
export async function sendMessageToEngine({
  messages,
  message,
  signal,
  onChunk,
  runtimeOverrides = {},
}) {
  // Extract user message from direct parameter or last user role in messages history
  let userMessageText = '';
  if (typeof message === 'string' && message.trim()) {
    userMessageText = message.trim();
  } else if (Array.isArray(messages) && messages.length > 0) {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    userMessageText = lastUserMessage?.content?.trim() || '';
  }

  // Prevent sending empty messages
  if (!userMessageText) {
    throw new Error('Message cannot be empty.');
  }

  const config = getEngineConfig(runtimeOverrides);
  const baseUrl = (config.baseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
  const endpointUrl = getEndpointUrl(runtimeOverrides);

  let response;
  try {
    response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessageText }),
      signal,
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') {
      throw fetchErr;
    }
    // Network failures, connection refused, or CORS errors
    throw new Error(
      `Unable to connect to the backend server at ${baseUrl}. Please ensure the Express backend is running on port 5181.`
    );
  }

  let responseData = null;
  try {
    responseData = await response.json();
  } catch {
    // Non-JSON response
  }

  // Handle HTTP error statuses or explicit failure payloads from backend
  if (!response.ok || (responseData && responseData.success === false)) {
    const errorCode = responseData?.error?.code;
    const errorMessage = responseData?.error?.message;

    // Gracefully handle AI_SERVICE_UNAVAILABLE
    if (errorCode === 'AI_SERVICE_UNAVAILABLE') {
      const detailText = errorMessage ? `: ${errorMessage}` : '';
      throw new Error(`AI service is currently unavailable. Please check that the local AI service is running and try again${detailText}.`);
    }

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    if (responseData?.message) {
      throw new Error(responseData.message);
    }

    throw new Error(`Backend server error (HTTP ${response.status}: ${response.statusText || 'Request failed'}).`);
  }

  // Validate success response structure: { success: true, data: { reply, model } }
  if (
    !responseData ||
    responseData.success !== true ||
    !responseData.data ||
    typeof responseData.data.reply !== 'string'
  ) {
    throw new Error('Received an unexpected response format from the backend.');
  }

  const reply = responseData.data.reply;
  const model = responseData.data.model || config.modelName || 'gpt-oss-20b';

  // Update UI with the final reply
  if (typeof onChunk === 'function') {
    onChunk(reply);
  }

  return {
    content: reply,
    reply,
    model,
    isDemo: false,
  };
}

/**
 * Tests connectivity to the backend server endpoint.
 */
export async function testEngineConnection(runtimeOverrides = {}) {
  const config = getEngineConfig(runtimeOverrides);
  const baseUrl = (config.baseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
  const url = getEndpointUrl(runtimeOverrides);

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'OPTIONS',
      signal: controller.signal,
    }).catch(() => {
      return fetch(url, { method: 'GET', signal: controller.signal });
    });

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    return {
      success: true,
      status: response.status,
      latencyMs: latency,
      message: `Successfully contacted backend server at ${baseUrl} (${latency}ms).`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Could not connect to backend server at ${baseUrl}. Ensure Express backend is running on port 5181.`,
    };
  }
}
