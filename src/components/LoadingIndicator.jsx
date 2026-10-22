export default function LoadingIndicator({ text = 'Thinking' }) {
  return (
    <div className="loading-indicator-container" role="status" aria-live="polite" aria-label="AI is generating a response">
      <span className="loading-dots">
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </span>
      {text && <span className="loading-label">{text}</span>}
    </div>
  );
}
