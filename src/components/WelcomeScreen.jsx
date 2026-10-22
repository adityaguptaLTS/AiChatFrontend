import { Code2, BookOpen, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  {
    id: 'explain',
    title: 'Explain a concept',
    desc: 'Deep dive into synchronous vs asynchronous execution',
    prompt: 'Explain the difference between synchronous and asynchronous execution with practical examples.',
    icon: BookOpen,
  },
  {
    id: 'code',
    title: 'Help me write code',
    desc: 'Craft a debounce utility function with cancellation',
    prompt: 'Write a robust JavaScript debounce utility function with cancel support and explain how it works.',
    icon: Code2,
  },
  {
    id: 'summarize',
    title: 'Summarize best practices',
    desc: 'Key principles for securing REST API endpoints',
    prompt: 'Summarize essential best practices for securing enterprise REST APIs.',
    icon: ShieldAlert,
  },
  {
    id: 'debug',
    title: 'Help me solve a problem',
    desc: 'Diagnose memory leaks in a server application',
    prompt: 'How do I diagnose and resolve high memory consumption in a Node.js service?',
    icon: Cpu,
  },
];

export default function WelcomeScreen({ onSelectPrompt, isDemoMode = true }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-hero">
        <div className="welcome-badge">
          <Sparkles size={14} className="sparkle-icon" />
          <span>Local AI Machine Engine</span>
        </div>
        <h1 className="welcome-title">How can I help you today?</h1>
        <p className="welcome-subtitle">
          Direct interface to your locally hosted AI model. Fast, private, and running entirely within your infrastructure.
        </p>
      </div>

      <div className="welcome-suggestions-grid">
        {SUGGESTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="suggestion-card"
              onClick={() => onSelectPrompt(item.prompt)}
              aria-label={`Prompt suggestion: ${item.title}`}
            >
              <div className="suggestion-icon-wrapper">
                <Icon size={18} />
              </div>
              <div className="suggestion-text">
                <span className="suggestion-title">{item.title}</span>
                <span className="suggestion-desc">{item.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {isDemoMode && (
        <div className="welcome-demo-banner" role="status">
          <span className="demo-banner-dot" />
          <span>
            <strong>Demo Mode Active:</strong> Responses are simulated for interface validation. Configure your local engine URL in <code>.env</code> or Settings to connect live.
          </span>
        </div>
      )}
    </div>
  );
}
