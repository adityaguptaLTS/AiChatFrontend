import { useState, useEffect, useRef } from 'react';
import { Check, Copy } from 'lucide-react';
import Prism from 'prismjs';
import { copyTextToClipboard } from '../utils/chatHelpers.js';

// Import essential Prism language modules
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';

export default function CodeBlock({ language = 'plaintext', children }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  // Normalize language identifier (e.g., 'js' -> 'javascript', 'py' -> 'python', 'sh' -> 'bash')
  const normalizedLang = (() => {
    const raw = (language || '').toLowerCase().trim();
    if (raw === 'js') return 'javascript';
    if (raw === 'ts') return 'typescript';
    if (raw === 'py') return 'python';
    if (raw === 'sh' || raw === 'shell') return 'bash';
    if (raw === 'html' || raw === 'xml') return 'markup';
    return raw || 'plaintext';
  })();

  const rawCode = String(children).replace(/\n$/, '');

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [rawCode, normalizedLang]);

  const handleCopy = async () => {
    const success = await copyTextToClipboard(rawCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="code-block-container" tabIndex={0} aria-label={`Code snippet in ${normalizedLang}`}>
      <div className="code-block-header">
        <span className="code-block-lang">{normalizedLang}</span>
        <button
          type="button"
          className="code-copy-btn"
          onClick={handleCopy}
          aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className="icon-success" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className={`code-block-pre language-${normalizedLang}`}>
        <code ref={codeRef} className={`language-${normalizedLang}`}>
          {rawCode}
        </code>
      </pre>
    </div>
  );
}
