import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RotateCw, AlertTriangle, Bot, User, Sparkles } from 'lucide-react';
import CodeBlock from './CodeBlock.jsx';
import { copyTextToClipboard, formatTimestamp } from '../utils/chatHelpers.js';

export default function MessageBubble({
  message,
  isLatestAssistant = false,
  isLoading = false,
  onRegenerate,
  onRetry,
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isError = Boolean(message.isError);
  const isDemo = Boolean(message.isDemo);

  const handleCopyResponse = async () => {
    const success = await copyTextToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`message-row ${isUser ? 'user-row' : 'assistant-row'} ${isError ? 'error-row' : ''}`}>
      <div className="message-container">
        {/* Avatar */}
        <div className={`message-avatar ${isUser ? 'user-avatar' : 'assistant-avatar'}`} aria-hidden="true">
          {isUser ? (
            <User size={18} />
          ) : isError ? (
            <AlertTriangle size={18} className="icon-error" />
          ) : (
            <Bot size={18} />
          )}
        </div>

        {/* Content Box */}
        <div className="message-content-wrapper">
          <div className="message-header-meta">
            <span className="message-sender-name">
              {isUser ? 'You' : 'ACME AI Assistant'}
            </span>

            {isDemo && !isUser && (
              <span className="demo-pill" title="This response was simulated locally in demo mode">
                <Sparkles size={11} />
                <span>Demo Mode</span>
              </span>
            )}

            {message.timestamp && (
              <span className="message-timestamp">
                {formatTimestamp(message.timestamp)}
              </span>
            )}
          </div>

          <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
            {isUser ? (
              <div className="user-text-content">{message.content}</div>
            ) : isError ? (
              <div className="error-message-content">
                <div className="error-text">{message.content}</div>
                {onRetry && (
                  <button
                    type="button"
                    className="msg-retry-btn"
                    onClick={onRetry}
                    disabled={isLoading}
                    aria-label="Retry failed request"
                  >
                    <RotateCw size={13} />
                    <span>Retry Request</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeText = String(children);
                      const isMultiLine = codeText.includes('\n');

                      if (match || isMultiLine) {
                        return (
                          <CodeBlock language={match ? match[1] : 'plaintext'}>
                            {codeText}
                          </CodeBlock>
                        );
                      }

                      return (
                        <code className="inline-code" {...props}>
                          {children}
                        </code>
                      );
                    },
                    a({ href, children, ...props }) {
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="markdown-link"
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    },
                    table({ children, ...props }) {
                      return (
                        <div className="table-responsive">
                          <table className="markdown-table" {...props}>
                            {children}
                          </table>
                        </div>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Action Bar for Assistant Messages */}
          {!isUser && !isError && (
            <div className="message-actions">
              <button
                type="button"
                className="msg-action-btn"
                onClick={handleCopyResponse}
                title="Copy response to clipboard"
                aria-label={copied ? 'Response copied' : 'Copy response'}
              >
                {copied ? (
                  <>
                    <Check size={13} className="icon-success" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {isLatestAssistant && onRegenerate && (
                <button
                  type="button"
                  className="msg-action-btn"
                  onClick={onRegenerate}
                  disabled={isLoading}
                  title="Regenerate this response"
                  aria-label="Regenerate response"
                >
                  <RotateCw size={13} className={isLoading ? 'spin-icon' : ''} />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
