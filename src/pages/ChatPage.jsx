import { useState, useEffect } from 'react';
import TopHeader from '../components/TopHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import SettingsModal from '../components/SettingsModal.jsx';
import { useChat } from '../hooks/useChat.js';

export default function ChatPage({ theme, onToggleTheme }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Desktop default open, mobile default closed
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
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
  } = useChat();

  // Handle responsive resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && isSidebarOpen) {
        // Automatically close on mobile resize
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+O or Ctrl+K for New Chat
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        createNewChat();
      }
      // Escape closes settings modal
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewChat, isSettingsOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleSelectChat = (chatId) => {
    selectConversation(chatId);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleNewChat = () => {
    createNewChat();
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="app-shell">
      <TopHeader />
      <div className="app-layout">
        <Sidebar
          conversations={conversations}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onRenameChat={renameConversation}
          onDeleteChat={deleteConversation}
          onClearAllChats={clearAllConversations}
          isOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isDemoMode={engineConfig.isDemoMode}
        />

        <ChatWindow
          activeConversation={activeConversation}
          isLoading={isLoading}
          streamingContent={streamingContent}
          error={error}
          engineConfig={engineConfig}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          onSendMessage={sendMessage}
          onStopGeneration={stopGeneration}
          onRegenerate={regenerateLastResponse}
          onRetry={retryLastMessage}
          onClearCurrentChat={clearCurrentChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={engineSettings}
          onUpdateSettings={updateEngineSettings}
          engineConfig={engineConfig}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      </div>
    </div>
  );
}
