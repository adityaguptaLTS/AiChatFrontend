# Local AI Assistant — Frontend (ChatGPT & Claude Style)

A high-performance, standalone conversational AI chat interface built with **React 19** and **Vite**, engineered specifically for on-premise, locally hosted AI machine engines. 

This application provides a user experience inspired by ChatGPT and Claude with a clean, typography-focused UI, markdown rendering, syntax-highlighted code blocks, client-side conversation persistence, dark/light themes, and an isolated API service layer ready for local AI engine integration.

---

## 1. Project Purpose & Architecture

Organizations hosting proprietary AI models on local machines often lack a modern, user-friendly frontend. This project provides a production-grade interface that:
- Runs completely standalone in the browser.
- Encapsulates all backend/network communication inside a dedicated service layer (`src/services/aiService.js`).
- Never exposes secrets, keys, or credentials on the client.
- Provides a simulated **Demo Mode** with realistic token-by-token streaming so all UX elements (markdown, tables, code highlighting, copy buttons, stop generation) can be tested immediately prior to backend readiness.
- Provides a live runtime **Engine Settings** panel to configure and test endpoints without needing to rebuild.

---

## 2. Technology Stack

- **Framework**: React 19 (JavaScript & JSX)
- **Bundler & Dev Server**: Vite 8
- **Styling**: Modern Vanilla CSS with CSS custom properties (design tokens for Dark & Light modes, responsive breakpoints)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown & Code Rendering**: `react-markdown`, `remark-gfm` (tables, strikethrough, autolinks), and `prismjs` for multi-language syntax highlighting
- **State Management**: React Hooks (`useChat.js`) with isolated storage management (`storage.js`)

---

## 3. Directory Structure

```
LocalAiChatFrontend/
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── index.html                # App entrypoint with SEO & theme meta
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── README.md                 # Documentation
├── src/
│   ├── components/
│   │   ├── ChatInput.jsx        # Auto-resizing composer, send & stop controls
│   │   ├── ChatWindow.jsx       # Header, message stream, auto-scroll, composer wrapper
│   │   ├── CodeBlock.jsx        # Prism.js highlighted code block with one-click copy
│   │   ├── LoadingIndicator.jsx # Animated pulse indicator for in-flight generation
│   │   ├── MessageBubble.jsx    # Distinct user & assistant bubbles, markdown, copy, retry
│   │   ├── SettingsModal.jsx    # Runtime configuration modal with endpoint connectivity tester
│   │   ├── Sidebar.jsx          # Conversation history, search, rename, delete, theme switch
│   │   ├── ThemeToggle.jsx      # Dark / Light mode toggle
│   │   └── WelcomeScreen.jsx    # Hero greeting, suggested prompts, demo notice
│   ├── hooks/
│   │   └── useChat.js           # Conversation state, active chat, streaming, abort controller
│   ├── services/
│   │   └── aiService.js         # Dedicated local AI communication & payload adapter layer
│   ├── utils/
│   │   ├── chatHelpers.js       # ID generator, title extraction, timestamps, copy helper
│   │   └── storage.js           # Safe localStorage persistence with schema validation
│   ├── App.jsx                  # Root layout, drawer state, keyboard shortcuts
│   ├── index.css                # Design tokens, typography, prism theme, responsive rules
│   └── main.jsx                 # React root bootstrap
```

---

## 4. Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation
```bash
# Clone or navigate to the project directory
cd LocalAiChatFrontend

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
The server will start at `http://127.0.0.1:5173/` with Hot Module Replacement (HMR).

### Building for Production
```bash
npm run build
```
Production assets are generated in the `dist/` directory.

### Previewing the Production Build
```bash
npm run preview
```

### Running Lint Checks
```bash
npm run lint
```

---

## 5. Environment Configuration

Copy `.env.example` to `.env` (or `.env.local`):

```bash
cp .env.example .env
```

### Available Configuration Parameters

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_AI_API_BASE_URL` | Base URL of your local AI engine (e.g. `http://localhost:8000` or `http://127.0.0.1:11434`) | *(empty = activates Demo Mode)* |
| `VITE_AI_API_CHAT_PATH` | Chat endpoint path on the engine server | `/api/chat` |
| `VITE_AI_MODEL_NAME` | Model identifier expected by your local engine | `local-model` |
| `VITE_AI_API_KEY` | Optional bearer token or API key (if required by private engine) | *(empty)* |
| `VITE_ENABLE_DEMO_MODE` | Force demo mode even when an endpoint is provided (`true` / `false`) | `true` |

> [!NOTE]
> All client-exposed Vite variables must be prefixed with `VITE_`. Never commit real passwords, tokens, or private keys to source control.

---

## 6. How Demo Mode Works

When `VITE_AI_API_BASE_URL` is empty or `VITE_ENABLE_DEMO_MODE=true` is set:
1. The application operates in **Demo Mode**.
2. A subtle **Demo Mode** indicator is displayed in the sidebar status, welcome screen, chat header, and message bubbles.
3. The demo simulator produces realistic responses formatted in Markdown, including:
   - Full code blocks with syntax highlighting (e.g., JavaScript debounce utilities).
   - Markdown comparison tables (e.g., synchronous vs. asynchronous execution).
   - Architectural summaries with bullet lists and security guidelines.
   - Troubleshooting diagnostics for performance and memory leaks.
4. Token-by-token streaming is simulated to exercise the UI's real-time typewriter effect, auto-scrolling, and user cancellation (`Stop Generation`).

---

## 7. Connecting Your Local AI Machine Engine

Connecting your actual local AI engine is isolated to a single file: `src/services/aiService.js`.

### Step 1: Configure Endpoint
Set your local engine base URL in `.env`:
```env
VITE_AI_API_BASE_URL=http://localhost:8000
VITE_AI_API_CHAT_PATH=/api/chat
VITE_ENABLE_DEMO_MODE=false
```
Alternatively, open the **Engine Settings** modal in the UI and enter your base URL directly.

### Step 2: Adapt Payload Formats in `src/services/aiService.js`
Open `src/services/aiService.js` and locate the two adapter functions:

#### A. Request Mapping (`mapRequestPayload`)
If your backend expects a different body schema, adjust this function:
```javascript
export function mapRequestPayload(messages, options = {}) {
  // Example for OpenAI-compatible schema:
  return {
    model: options.modelName || 'local-model',
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: options.temperature ?? 0.7,
    stream: options.stream ?? true,
  };

  // Example for simple single-prompt schema:
  // const lastMsg = messages[messages.length - 1];
  // return { prompt: lastMsg.content, temperature: 0.7 };
}
```

#### B. Response Mapping (`mapResponsePayload`)
If your backend returns a non-streaming single-shot JSON response:
```javascript
export function mapResponsePayload(data) {
  // Adjust to match your engine's response structure:
  // e.g., data.choices[0].message.content, data.response, data.output, data.text
  return data.choices?.[0]?.message?.content || data.response || data.text || '';
}
```

### Step 3: Test Connectivity
Click **Settings** in the chat header or sidebar footer, enter your endpoint, and click **Test Engine Endpoint**. The test runner verifies reachability and latency without requiring a full chat roundtrip.

---

## 8. Network and CORS Requirements

When connecting to an engine running on `http://localhost:<PORT>`:
- Modern web browsers enforce Cross-Origin Resource Sharing (CORS).
- The local AI engine server must include the following headers in its responses:
  ```http
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  ```
- If your local engine server cannot easily add CORS headers, configure a Vite development proxy in `vite.config.js`:
  ```javascript
  // vite.config.js
  export default defineConfig({
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        }
      }
    }
  });
  ```

---

## 9. API Details Pending Confirmation from the Engine Team

Before final deployment with the company engine, verify:
1. **Endpoint URL & Port**: (e.g., `http://192.168.x.x:8080`, `http://localhost:11434`, or private domain).
2. **Authentication**: None, static API key, or Bearer token.
3. **Request Schema**: Standard OpenAI chat format (`{ messages: [...] }`) vs. raw prompt (`{ prompt: "..." }`).
4. **Streaming Protocol**: Server-Sent Events (SSE with `data: ...`) vs. NDJSON vs. single-shot JSON.
5. **Model Identifiers**: Default model name string required by the server.

---

## 10. Key Features Checklist

- [x] Full-height ChatGPT/Claude inspired responsive design
- [x] Collapsible sidebar with mobile off-canvas drawer
- [x] Real-time conversation search
- [x] Date-grouped conversation history (Today, Yesterday, 7 Days, Older)
- [x] Rename and delete conversations with confirmation
- [x] Welcome screen with 4 interactive prompt suggestion cards
- [x] Auto-resizing composer textarea with Enter/Shift+Enter shortcuts
- [x] Send button disabled state & loading indicator
- [x] Stop generation support via `AbortController`
- [x] Token-by-token streaming UI with auto-scroll lock and "scroll to bottom" button
- [x] Assistant response Markdown rendering (headings, tables, lists, links, blockquotes)
- [x] Prism.js syntax highlighting with language badge and one-click code copy
- [x] Assistant message copy-to-clipboard action
- [x] Regenerate response & Retry failed request actions
- [x] Clear conversation with confirmation
- [x] Dark / Light theme toggle with persistence
- [x] Safe client-side `localStorage` persistence with schema validation
- [x] Dedicated `aiService.js` integration layer with clean adapter functions
- [x] Explicitly labeled Demo Mode with domain-specific mock responses
- [x] Runtime Engine Settings modal with live connectivity test runner
#   A i C h a t F r o n t e n d  
 