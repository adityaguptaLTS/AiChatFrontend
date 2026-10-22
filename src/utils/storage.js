/**
 * Storage utility for client-side persistence using localStorage.
 * 
 * Note: localStorage provides local, browser-only persistence on this device.
 * It does NOT provide server-side persistence or cross-device synchronization.
 * Sensitive data (e.g. API keys or credentials) must NEVER be stored here.
 */

const STORAGE_KEYS = {
  CONVERSATIONS: 'local_ai_conversations_v1',
  ACTIVE_CHAT_ID: 'local_ai_active_chat_id_v1',
  THEME: 'local_ai_theme_v1',
  ENGINE_SETTINGS: 'local_ai_engine_settings_v1',
};

/**
 * Safely reads and parses JSON from localStorage
 */
function safeGet(key, defaultValue) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[storage] Failed reading or parsing key "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Safely writes JSON string to localStorage with quota-exceeded catch
 */
function safeSet(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[storage] Failed writing key "${key}":`, err);
    return false;
  }
}

/**
 * Loads all saved conversations, sanitizing data structure
 */
export function loadConversations() {
  const data = safeGet(STORAGE_KEYS.CONVERSATIONS, []);
  if (!Array.isArray(data)) {
    console.warn('[storage] Invalid conversations format in storage. Resetting to empty array.');
    return [];
  }

  // Validate conversation schema and ensure required fields
  return data.map((conv) => ({
    id: conv.id || String(Date.now()),
    title: conv.title || 'Untitled Chat',
    createdAt: conv.createdAt || new Date().toISOString(),
    updatedAt: conv.updatedAt || conv.createdAt || new Date().toISOString(),
    messages: Array.isArray(conv.messages) ? conv.messages.map(msg => ({
      id: msg.id || String(Math.random()),
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : '',
      timestamp: msg.timestamp || new Date().toISOString(),
      isError: Boolean(msg.isError),
      isDemo: Boolean(msg.isDemo),
      attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
    })) : [],
  }));
}

/**
 * Persists all conversations
 */
export function saveConversations(conversations) {
  if (!Array.isArray(conversations)) return;
  safeSet(STORAGE_KEYS.CONVERSATIONS, conversations);
}

/**
 * Loads the last active conversation ID
 */
export function loadActiveChatId() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT_ID) || null;
  } catch {
    return null;
  }
}

/**
 * Saves the active conversation ID
 */
export function saveActiveChatId(chatId) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (chatId) {
      window.localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT_ID, chatId);
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT_ID);
    }
  } catch (err) {
    console.warn('[storage] Failed to save active chat ID:', err);
  }
}

/**
 * Loads user theme preference ('dark' | 'light')
 */
export function loadTheme() {
  const saved = safeGet(STORAGE_KEYS.THEME, null);
  if (saved === 'dark' || saved === 'light') return saved;
  // Fallback to system preference
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

/**
 * Saves user theme preference
 */
export function saveTheme(theme) {
  if (theme === 'dark' || theme === 'light') {
    safeSet(STORAGE_KEYS.THEME, theme);
  }
}

/**
 * Loads local engine connection preferences (endpoint overrides, demo mode toggle)
 * NOTE: Credentials/passwords must NEVER be stored here.
 */
export function loadEngineSettings() {
  return safeGet(STORAGE_KEYS.ENGINE_SETTINGS, {
    useDemoMode: false,
    customEndpoint: '',
    customModel: '',
    temperature: 0.7,
  });
}

/**
 * Saves local engine connection preferences
 */
export function saveEngineSettings(settings) {
  safeSet(STORAGE_KEYS.ENGINE_SETTINGS, settings);
}
