import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, X, FileText, Image, FileCode, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(fileName = '') {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return <Image size={14} className="attachment-type-icon" />;
  }
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'html', 'css', 'sql'].includes(ext)) {
    return <FileCode size={14} className="attachment-type-icon" />;
  }
  return <FileText size={14} className="attachment-type-icon" />;
}

export default function ChatInput({
  onSendMessage,
  onStopGeneration,
  isLoading = false,
  placeholder,
}) {
  const { t } = useLanguage();
  const effectivePlaceholder = placeholder || t('askPlaceholder');
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [validationError, setValidationError] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea based on text height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 200;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [input]);

  // Focus textarea when loading completes
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Handle file selection with validation
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setValidationError('');

    if (attachments.length + files.length > MAX_FILES) {
      setValidationError(`You can attach a maximum of ${MAX_FILES} files per message.`);
      e.target.value = '';
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setValidationError(`"${file.name}" exceeds the 10 MB size limit.`);
        e.target.value = '';
        return;
      }
      validFiles.push(file);
    }

    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setValidationError('');
  };

  const handleTriggerFileInput = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const hasText = Boolean(input.trim());
    const hasFiles = attachments.length > 0;

    if ((!hasText && !hasFiles) || isLoading) return;

    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    setValidationError('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isSendDisabled = (!input.trim() && attachments.length === 0) || isLoading;

  return (
    <div className="composer-container">
      {/* Validation Error Alert */}
      {validationError && (
        <div className="composer-validation-error" role="alert">
          <AlertCircle size={14} className="validation-error-icon" />
          <span>{validationError}</span>
          <button
            type="button"
            className="validation-error-close"
            onClick={() => setValidationError('')}
            aria-label="Dismiss error"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Selected Attachments Preview Strip */}
      {attachments.length > 0 && (
        <div className="composer-attachments-preview" aria-label="Attached files">
          {attachments.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="attachment-chip">
              {getFileIcon(file.name)}
              <div className="attachment-meta">
                <span className="attachment-name" title={file.name}>
                  {file.name}
                </span>
                <span className="attachment-size">{formatFileSize(file.size)}</span>
              </div>
              <button
                type="button"
                className="attachment-remove-btn"
                onClick={() => handleRemoveAttachment(idx)}
                aria-label={`Remove ${file.name}`}
                title="Remove file"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <form onSubmit={handleSubmit} className="composer-box" role="region" aria-label="Message composer">
        {/* Attachment Button */}
        <button
          type="button"
          className="composer-btn attach-btn"
          onClick={handleTriggerFileInput}
          disabled={isLoading}
          aria-label="Attach file"
          title="Attach files (up to 10 MB)"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachments.length > 0 ? 'Add instructions for attached file(s)...' : effectivePlaceholder}
          rows={1}
          disabled={isLoading}
          className="composer-textarea"
          aria-label="Prompt message input"
        />

        <div className="composer-controls">
          {isLoading ? (
            <button
              type="button"
              className="composer-btn stop-btn"
              onClick={onStopGeneration}
              aria-label="Stop generation"
              title="Stop generating response"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSendDisabled}
              className={`composer-btn send-btn ${isSendDisabled ? 'disabled' : 'active'}`}
              aria-label="Send message"
              title="Send message (Enter)"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </form>

      <p className="composer-disclaimer">
        Responses are generated by the connected local AI engine.
      </p>
    </div>
  );
}
