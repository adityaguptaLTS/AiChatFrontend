import { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Sliders,
  PanelLeftClose,
  Sparkles
} from 'lucide-react';
import { groupConversationsByDate } from '../utils/chatHelpers.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function Sidebar({
  conversations = [],
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onClearAllChats,
  isOpen,
  onToggleSidebar,
  theme,
  onToggleTheme,
  onOpenSettings,
  isDemoMode = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.messages || []).some(m => (m.content || '').toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Group filtered conversations
  const groupedConversations = useMemo(() => {
    return groupConversationsByDate(filteredConversations);
  }, [filteredConversations]);

  const handleStartRename = (e, chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title || '');
    setConfirmDeleteId(null);
  };

  const handleSaveRename = (e, chatId) => {
    if (e) e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleCancelRename = (e) => {
    if (e) e.stopPropagation();
    setEditingChatId(null);
  };

  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation();
    setConfirmDeleteId(chatId);
    setEditingChatId(null);
  };

  const handleConfirmDelete = (e, chatId) => {
    e.stopPropagation();
    onDeleteChat(chatId);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onToggleSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`} aria-label="Conversation history">
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon-box">
              <Sparkles size={18} className="brand-icon" />
            </div>
            <div className="brand-text">
              <span className="brand-name">Local AI Assistant</span>
              <span className="brand-status">
                {isDemoMode ? 'Demo Mode' : 'Engine Ready'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onToggleSidebar}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="sidebar-action-row">
          <button
            type="button"
            className="new-chat-btn"
            onClick={onNewChat}
            aria-label="Create a new conversation"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="sidebar-search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="search-input"
            aria-label="Search conversation history"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Conversations List */}
        <div className="sidebar-history-scroll" role="navigation" aria-label="Chat conversations">
          {conversations.length === 0 ? (
            <div className="history-empty-state">
              <MessageSquare size={28} className="empty-icon" />
              <p className="empty-title">No conversations yet</p>
              <p className="empty-desc">Your chat history will appear here once you send a message.</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="history-empty-state">
              <Search size={24} className="empty-icon" />
              <p className="empty-title">No matches found</p>
              <p className="empty-desc">No chats match "{searchQuery}".</p>
            </div>
          ) : (
            groupedConversations.map(group => (
              <div key={group.label} className="history-group">
                <div className="history-group-header">{group.label}</div>
                <div className="history-items-list">
                  {group.items.map(chat => {
                    const isActive = chat.id === activeChatId;
                    const isEditing = chat.id === editingChatId;
                    const isDeleting = chat.id === confirmDeleteId;

                    return (
                      <div
                        key={chat.id}
                        className={`history-item ${isActive ? 'active' : ''}`}
                        onClick={() => !isEditing && onSelectChat(chat.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isEditing) onSelectChat(chat.id);
                        }}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <MessageSquare size={15} className="item-icon" />

                        {isEditing ? (
                          <div className="item-edit-box" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(e, chat.id);
                                if (e.key === 'Escape') handleCancelRename(e);
                              }}
                              autoFocus
                              className="item-rename-input"
                              aria-label="Rename conversation"
                            />
                            <button
                              type="button"
                              className="item-action-btn confirm-btn"
                              onClick={(e) => handleSaveRename(e, chat.id)}
                              title="Save title"
                              aria-label="Save title"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              className="item-action-btn cancel-btn"
                              onClick={handleCancelRename}
                              title="Cancel"
                              aria-label="Cancel rename"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : isDeleting ? (
                          <div className="item-delete-confirm" onClick={(e) => e.stopPropagation()}>
                            <span className="confirm-text">Delete?</span>
                            <button
                              type="button"
                              className="item-action-btn delete-yes"
                              onClick={(e) => handleConfirmDelete(e, chat.id)}
                              title="Confirm delete"
                              aria-label="Confirm delete conversation"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              className="item-action-btn delete-no"
                              onClick={handleCancelDelete}
                              title="Cancel"
                              aria-label="Cancel delete"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="item-title" title={chat.title}>
                              {chat.title}
                            </span>
                            <div className="item-hover-actions">
                              <button
                                type="button"
                                className="item-action-btn"
                                onClick={(e) => handleStartRename(e, chat)}
                                title="Rename conversation"
                                aria-label="Rename conversation"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="item-action-btn"
                                onClick={(e) => handleDeleteClick(e, chat.id)}
                                title="Delete conversation"
                                aria-label="Delete conversation"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {conversations.length > 0 && (
            <div className="sidebar-footer-row">
              {showClearConfirm ? (
                <div className="clear-confirm-bar">
                  <span>Clear all chats?</span>
                  <button
                    type="button"
                    className="clear-confirm-yes"
                    onClick={() => {
                      onClearAllChats();
                      setShowClearConfirm(false);
                    }}
                  >
                    Yes, clear
                  </button>
                  <button
                    type="button"
                    className="clear-confirm-no"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="sidebar-footer-btn danger"
                  onClick={() => setShowClearConfirm(true)}
                  aria-label="Clear all conversations"
                >
                  <Trash2 size={14} />
                  <span>Clear all conversations</span>
                </button>
              )}
            </div>
          )}

          <div className="sidebar-footer-row">
            <button
              type="button"
              className="sidebar-footer-btn"
              onClick={onOpenSettings}
              aria-label="Engine Settings"
            >
              <Sliders size={14} />
              <span>Engine Settings</span>
            </button>
          </div>

          <div className="sidebar-footer-row">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </aside>
    </>
  );
}
