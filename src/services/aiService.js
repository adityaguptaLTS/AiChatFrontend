/**
 * AI Service Integration Layer
 * 
 * Provides an isolated communication interface between the UI and the local AI machine engine.
 * 
 * DESIGN PRINCIPLES:
 * 1. UI components NEVER call fetch directly; they communicate solely through this service.
 * 2. Configuration is read from Vite environment variables (VITE_AI_API_BASE_URL, etc.).
 * 3. A clearly labeled Demo/Mock mode is enabled whenever the engine is not configured
 *    or when demo mode is explicitly enabled.
 * 4. Request and response payloads are mapped through customizable adapter functions below.
 * 5. Supports cancellation via AbortController / AbortSignal.
 * 6. Supports both streaming (SSE/chunked) and single-shot JSON responses.
 */

// Environment configuration from Vite (import.meta.env)
const ENV_BASE_URL = (import.meta.env.VITE_AI_API_BASE_URL || '').trim();
const ENV_CHAT_PATH = (import.meta.env.VITE_AI_API_CHAT_PATH || '/api/chat').trim();
const ENV_MODEL_NAME = (import.meta.env.VITE_AI_MODEL_NAME || 'local-model').trim();
const ENV_API_KEY = (import.meta.env.VITE_AI_API_KEY || '').trim();
const ENV_FORCE_DEMO = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';

/**
 * Returns the effective configuration, factoring in optional runtime overrides.
 */
export function getEngineConfig(runtimeOverrides = {}) {
  const baseUrl = (runtimeOverrides.customEndpoint?.trim() || ENV_BASE_URL).trim();
  const modelName = (runtimeOverrides.customModel?.trim() || ENV_MODEL_NAME).trim();
  const forceDemo = runtimeOverrides.useDemoMode === true || (ENV_FORCE_DEMO && runtimeOverrides.useDemoMode !== false);

  return {
    baseUrl,
    chatPath: ENV_CHAT_PATH,
    modelName,
    apiKey: ENV_API_KEY,
    isDemoMode: forceDemo || !baseUrl,
    isConfigured: Boolean(baseUrl),
  };
}

/* ==============================================================================
 * ADAPTER / TRANSFORMATION LAYER
 * When the local AI engine API contract is confirmed by the backend team,
 * customize these two functions to match the exact request & response format.
 * ============================================================================== */

/**
 * Transforms the chat history and options into the request body expected by the local engine.
 * Default format: standard messages array [{ role: 'user' | 'assistant', content: string }]
 */
export function mapRequestPayload(messages, options = {}) {
  // Format messages for the engine
  const formattedMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  return {
    model: options.modelName || 'local-model',
    messages: formattedMessages,
    temperature: options.temperature ?? 0.7,
    stream: options.stream ?? true,
    // Add any additional engine-specific parameters here:
    // e.g. max_tokens: 2048, top_p: 0.95
  };
}

/**
 * Extracts text content from a non-streaming JSON response from the local engine.
 */
export function mapResponsePayload(data) {
  if (!data) return '';

  // Case 1: OpenAI-compatible format { choices: [{ message: { content } }] }
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  if (data.choices?.[0]?.message?.reasoning) {
    return data.choices[0].message.reasoning;
  }

  // Case 2: Ollama / generic format { response: string } or { message: { content } }
  if (typeof data.response === 'string') {
    return data.response;
  }
  if (data.message?.content) {
    return data.message.content;
  }

  // Case 3: Simple string response or { output: string } / { text: string }
  if (typeof data.text === 'string') return data.text;
  if (typeof data.output === 'string') return data.output;
  if (typeof data === 'string') return data;

  // Fallback: stringify unrecognized object
  return JSON.stringify(data, null, 2);
}

/* ==============================================================================
 * DEMO / SIMULATION ENGINE
 * Provides realistic responses with simulated streaming for UI development and testing.
 * ============================================================================== */

const DEMO_RESPONSES = [
  {
    matcher: /(code|javascript|function|debounce|react|python|script)/i,
    reply: `Here is a production-ready **JavaScript debounce utility** with support for leading/trailing execution and cancellation:

\`\`\`javascript
/**
 * Creates a debounced function that delays invoking func until after
 * wait milliseconds have elapsed since the last invocation.
 */
export function debounce(func, wait = 300, { leading = false, trailing = true } = {}) {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    const callNow = leading && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing && !callNow) {
        func.apply(lastThis, lastArgs);
      }
    }, wait);

    if (callNow) {
      func.apply(lastThis, lastArgs);
    }
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
\`\`\`

### Key Features:
- **Zero Dependencies:** Pure vanilla JavaScript.
- **Cancellation Support:** Call \`.cancel()\` on unmount or navigation.
- **Configurable Edge Triggers:** Supports both leading (immediate) and trailing executions.
`
  },
  {
    matcher: /(concept|difference|async|synchronous|promise|explain)/i,
    reply: `### Synchronous vs. Asynchronous Execution

In programming, the primary difference lies in **how tasks wait for I/O operations** (such as network requests, file access, or database queries).

| Dimension | Synchronous Execution | Asynchronous Execution |
| :--- | :--- | :--- |
| **Execution Flow** | Sequential (step-by-step) | Non-blocking (event-driven) |
| **Thread State** | Blocked while waiting | Free to handle other tasks |
| **Throughput** | Limited by slowest operation | High concurrency with fewer threads |
| **Mental Model** | Simple and predictable | Requires handling callbacks/promises |

#### How It Works Under The Hood:
1. **Synchronous:** The thread pauses completely until the current operation yields a value. If a query takes 2 seconds, no other code executes for 2 seconds.
2. **Asynchronous:** The runtime offloads the operation to the operating system or worker pool. When complete, a callback is pushed to the **event loop** for execution.
`
  },
  {
    matcher: /(summarize|summary|security|rest|api|best practice)/i,
    reply: `### Essential Best Practices for REST API Security

Here is a concise summary of the core principles for securing enterprise REST APIs:

1. **Authentication & Authorization**
   - Use short-lived JWTs or opaque tokens backed by an identity provider.
   - Enforce strict Role-Based Access Control (RBAC) at the route and object levels.
2. **Transport Security**
   - Enforce **TLS 1.3** across all endpoints with HTTP Strict Transport Security (HSTS).
3. **Input Validation & Sanitization**
   - Validate every incoming payload against a strict schema (e.g. Zod, Joi, or JSON Schema).
   - Reject unexpected fields rather than stripping them silently.
4. **Rate Limiting & Throttling**
   - Apply token-bucket or sliding-window rate limiting per IP or authenticated user to prevent DoS.
5. **Security Headers**
   - Include standard security headers: \`Content-Security-Policy\`, \`X-Frame-Options: DENY\`, and \`X-Content-Type-Options: nosniff\`.
`
  },
  {
    matcher: /(problem|memory|node|leak|diagnose|fix)/i,
    reply: `### Diagnosing and Resolving Memory Leaks in Node.js

To systematically identify high memory consumption in a Node.js process:

#### Step 1: Generate Heap Snapshots
Run Node with the inspection flag enabled:
\`\`\`bash
node --inspect server.js
\`\`\`
Connect Chrome DevTools via \`chrome://inspect\`, trigger workload traffic, and take two snapshots:
- **Snapshot 1:** Baseline state after startup.
- **Snapshot 2:** After running 1,000 requests.
Compare snapshots using the **Objects allocated between Snapshot 1 and 2** view.

#### Step 2: Common Root Causes
- **Unbounded Caches:** In-memory maps growing indefinitely without an eviction policy (e.g. LRU).
- **Dangling Event Listeners:** Attaching \`.on('event')\` without calling \`.off()\` on connection close.
- **Closures holding large scopes:** Nested functions holding references to outer variables that cannot be garbage-collected.
`
  }
];

const DEFAULT_DEMO_REPLY = `I am running in **Demo Mode** simulating the ACME AI assistant.

You can ask me questions about:
- Writing and reviewing code
- Explaining computer science concepts
- Architectural design patterns
- Troubleshooting bugs and performance issues

> **[Demo Simulation]**: This response is simulated inside the frontend client. To connect your real local AI engine, specify your API endpoint in \`.env\` (e.g. \`VITE_AI_API_BASE_URL=http://localhost:8000\`) or open the **Settings** menu.`;

/**
 * Simulates a streaming AI response token by token.
 */
async function streamDemoResponse(prompt, signal, onChunk) {
  // Select matching reply based on user prompt
  const matched = DEMO_RESPONSES.find(item => item.matcher.test(prompt));
  const fullText = matched ? matched.reply : DEFAULT_DEMO_REPLY;

  let accumulated = '';
  // Split into small token-like chunks (words + punctuation)
  const tokens = fullText.match(/\S+|\s+/g) || [fullText];

  for (let i = 0; i < tokens.length; i++) {
    if (signal?.aborted) {
      throw new DOMException('Generation stopped by user.', 'AbortError');
    }

    accumulated += tokens[i];
    if (typeof onChunk === 'function') {
      onChunk(accumulated);
    }

    // Realistic typing delay: 15ms - 35ms per token
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 20) + 15));
  }

  return {
    content: accumulated,
    isDemo: true,
  };
}

/* ==============================================================================
 * REAL ENGINE COMMUNICATION
 * Handles HTTP requests, streaming readers, and network error handling.
 * ============================================================================== */

/**
 * Sends messages to the real local AI engine.
 */
async function sendToRealEngine({ messages, signal, onChunk, config }) {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/${config.chatPath.replace(/^\/+/, '')}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const payload = mapRequestPayload(messages, {
    modelName: config.modelName,
    stream: typeof onChunk === 'function',
  });

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal,
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') {
      throw fetchErr;
    }
    // Network or CORS errors typically surface as TypeError: Failed to fetch
    const msg = `Unable to reach local AI engine at ${url}. ` +
      `Please check that: 1) your local AI engine server is running, ` +
      `2) the port and URL are correct, and ` +
      `3) CORS is configured on your local engine to allow requests from this origin (${window.location.origin}).`;
    throw new Error(msg);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = await response.text().catch(() => '');
    }
    throw new Error(`Local AI Engine responded with HTTP ${response.status} (${response.statusText}): ${errorDetail || 'Unknown error'}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const isStreaming = contentType.includes('text/event-stream') || contentType.includes('application/x-ndjson');

  // Handle streaming response if supported by server
  if (isStreaming && response.body && typeof onChunk === 'function') {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulated = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete trailing line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue; // Ignore SSE comments/pings

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              // Extract delta chunk
              const delta = parsed.choices?.[0]?.delta?.content ?? (parsed.choices?.[0]?.delta?.reasoning || parsed.response || parsed.message?.content || '');
              if (delta) {
                accumulated += delta;
                onChunk(accumulated);
              }
            } catch {
              // Raw non-JSON text streaming line
              accumulated += dataStr;
              onChunk(accumulated);
            }
          } else {
            // NDJSON format line
            try {
              const parsed = JSON.parse(trimmed);
              const delta = parsed.response || parsed.message?.content || parsed.delta || '';
              if (delta) {
                accumulated += delta;
                onChunk(accumulated);
              }
            } catch {
              accumulated += trimmed;
              onChunk(accumulated);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!accumulated.trim()) {
      throw new Error('Local AI engine returned an empty streaming response.');
    }

    return {
      content: accumulated,
      isDemo: false,
    };
  }

  // Non-streaming JSON response fallback
  const responseData = await response.json();
  const textContent = mapResponsePayload(responseData);

  if (!textContent || !textContent.trim()) {
    throw new Error('Local AI engine returned an empty response.');
  }

  if (typeof onChunk === 'function') {
    onChunk(textContent);
  }

  return {
    content: textContent,
    isDemo: false,
  };
}

/* ==============================================================================
 * PUBLIC API EXPORTS
 * ============================================================================== */

/**
 * Main entry point for sending a conversation to the AI service.
 * Automatically delegates to Demo Mode simulator or Real Engine based on configuration.
 * 
 * @param {Object} params
 * @param {Array} params.messages - Ordered conversation history [{ role: 'user' | 'assistant', content: string }]
 * @param {AbortSignal} [params.signal] - AbortSignal for user cancellation
 * @param {Function} [params.onChunk] - Callback receiving accumulated text for real-time streaming UI updates
 * @param {Object} [params.runtimeOverrides] - Optional runtime engine overrides (from Settings modal)
 * @returns {Promise<{ content: string, isDemo: boolean }>}
 */
export async function sendMessageToEngine({
  messages,
  signal,
  onChunk,
  runtimeOverrides = {},
}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Cannot send empty conversation history.');
  }

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  const prompt = lastUserMessage?.content || '';

  const config = getEngineConfig(runtimeOverrides);

  if (config.isDemoMode) {
    return await streamDemoResponse(prompt, signal, onChunk);
  }

  return await sendToRealEngine({
    messages,
    signal,
    onChunk,
    config,
  });
}

/**
 * Tests connectivity to the configured local AI engine endpoint.
 */
export async function testEngineConnection(runtimeOverrides = {}) {
  const config = getEngineConfig(runtimeOverrides);
  if (!config.baseUrl) {
    return {
      success: false,
      message: 'No endpoint configured. Currently running in Demo / Mock mode.',
    };
  }

  const startTime = Date.now();
  const url = `${config.baseUrl.replace(/\/+$/, '')}/${config.chatPath.replace(/^\/+/, '')}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Send a minimal ping or OPTIONS/GET check
    const response = await fetch(url, {
      method: 'OPTIONS',
      signal: controller.signal,
    }).catch(() => {
      // If OPTIONS is rejected, try a dummy GET
      return fetch(url, { method: 'GET', signal: controller.signal });
    });

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    return {
      success: true,
      status: response.status,
      latencyMs: latency,
      message: `Successfully contacted engine endpoint at ${config.baseUrl} (${latency}ms).`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to connect to ${config.baseUrl}: ${err.message}`,
    };
  }
}
