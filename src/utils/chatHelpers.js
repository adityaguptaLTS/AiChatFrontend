/**
 * Utility helper functions for conversation IDs, titles, timestamps, and grouping.
 */

export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'conv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Creates a clean title for a conversation based on the first prompt.
 * Truncates gracefully without slicing words in half.
 */
export function generateTitleFromPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return 'New Conversation';
  
  const cleaned = prompt.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 36) {
    return cleaned;
  }
  
  const truncated = cleaned.substring(0, 36);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 20) {
    return truncated.substring(0, lastSpace) + '...';
  }
  return truncated + '...';
}

/**
 * Formats ISO timestamp or number into human-readable time (e.g. "10:42 AM")
 */
export function formatTimestamp(dateValue) {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Groups a list of conversations by recency (Today, Yesterday, Previous 7 Days, Older).
 */
export function groupConversationsByDate(conversations = []) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfWeek = startOfToday - 6 * 86400000;

  const groups = {
    today: [],
    yesterday: [],
    lastWeek: [],
    older: []
  };

  conversations.forEach((conv) => {
    const updatedAt = new Date(conv.updatedAt || conv.createdAt || Date.now()).getTime();
    if (updatedAt >= startOfToday) {
      groups.today.push(conv);
    } else if (updatedAt >= startOfYesterday) {
      groups.yesterday.push(conv);
    } else if (updatedAt >= startOfWeek) {
      groups.lastWeek.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return [
    { label: 'Today', items: groups.today },
    { label: 'Yesterday', items: groups.yesterday },
    { label: 'Previous 7 Days', items: groups.lastWeek },
    { label: 'Older', items: groups.older }
  ].filter(group => group.items.length > 0);
}

/**
 * Safe clipboard copy with fallback textarea for environments where navigator.clipboard might fail
 */
export async function copyTextToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard failed, attempting fallback', err);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (fallbackErr) {
    console.error('Fallback clipboard copy failed', fallbackErr);
    return false;
  }
}
