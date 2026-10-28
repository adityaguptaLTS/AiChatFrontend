import { useEffect, useRef, useState, useMemo } from 'react';
import {
  PanelLeft,
  Sliders,
  RotateCcw,
  ArrowDown
} from 'lucide-react';
import acmeLogo from '../assets/ACME-Logo-SVG.png';
import WelcomeScreen from './WelcomeScreen.jsx';
import MessageBubble from './MessageBubble.jsx';
import ChatInput from './ChatInput.jsx';
import LoadingIndicator from './LoadingIndicator.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

export default function ChatWindow({
  activeConversation,
  isLoading,
  streamingContent,
  engineConfig,
  isSidebarOpen,
  onToggleSidebar,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onRetry,
  onClearCurrentChat,
  onOpenSettings,
}) {
  const { t } = useLanguage();
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isAutoScrollLocked, setIsAutoScrollLocked] = useState(true);

  const messages = useMemo(() => activeConversation?.messages || [], [activeConversation?.messages]);
  const hasMessages = messages.length > 0;
  const isDemo = engineConfig.isDemoMode;

  // Auto-scroll handler
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom on initial message load or streaming update if locked to bottom
  useEffect(() => {
    if (isAutoScrollLocked) {
      scrollToBottom(streamingContent ? 'auto' : 'smooth');
    }
  }, [messages, streamingContent, isAutoScrollLocked]);

  // Monitor user scrolling to detect if they scrolled up
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const threshold = 120;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;

    setIsAutoScrollLocked(isNearBottom);
    setShowScrollBottom(!isNearBottom && (hasMessages || streamingContent));
  };

  return (
    <main className="chat-window-container" role="main" aria-label="Chat conversation window">
      {/* Top Navigation Bar */}
      <header className="chat-header">
        <div className="chat-header-left">
          {!isSidebarOpen && (
            <button
              type="button"
              className="header-icon-btn sidebar-open-btn"
              onClick={onToggleSidebar}
              aria-label={t('openSidebar')}
              title={t('openSidebar')}
            >
              <PanelLeft size={18} />
            </button>
          )}

          <div className="chat-header-info">
            <h2 className="chat-header-title">
              {activeConversation ? activeConversation.title : 'ACME AI Assistant'}
            </h2>
          </div>
        </div>

        <div className="chat-header-right">
          {hasMessages && (
            <button
              type="button"
              className="header-action-btn"
              onClick={onClearCurrentChat}
              disabled={isLoading}
              title={t('clearChat')}
              aria-label={t('clearChat')}
            >
              <RotateCcw size={15} />
              <span className="btn-text">{t('clearChat')}</span>
            </button>
          )}

          <button
            type="button"
            className="header-action-btn"
            onClick={onOpenSettings}
            title={t('settings')}
            aria-label={t('settings')}
          >
            <Sliders size={15} />
            <span className="btn-text">{t('settings')}</span>
          </button>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <div
        className="chat-messages-area"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label="Messages list"
      >
        {!hasMessages && !isLoading && !streamingContent ? (
          <WelcomeScreen>
            <ChatInput
              onSendMessage={onSendMessage}
              onStopGeneration={onStopGeneration}
              isLoading={isLoading}
              placeholder={t('askPlaceholder')}
            />
          </WelcomeScreen>
        ) : (
          <div className="messages-column">
            {messages.map((message, idx) => {
              const isLast = idx === messages.length - 1;
              const isLatestAssistant =
                message.role === 'assistant' &&
                (isLast || idx === messages.length - 2 && messages[messages.length - 1].isError);

              return (
                <MessageBubble
                  key={message.id || idx}
                  message={message}
                  isLatestAssistant={isLatestAssistant}
                  isLoading={isLoading}
                  onRegenerate={onRegenerate}
                  onRetry={onRetry}
                />
              );
            })}

            {/* In-flight streaming response */}
            {isLoading && streamingContent && (
              <MessageBubble
                message={{
                  id: 'streaming-preview',
                  role: 'assistant',
                  content: streamingContent,
                  timestamp: null,
                  isDemo: isDemo,
                }}
                isLatestAssistant={false}
                isLoading={true}
              />
            )}

            {/* Thinking / Loading indicator before any text arrives */}
            {isLoading && !streamingContent && (
              <div className="message-row assistant-row">
                <div className="message-container">
                  <div className="message-avatar assistant-avatar" aria-hidden="true">
                    <img src={acmeLogo} alt="ACME" className="bot-avatar-logo" />
                  </div>
                  <div className="message-content-wrapper">
                    <div className="message-bubble assistant-bubble loading-bubble">
                      <LoadingIndicator text={t('generatingResponse')} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="messages-bottom-anchor" />
          </div>
        )}

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            type="button"
            className="scroll-to-bottom-btn"
            onClick={() => {
              setIsAutoScrollLocked(true);
              scrollToBottom('smooth');
            }}
            aria-label="Scroll to newest messages"
            title="Scroll to bottom"
          >
            <ArrowDown size={16} />
          </button>
        )}
      </div>

      {/* Composer Input Bar (only shown when conversation is active or loading) */}
      {(hasMessages || isLoading || streamingContent) && (
        <div className="chat-composer-section">
          <ChatInput
            onSendMessage={onSendMessage}
            onStopGeneration={onStopGeneration}
            isLoading={isLoading}
            placeholder={t('askPlaceholder')}
          />
        </div>
      )}
    </main>
  );
}
