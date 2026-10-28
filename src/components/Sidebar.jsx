import { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  PanelLeftClose
} from 'lucide-react';
import { groupConversationsByDate } from '../utils/chatHelpers.js';
import ThemeToggle from './ThemeToggle.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

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
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
        {/* Top Action Row: New Chat & Sidebar Collapse */}
        <div className="sidebar-action-row">
          <button
            type="button"
            className="new-chat-btn"
            onClick={onNewChat}
            aria-label={t('newChat')}
          >
            <Plus size={16} />
            <span>{t('newChat')}</span>
          </button>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onToggleSidebar}
            aria-label={t('collapseSidebar')}
            title={t('collapseSidebar')}
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="sidebar-search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="search-input"
            aria-label={t('searchPlaceholder')}
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
              <p className="empty-title">{t('noConversations')}</p>
              <p className="empty-desc">{t('noConversationsDesc')}</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="history-empty-state">
              <Search size={24} className="empty-icon" />
              <p className="empty-title">{t('noMatches')}</p>
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
          <div className="sidebar-footer-row">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </aside>
    </>
  );
}
