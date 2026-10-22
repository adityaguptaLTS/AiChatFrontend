import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadConversations,
  saveConversations,
  loadActiveChatId,
  saveActiveChatId,
  loadEngineSettings,
  saveEngineSettings
} from '../utils/storage.js';
import {
  generateId,
  generateTitleFromPrompt
} from '../utils/chatHelpers.js';
import {
  sendMessageToEngine,
  getEngineConfig
} from '../services/aiService.js';

/**
 * Custom hook managing full conversation state, persistence, streaming, and engine communication.
 */
export function useChat() {
  const [conversations, setConversations] = useState(() => loadConversations());
  const [activeChatId, setActiveChatId] = useState(() => {
    const savedId = loadActiveChatId();
    const stored = loadConversations();
    if (savedId && stored.some(c => c.id === savedId)) {
      return savedId;
    }
    return stored.length > 0 ? stored[0].id : null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState(null);
  const [engineSettings, setEngineSettings] = useState(() => loadEngineSettings());

  // Ref to hold the active AbortController for cancellation
  const abortControllerRef = useRef(null);
  // Ref to track which conversation is currently receiving streaming responses
  const activeStreamTargetRef = useRef(null);

  // Sync conversations to localStorage whenever they change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Sync activeChatId to localStorage
  useEffect(() => {
    saveActiveChatId(activeChatId);
  }, [activeChatId]);

  // Sync engine settings
  const updateEngineSettings = useCallback((newSettings) => {
    setEngineSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveEngineSettings(updated);
      return updated;
    });
  }, []);

  // Retrieve current active conversation
  const activeConversation = conversations.find(c => c.id === activeChatId) || null;

  /**
   * Creates a new conversation and sets it as active.
   * If the current active chat is already empty with 0 messages, we simply focus on it.
   */
  const createNewChat = useCallback(() => {
    // If current conversation is completely empty, keep it
    if (activeConversation && activeConversation.messages.length === 0) {
      return activeConversation.id;
    }

    const newChat = {
      id: generateId(),
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    setConversations(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setError(null);
    setStreamingContent('');
    return newChat.id;
  }, [activeConversation]);

  /**
   * Switches to a different conversation safely.
   */
  const selectConversation = useCallback((chatId) => {
    if (chatId === activeChatId) return;
    setActiveChatId(chatId);
    setError(null);
    // Note: if a request is in flight for another chat, it continues in the background,
    // but the streaming preview is decoupled so the new chat shows its own messages.
  }, [activeChatId]);

  /**
   * Renames a conversation.
   */
  const renameConversation = useCallback((chatId, newTitle) => {
    if (!newTitle || !newTitle.trim()) return;
    const trimmed = newTitle.trim();
    setConversations(prev => prev.map(conv => {
      if (conv.id === chatId) {
        return { ...conv, title: trimmed, updatedAt: new Date().toISOString() };
      }
      return conv;
    }));
  }, []);

  /**
   * Deletes a conversation.
   */
  const deleteConversation = useCallback((chatId) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== chatId);
      // If we deleted the active chat, select the first remaining conversation or null
      if (chatId === activeChatId) {
        const nextActive = filtered.length > 0 ? filtered[0].id : null;
        setActiveChatId(nextActive);
      }
      return filtered;
    });
  }, [activeChatId]);

  /**
   * Clears all conversations with verification.
   */
  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setActiveChatId(null);
    setError(null);
    setStreamingContent('');
  }, []);

  /**
   * Clears messages in the current conversation.
   */
  const clearCurrentChat = useCallback(() => {
    if (!activeChatId) return;
    setConversations(prev => prev.map(conv => {
      if (conv.id === activeChatId) {
        return { ...conv, messages: [], updatedAt: new Date().toISOString() };
      }
      return conv;
    }));
    setError(null);
    setStreamingContent('');
  }, [activeChatId]);

  /**
   * Stops an active AI generation request.
   */
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  /**
   * Internal executor for sending message history to the engine.
   */
  const executeAiRequest = useCallback(async (targetChatId, messagesToSend) => {
    setIsLoading(true);
    setError(null);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeStreamTargetRef.current = targetChatId;

    let accumulatedContent = '';

    try {
      const result = await sendMessageToEngine({
        messages: messagesToSend,
        signal: controller.signal,
        runtimeOverrides: engineSettings,
        onChunk: (chunk) => {
          accumulatedContent = chunk;
          // Only update streaming preview if the user is still looking at this conversation
          if (activeStreamTargetRef.current === targetChatId) {
            setStreamingContent(chunk);
          }
        },
      });

      const finalContent = result.content || accumulatedContent;

      // Commit the completed assistant message into the conversation
      setConversations(prev => prev.map(conv => {
        if (conv.id === targetChatId) {
          const assistantMsg = {
            id: generateId(),
            role: 'assistant',
            content: finalContent,
            timestamp: new Date().toISOString(),
            isDemo: Boolean(result.isDemo),
          };
          return {
            ...conv,
            messages: [...conv.messages, assistantMsg],
            updatedAt: new Date().toISOString(),
          };
        }
        return conv;
      }));
    } catch (err) {
      if (err.name === 'AbortError') {
        // If aborted but partial content was received, save what we have with a notice
        if (accumulatedContent.trim()) {
          setConversations(prev => prev.map(conv => {
            if (conv.id === targetChatId) {
              const partialMsg = {
                id: generateId(),
                role: 'assistant',
                content: accumulatedContent + '\n\n*(Generation stopped by user)*',
                timestamp: new Date().toISOString(),
                isDemo: false,
              };
              return {
                ...conv,
                messages: [...conv.messages, partialMsg],
                updatedAt: new Date().toISOString(),
              };
            }
            return conv;
          }));
        }
      } else {
        const errorMessage = err.message || 'An unexpected error occurred while communicating with the AI engine.';
        setError(errorMessage);

        // Record error message inside conversation for visibility and retry
        setConversations(prev => prev.map(conv => {
          if (conv.id === targetChatId) {
            const errorMsg = {
              id: generateId(),
              role: 'assistant',
              content: `⚠️ **Error:** ${errorMessage}`,
              timestamp: new Date().toISOString(),
              isError: true,
            };
            return {
              ...conv,
              messages: [...conv.messages, errorMsg],
              updatedAt: new Date().toISOString(),
            };
          }
          return conv;
        }));
      }
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      abortControllerRef.current = null;
      activeStreamTargetRef.current = null;
    }
  }, [engineSettings]);

  /**
   * Submits a user prompt to the active conversation (or creates one if none exists).
   */
  const sendMessage = useCallback(async (promptText) => {
    if (!promptText || !promptText.trim() || isLoading) return;
    const trimmed = promptText.trim();

    let targetChatId = activeChatId;
    let currentConv = conversations.find(c => c.id === targetChatId);

    // If no active conversation exists, create one now
    if (!currentConv) {
      const newChatId = generateId();
      const newChat = {
        id: newChatId,
        title: generateTitleFromPrompt(trimmed),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      setConversations(prev => [newChat, ...prev]);
      setActiveChatId(newChatId);
      targetChatId = newChatId;
      currentConv = newChat;
    }

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    // Update conversation title from first message if currently untitled/default
    const isFirstMessage = currentConv.messages.length === 0;
    const newTitle = isFirstMessage ? generateTitleFromPrompt(trimmed) : currentConv.title;

    const updatedMessages = [...currentConv.messages, userMessage];

    // Optimistically update conversation with the user's message
    setConversations(prev => prev.map(c => {
      if (c.id === targetChatId) {
        return {
          ...c,
          title: newTitle,
          messages: updatedMessages,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    }));

    // Trigger AI response
    await executeAiRequest(targetChatId, updatedMessages);
  }, [activeChatId, conversations, isLoading, executeAiRequest]);

  /**
   * Regenerates the last assistant response in the active chat.
   */
  const regenerateLastResponse = useCallback(async () => {
    if (!activeConversation || isLoading) return;
    const messages = [...activeConversation.messages];
    if (messages.length === 0) return;

    // If last message is assistant or error, strip it
    let historyToUse = messages;
    if (messages[messages.length - 1].role === 'assistant') {
      historyToUse = messages.slice(0, -1);
      // Update state to remove old assistant response
      setConversations(prev => prev.map(c => {
        if (c.id === activeConversation.id) {
          return { ...c, messages: historyToUse, updatedAt: new Date().toISOString() };
        }
        return c;
      }));
    }

    if (historyToUse.length === 0) return;

    await executeAiRequest(activeConversation.id, historyToUse);
  }, [activeConversation, isLoading, executeAiRequest]);

  /**
   * Retries after an error by resending up to the last user message.
   */
  const retryLastMessage = useCallback(async () => {
    if (!activeConversation || isLoading) return;
    const messages = [...activeConversation.messages];
    if (messages.length === 0) return;

    // Filter out trailing error messages
    const trimmed = [];
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].isError) continue;
      trimmed.push(messages[i]);
    }

    setConversations(prev => prev.map(c => {
      if (c.id === activeConversation.id) {
        return { ...c, messages: trimmed, updatedAt: new Date().toISOString() };
      }
      return c;
    }));

    await executeAiRequest(activeConversation.id, trimmed);
  }, [activeConversation, isLoading, executeAiRequest]);

  const engineConfig = getEngineConfig(engineSettings);

  return {
    conversations,
    activeChatId,
    activeConversation,
    isLoading,
    streamingContent,
    error,
    engineConfig,
    engineSettings,
    updateEngineSettings,
    createNewChat,
    selectConversation,
    renameConversation,
    deleteConversation,
    clearAllConversations,
    clearCurrentChat,
    sendMessage,
    stopGeneration,
    regenerateLastResponse,
    retryLastMessage,
  };
}
